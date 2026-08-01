export const MERCH_DEFAULTS = {
  density: "compact",
  rotateSeconds: 15,
  refreshSeconds: 120,
  reloadMinutes: 10,
} as const;

export const MERCH_BOUNDS = {
  limit: { min: 1, max: 80 },
  page: { min: 1, max: 80 },
  rotateSeconds: { min: 8, max: 120 },
  refreshSeconds: { min: 15, max: 600 },
  reloadMinutes: { min: 2, max: 1440 },
} as const;

export type MerchDensity = "comfortable" | "compact" | "dense";
export type MerchShow = "all" | "sized" | "one-size";
export type MerchView = "board" | "cards";

export type MerchConfig = {
  show: MerchShow;
  view: MerchView;
  showOneSize: boolean;
  includeIds: Set<number>;
  excludeIds: Set<number>;
  requestedSizes: string[];
  hideSoldOut: boolean;
  density: MerchDensity;
  limit: number | null;
  page: number | null;
  rotateSeconds: number;
  refreshSeconds: number;
  reloadMinutes: number;
  debug: boolean;
};

function parseIds(value: string | null) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isSafeInteger(id) && id > 0),
  );
}

function parseBoolean(value: string | null, fallback: boolean) {
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

function parseBoundedNumber(
  value: string | null,
  fallback: number,
  bounds: { min: number; max: number },
  allowZero = false,
) {
  if (value == null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  if (allowZero && parsed === 0) return 0;
  if (parsed < bounds.min || parsed > bounds.max) return fallback;
  return parsed;
}

function parseShow(value: string | null): MerchShow {
  if (value === "sized" || value === "apparel") return "sized";
  if (value === "one-size") return "one-size";
  return "all";
}

function parseView(value: string | null): MerchView {
  return value === "cards" ? "cards" : "board";
}

function parseDensity(value: string | null): MerchDensity {
  if (value === "comfortable" || value === "dense") return value;
  return MERCH_DEFAULTS.density;
}

function parseSizes(value: string | null) {
  return Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((size) => size.trim().toUpperCase())
        .filter(Boolean),
    ),
  ).slice(0, 18);
}

export function parseMerchConfig(search = window.location.search): MerchConfig {
  const params = new URLSearchParams(search);
  const oneSizeValue = params.has("oneSize") ? params.get("oneSize") : params.get("showOneSize");

  return {
    show: parseShow(params.get("show")),
    view: parseView(params.get("view")),
    showOneSize: parseBoolean(oneSizeValue, true),
    includeIds: parseIds(params.get("include")),
    excludeIds: parseIds(params.get("exclude")),
    requestedSizes: parseSizes(params.get("sizes")),
    hideSoldOut: parseBoolean(params.get("hideSoldOut"), false),
    density: parseDensity(params.get("density")),
    limit: params.has("limit")
      ? parseBoundedNumber(params.get("limit"), 0, MERCH_BOUNDS.limit) || null
      : null,
    page: params.has("page")
      ? parseBoundedNumber(params.get("page"), 0, MERCH_BOUNDS.page) || null
      : null,
    rotateSeconds: parseBoundedNumber(
      params.get("rotate"),
      MERCH_DEFAULTS.rotateSeconds,
      MERCH_BOUNDS.rotateSeconds,
      true,
    ),
    refreshSeconds: parseBoundedNumber(
      params.get("refresh"),
      MERCH_DEFAULTS.refreshSeconds,
      MERCH_BOUNDS.refreshSeconds,
      true,
    ),
    reloadMinutes: parseBoundedNumber(
      params.get("reload"),
      MERCH_DEFAULTS.reloadMinutes,
      MERCH_BOUNDS.reloadMinutes,
      true,
    ),
    debug: parseBoolean(params.get("debug"), false),
  };
}
