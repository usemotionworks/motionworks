import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json" with { type: "json" };

countries.registerLocale(en);

// Helper function to normalize raw distributor country text
export const normalizeCountry = (rawInput) => {
  if (!rawInput) return { code: "ZZ", name: "Unknown / International" };

  const trimmed = rawInput.trim();

  // If already a 2-letter ISO code (e.g. "NG", "US")
  if (trimmed.length === 2) {
    const name = countries.getName(trimmed.toUpperCase(), "en");
    if (name) return { code: trimmed.toUpperCase(), name };
  }

  // If full country name (e.g. "United States", "Nigeria") or 3-letter code ("USA")
  const code = countries.getAlpha2Code(trimmed, "en");
  if (code) {
    return { code, name: countries.getName(code, "en") };
  }

  // Fallback for unmapped or global entries (e.g. "Worldwide", "Other")
  return { code: "ZZ", name: trimmed };
};
