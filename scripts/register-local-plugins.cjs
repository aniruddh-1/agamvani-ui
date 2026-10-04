#!/usr/bin/env node
// `npx cap sync` regenerates capacitor.plugins.json from node_modules only, dropping
// plugins that live in the app itself. Re-add them after every sync (run via the
// capacitor:sync:after hook) so the native bridge loads them.
const fs = require('fs');
const path = require('path');

const LOCAL_PLUGINS = [
  { pkg: 'BackgroundAudio', classpath: 'in.ramsabha.agamvani.BackgroundAudioPlugin' },
];

const platform = process.env.CAPACITOR_PLATFORM_NAME;
if (platform && platform !== 'android') process.exit(0);

const file = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'capacitor.plugins.json');
if (!fs.existsSync(file)) {
  console.warn(`[register-local-plugins] ${file} not found; run "npx cap sync android" first`);
  process.exit(0);
}

const plugins = JSON.parse(fs.readFileSync(file, 'utf8'));
let added = 0;
for (const plugin of LOCAL_PLUGINS) {
  if (!plugins.some((p) => p.classpath === plugin.classpath)) {
    plugins.push(plugin);
    added += 1;
  }
}
if (added) {
  fs.writeFileSync(file, JSON.stringify(plugins, null, '\t') + '\n');
}
console.log(`[register-local-plugins] ${added ? `added ${added}` : 'already present'}: ${LOCAL_PLUGINS.map((p) => p.pkg).join(', ')}`);
