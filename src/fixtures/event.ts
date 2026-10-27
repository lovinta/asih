// Synthetic EXAMPLE event listing. Invented group, place, and date.
import { EXAMPLE_LABEL } from "./letter";

export interface ExampleEvent {
  label: string;
  name: string;
  source: string;
  date: string;
  time: string;
  place: string;
  bring: string[];
  startPoint: string;
}

// Mock result for find_activities: "Riverside Morning Walkers — EXAMPLE".
export const EXAMPLE_EVENT: ExampleEvent = {
  label: EXAMPLE_LABEL,
  name: "Riverside Morning Walkers — EXAMPLE",
  source: "Example community board listing (synthetic)",
  date: "Saturday, November 7, 2026",
  time: "9:00 AM",
  place: "Riverside Park main gate, Riverton",
  bring: [
    "Comfortable walking shoes",
    "A bottle of water",
    "A light jacket",
  ],
  startPoint: "Meet at the Riverside Park main gate sign.",
};
