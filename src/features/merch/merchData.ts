import type { MerchConfig, MerchDensity } from "./merchConfig";
import type { FBProductDocument, StockStatus } from "@/types/ht";

export type MerchStockState = "available" | "low" | "out" | "unknown";
export type MerchStockChangeDirection = "better" | "worse";

export type FilteredMerch = {
  candidates: FBProductDocument[];
  sizedProducts: FBProductDocument[];
  oneSizeProducts: FBProductDocument[];
  sizeCodes: string[];
};

export function getStockState(status: StockStatus | undefined): MerchStockState {
  if (status === "IN") return "available";
  if (status === "LOW") return "low";
  if (status === "OUT") return "out";
  return "unknown";
}

export function getStockChangeDirection(
  previous: MerchStockState,
  next: MerchStockState,
): MerchStockChangeDirection | null {
  const stockRank: Partial<Record<MerchStockState, number>> = {
    available: 2,
    low: 1,
    out: 0,
  };
  const previousRank = stockRank[previous];
  const nextRank = stockRank[next];
  if (previousRank == null || nextRank == null || previousRank === nextRank) return null;
  return nextRank > previousRank ? "better" : "worse";
}

export function isOneSizeProduct(product: FBProductDocument) {
  const variants = product.fields.variants;
  return variants.length > 0 && variants.every((variant) => variant.code.toUpperCase() === "OSFA");
}

export function isSoldOut(product: FBProductDocument) {
  const variants = product.fields.variants;
  return (
    variants.length > 0 &&
    variants.every((variant) => getStockState(variant.stock_status) === "out")
  );
}

export function getProductLabel(product: FBProductDocument) {
  const code = product.fields.code.trim();
  const title = product.fields.title.trim();
  const prefix = new RegExp(`^${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-:]\\s*`, "i");
  return {
    code,
    title: code ? title.replace(prefix, "") : title,
  };
}

function isRenderableProduct(product: FBProductDocument) {
  return (
    Number.isSafeInteger(product.fields.id) &&
    product.fields.id > 0 &&
    product.fields.title.trim().length > 0 &&
    Array.isArray(product.fields.variants) &&
    product.fields.variants.length > 0
  );
}

function getAvailableSizes(products: FBProductDocument[]) {
  const sizes = new Map<string, number>();
  products.forEach((product) => {
    product.fields.variants.forEach((variant) => {
      const code = variant.code.trim().toUpperCase();
      if (code && code !== "OSFA") {
        const currentOrder = sizes.get(code);
        sizes.set(code, Math.min(currentOrder ?? variant.sort_order, variant.sort_order));
      }
    });
  });
  return Array.from(sizes.entries())
    .sort(([codeA, orderA], [codeB, orderB]) => orderA - orderB || codeA.localeCompare(codeB))
    .map(([code]) => code);
}

export function filterMerchProducts(
  documents: FBProductDocument[],
  config: MerchConfig,
): FilteredMerch {
  const sorted = [...documents]
    .filter(isRenderableProduct)
    .sort(
      (a, b) =>
        a.fields.sort_order - b.fields.sort_order ||
        a.fields.id - b.fields.id ||
        a.name.localeCompare(b.name),
    );

  const candidates = sorted.filter((product) =>
    isOneSizeProduct(product) ? config.showOSFA : config.showSized,
  );

  const sizedProducts = candidates.filter((product) => !isOneSizeProduct(product));
  const oneSizeProducts = candidates.filter(isOneSizeProduct);
  const sizeCodes = getAvailableSizes(sizedProducts);

  return {
    candidates,
    sizedProducts,
    oneSizeProducts,
    sizeCodes,
  };
}

export function paginate<T>(items: T[], pageSize: number) {
  if (items.length === 0) return [];
  const pageCount = Math.ceil(items.length / pageSize);
  const minimumPageSize = Math.floor(items.length / pageCount);
  const largerPageCount = items.length % pageCount;
  const pages: T[][] = [];
  let index = 0;
  for (let page = 0; page < pageCount; page += 1) {
    const balancedPageSize = minimumPageSize + (page < largerPageCount ? 1 : 0);
    pages.push(items.slice(index, index + balancedPageSize));
    index += balancedPageSize;
  }
  return pages;
}

export function splitInHalf<T>(items: T[]) {
  const splitAt = Math.ceil(items.length / 2);
  return [items.slice(0, splitAt), items.slice(splitAt)] as const;
}

export function getRowsPerPage(viewportHeight: number, density: MerchDensity) {
  const rowsAt1080 = { compact: 8, dense: 9 }[density];
  const scaled = Math.floor(Math.pow(viewportHeight / 1080, 0.7) * rowsAt1080);
  const minimum = { compact: 7, dense: 8 }[density];
  const maximum = { compact: 13, dense: 15 }[density];
  return Math.max(minimum, Math.min(maximum, scaled));
}

export function getMeasuredRowsPerPage(
  availableHeight: number,
  headerHeight: number,
  minimumRowHeight: number,
  safetyInset = 2,
) {
  if (availableHeight <= 0 || minimumRowHeight <= 0) return 1;
  const rowsHeight = Math.max(0, availableHeight - headerHeight - safetyInset);
  return Math.max(1, Math.floor(rowsHeight / minimumRowHeight));
}
