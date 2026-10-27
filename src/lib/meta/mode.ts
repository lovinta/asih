// LIVE vs MOCK mode. Mock is the default when no key is set, so tests and
// the offline demo never touch the network and never need a key.
export function isMockMode(): boolean {
  return process.env.MOCK_MODE === "1" || !process.env.META_API_KEY;
}

export function getApiKey(): string | undefined {
  return process.env.META_API_KEY;
}
