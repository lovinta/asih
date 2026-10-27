// Public URL / tel: helpers. No API calls, no scraping, no auto-sending.
// The person always taps / sends themselves.

// Editable invite or note text opened in WhatsApp; the person picks
// recipients and sends. https://wa.me/?text=<urlencoded draft>
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// Public-transit directions to a place. TODO: confirm provider with Vinta.
export function transitDirectionsUrl(place: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}&travelmode=transit`;
}

// Generic web search built from suggested terms + optional place.
// We never fetch results server-side; the person opens the link.
export function webSearchUrl(terms: string, place?: string): string {
  const q = place ? `${terms} ${place}` : terms;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

// Meta Ad Library search for an advertiser name.
export function adLibrarySearchUrl(advertiserName: string): string {
  return (
    "https://www.facebook.com/ads/library/?active_status=all&ad_type=all" +
    `&country=US&q=${encodeURIComponent(advertiserName)}&search_type=keyword_unordered`
  );
}

// Ad preferences in Accounts Center (fixed link from the spec).
export const ACCOUNTS_CENTER_AD_PREFS_URL =
  "https://www.facebook.com/help/943858526073065";

// 211: local help and ride contacts.
export const E211_PHONE = "tel:211";
export const E211_URL = "https://www.211.org/";

// Eldercare Locator: local ride contacts for older adults.
export const ELDERCARE_URL = "https://eldercare.acl.gov/";
export const ELDERCARE_PHONE = "tel:+18006771116";

// Emergency numbers for the Get-help screen. The app never calls by itself.
export const EMERGENCY_US = "tel:911";
export const EMERGENCY_INDONESIA_GENERAL = "tel:112";
export const EMERGENCY_INDONESIA_MEDICAL = "tel:119";
