// Synthetic EXAMPLE data only. Every name, place, and number here is invented
// for the offline demo. Never treat fixture text as a real letter.

// Label shown in the UI next to every fixture.
export const EXAMPLE_LABEL = "EXAMPLE (synthetic data)";

// Invented appointment letter. Fields extracted from it live in
// EXAMPLE_LETTER_FIELDS below with exact evidence quotes.
export const EXAMPLE_LETTER_TEXT = [
  "Riverside Community Health Center",
  "12 Park Avenue, Riverton",
  "Dear Mrs. Elena Rivera,",
  "You have a visit on Tuesday, November 10, 2026 at 10:30 AM",
  "with Dr. Patel at Riverside Community Health Center, Room 204.",
  "Please bring your photo ID, your medication list, and your insurance card.",
  "Questions? Call us at (555) 014-2200.",
  "Riverside Community Health Center",
].join("\n");

export type LetterFieldKind =
  | "date"
  | "time"
  | "place"
  | "clinic_name"
  | "person_name"
  | "phone"
  | "bring_items";

export interface LetterField {
  kind: LetterFieldKind;
  value: string;
  readable: boolean;
  evidence_quote: string;
}

// What read_document returns for the example letter in mock mode.
export const EXAMPLE_LETTER_FIELDS: LetterField[] = [
  {
    kind: "date",
    value: "Tuesday, November 10, 2026",
    readable: true,
    evidence_quote: "You have a visit on Tuesday, November 10, 2026 at 10:30 AM",
  },
  {
    kind: "time",
    value: "10:30 AM",
    readable: true,
    evidence_quote: "at 10:30 AM",
  },
  {
    kind: "place",
    value: "Riverside Community Health Center, Room 204",
    readable: true,
    evidence_quote: "at Riverside Community Health Center, Room 204",
  },
  {
    kind: "clinic_name",
    value: "Riverside Community Health Center",
    readable: true,
    evidence_quote: "Riverside Community Health Center",
  },
  {
    kind: "person_name",
    value: "Dr. Patel",
    readable: true,
    evidence_quote: "with Dr. Patel",
  },
  {
    kind: "phone",
    value: "(555) 014-2200",
    readable: true,
    evidence_quote: "Call us at (555) 014-2200",
  },
  {
    kind: "bring_items",
    value: "photo ID, medication list, insurance card",
    readable: true,
    evidence_quote:
      "Please bring your photo ID, your medication list, and your insurance card.",
  },
];
