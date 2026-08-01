export const CONFERENCES = {
  DEFCON33: { code: "DEFCON33", name: "DEF CON 33" },
  DEFCON34: { code: "DEFCON34", name: "DEF CON 34" },
} as const;

export type ConferenceCode = keyof typeof CONFERENCES;
export type ConferenceConfig = (typeof CONFERENCES)[ConferenceCode];

export const DEFAULT_CONFERENCE = CONFERENCES.DEFCON34;
export const CONFERENCE_CODE = DEFAULT_CONFERENCE.code;
export const CONFERENCE_NAME = DEFAULT_CONFERENCE.name;
export const CONFERENCE_THEME = "Agency";

function normalizeConferenceCode(value: string | null): ConferenceCode | null {
  const normalized = (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  if (normalized === "33" || normalized === "DC33" || normalized === "DEFCON33") {
    return "DEFCON33";
  }
  if (normalized === "34" || normalized === "DC34" || normalized === "DEFCON34") {
    return "DEFCON34";
  }
  return null;
}

export function parseConferenceConfig(search = window.location.search): ConferenceConfig {
  const params = new URLSearchParams(search);
  const code = normalizeConferenceCode(params.get("conference")) ?? DEFAULT_CONFERENCE.code;
  return CONFERENCES[code];
}
