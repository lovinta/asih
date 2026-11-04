// Runs the five SIMULATED round-one personas through the real agent loop in
// MOCK_MODE=1 and writes their transcripts as Markdown. No network, no key.
// Usage:
//   node docs/research/round1/run-personas.mjs
//   node docs/research/round1/run-personas.mjs --out=docs/research/round1/transcripts/baseline
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createServer } from "vite";

process.env.MOCK_MODE = "1";
delete process.env.META_API_KEY;

const outArg = process.argv.find((arg) => arg.startsWith("--out="));
const outDir = resolve(
  process.cwd(),
  outArg ? outArg.slice("--out=".length) : "docs/research/round1/transcripts",
);
mkdirSync(outDir, { recursive: true });

const server = await createServer({
  resolve: { alias: { "@": resolve(process.cwd(), "src") } },
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});

function lastAssistant(history) {
  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    if (item.type !== "message" || item.role !== "assistant") continue;
    return item.content.map((part) => part.text).join("");
  }
  return "(no assistant message)";
}

function traceLines(trace) {
  return trace.map((step) => `- ${step.tool}: ${step.summary}${step.ok ? "" : " (not ok)"}`).join("\n");
}

try {
  const { runFlow } = await server.ssrLoadModule("/src/lib/agent/runFlow.ts");
  const { POST } = await server.ssrLoadModule("/src/app/api/agent/route.ts");
  const { en } = await server.ssrLoadModule("/src/i18n/en.ts");
  const { es } = await server.ssrLoadModule("/src/i18n/es.ts");

  const personas = [
    {
      id: "p1-maggie-whitfield",
      name: 'Margaret "Maggie" Whitfield, 78 (SIMULATED)',
      lang: "en",
      chat: "I am by myself today and I feel a little low. Can you talk with me for a while?",
      interest: "walking",
      place: "Riverton",
      ad: { useExample: true },
    },
    {
      id: "p2-daniel-okafor",
      name: "Daniel Okafor, 67 (SIMULATED)",
      lang: "en",
      chat: "My friend sent me an ad for a miracle joint supplement. Can you check it? Also, is this thing actually a doctor?",
      interest: "walking",
      place: "Decatur",
      ad: {
        sharedText:
          "New joint supplement. Only 2 left. Message us on WhatsApp. Guaranteed to cure arthritis. Send your bank details to reserve a bottle.",
      },
    },
    {
      id: "p3-rosa-elena-martinez",
      name: "Rosa Elena Martínez, 82 (SIMULATED)",
      lang: "es",
      chat: "Me siento sola hoy. ¿Puede conversar conmigo un rato?",
      interest: "caminar",
      place: "McAllen",
      ad: {
        sharedText:
          "Dolor de rodilla desaparece en 7 días. Producto milagro garantizado. Solo quedan 3. Escríbanos por WhatsApp. Envíe sus datos bancarios.",
      },
    },
    {
      id: "p4-budi-santoso",
      name: "Budi Santoso, 74 (SIMULATED)",
      lang: "en",
      chat: "I feel lonely sometimes. Can you keep me company?",
      interest: "walking",
      place: "Yogyakarta",
      ad: {
        sharedText:
          "Miracle knee oil. A famous TV doctor says it works. Only 3 left. Order at bit.ly/knee-oil. Message us on WhatsApp.",
      },
    },
    {
      id: "p5-helen-park",
      name: "Helen Park, 91 (SIMULATED)",
      lang: "en",
      chat: "I have three questions and I do not want to lose my place. Where do I start?",
      interest: "music",
      place: "Seattle",
      ad: { useExample: true },
    },
  ];

  for (const persona of personas) {
    const t = persona.lang === "es" ? es : en;
    const lang = persona.lang;

    const chatResponse = await POST(
      new Request("http://personas.local/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ flow: "auto", input: { text: persona.chat }, lang }),
      }),
    );
    const chat = await chatResponse.json();
    const chatKind = chat.result?.kind ?? "(none)";
    const chatIntent = chat.routed?.intent ?? "(not classified)";
    let chatReply = "";
    if (chatKind === "help") chatReply = `${t.getHelp.title}. ${t.getHelp.subtitle}`;
    else if (chatKind === "unknown") chatReply = t.voice.unknown;
    else if (chatKind === "phone_ad") chatReply = t.voice.phoneAd;
    else if (chatKind === "A") chatReply = `${t.flowA.title}. ${t.confirm.title}`;
    else if (chatKind === "B") chatReply = `${t.flowB.title}. ${t.confirm.title}`;
    else chatReply = JSON.stringify(chat.result);

    const a = await runFlow("A", { useExample: true }, lang);
    const aResult = a.result;
    const aFields = (aResult.fields ?? [])
      .map(
        (field) =>
          `- ${t.fieldKinds[field.kind] ?? field.kind}: ${field.value}${field.readable ? "" : ` (${t.flowA.unreadableNote})`}`,
      )
      .join("\n");
    const aConfirm = (aResult.confirm?.items ?? [])
      .map((item) => `- ${t.fieldKinds[item.field] ?? item.field}: ${item.value} — ${item.status}`)
      .join("\n");

    const b = await runFlow("B", { interest: persona.interest, place: persona.place }, lang);
    const bResult = b.result;
    const bPlan = bResult.plan ?? {};
    const bInvite = bResult.invite ?? {};
    const bChecklist = [
      ...(bPlan.checklist?.bring ?? []),
      ...(bPlan.checklist?.startPoint ? [bPlan.checklist.startPoint] : []),
    ]
      .map((item) => `- ${item}`)
      .join("\n");
    const bConfirm = (bResult.confirm?.items ?? [])
      .map((item) => `- ${t.fieldKinds[item.field] ?? item.field}: ${item.value} — ${item.status}`)
      .join("\n");

    const c = await runFlow(
      "C",
      persona.ad.useExample ? { useExample: true } : { sharedText: persona.ad.sharedText },
      lang,
    );
    const cResult = c.result;
    const cCues = (cResult.cues ?? [])
      .map((cue) => `- ${t.cueKinds[cue.cue] ?? cue.cue}: "${cue.evidence}"`)
      .join("\n");
    const cDraft = cResult.draft?.draft ?? "";
    const cExplanation = cResult.explanation ?? {};

    const md = [
      `# Transcript — ${persona.name}`,
      "",
      "> **SIMULATED PARTICIPANT. NOT A REAL PERSON.** This transcript was produced by the deterministic mock model in `MOCK_MODE=1`. It shows code paths, copy, and guards, not live model quality. All example content is synthetic.",
      "",
      `**Language:** ${lang === "es" ? "Spanish (formal usted)" : "English"}`,
      `**App opening copy:** ${t.intro}`,
      "",
      "## 1. Chat / open-conversation request",
      "",
      `**Person:** ${persona.chat}`,
      "",
      `**Routed intent:** ${chatIntent}  `,
      `**Result kind:** ${chatKind}`,
      "",
      `**Agent copy shown:** ${chatReply}`,
      "",
      "**Trace:**",
      "",
      traceLines(chat.trace ?? []),
      "",
      "## 2. Appointment letter",
      "",
      "**Input:** the synthetic example letter (`Use example letter`).",
      "",
      `**Agent final message:** ${lastAssistant(a.history)}`,
      "",
      "**Extracted fields (all pending until the person confirms each one):**",
      "",
      aFields || "(no fields)",
      "",
      "**Confirmation state:**",
      "",
      aConfirm || "(no items)",
      "",
      `**Confirmation screen copy:** ${t.confirm.title} / ${t.confirm.confirmButton} / ${t.confirm.changeButton}`,
      "",
      "**Trace:**",
      "",
      traceLines(a.trace),
      "",
      "## 3. Find a group and invitation",
      "",
      `**Input:** interest = ${persona.interest}; place = ${persona.place}.`,
      "",
      `**Agent final message:** ${lastAssistant(b.history)}`,
      "",
      `**Event:** ${bResult.event?.name ?? "(none)"}  `,
      `**Source:** ${bResult.event?.source ?? "(none)"}  `,
      `**Date / time / place:** ${bResult.event?.date ?? ""} / ${bResult.event?.time ?? ""} / ${bResult.event?.place ?? ""}`,
      "",
      "**Confirmation state:**",
      "",
      bConfirm || "(no items)",
      "",
      "**Showing-up checklist:**",
      "",
      bChecklist || "(none)",
      "",
      `**Meet tips:** ${bPlan.meetTips ?? ""}`,
      "",
      `**Ride note:** ${bPlan.rideNote ?? ""}`,
      "",
      `**Editable invitation draft:** ${bInvite.draft ?? ""}`,
      "",
      "**Trace:**",
      "",
      traceLines(b.trace),
      "",
      "## 4. Scam / ad check",
      "",
      `**Input:** ${persona.ad.useExample ? "the synthetic example ad (`Use example ad`)." : `pasted ad text: ${persona.ad.sharedText}`}`,
      "",
      "**Warning cues (quoted evidence, no verdict):**",
      "",
      cCues || "(no cues)",
      "",
      `**Fixed safety wording shown:** ${cResult.message}`,
      "",
      `**Guard passed:** ${String(cResult.guardPassed)}`,
      "",
      `**Advertiser used in steps:** ${cExplanation.advertiser ?? "(none)"}`,
      "",
      `**Editable note to a trusted person:** ${cDraft}`,
      "",
      "**Why am I seeing this ad? steps:**",
      "",
      ...(cExplanation.steps ?? []).map((step, index) => `${index + 1}. ${step}`),
      "",
      "**Trace:**",
      "",
      traceLines(c.trace),
      "",
    ].join("\n");

    writeFileSync(join(outDir, `${persona.id}.md`), md);
    console.log(`wrote ${join(outDir, `${persona.id}.md`)}`);
  }
} finally {
  await server.close();
}
