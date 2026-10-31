# Google Play publishing

Package: `in.ramsabha.agamvani`

## One-time access setup

1. Enable the Google Play Android Developer API in a Google Cloud project.
2. Create a service account and JSON key in that project.
3. In Google Play Console, open **Users and permissions**, invite the service
   account email, and grant Agamvani release access for internal testing and
   production.
4. Keep the downloaded JSON outside this repository, for example:
   `~/.config/google-play/agamvani-service-account.json`.

Never commit or paste the service-account JSON or Android keystore.

## Local terminal

Upload a signed AAB to internal testing:

```sh
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/google-play/agamvani-service-account.json"
npm run play:upload:internal -- android/app/build/outputs/bundle/release/app-release.aab
```

Promote an internal version to a 10% production rollout:

```sh
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/google-play/agamvani-service-account.json"
npm run play:promote:production -- 72 --rollout 0.1 --confirm-production
```

Use `--rollout 1` only for an explicit full production rollout.

## GitHub Actions

Configure these repository or environment secrets:

- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The workflow uses the existing Vite build secrets as well. Configure the
`google-play-production` GitHub environment with required reviewers so a
production promotion cannot start without approval. Run **Publish Android to
Google Play** manually from the Actions page.
