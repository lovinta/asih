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

// Spanish mode variant. Still synthetic and labeled as an example.
export const EXAMPLE_EVENT_ES: ExampleEvent = {
  label: "EJEMPLO (datos sintéticos)",
  name: "Caminantes Matutinos del Parque Riverside — EJEMPLO",
  source: "Anuncio de ejemplo del tablón comunitario (sintético)",
  date: "sábado, 7 de noviembre de 2026",
  time: "9:00 AM",
  place: "Puerta principal del Parque Riverside, Riverton",
  bring: [
    "Zapatos cómodos para caminar",
    "Una botella de agua",
    "Una chaqueta ligera",
  ],
  startPoint: "Nos reunimos en el cartel de la puerta principal del Parque Riverside.",
};

export function exampleEventFor(lang: "en" | "es"): ExampleEvent {
  return lang === "es" ? EXAMPLE_EVENT_ES : EXAMPLE_EVENT;
}
