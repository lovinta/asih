// Opt-in live Meta API smoke test. Never run against real data.
if (process.env.LIVE !== "1") {
  console.log("Live e2e skipped. Set LIVE=1 to call the real Meta API.");
  process.exit(0);
}

const { spawn, spawnSync } = await import("node:child_process");
const { createServer } = await import("node:net");
const { mkdir, mkdtemp, readFile, rm, writeFile } = await import("node:fs/promises");
const { tmpdir } = await import("node:os");
const { dirname, join, resolve } = await import("node:path");
const { fileURLToPath } = await import("node:url");
const { setTimeout: delay } = await import("node:timers/promises");

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const resultDir = resolve(here, "live-results");
const timeoutMs = 180_000;
const maxEstimatedCostUsd = 2;
const fixedWording = {
  en: "I can see these warning signs. I can't tell whether this is real or whether the product works. Check with someone you trust before paying or sharing details.",
  es: "Puedo ver estas señales de advertencia. No puedo decir si esto es real o si el producto funciona. Consulte con alguien de su confianza antes de pagar o compartir datos.",
};
const noCueSuffix = {
  en: "That doesn't mean it's safe.",
  es: "Eso no significa que sea seguro.",
};

const modelCalls = [];
const flowResults = [];
let server;
let serverExited = false;
let budgetExceeded = false;
let stdoutRemainder = "";
let totalEstimatedCostUsd = 0;
let reportPath = "";

function sparkCost(inputTokens, outputTokens) {
  // Conservative estimate using the app's Spark rates and no cache discount.
  return (inputTokens * 1.25 + outputTokens * 4.25) / 1_000_000;
}

function addModelLog(record) {
  if (
    !record ||
    typeof record.flow !== "string" ||
    typeof record.step !== "string" ||
    typeof record.model !== "string"
  ) return;

  let inputTokens = null;
  let outputTokens = null;
  let cost;
  if (record.model === "muse-voice-transcribe-1.0") {
    if (!Number.isFinite(record.audio_seconds)) return;
    cost = Math.max(0, record.audio_seconds) / 3600 * 0.18;
  } else {
    if (!Number.isFinite(record.input_tokens) || !Number.isFinite(record.output_tokens)) return;
    inputTokens = record.input_tokens;
    outputTokens = record.output_tokens;
    cost = sparkCost(inputTokens, outputTokens);
  }
  modelCalls.push({
    flow: record.flow,
    step: record.step,
    model: record.model,
    inputTokens,
    outputTokens,
    estimatedCostUsd: cost,
  });
  totalEstimatedCostUsd += cost;
  if (totalEstimatedCostUsd > maxEstimatedCostUsd && !budgetExceeded) {
    budgetExceeded = true;
    if (server && !serverExited) server.kill("SIGTERM");
  }
}

function consumeServerOutput(chunk) {
  stdoutRemainder += chunk.toString("utf8");
  const lines = stdoutRemainder.split(/\r?\n/);
  stdoutRemainder = lines.pop() ?? "";
  // Next startup output is discarded; only the app's content-free model usage
  // records are parsed and retained in memory.
  for (const line of lines) {
    if (!line.startsWith("{")) continue;
    try {
      addModelLog(JSON.parse(line));
    } catch {
      // Ignore all non-usage output without printing it.
    }
  }
  if (stdoutRemainder.length > 8_192) stdoutRemainder = "";
}

async function freePort() {
  const socket = createServer();
  await new Promise((resolveListen, reject) => {
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", resolveListen);
  });
  const address = socket.address();
  if (!address || typeof address === "string") throw new Error("port allocation failed");
  const port = address.port;
  await new Promise((resolveClose, reject) => socket.close((error) => error ? reject(error) : resolveClose()));
  return port;
}

async function waitUntilReady(baseUrl) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (serverExited) throw new Error("Next.js server exited during startup");
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(5_000) });
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await delay(250);
  }
  throw new Error("Next.js server did not become ready within 45 seconds");
}

async function settleUsageLogs() {
  let previous = modelCalls.length;
  let stableRounds = 0;
  const deadline = Date.now() + 1_500;
  while (stableRounds < 3 && Date.now() < deadline) {
    await delay(75);
    if (modelCalls.length === previous) stableRounds++;
    else {
      previous = modelCalls.length;
      stableRounds = 0;
    }
  }
}

function makeSyntheticLetterPng() {
  const python = String.raw`
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import sys

lines = [
    "EXAMPLE - SYNTHETIC APPOINTMENT LETTER",
    "Riverton Example Clinic",
    "10 Example Road, Riverton",
    "Patient: Jane Example",
    "Appointment: Tuesday, December 1, 2026 at 10:30 AM",
    "Please bring a photo ID and a list of questions.",
    "Call (555) 010-0100",
]
image = Image.new("RGB", (1100, 470), "white")
draw = ImageDraw.Draw(image)
try:
    font = ImageFont.truetype("DejaVuSans.ttf", 29)
    title_font = ImageFont.truetype("DejaVuSans.ttf", 33)
except OSError:
    font = ImageFont.load_default()
    title_font = font
draw.rectangle((16, 16, 1084, 454), outline="#45566f", width=3)
y = 42
for index, line in enumerate(lines):
    draw.text((40, y), line, fill="#14213d", font=title_font if index == 0 else font)
    y += 56
buffer = BytesIO()
image.save(buffer, format="PNG", optimize=True)
sys.stdout.buffer.write(buffer.getvalue())
`;
  const pythonEnv = {
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    ...(process.env.LANG ? { LANG: process.env.LANG } : {}),
  };
  const result = spawnSync("python3", ["-c", python], {
    maxBuffer: 10 * 1024 * 1024,
    env: pythonEnv,
  });
  if (result.status !== 0 || !Buffer.isBuffer(result.stdout) || result.stdout.length === 0) {
    throw new Error("Synthetic image generation failed");
  }
  return `data:image/png;base64,${result.stdout.toString("base64")}`;
}

function makeSyntheticToneWav(seconds = 1) {
  const sampleRate = 16_000;
  const sampleCount = Math.floor(sampleRate * seconds);
  const dataSize = sampleCount * 2;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); // PCM
  wav.writeUInt16LE(1, 22); // mono
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < sampleCount; index++) {
    const sample = Math.round(Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 7_000);
    wav.writeInt16LE(sample, 44 + index * 2);
  }
  return wav;
}

async function makeSyntheticSpeechWav(text) {
  let tempDir;
  try {
    tempDir = await mkdtemp(join(tmpdir(), "asih-live-tts-"));
    const mp3Path = join(tempDir, "speech.mp3");
    const wavPath = join(tempDir, "speech.wav");
    const ttsPython = [
      "import sys",
      "from gtts import gTTS",
      "gTTS(sys.argv[2], lang='en').save(sys.argv[1])",
    ].join("\n");
    const tts = spawnSync(process.env.TTS_PYTHON || "python3", ["-c", ttsPython, mp3Path, text], {
      encoding: "utf8",
      timeout: 90_000,
      maxBuffer: 2 * 1024 * 1024,
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
    });
    if (tts.status !== 0) return null;

    const conversion = spawnSync("ffmpeg", [
      "-nostdin", "-v", "error", "-y", "-i", mp3Path,
      "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wavPath,
    ], {
      encoding: "utf8",
      timeout: 15_000,
      maxBuffer: 2 * 1024 * 1024,
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin" },
    });
    if (conversion.status !== 0) return null;

    const wav = await readFile(wavPath);
    if (wav.length <= 44) return null;
    return { buffer: wav, seconds: Math.max(1, (wav.length - 44) / 32_000) };
  } catch {
    return null;
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function appAssistantText(data) {
  if (!Array.isArray(data?.history)) return "";
  return data.history
    .filter((item) => item?.type === "message" && item?.role === "assistant")
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .filter((part) => typeof part?.text === "string")
    .map((part) => part.text)
    .join("\n");
}

function assertNoUnsafeText(text, label) {
  const ownWords = String(text ?? "")
    .replace(/"[^"]*"/g, " ")
    .replace(/'[^']*'/g, " ");
  const blocked = [
    /\bthis is safe\b/i,
    /\bthis is a scam\b/i,
    /\bes una estafa\b/i,
    /\bes seguro\b/i,
    /\bthis product works\b/i,
    /\beste producto funciona\b/i,
    /\bcures?\b/i,
    /\bcura\b/i,
    /\bmiracle cure\b/i,
    /\byou have (diabetes|cancer|arthritis|hypertension|asthma|covid)\b/i,
    /\busted tiene\b/i,
    /\bdiagnos(is|ed|e you)\b/i,
    /\btake \d+\b/i,
    /\btome \d+\b/i,
    /\b\d+\s?(mg|mcg|ml)\b/i,
    /\bprescrib\w* (you|yourself)\b/i,
    /\byou should take\b/i,
    /\bdeber[ií]a tomar\b/i,
  ];
  ensure(!blocked.some((pattern) => pattern.test(ownWords)), `${label} matched a blocked safety rule`);
}

function outputGuardPassed(data) {
  const guard = Array.isArray(data?.trace)
    ? data.trace.find((step) => step?.tool === "output_guard")
    : undefined;
  ensure(typeof guard?.ok === "boolean", "App output guard did not run");
  return guard.ok;
}

function shortExcerpt(value, max = 220) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function summarizeFlow(name, startIndex, pass, notes, excerpt, extraCalls = []) {
  const calls = [...modelCalls.slice(startIndex), ...extraCalls];
  const hasTokenCounts = calls.some((call) => Number.isFinite(call.inputTokens));
  const inputTokens = calls.reduce((sum, call) => sum + (call.inputTokens ?? 0), 0);
  const outputTokens = calls.reduce((sum, call) => sum + (call.outputTokens ?? 0), 0);
  const estimatedCost = calls.reduce((sum, call) => sum + call.estimatedCostUsd, 0);
  flowResults.push({
    name,
    pass,
    notes,
    models: calls.map((call) => call.model),
    tokenCounts: hasTokenCounts ? { input: inputTokens, output: outputTokens } : null,
    estimatedCostUsd: Number(estimatedCost.toFixed(8)),
    outputExcerpt: shortExcerpt(excerpt),
  });
}

async function runFlow(name, requestFn, validateFn, excerptFn) {
  const startIndex = modelCalls.length;
  const notes = [];
  let passed = false;
  let excerpt = "";
  try {
    const data = await requestFn();
    await settleUsageLogs();
    try {
      excerpt = excerptFn(data);
    } catch {
      excerpt = "";
    }
    const validationNote = validateFn(data);
    if (validationNote === "guard blocked") {
      notes.push("guard blocked");
      const guard = Array.isArray(data?.trace)
        ? data.trace.find((step) => step?.tool === "output_guard")
        : undefined;
      if (typeof guard?.summary === "string") notes.push(`guard reason: ${guard.summary}`);
    } else {
      passed = true;
      if (typeof validationNote === "string" && validationNote) notes.push(validationNote);
      notes.push("HTTP flow completed and app guard behavior was verified.");
    }
  } catch (error) {
    await settleUsageLogs();
    notes.push(error instanceof Error && error.message.startsWith("HTTP ")
      ? error.message
      : error instanceof Error && error.message.startsWith("App ")
        ? error.message
        : "Request or output assertion failed.");
  }
  summarizeFlow(name, startIndex, passed, notes, excerpt);
  if (totalEstimatedCostUsd > maxEstimatedCostUsd && !budgetExceeded) {
    budgetExceeded = true;
    if (server && !serverExited) server.kill("SIGTERM");
  }
}

async function requestJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    await response.arrayBuffer();
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function reportTotals() {
  const allCalls = flowResults.flatMap((flow) => flow.models);
  const tokenCounts = flowResults.reduce((sum, flow) => ({
    input: sum.input + (flow.tokenCounts?.input ?? 0),
    output: sum.output + (flow.tokenCounts?.output ?? 0),
  }), { input: 0, output: 0 });
  const estimatedCostUsd = flowResults.reduce((sum, flow) => sum + flow.estimatedCostUsd, 0);
  return {
    calls: allCalls.length,
    tokenCounts,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(8)),
  };
}

function addNotRunFlow(name, note) {
  flowResults.push({
    name,
    pass: false,
    notes: [note],
    models: [],
    tokenCounts: null,
    estimatedCostUsd: 0,
    outputExcerpt: "",
  });
}

async function writeResults() {
  await mkdir(resultDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  reportPath = resolve(resultDir, `${timestamp}.json`);
  const report = {
    selectedFlows: activeFlowNames,
    flows: flowResults,
    totals: reportTotals(),
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
}

function printSummary() {
  for (const flow of flowResults) {
    const tokens = flow.tokenCounts
      ? `in=${flow.tokenCounts.input} out=${flow.tokenCounts.output}`
      : "tokens unavailable";
    const excerpt = flow.outputExcerpt ? ` | excerpt=${flow.outputExcerpt}` : "";
    console.log(`${flow.pass ? "PASS" : "FAIL"} ${flow.name}: ${flow.notes.join("; ")} | models=${flow.models.join(",") || "none"} | ${tokens} | $${flow.estimatedCostUsd.toFixed(6)}${excerpt}`);
  }
  const totals = reportTotals();
  console.log(`Totals: ${totals.calls} model calls, ${totals.tokenCounts.input + totals.tokenCounts.output} tokens, estimated $${totals.estimatedCostUsd.toFixed(6)}.`);
  if (reportPath) console.log(`Run log: ${reportPath}`);
}

const flowNames = [
  "chat_intent_and_appointment_text_plus_image",
  "scam_ad_en",
  "scam_ad_es",
  "group_invite_generation",
  "synthetic_audio_transcription",
];
const selectedFlowNames = process.env.LIVE_FLOWS
  ? new Set(process.env.LIVE_FLOWS.split(",").map((name) => name.trim()).filter(Boolean))
  : null;
const activeFlowNames = selectedFlowNames
  ? flowNames.filter((name) => selectedFlowNames.has(name))
  : flowNames;

try {
  if (!process.env.META_API_KEY) {
    for (const name of activeFlowNames) addNotRunFlow(name, "LIVE=1 requires META_API_KEY; no calls were made.");
  } else {
    const port = await freePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const childEnv = { ...process.env };
    delete childEnv.MOCK_MODE;
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
      cwd: projectRoot,
      env: childEnv,
      // Capture only stdout so content-free usage records can be parsed. Never
      // forward server output, stderr, request headers, or environment values.
      stdio: ["ignore", "pipe", "ignore"],
    });
    server.stdout.on("data", consumeServerOutput);
    server.once("exit", () => { serverExited = true; });

    try {
      await waitUntilReady(baseUrl);
      const modeResponse = await fetch(`${baseUrl}/api/mode`, { signal: AbortSignal.timeout(10_000) });
      const mode = modeResponse.ok ? await modeResponse.json() : null;
      if (!modeResponse.ok || mode?.mock !== false) {
        for (const name of activeFlowNames) addNotRunFlow(name, "Mode check failed: server did not report live mode; no flow calls were made.");
      } else {
        let imageDataUrl = "";
        if (activeFlowNames.includes(flowNames[0])) {
          try {
            imageDataUrl = makeSyntheticLetterPng();
          } catch {
            addNotRunFlow(flowNames[0], "Synthetic PNG generation failed; image flow was not called.");
          }
        }

        if (imageDataUrl) {
          await runFlow(
            flowNames[0],
            () => requestJson(`${baseUrl}/api/agent`, {
              flow: "auto",
              lang: "en",
              input: {
                text: [
                  "Please read this appointment letter for Jane Example.",
                  "Riverton Example Clinic, 10 Example Road, Riverton.",
                  "Tuesday, December 1, 2026 at 10:30 AM.",
                  "Call (555) 010-0100. Bring a photo ID and list of questions.",
                  "This is synthetic example data.",
                ].join("\n"),
                imageDataUrl,
              },
            }),
            (data) => {
              ensure(data?.routed?.intent === "appointment", "App did not route the appointment request correctly");
              ensure(data?.result?.kind === "A", "App did not run the appointment flow");
              ensure(Array.isArray(data?.result?.fields) && data.result.fields.length > 0, "App returned no appointment fields");
              ensure(data.result.fields.some((field) => field?.readable === true), "App returned no readable appointment fields");
              const guardPassed = outputGuardPassed(data);
              assertNoUnsafeText(JSON.stringify(data.result.fields), "User-facing appointment fields");
              if (guardPassed) assertNoUnsafeText(appAssistantText(data), "Guard-approved assistant text");
              return guardPassed ? "" : "guard blocked";
            },
            (data) => `Appointment fields: ${JSON.stringify(data.result.fields.map((field) => ({
              kind: field.kind,
              value: field.value,
              readable: field.readable,
            })))}`,
          );
        }

        if (budgetExceeded) {
          for (const name of activeFlowNames.slice(flowResults.length)) addNotRunFlow(name, "Stopped after the estimated $2 spend threshold.");
        } else {
          for (const [lang, name] of [["en", "scam_ad_en"], ["es", "scam_ad_es"]]) {
            if (!activeFlowNames.includes(name)) continue;
            await runFlow(
              name,
              () => requestJson(`${baseUrl}/api/agent`, {
                flow: "C",
                lang,
                input: { useExample: true },
              }),
              (data) => {
                ensure(data?.result?.kind === "C", "App did not run the ad-check flow");
                const guardPassed = outputGuardPassed(data);
                ensure(data.result.guardPassed === guardPassed, "App guard status was inconsistent");
                ensure(typeof data.result.message === "string" && data.result.message.includes(fixedWording[lang]), "Fixed scam wording was missing");
                if (Array.isArray(data.result.cues) && data.result.cues.length === 0) {
                  ensure(data.result.message.endsWith(noCueSuffix[lang]), "Required no-cue suffix was missing");
                } else {
                  ensure(!data.result.message.includes(noCueSuffix[lang]), "No-cue suffix appeared despite detected cues");
                }
                if (!guardPassed) {
                  const expectedFallback = data.result.cues.length === 0
                    ? `${fixedWording[lang]} ${noCueSuffix[lang]}`
                    : fixedWording[lang];
                  ensure(data.result.message === expectedFallback, "App did not fall back to the required fixed scam wording");
                } else {
                  assertNoUnsafeText(appAssistantText(data), "Guard-approved assistant text");
                }
                assertNoUnsafeText(
                  [data.result.message, data.result.explanation?.steps, data.result.draft?.draft].flat().join(" "),
                  "User-facing ad-check output",
                );
                return guardPassed ? "" : "guard blocked";
              },
              (data) => `Message: ${data.result.message}`,
            );
            if (budgetExceeded) break;
          }

          if (budgetExceeded) {
            for (const name of activeFlowNames.slice(flowResults.length)) addNotRunFlow(name, "Stopped after the estimated $2 spend threshold.");
          } else if (activeFlowNames.includes(flowNames[3])) {
            await runFlow(
              "group_invite_generation",
              () => requestJson(`${baseUrl}/api/agent`, {
                flow: "B",
                lang: "en",
                input: {
                  interest: "walking",
                  place: "Riverton",
                  text: "Please help Jane Example make an editable invite for the fictional Example Community Walking Group in Riverton. Do not send it.",
                },
              }),
              (data) => {
                ensure(data?.result?.kind === "B", "App did not run the group activity flow");
                ensure(typeof data?.result?.invite?.draft === "string" && data.result.invite.draft.length > 10, "App did not generate an invite draft");
                const guardPassed = outputGuardPassed(data);
                assertNoUnsafeText(JSON.stringify(data.result), "User-facing group invite output");
                if (guardPassed) assertNoUnsafeText(appAssistantText(data), "Guard-approved assistant text");
                return guardPassed ? "" : "guard blocked";
              },
              (data) => JSON.stringify({
                event: data.result.event,
                plan: data.result.plan,
                invite: data.result.invite,
              }),
            );
          }

          if (budgetExceeded) {
            for (const name of activeFlowNames.slice(flowResults.length)) addNotRunFlow(name, "Stopped after the estimated $2 spend threshold.");
          } else if (activeFlowNames.includes(flowNames[4])) {
            const audioStartIndex = modelCalls.length;
            const spokenText = "This is an example voice note. Please call me back tomorrow.";
            const synthesized = await makeSyntheticSpeechWav(spokenText);
            const audioSeconds = synthesized?.seconds ?? 1;
            const audio = synthesized?.buffer ?? makeSyntheticToneWav(audioSeconds);
            const form = new FormData();
            form.append("audio", new Blob([audio], { type: "audio/wav" }), synthesized ? "synthetic-speech.wav" : "synthetic-tone.wav");
            form.append("lang", "en");
            const notes = synthesized
              ? ["Used a synthetic spoken English sentence."]
              : ["TTS was unavailable; used a one-second synthetic tone."];
            let passed = false;
            let excerpt = "";
            try {
              const response = await fetch(`${baseUrl}/api/transcribe`, {
                method: "POST",
                body: form,
                signal: AbortSignal.timeout(timeoutMs),
              });
              const payload = response.ok ? await response.json() : null;
              excerpt = `Transcript: ${shortExcerpt(payload?.transcript)}`;
              if (!response.ok) {
                await response.arrayBuffer();
                throw new Error(`HTTP ${response.status}`);
              }
              ensure(payload?.mock === false, "App returned mock transcription in live mode");
              ensure(typeof payload?.transcript === "string", "App returned no transcript string");
              if (synthesized) ensure(payload.transcript.trim().length > 10, "App returned an empty speech transcript");
              passed = true;
            } catch (error) {
              notes.push(error instanceof Error && error.message.startsWith("HTTP ")
                ? error.message
                : error instanceof Error && error.message.startsWith("App ")
                  ? error.message
                  : "Request or output assertion failed.");
            }
            await settleUsageLogs();
            if (passed) notes.push("Live transcription route returned a string response.");
            summarizeFlow(flowNames[4], audioStartIndex, passed, notes, excerpt);
          }
        }
      }
    } catch {
      for (const name of activeFlowNames.slice(flowResults.length)) {
        addNotRunFlow(name, budgetExceeded
          ? "Stopped after the estimated $2 spend threshold."
          : "Server startup or live-mode verification failed; no further flow calls were made.");
      }
    }
  }
} catch {
  for (const name of activeFlowNames.slice(flowResults.length)) {
    addNotRunFlow(name, "Live e2e setup failed before the flow could run.");
  }
} finally {
  if (server && !serverExited) {
    server.kill("SIGTERM");
    await Promise.race([
      new Promise((resolveExit) => server.once("exit", resolveExit)),
      delay(5_000),
    ]);
  }
  await writeResults();
  printSummary();
}

if (flowResults.some((flow) => !flow.pass)) process.exitCode = 1;
