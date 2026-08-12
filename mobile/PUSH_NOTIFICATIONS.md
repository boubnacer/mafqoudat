# Push notifications (Android)

Match alerts that arrive in the device's notification tray while the app is
closed. This is the third delivery channel for a lost/found match, after the
in-app inbox (always on) and the opt-in email — and the only one that reaches a
user who is not currently looking at the app.

**Android only today.** Everything in the code is platform-agnostic; iOS is
switched off in exactly one place (`SUPPORTED_PLATFORMS` in
`src/utils/pushNotifications.js`) because delivery on iOS needs an APNs key,
which needs a paid Apple Developer account. See "Turning iOS on" at the bottom.

## How it fits together

```
post created/edited
  → server/services/matchingService.js scores the opposite side of the country
  → writes a Notification row per recipient  (the in-app inbox, always)
  → collects one push per recipient for the whole run
  → server/services/pushNotificationService.js  →  Expo push service  →  FCM  →  device
  → mobile/App.js routes the tap
```

The aggregation in the middle is the important part. The engine floors every
same-category, same-city pair onto the strong-match boundary, so a single new
listing in a dense city/category legitimately produces a burst of matches at
once. The inbox groups them after the fact; a notification tray cannot, so the
server sends **one** message per recipient per scan run — "3 possible matches"
rather than three notifications.

Delivery goes through Expo's push service rather than FCM directly. The app is
an Expo (CNG) project, so its tokens are already Expo tokens and Expo holds the
FCM credentials for the project: the server side is one HTTPS POST with no
vendor SDK.

### Files

| Where | What |
| --- | --- |
| `server/services/pushNotificationService.js` | Sends to Expo, prunes dead tokens, holds the tray copy in en/fr/ar |
| `server/services/matchingService.js` | Collects the run's pushes and dispatches them (`dispatchQueuedPushes`) |
| `server/controllers/notificationsController.js` | `POST`/`DELETE /notifications/push-token`, `pushAlerts` preference |
| `server/models/User.js` | `pushTokens[]` and `notificationPreferences.pushAlerts` |
| `src/utils/pushNotifications.js` | Permission, token, Android channel, tap target resolution |
| `src/context/NotificationsContext.js` | Registers on sign-in and on language change |
| `App.js` | Routes a tapped notification once the right navigator is mounted |
| `src/context/AuthContext.js` | Revokes the device's token on sign out |
| `src/components/notifications/NotificationPreferencesPanel.js` | The user-facing switch |

## One-time setup

Push does not work until steps 1–3 are done. Until then the app registers
nothing and the server sends nothing; everything else behaves exactly as before.

### 1. Firebase project and `google-services.json`

Expo's push service delivers to Android through FCM, so the project needs FCM
credentials of its own.

1. In the [Firebase console](https://console.firebase.google.com), create a
   project (or reuse one) and add an **Android app** with package name
   `com.mafqoudat.app` — it must match `android.package` in `app.config.js`
   exactly.
2. Download the generated `google-services.json`.
3. Upload it to EAS as a **file** secret so builds can pick it up:

   ```bash
   eas secret:create --scope project --name GOOGLE_SERVICES_JSON \
     --type file --value ./google-services.json
   ```

   `app.config.js` reads that env var and falls back to `./google-services.json`
   in this directory if you have one locally. The file is gitignored: it carries
   no secret (it ships inside every APK) but it is per-Firebase-project, and
   committing it invites the wrong one being used.

4. Give Expo permission to send through FCM. In the Firebase console open
   **Project settings → Service accounts → Generate new private key**, then:

   ```bash
   eas credentials
   # Android → production → Google Service Account → Manage your Google Service
   # Account Key for Push Notifications (FCM V1) → upload the JSON
   ```

### 2. Server environment

Both are optional; the defaults work.

```
PUSH_NOTIFICATIONS_ENABLED=true   # kill switch, set to "false" to stop all sends
EXPO_ACCESS_TOKEN=                # expo.dev → Account settings → Access tokens
PUSH_RECEIPT_CHECK_DELAY_MS=      # defaults to 5 minutes, clamped to 1s–15min
```

Set `EXPO_ACCESS_TOKEN` in production. Without it Expo accepts unauthenticated
sends, which means anyone who scrapes a push token can send notifications that
appear to come from this app.

### 3. A real build

`npm start` runs `expo start --go`, and **Expo Go cannot receive remote push
notifications on Android** (support was removed in SDK 53). Testing needs the
development build, which this repo's `eas.json` already defines:

```bash
eas build --profile development --platform android   # install the APK on a real device
npm run start:dev                                    # dev server for that build
```

An emulator without Google Play Services cannot mint a token at all — the app
detects this (`Device.isDevice`) and skips registration with a single log line
rather than an error box.

## Verifying it works

1. Sign in on the device. Android 13+ shows the notification permission prompt;
   grant it.
2. Confirm the token reached the server — the account's `pushTokens` array
   should now hold one entry with `platform: "android"`.
3. Post a lost item, then from a second account post a found item in the same
   city and category. The scan runs on the second post; both accounts should
   get one notification.
4. Send yourself a test message directly, without waiting for a match:

   ```bash
   curl -X POST https://exp.host/--/api/v2/push/send \
     -H 'Content-Type: application/json' \
     -d '{"to":"ExponentPushToken[...]","title":"Test","body":"Hello",
          "channelId":"match-alerts","data":{"type":"match_found"}}'
   ```

   A tap on that one opens the notifications inbox; add
   `"postId":"<a real post id>"` to the `data` object to test the
   open-the-listing path instead.

## Behaviour worth knowing

- **Permission is asked once**, at sign-in, and never again: if the user denies
  it and Android stops allowing the prompt, registration returns early. The
  preferences panel then explains the situation and links to system settings.
- **Two switches, not one.** `notificationPreferences.pushAlerts` is the account
  setting; the OS permission sits above it and wins. Turning off `matchAlerts`
  (the master switch) stops pushes too, along with everything else.
- **A re-scored match never buzzes twice.** Only a genuinely new notification row
  queues a push, so re-scanning a post cannot re-alert on pairs the user has
  already seen.
- **Sign-out revokes the token.** Otherwise the next person to sign in on a
  shared phone keeps receiving the previous account's alerts — the tray copy
  says what kind of listing they concern, so this is a privacy matter, not just
  noise.
- **Dead tokens are pruned.** Expo reports `DeviceNotRegistered` for an
  uninstalled app, either in the send ticket or in the receipt checked a few
  minutes later; either path drops the token.
- **The channel is a contract.** Every message names the `match-alerts` channel,
  and the app creates it (`ensureNotificationChannel`) with a name in the user's
  language. Renaming it on one side only makes Android fall back to a default
  channel the user cannot configure.

## Turning iOS on

When a paid Apple Developer account exists:

1. Add `'ios'` to `SUPPORTED_PLATFORMS` in `src/utils/pushNotifications.js`.
2. `eas credentials` → iOS → set up a **Push Notification key** (APNs).
3. Rebuild. The `aps-environment` entitlement is added by the
   expo-notifications config plugin; nothing else in the app or the server needs
   to change — the server already stores `platform: 'ios'` tokens and Expo routes
   them.
