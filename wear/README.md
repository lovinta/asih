# Asih Wear OS

A Wear OS companion for Asih that records a short voice request, sends it to the paired development server, and shows a concise Flow B reply. The app requires acknowledgment of the data notice before recording or sending.

## Build

```sh
./gradlew :app:assembleDebug
```

Install the debug APK on a Wear OS device. To run against the web app, start it from the repository root with `MOCK_MODE=1 npm start`, then set the server URL in the watch's **Server** settings. The emulator default is `http://10.0.2.2:3000`.

## JVM screenshots and tests

Screenshots are rendered on the JVM with Robolectric and Roborazzi; they are not emulator captures. The committed images are in `screenshots/`.

```sh
./gradlew :app:assembleDebug :app:testDebugUnitTest -Proborazzi.test.record=true
```

The mock-server end-to-end test is skipped unless `ASIH_E2E_URL` is set. Run it against an already-running mock server with:

```sh
ASIH_E2E_URL=http://localhost:3000 ./gradlew :app:testDebugUnitTest -Proborazzi.test.record=true
```

## Data path

Watch microphone audio is encoded as a mono 16 kHz PCM WAV and sent to your Asih server at `/api/transcribe`. The transcript is then sent to `/api/agent` as Flow B. The server may send submitted audio or text to Meta's AI service according to its configured mode. The notice explains data handling and must be acknowledged on first launch. The watch never stores or receives `META_API_KEY`.

## TODOs

- TODO: Vinta to decide which flow(s) the watch should use. Flows A and C need a photo, which stays on the phone.
- TODO: HTTPS for real devices and real device pairing guidance.
- TODO: replace the placeholder with the final avatar via Muse Image.

There is no Play Store listing.
