import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";

const port = Number(process.env.E2E_PORT || 3124);
const baseUrl = `http://127.0.0.1:${port}`;
const screenshotDir = fileURLToPath(new URL("./screenshots/", import.meta.url));
const timeout = 10_000;
let server;
let browser;

async function waitUntilReady() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error("next start did not become ready within 30 seconds");
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${screenshotDir}/${name}`, fullPage: true, timeout });
}

try {
  await mkdir(screenshotDir, { recursive: true });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, MOCK_MODE: "1", META_API_KEY: "" },
    stdio: "inherit",
  });
  await waitUntilReady();

  browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });
  const context = await browser.newContext({ viewport: { width: 430, height: 900 } });
  await context.grantPermissions(["microphone"], { origin: baseUrl });
  await context.addInitScript(() => {
    window.open = (url) => {
      window.__lastOpenedUrl = String(url);
      return null;
    };
    const media = navigator.mediaDevices;
    if (media) media.getUserMedia = async () => {
      const audio = new AudioContext();
      const destination = audio.createMediaStreamDestination();
      const tone = audio.createOscillator();
      tone.connect(destination); tone.start();
      await audio.resume();
      return destination.stream;
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(timeout);
  page.setDefaultNavigationTimeout(timeout);
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout });
  await page.locator(".intro-text").getByText("Hello, I'm Asih, an AI helper. I'm not a person or a doctor. I can make mistakes. You decide every step.").waitFor({ state: "visible", timeout });
  await page.getByRole("img", { name: "Asih (AI helper)" }).waitFor({ state: "visible", timeout });
  await page.getByTestId("flow-a").click({ timeout });
  await page.getByRole("button", { name: "Use example letter" }).click({ timeout });
  await page.getByTestId("data-notice").waitFor({ state: "visible", timeout });
  assert.equal(await page.getByTestId("confirm-item").count(), 0, "flow must not run before notice acknowledgment");
  await screenshot(page, "01-data-notice.png");
  await page.getByTestId("acknowledge-notice").click({ timeout });
  await page.getByTestId("confirm-item").waitFor({ state: "visible", timeout });

  // Edit the first field before confirming any of the seven fields.
  await page.getByTestId("change-item").click({ timeout });
  await page.getByTestId("confirm-edit").fill("Wednesday, November 11, 2026", { timeout });
  await page.getByTestId("save-edit").click({ timeout });
  const itemCount = 7;
  for (let i = 0; i < itemCount; i++) {
    assert.equal(await page.evaluate(() => localStorage.getItem("oah.visits")), null, `visit saved before confirm ${i + 1}`);
    assert.equal(
      await page.getByRole("button", { name: "Download calendar file (.ics)" }).count(),
      0,
      `calendar download appeared before confirmation ${i + 1}`,
    );
    await page.getByTestId("confirm-item").click({ timeout });
    if (i < itemCount - 1) {
      await page.getByText(`(${i + 1}/${itemCount})`, { exact: false }).waitFor({ state: "visible", timeout });
    }
  }
  assert.equal(await page.evaluate(() => localStorage.getItem("oah.visits")), null, "visit saved before Continue");
  await page.getByTestId("confirm-continue").click({ timeout });
  await page.getByText("Visit saved on this phone.", { exact: true }).waitFor({ state: "visible", timeout });
  assert.ok(await page.evaluate(() => localStorage.getItem("oah.visits")), "confirmed visit was not saved");
  await page.getByRole("button", { name: "Download calendar file (.ics)" }).waitFor({ state: "visible", timeout });
  await screenshot(page, "02-flow-a-confirmed.png");

  await page.getByTestId("screen-back").click({ timeout });
  await page.getByTestId("flow-b").click({ timeout });
  await page.getByRole("button", { name: "Use example listing" }).click({ timeout });
  await page.getByTestId("confirm-item").waitFor({ state: "visible", timeout });
  for (let i = 0; i < 3; i++) await page.getByTestId("confirm-item").click({ timeout });
  await page.getByTestId("confirm-continue").click({ timeout });
  await page.getByTestId("invite-draft").waitFor({ state: "visible", timeout });
  const editedInvite = "I edited this invitation before sharing.";
  await page.getByTestId("invite-draft").fill(editedInvite, { timeout });
  await page.getByRole("button", { name: "Open in WhatsApp" }).click({ timeout });
  const waUrl = await page.evaluate(() => window.__lastOpenedUrl);
  assert.ok(waUrl.startsWith("https://wa.me/?text="), `unexpected WhatsApp URL: ${waUrl}`);
  assert.ok(decodeURIComponent(waUrl).includes(editedInvite), "WhatsApp URL does not contain the edited invite");
  const links = await page.locator("a").evaluateAll((anchors) => anchors.map((a) => a.href));
  assert.ok(links.some((url) => url.includes("travelmode=transit")), "transit link missing");
  assert.ok(links.includes("https://www.211.org/"), "211 link missing");
  assert.ok(links.includes("https://eldercare.acl.gov/"), "Eldercare link missing");
  await screenshot(page, "03-flow-b.png");

  await page.getByRole("button", { name: "Back", exact: true }).click({ timeout });
  await page.getByTestId("flow-c").click({ timeout });
  await page.getByRole("button", { name: "Use example ad" }).click({ timeout });
  await page.getByTestId("fixed-scam-wording").waitFor({ state: "visible", timeout });
  assert.ok((await page.getByTestId("fixed-scam-wording").innerText({ timeout })).includes("I can see these warning signs."));
  const quotes = await page.getByTestId("scam-cues").innerText({ timeout });
  assert.ok(quotes.includes("Only 3 left in stock. ACT NOW!"), "whole quoted cue line missing");
  const adLinks = await page.locator("a").evaluateAll((anchors) => anchors.map((a) => a.href));
  assert.ok(adLinks.some((url) => url.includes("facebook.com/ads/library/")), "Ad Library link missing");
  await screenshot(page, "04-flow-c-en.png");
  // Choose Spanish BEFORE running the flow: agent-written text is produced in the language active at run time.
  await page.getByRole("button", { name: "Back", exact: true }).click({ timeout });
  await page.getByRole("button", { name: "ES", exact: true }).click({ timeout });
  await page.getByTestId("flow-c").click({ timeout });
  await page.getByTestId("flow-c-example").click({ timeout });
  await page.getByTestId("fixed-scam-wording").waitFor({ state: "visible", timeout });
  assert.ok((await page.getByTestId("fixed-scam-wording").innerText({ timeout })).includes("Puedo ver estas señales de advertencia."));
  const esText = await page.locator("main").innerText({ timeout });
  const drafts = await page.locator("textarea").evaluateAll((els) => els.map((el) => el.value).join("\n"));
  assert.ok(drafts.includes("¿Puede mirar este anuncio conmigo?"), "Spanish draft missing");
  assert.ok(!esText.includes("Tap the three dots"), "English ad steps shown in Spanish mode");
  await screenshot(page, "05-flow-c-es.png");

  await page.getByTestId("screen-back").click({ timeout });
  await page.getByRole("button", { name: "EN", exact: true }).click({ timeout });
  await page.getByTestId("voice-note").click({ timeout });
  await page.getByRole("button", { name: "Use example voice note" }).click({ timeout });
  await page.getByTestId("voice-transcript").waitFor({ state: "visible", timeout });
  await screenshot(page, "07-voice-note-transcript.png");
  await page.getByRole("button", { name: "Write a reply" }).click({ timeout });
  const voiceDraft = "I will call you later.";
  await page.getByTestId("voice-draft").fill(voiceDraft, { timeout });
  await page.getByRole("button", { name: "Open in WhatsApp" }).last().click({ timeout });
  const voiceUrl = await page.evaluate(() => window.__lastOpenedUrl);
  assert.ok(voiceUrl.includes(encodeURIComponent(voiceDraft)), "WhatsApp URL does not contain the voice reply draft");
  await screenshot(page, "08-voice-note-reply.png");
  await page.getByRole("button", { name: "Back", exact: true }).click({ timeout });
  await page.getByTestId("voice-note").click({ timeout });
  const sampleRate = 16000;
  const wav = Buffer.alloc(46);
  wav.write("RIFF", 0); wav.writeUInt32LE(38, 4); wav.write("WAVE", 8); wav.write("fmt ", 12); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(2, 40);
  await page.locator("#voice-upload").setInputFiles({ name: "small.wav", mimeType: "audio/wav", buffer: wav });
  await page.getByTestId("voice-transcript").waitFor({ state: "visible", timeout });
  await page.getByRole("button", { name: "Back", exact: true }).click({ timeout });
  await page.getByTestId("voice-note").click({ timeout });
  await page.getByRole("button", { name: "Start recording" }).click({ timeout });
  await page.waitForTimeout(100);
  if (await page.getByTestId("data-notice").count()) await page.getByTestId("acknowledge-notice").click({ timeout });
  if (await page.getByRole("button", { name: "Start recording" }).count()) await page.getByRole("button", { name: "Start recording" }).click({ timeout });
  await delay(1500);
  await page.getByRole("button", { name: "Stop recording" }).click({ timeout });
  await page.getByTestId("voice-transcript").waitFor({ state: "visible", timeout });
  await page.getByRole("button", { name: "Back", exact: true }).click({ timeout });

  await page.getByTestId("activity-notes").click({ timeout });
  await page.getByLabel("What", { exact: true }).fill("Library visit", { timeout });
  await page.getByRole("button", { name: "Save note" }).click({ timeout });
  await page.locator("li").filter({ hasText: "Library visit" }).first().waitFor({ state: "visible", timeout });
  await screenshot(page, "09-activity-note.png");
  await page.getByRole("button", { name: "Back", exact: true }).click({ timeout });
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete everything" }).click({ timeout });
  assert.equal(await page.evaluate(() => localStorage.getItem("oah.activityNotes")), null, "Delete everything left activity notes on the phone");

  await page.getByTestId("get-help").click({ timeout });
  await page.getByTestId("call-911").waitFor({ state: "visible", timeout });
  assert.equal(await page.getByTestId("call-911").getAttribute("href", { timeout }), "tel:911");
  await screenshot(page, "06-get-help.png");
  await context.close();
  console.log("e2e smoke passed; screenshots saved to e2e/screenshots/");
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      delay(5_000),
    ]);
  }
}
