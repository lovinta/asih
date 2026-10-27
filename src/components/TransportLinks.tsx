"use client";

// Transport help for a confirmed place: public-transit directions link, 211,
// and the Eldercare Locator. The person arranges the ride; the app never
// books one.
import {
  E211_PHONE,
  E211_URL,
  ELDERCARE_PHONE,
  ELDERCARE_URL,
  transitDirectionsUrl,
} from "@/lib/links";
import { useLang } from "./Lang";

export default function TransportLinks({
  place,
  transitUrl,
  rideNote,
}: {
  place: string;
  transitUrl?: string;
  rideNote: string;
}) {
  const { t } = useLang();
  const directions = transitUrl ?? transitDirectionsUrl(place);
  return (
    <section>
      <h2>{t.flowA.transportTitle}</h2>
      <ul className="link-list">
        <li>
          <a href={directions} target="_blank" rel="noopener noreferrer">
            {place || directions}
          </a>
        </li>
        <li>
          <a href={E211_PHONE}>211</a> — <a href={E211_URL}>{E211_URL}</a>
        </li>
        <li>
          <a href={ELDERCARE_URL}>{ELDERCARE_URL}</a> —{" "}
          <a href={ELDERCARE_PHONE}>1-800-677-1116</a>
        </li>
      </ul>
      <p className="muted">{rideNote}</p>
    </section>
  );
}
