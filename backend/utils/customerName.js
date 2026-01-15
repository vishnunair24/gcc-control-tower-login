// Utility helpers for normalizing customer names across the app.
// This keeps lookups and logo mapping robust even if users
// type different casing or extended names like "Infinite electronics inc".

const CANONICAL_CUSTOMERS = {
  infinite: "Infinite",
  vip: "VIP",
  routeware: "Routeware",
  "client 4": "Client 4",
  "client 5": "Client 5",
  "client 6": "Client 6",
  "client 7": "Client 7",
  "client 8": "Client 8",
  "client 9": "Client 9",
};

const DEFAULT_LOGO_URLS = {
  Infinite: "/client-logos/Infinite.png",
  VIP: "/client-logos/VIP.png",
  Routeware: "/client-logos/Routeware.png",
};

/**
 * Normalize a raw customer name to a canonical label.
 * - Trims whitespace
 * - Case-insensitive
 * - If it contains a known token (e.g., "infinite" anywhere in the string),
 *   returns the configured canonical label (e.g., "Infinite").
 * - Otherwise returns the trimmed original value.
 */
function normalizeCustomerName(raw) {
  if (!raw) return null;
  const input = String(raw).trim();
  if (!input) return null;

  const lower = input.toLowerCase();
  for (const [token, canonical] of Object.entries(CANONICAL_CUSTOMERS)) {
    if (lower.includes(token)) {
      return canonical;
    }
  }

  // Fallback: keep original text if we don't recognise it.
  return input;
}

function defaultLogoUrlForCustomer(canonicalName) {
  if (!canonicalName) return null;
  return DEFAULT_LOGO_URLS[canonicalName] || null;
}

module.exports = {
  normalizeCustomerName,
  defaultLogoUrlForCustomer,
  CANONICAL_CUSTOMERS,
};
