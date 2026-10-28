# Asih Wear OS

A Wear OS companion for Asih that records a short voice request, sends it to the paired development server, and shows a concise reply. The server routes each transcript to appointment help, activity planning, ad help on the phone, or Get help. The app requires acknowledgment of the data notice before recording or sending.

## Build

```sh
./gradlew :app:assembleDebug
```

Install the debug APK on a Wear OS device. Debug builds default to `http://10.0.2.2:3000`; release builds default to an empty URL and require configuration. A real watch needs an HTTPS server URL, such as your deployed web app. HTTP works only for `10.0.2.2`, `localhost`, or `127.0.0.1` for the emulator and local development. On the watch, open **Server**, enter the server URL, and choose **Save**. The app checks the URL when you save and again before sending.

You may set `-PasihServerUrl=https://your-deployed-server.example` when building to supply a URL for either build type. This value is checked by the app at runtime as well.

## JVM screenshots and tests

Screenshots are rendered on the JVM with Robolectric and Roborazzi; they are not emulator captures. The committed square and black-masked round images are in `screenshots/`.

```sh
./gradlew :app:assembleDebug :app:testDebugUnitTest -Proborazzi.test.record=true
```

The mock-server end-to-end test is skipped unless `ASIH_E2E_URL` is set. Run it against an already-running mock server with:

```sh
ASIH_E2E_URL=http://localhost:3000 ./gradlew :app:testDebugUnitTest -Proborazzi.test.record=true
```

## Data path

Watch microphone audio is encoded as a mono 16 kHz PCM WAV and sent to your Asih server at `/api/transcribe`. The transcript is then sent to `/api/agent` with flow `auto`; the server checks urgent phrases first, then routes the request. Appointment details are read on the phone, ads are checked from a phone photo, and activity requests use Flow B. The server may send submitted audio or text to Meta's AI service according to its configured mode. The notice explains data handling and must be acknowledged on first launch. The watch never stores or receives `META_API_KEY`.

## TODOs

- TODO: Flows A and C need a photo, which stays on the phone; the watch directs people to Asih on their phone.
- TODO: HTTPS for real devices and real device pairing guidance.
- TODO: replace the placeholder with the final avatar via Muse Image.

There is no Play Store listing.
