# Asih Wear OS

A Wear OS companion for Asih that records a short voice request, sends it to the paired development server, and shows a concise Flow B reply. The app requires acknowledgment of the data notice before recording or sending.

## Build

```sh
./gradlew :app:assembleDebug
```

Install the debug APK on a Wear OS emulator or paired watch. To run against the web app, start it from the repository root with `MOCK_MODE=1 npm start`, then set the server URL in the watch's **Server** settings. The emulator default is `http://10.0.2.2:3000`.

## Data path

Watch microphone audio is encoded as a mono 16 kHz PCM WAV and sent to your Asih server at `/api/transcribe`. The transcript is then sent to `/api/agent` as Flow B. The server may send submitted audio or text to Meta's AI service according to its configured mode. The notice explains data handling and must be acknowledged on first launch. The watch never stores or receives `META_API_KEY`.

## TODOs

- TODO: Vinta to decide which flow(s) the watch should use. Flows A and C need a photo, which stays on the phone.
- TODO: HTTPS for real devices and real device pairing guidance.
- TODO: replace the placeholder with the final avatar via Muse Image.

There is no Play Store listing.
