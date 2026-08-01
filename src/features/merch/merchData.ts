import type { MerchConfig, MerchDensity } from "./merchConfig";
import type { FBProductDocument, StockStatus } from "@/types/ht";

export type MerchStockState = "available" | "low" | "out" | "unknown";

export type FilteredMerch = {
  candidates: FBProductDocument[];
  sizedProducts: FBProductDocument[];
  oneSizeProducts: FBProductDocument[];
  sizeCodes: string[];
  matchingBeforeSoldOut: number;
};

export function getStockState(status: StockStatus | undefined): MerchStockState {
  if (status === "IN") return "available";
  if (status === "LOW") return "low";
  if (status === "OUT") return "out";
  return "unknown";
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

  let candidates = sorted.filter((product) => {
    const oneSize = isOneSizeProduct(product);
    if (config.show === "sized") return !oneSize;
    if (config.show === "one-size") return oneSize;
    return config.showOneSize || !oneSize;
  });

  if (config.includeIds.size > 0) {
    candidates = candidates.filter((product) => config.includeIds.has(product.fields.id));
  }
  candidates = candidates.filter((product) => !config.excludeIds.has(product.fields.id));

  const matchingBeforeSoldOut = candidates.length;
  if (config.hideSoldOut) {
    candidates = candidates.filter((product) => !isSoldOut(product));
  }
  if (config.limit != null) {
    candidates = candidates.slice(0, config.limit);
  }

  const sizedProducts = candidates.filter((product) => !isOneSizeProduct(product));
  const oneSizeProducts = candidates.filter(isOneSizeProduct);
  const availableSizes = getAvailableSizes(sizedProducts);
  const requestedSizeSet = new Set(config.requestedSizes);
  const requestedSizes = availableSizes.filter((size) => requestedSizeSet.has(size));
  const sizeCodes = requestedSizes.length > 0 ? requestedSizes : availableSizes;

  return {
    candidates,
    sizedProducts,
    oneSizeProducts,
    sizeCodes,
    matchingBeforeSoldOut,
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

export function getRowsPerPage(viewportHeight: number, density: MerchDensity) {
  const rowsAt1080 = { comfortable: 6, compact: 8, dense: 9 }[density];
  const scaled = Math.floor(Math.pow(viewportHeight / 1080, 0.7) * rowsAt1080);
  const minimum = { comfortable: 5, compact: 7, dense: 8 }[density];
  const maximum = { comfortable: 10, compact: 13, dense: 15 }[density];
  return Math.max(minimum, Math.min(maximum, scaled));
}
