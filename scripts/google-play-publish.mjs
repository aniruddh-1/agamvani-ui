#!/usr/bin/env node

import {
  createReadStream,
  existsSync,
  readFileSync,
  statSync,
} from "node:fs";
import { resolve } from "node:path";
import { google } from "googleapis";

const packageName =
  process.env.GOOGLE_PLAY_PACKAGE_NAME || "in.ramsabha.agamvani";
const scope = "https://www.googleapis.com/auth/androidpublisher";

function usage() {
  console.error(`Usage:
  npm run play:upload:internal -- /path/to/app-release.aab
  npm run play:promote:production -- <version-code> --rollout <0-1> --confirm-production

Authentication:
  Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON file.`);
}

function parseArguments(argv) {
  const [command, target, ...options] = argv;

  if (command === "upload" && target === "internal") {
    const bundlePath = options[0];
    if (!bundlePath || options.length !== 1) {
      throw new Error("Internal upload requires exactly one AAB path.");
    }
    return { operation: "upload", bundlePath: resolve(bundlePath) };
  }

  if (command === "promote" && target === "production") {
    const versionCode = options[0];
    const rolloutIndex = options.indexOf("--rollout");
    const rollout = Number(options[rolloutIndex + 1]);
    const confirmed = options.includes("--confirm-production");

    if (!/^[1-9]\d*$/.test(versionCode || "")) {
      throw new Error("Production promotion requires a positive version code.");
    }
    if (
      rolloutIndex === -1 ||
      !Number.isFinite(rollout) ||
      rollout <= 0 ||
      rollout > 1
    ) {
      throw new Error("--rollout must be greater than 0 and at most 1.");
    }
    if (!confirmed) {
      throw new Error(
        "Production promotion requires the --confirm-production flag.",
      );
    }

    return {
      operation: "promote",
      versionCode,
      rollout,
    };
  }

  throw new Error("Unknown Google Play publishing command.");
}

function createAuth() {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFile) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set.");
  }

  const resolvedKeyFile = resolve(keyFile);
  if (!existsSync(resolvedKeyFile)) {
    throw new Error(`Service-account file not found: ${resolvedKeyFile}`);
  }

  const credentials = JSON.parse(readFileSync(resolvedKeyFile, "utf8"));
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("Service-account JSON is missing required credentials.");
  }

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [scope],
  });
}

async function withEdit(publisher, callback) {
  const inserted = await publisher.edits.insert({
    packageName,
    requestBody: {},
  });
  const editId = inserted.data.id;
  if (!editId) {
    throw new Error("Google Play did not return an edit ID.");
  }

  try {
    const result = await callback(editId);
    await publisher.edits.commit({ packageName, editId });
    return result;
  } catch (error) {
    await publisher.edits
      .delete({ packageName, editId })
      .catch(() => undefined);
    throw error;
  }
}

async function uploadInternal(publisher, bundlePath) {
  if (!existsSync(bundlePath) || !statSync(bundlePath).isFile()) {
    throw new Error(`AAB file not found: ${bundlePath}`);
  }
  if (!bundlePath.endsWith(".aab")) {
    throw new Error("The upload file must use the .aab extension.");
  }

  const versionCode = await withEdit(publisher, async (editId) => {
    const uploaded = await publisher.edits.bundles.upload({
      packageName,
      editId,
      media: {
        mimeType: "application/octet-stream",
        body: createReadStream(bundlePath),
      },
    });
    const uploadedVersionCode = uploaded.data.versionCode;
    if (!uploadedVersionCode) {
      throw new Error("Google Play did not return the uploaded version code.");
    }

    await publisher.edits.tracks.update({
      packageName,
      editId,
      track: "internal",
      requestBody: {
        track: "internal",
        releases: [
          {
            name: `Internal ${uploadedVersionCode}`,
            versionCodes: [String(uploadedVersionCode)],
            status: "completed",
          },
        ],
      },
    });

    return uploadedVersionCode;
  });

  console.log(
    `Published ${packageName} version ${versionCode} to internal testing.`,
  );
}

async function promoteProduction(publisher, versionCode, rollout) {
  await withEdit(publisher, async (editId) => {
    const internalTrack = await publisher.edits.tracks.get({
      packageName,
      editId,
      track: "internal",
    });
    const isOnInternalTrack = (internalTrack.data.releases || []).some(
      (release) => (release.versionCodes || []).includes(String(versionCode)),
    );
    if (!isOnInternalTrack) {
      throw new Error(
        `Version ${versionCode} is not currently on the internal track.`,
      );
    }

    const fullRollout = rollout === 1;
    await publisher.edits.tracks.update({
      packageName,
      editId,
      track: "production",
      requestBody: {
        track: "production",
        releases: [
          {
            name: `Production ${versionCode}`,
            versionCodes: [String(versionCode)],
            status: fullRollout ? "completed" : "inProgress",
            ...(fullRollout ? {} : { userFraction: rollout }),
          },
        ],
      },
    });
  });

  console.log(
    `Promoted ${packageName} version ${versionCode} to production at ${rollout * 100}%.`,
  );
}

async function main() {
  let command;
  try {
    command = parseArguments(process.argv.slice(2));
  } catch (error) {
    usage();
    throw error;
  }

  const publisher = google.androidpublisher({
    version: "v3",
    auth: createAuth(),
  });

  if (command.operation === "upload") {
    await uploadInternal(publisher, command.bundlePath);
  } else {
    await promoteProduction(publisher, command.versionCode, command.rollout);
  }
}

main().catch((error) => {
  console.error(`Google Play publish failed: ${error.message}`);
  process.exitCode = 1;
});
