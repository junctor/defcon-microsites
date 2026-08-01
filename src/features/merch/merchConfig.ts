export const MERCH_REFRESH_SECONDS = 120;
export const MERCH_RELOAD_MINUTES = 10;

const MERCH_ROTATE_SECONDS = 15;
const MERCH_PAGE_BOUNDS = { min: 1, max: 80 };
const MERCH_ROTATE_BOUNDS = { min: 8, max: 120 };

export type MerchDensity = "compact" | "dense";
export type MerchDisplayView = "mobile" | "rotating" | "full";

export type MerchConfig = {
  displayView: MerchDisplayView;
  showSized: boolean;
  showOSFA: boolean;
  density: MerchDensity;
  page: number | null;
  rotateSeconds: number;
};

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

/** Parse the small set of operator-facing merch URL options. */
export function parseMerchConfig(search = window.location.search): MerchConfig {
  const params = new URLSearchParams(search);
  const requestedView = params.get("view");
  const displayView: MerchDisplayView =
    requestedView === "rotating" || requestedView === "full" ? requestedView : "mobile";

  return {
    displayView,
    showSized: parseBoolean(params.get("showSized"), true),
    showOSFA: parseBoolean(params.get("showOSFA"), true),
    density: displayView === "full" ? "dense" : "compact",
    page:
      displayView === "rotating" && params.has("page")
        ? parseBoundedNumber(params.get("page"), 0, MERCH_PAGE_BOUNDS) || null
        : null,
    rotateSeconds:
      displayView === "rotating"
        ? parseBoundedNumber(params.get("rotate"), MERCH_ROTATE_SECONDS, MERCH_ROTATE_BOUNDS, true)
        : 0,
  };
}

export function getMerchDisplayHref(target: MerchDisplayView) {
  const current = new URL(window.location.href);
  const params = new URLSearchParams();

  for (const name of ["conference", "showSized", "showOSFA"]) {
    const value = current.searchParams.get(name);
    if (value != null) params.set(name, value);
  }

  if (target !== "mobile") params.set("view", target);
  if (target === "rotating") {
    for (const name of ["page", "rotate"]) {
      const value = current.searchParams.get(name);
      if (value != null) params.set(name, value);
    }
  }

  return `${current.pathname}?${params.toString()}${current.hash}`;
}
