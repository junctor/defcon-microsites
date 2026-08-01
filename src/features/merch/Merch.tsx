import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import gsap from "gsap";
import type { ConferenceConfig } from "@/lib/conference";
import type { FBProductDocument, FBProducts, FBVariant } from "@/types/ht";
import {
  filterMerchProducts,
  getProductLabel,
  getRowsPerPage,
  getStockState,
  isOneSizeProduct,
  isSoldOut,
  paginate,
  type MerchStockState,
} from "./merchData";
import { getMerchDisplayHref, MERCH_RELOAD_MINUTES, type MerchConfig } from "./merchConfig";
import type { MerchInventoryState } from "./useMerchInventory";

type MerchProps = {
  products: FBProducts;
  config: MerchConfig;
  conference: ConferenceConfig;
  inventory: MerchInventoryState;
};

type BoardPage = {
  sized: FBProductDocument[];
  oneSize: FBProductDocument[];
};

const syncTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  minute: "2-digit",
});

const statusTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getBoardRowStyle(rows: number): CSSProperties {
  const rowCount = Math.max(rows, 1);
  const fullRowHeight = Math.min(120, Math.max(10, (window.innerHeight - 100) / (rowCount + 1)));
  return {
    "--merch-full-row-height": `${fullRowHeight}px`,
    "--merch-full-stock-size": `${Math.max(9, fullRowHeight - 10)}px`,
    "--merch-full-title-size": `${Math.min(30, Math.max(8, fullRowHeight * 0.32))}px`,
    "--merch-full-label-size": `${Math.min(22, Math.max(7, fullRowHeight * 0.25))}px`,
  } as CSSProperties;
}

function useViewport() {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    let frame: number | null = null;
    const update = () => {
      if (frame != null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = null;
        setViewport({ width: window.innerWidth, height: window.innerHeight });
      });
    };
    window.addEventListener("resize", update);
    return () => {
      if (frame != null) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, []);

  return viewport;
}

function formatSyncTime(timestamp: number | null) {
  if (timestamp == null) return "WAITING FOR SYNC";
  return `SYNC ${syncTimeFormatter.format(timestamp)} PT`;
}

function StockCell({
  variant,
  size,
  oneSize = false,
  productId,
}: {
  variant?: FBVariant;
  size: string;
  oneSize?: boolean;
  productId: number;
}) {
  const state = getStockState(variant?.stock_status ?? (variant ? "" : "OUT"));
  const key = `${productId}:${variant?.variant_id ?? size}`;
  const accessibleState = {
    available: "in stock",
    low: "low stock",
    out: "out of stock",
    unknown: "stock unknown",
  }[state];

  return (
    <span
      className={`merch-stock-cell merch-stock-cell--${state}`}
      data-stock-key={key}
      aria-label={`${oneSize ? "One size" : size}: ${accessibleState}`}
    >
      {state === "available" && (oneSize ? "IN" : size)}
      {state === "low" && (oneSize ? "IN" : size)}
      {state === "out" && "OUT"}
      {state === "unknown" && "UNK"}
    </span>
  );
}

function ProductName({ product }: { product: FBProductDocument }) {
  const label = getProductLabel(product);
  return (
    <span className="merch-product">
      <span className="merch-product__code">{label.code || product.fields.id}</span>
      <span className="merch-product__title">{label.title}</span>
    </span>
  );
}

function BoardHeading({
  title,
  pageIndex,
  totalPages,
  inventory,
  showTelemetry = true,
}: {
  title: string;
  pageIndex: number;
  totalPages: number;
  inventory: MerchInventoryState;
  showTelemetry?: boolean;
}) {
  return (
    <div className="merch-board__heading">
      <h2>
        {title}
        {showTelemetry && totalPages > 1 && (
          <span className="merch-board__page-count">
            ({pageIndex + 1} / {totalPages})
          </span>
        )}
      </h2>
      {showTelemetry && (
        <span className="merch-board__telemetry">
          <span className="merch-board__sync-time">
            {formatSyncTime(inventory.lastSuccessfulSync)}
          </span>
          {inventory.connection !== "live" && (
            <strong
              className={`merch-board__connection merch-board__connection--${inventory.connection}`}
            >
              {inventory.connection.toUpperCase()}
            </strong>
          )}
        </span>
      )}
    </div>
  );
}

function SizedBoard({
  products,
  sizes,
  pageIndex,
  totalPages,
  inventory,
  showTelemetry = true,
}: {
  products: FBProductDocument[];
  sizes: string[];
  pageIndex: number;
  totalPages: number;
  inventory: MerchInventoryState;
  showTelemetry?: boolean;
}) {
  return (
    <section
      className="merch-board__section merch-board__section--sized"
      aria-labelledby="sized-products"
    >
      <div className="merch-board__table-wrap">
        <table className="merch-board__table merch-board__table--sized">
          <caption id="sized-products">Sized merchandise availability</caption>
          <colgroup>
            <col className="merch-board__product-column" />
            {sizes.map((size) => (
              <col className="merch-board__size-column" key={size} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <BoardHeading
                  title="Sized products"
                  pageIndex={pageIndex}
                  totalPages={totalPages}
                  inventory={inventory}
                  showTelemetry={showTelemetry}
                />
              </th>
              {sizes.map((size) => (
                <th key={size} scope="col">
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.fields.id}
                className={isSoldOut(product) ? "merch-board__row--sold-out" : undefined}
                data-merch-page-row
              >
                <th scope="row">
                  <ProductName product={product} />
                </th>
                {sizes.map((size) => {
                  const variant = product.fields.variants.find(
                    (item) => item.code.toUpperCase() === size,
                  );
                  return (
                    <td key={size}>
                      <StockCell variant={variant} size={size} productId={product.fields.id} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OneSizeBoard({
  products,
  twoColumns,
  pageIndex,
  totalPages,
  inventory,
  showTelemetry = true,
}: {
  products: FBProductDocument[];
  twoColumns: boolean;
  pageIndex: number;
  totalPages: number;
  inventory: MerchInventoryState;
  showTelemetry?: boolean;
}) {
  const splitAt = Math.ceil(products.length / 2);
  const productColumns =
    twoColumns && products.length > 1
      ? [products.slice(0, splitAt), products.slice(splitAt)]
      : [products];

  return (
    <section
      className={`merch-board__section${productColumns.length > 1 ? " merch-board__section--one-size-split" : ""}`}
      aria-label="One-size merchandise availability"
    >
      {productColumns.map((column, columnIndex) => (
        <div className="merch-board__table-wrap" key={column[0].fields.id}>
          <table className="merch-board__table merch-board__table--one-size">
            <caption>
              One-size merchandise availability
              {productColumns.length === 2 &&
                `, column ${columnIndex + 1} of ${productColumns.length}`}
            </caption>
            <colgroup>
              <col />
              <col className="merch-board__one-size-status-column" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">
                  <BoardHeading
                    title="One-size products"
                    pageIndex={pageIndex}
                    totalPages={totalPages}
                    inventory={inventory}
                    showTelemetry={showTelemetry && columnIndex === 0}
                  />
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {column.map((product) => {
                const variant = product.fields.variants.find(
                  (item) => item.code.toUpperCase() === "OSFA",
                );
                return (
                  <tr
                    key={product.fields.id}
                    className={isSoldOut(product) ? "merch-board__row--sold-out" : undefined}
                    data-merch-page-row
                  >
                    <th scope="row">
                      <ProductName product={product} />
                    </th>
                    <td>
                      <StockCell
                        variant={variant}
                        size="OS"
                        oneSize
                        productId={product.fields.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}

function MobileProduct({ product, sizes }: { product: FBProductDocument; sizes: string[] }) {
  const oneSize = isOneSizeProduct(product);
  const visibleSizes = oneSize ? ["OSFA"] : sizes;

  return (
    <article
      className={`merch-mobile-product${isSoldOut(product) ? " merch-mobile-product--sold-out" : ""}`}
    >
      <ProductName product={product} />
      <div className="merch-mobile-product__stock">
        {visibleSizes.map((size) => {
          const variant = product.fields.variants.find(
            (item) => item.code.toUpperCase() === (oneSize ? "OSFA" : size),
          );
          return (
            <div className="merch-mobile-variant" key={size}>
              <span className="merch-mobile-variant__size">{size}</span>
              <StockCell
                variant={variant}
                size={oneSize ? "OS" : size}
                oneSize={oneSize}
                productId={product.fields.id}
              />
            </div>
          );
        })}
      </div>
    </article>
  );
}

function MobileBoard({
  sizedProducts,
  oneSizeProducts,
  sizes,
}: {
  sizedProducts: FBProductDocument[];
  oneSizeProducts: FBProductDocument[];
  sizes: string[];
}) {
  const groups = [
    { title: "Sized products", products: sizedProducts },
    { title: "One-size products", products: oneSizeProducts },
  ].filter((group) => group.products.length > 0);

  return (
    <section className="merch-mobile-board" aria-labelledby="mobile-inventory-title">
      <h1 id="mobile-inventory-title">Merch inventory</h1>
      {groups.map((group) => (
        <section className="merch-mobile-group" key={group.title}>
          <h2>{group.title}</h2>
          <div className="merch-mobile-products">
            {group.products.map((product) => (
              <MobileProduct product={product} sizes={sizes} key={product.fields.id} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

function getEmptyMessage(sourceCount: number) {
  if (sourceCount === 0) return "INVENTORY SOURCE CONTAINS NO PRODUCTS";
  return "NO PRODUCTS MATCH THIS DISPLAY";
}

function DisplayStatus({
  conference,
  config,
  inventory,
  pageIndex,
  totalPages,
  showPage,
}: {
  conference: ConferenceConfig;
  config: MerchConfig;
  inventory: MerchInventoryState;
  pageIndex: number;
  totalPages: number;
  showPage: boolean;
}) {
  const connectionLabel = {
    live: "Connected",
    syncing: "Reconnecting…",
    stale: "Stale • Reconnecting…",
    offline: "Offline • Last-known Inventory",
  }[inventory.connection];

  return (
    <footer className="merch-status">
      <p aria-live="polite">
        <strong>{conference.name}</strong>
        <span aria-hidden="true">•</span>
        <span>
          {inventory.lastSuccessfulSync == null
            ? "Waiting for update"
            : `Updated ${statusTimeFormatter.format(inventory.lastSuccessfulSync)}`}
        </span>
        <span aria-hidden="true">•</span>
        <span
          className={`merch-status__connection merch-status__connection--${inventory.connection}`}
        >
          {connectionLabel}
        </span>
        {showPage && (
          <>
            <span aria-hidden="true">•</span>
            <span>
              Page {totalPages === 0 ? 0 : pageIndex + 1} / {totalPages}
            </span>
          </>
        )}
      </p>
      <nav className="merch-view-switcher" aria-label="Inventory display mode">
        <a
          aria-current={config.displayView === "mobile" ? "page" : undefined}
          href={getMerchDisplayHref("mobile")}
        >
          Compact List
        </a>
        <a
          aria-current={config.displayView === "rotating" ? "page" : undefined}
          href={getMerchDisplayHref("rotating")}
        >
          Rotating Pages
        </a>
        <a
          aria-current={config.displayView === "full" ? "page" : undefined}
          href={getMerchDisplayHref("full")}
        >
          Full Inventory
        </a>
      </nav>
    </footer>
  );
}

export default function Merch({ products, config, conference, inventory }: MerchProps) {
  const rootRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const rotationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const previousStockRef = useRef<Map<string, MerchStockState> | null>(null);
  const viewport = useViewport();
  const filtered = useMemo(
    () => filterMerchProducts(products.documents, config),
    [config, products.documents],
  );
  const rowsPerPage = getRowsPerPage(viewport.height, config.density);
  const isRotatingDisplay = config.displayView === "rotating";
  const hasBothPanels = filtered.sizedProducts.length > 0 && filtered.oneSizeProducts.length > 0;
  const twoColumnOneSize = viewport.width > 1100 && !hasBothPanels;
  const oneSizePageSize = rowsPerPage * (twoColumnOneSize ? 2 : 1);
  const boardPages = useMemo<BoardPage[]>(() => {
    if (!isRotatingDisplay) {
      return [{ sized: filtered.sizedProducts, oneSize: filtered.oneSizeProducts }];
    }
    const sizedPages = paginate(filtered.sizedProducts, rowsPerPage);
    const oneSizePages = paginate(filtered.oneSizeProducts, oneSizePageSize);
    const pageCount = Math.max(sizedPages.length, oneSizePages.length);
    return Array.from({ length: pageCount }, (_, index) => ({
      sized: sizedPages.length > 0 ? sizedPages[index % sizedPages.length] : [],
      oneSize: oneSizePages.length > 0 ? oneSizePages[index % oneSizePages.length] : [],
    }));
  }, [
    filtered.oneSizeProducts,
    filtered.sizedProducts,
    isRotatingDisplay,
    oneSizePageSize,
    rowsPerPage,
  ]);
  const totalPages = boardPages.length;
  const [pageIndex, setPageIndex] = useState(() => Math.max(0, (config.page ?? 1) - 1));
  const [reloading, setReloading] = useState(false);
  const [nextReload] = useState(() => Date.now() + MERCH_RELOAD_MINUTES * 60_000);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const activePageIndex = totalPages > 0 ? Math.min(pageIndex, totalPages - 1) : 0;
  const visibleBoardPage = boardPages[activePageIndex] ?? null;
  const visibleBoardRows = visibleBoardPage
    ? Math.max(
        visibleBoardPage.sized.length,
        Math.ceil(visibleBoardPage.oneSize.length / (twoColumnOneSize ? 2 : 1)),
        1,
      )
    : 1;

  useEffect(() => {
    setPageIndex((current) => (totalPages === 0 ? 0 : Math.min(current, totalPages - 1)));
  }, [totalPages]);

  const stopRotation = useCallback(() => {
    if (!rotationTimelineRef.current) return;
    rotationTimelineRef.current.kill();
    rotationTimelineRef.current = null;
    const rows = pageRef.current?.querySelectorAll("[data-merch-page-row]");
    if (rows?.length) {
      gsap.set(rows, {
        clearProps: "transform,transformOrigin,opacity,filter,willChange,backfaceVisibility",
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (!isRotatingDisplay || !pageRef.current || reloading) return;
    const rows = pageRef.current.querySelectorAll("[data-merch-page-row]");
    if (rows.length === 0) return;
    const stockCellColumns = Array.from(rows).reduce<HTMLElement[][]>((columns, row) => {
      row.querySelectorAll<HTMLElement>(".merch-stock-cell").forEach((cell, columnIndex) => {
        (columns[columnIndex] ??= []).push(cell);
      });
      return columns;
    }, []);
    const context = gsap.context(() => {
      const landingDuration = reducedMotion ? 0.01 : 0.48;
      const clackHold = reducedMotion ? 0 : 0.08;
      const rowStagger = reducedMotion ? 0 : 0.08;
      const timeline = gsap
        .timeline()
        .fromTo(
          rows,
          {
            filter: reducedMotion ? "none" : "brightness(0.08)",
            opacity: reducedMotion ? 1 : 0.18,
            backfaceVisibility: "hidden",
            force3D: true,
            rotationX: reducedMotion ? 0 : -8,
            scaleY: reducedMotion ? 1 : 0.95,
            transformOrigin: "50% 0%",
            transformPerspective: 700,
            willChange: "transform,filter,opacity",
            y: reducedMotion ? 0 : 8,
          },
          {
            filter: "brightness(1)",
            opacity: 1,
            rotationX: reducedMotion ? 0 : 1.5,
            scaleY: 1,
            y: reducedMotion ? 0 : -1,
            duration: landingDuration,
            ease: reducedMotion ? "none" : "steps(5)",
            stagger: rowStagger,
          },
        )
        .to(
          rows,
          {
            rotationX: 0,
            y: 0,
            duration: reducedMotion ? 0.01 : 0.18,
            ease: "power1.out",
            stagger: rowStagger,
            clearProps: "transform,transformOrigin,filter,opacity,willChange,backfaceVisibility",
          },
          landingDuration + clackHold,
        );

      if (!reducedMotion) {
        stockCellColumns.forEach((cells, columnIndex) => {
          timeline.fromTo(
            cells,
            {
              backfaceVisibility: "hidden",
              filter: "brightness(0.82)",
              force3D: true,
              rotationX: -12,
              scaleY: 0.92,
              transformOrigin: "50% 50%",
              transformPerspective: 500,
              willChange: "transform,filter",
            },
            {
              filter: "brightness(1)",
              rotationX: 0,
              scaleY: 1,
              duration: 0.26,
              ease: "steps(4)",
              clearProps: "transform,transformOrigin,filter,willChange,backfaceVisibility",
            },
            0.12 + columnIndex * 0.035,
          );
        });
      }
    }, pageRef);
    return () => context.revert();
  }, [activePageIndex, isRotatingDisplay, reducedMotion, reloading]);

  const advancePage = useCallback(() => {
    if (totalPages <= 1 || reloading || !pageRef.current) return;
    stopRotation();
    const rows = pageRef.current.querySelectorAll("[data-merch-page-row]");
    if (rows.length === 0) return;
    rotationTimelineRef.current = gsap.timeline({
      onComplete: () => {
        rotationTimelineRef.current = null;
        setPageIndex((current) => (current + 1) % totalPages);
      },
    });
    rotationTimelineRef.current
      .to(rows, {
        filter: reducedMotion ? "none" : "brightness(0.08)",
        opacity: reducedMotion ? 1 : 0.18,
        backfaceVisibility: "hidden",
        force3D: true,
        rotationX: reducedMotion ? 0 : 6,
        scaleY: reducedMotion ? 1 : 0.95,
        transformOrigin: "50% 100%",
        transformPerspective: 700,
        willChange: "transform,filter,opacity",
        duration: reducedMotion ? 0.01 : 0.28,
        ease: reducedMotion ? "none" : "steps(4)",
        stagger: reducedMotion ? 0 : 0.034,
      })
      .to({}, { duration: reducedMotion ? 0 : 0.06 });
  }, [reducedMotion, reloading, stopRotation, totalPages]);

  useEffect(() => {
    if (!isRotatingDisplay || config.rotateSeconds === 0 || totalPages <= 1 || reloading) return;
    let timer: number | null = null;
    const dueAt = Date.now() + config.rotateSeconds * 1_000;
    const schedule = () => {
      if (timer != null) window.clearTimeout(timer);
      const delay = Math.max(0, dueAt - Date.now());
      timer = window.setTimeout(() => {
        timer = null;
        if (document.visibilityState === "visible") advancePage();
      }, delay);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        gsap.ticker.wake();
        if (Date.now() >= dueAt) {
          if (timer != null) window.clearTimeout(timer);
          timer = null;
          stopRotation();
          setPageIndex((current) => (current + 1) % totalPages);
          return;
        }
        schedule();
      } else if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };
    schedule();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (timer != null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
      stopRotation();
    };
  }, [
    activePageIndex,
    advancePage,
    config.rotateSeconds,
    isRotatingDisplay,
    reloading,
    stopRotation,
    totalPages,
  ]);

  useLayoutEffect(() => {
    const nextStock = new Map<string, MerchStockState>();
    filtered.candidates.forEach((product) => {
      product.fields.variants.forEach((variant) => {
        nextStock.set(
          `${product.fields.id}:${variant.variant_id}`,
          getStockState(variant.stock_status),
        );
      });
    });
    const previousStock = previousStockRef.current;
    previousStockRef.current = nextStock;
    if (!previousStock || !rootRef.current || reducedMotion) return;

    const changedKeys = new Set(
      Array.from(nextStock.entries())
        .filter(
          ([key, state]) => previousStock.get(key) != null && previousStock.get(key) !== state,
        )
        .map(([key]) => key),
    );
    if (changedKeys.size === 0) return;
    const cells = Array.from(
      rootRef.current.querySelectorAll<HTMLElement>("[data-stock-key]"),
    ).filter((cell) => changedKeys.has(cell.dataset.stockKey ?? ""));
    const context = gsap.context(() => {
      gsap
        .timeline()
        .fromTo(
          cells,
          {
            filter: "brightness(1.65)",
            backfaceVisibility: "hidden",
            force3D: true,
            rotationX: -10,
            scaleY: 0.94,
            transformOrigin: "50% 50%",
            transformPerspective: 500,
            willChange: "transform,filter",
          },
          {
            filter: "brightness(1.2)",
            rotationX: 2,
            scaleY: 1,
            duration: 0.18,
            ease: "steps(2)",
          },
        )
        .to(cells, {
          filter: "brightness(1)",
          rotationX: 0,
          duration: 0.14,
          ease: "power1.out",
          clearProps: "transform,transformOrigin,filter,willChange,backfaceVisibility",
        });
    }, rootRef);
    return () => context.revert();
  }, [filtered.candidates, reducedMotion]);

  useEffect(() => {
    const triggerReload = () => {
      if (Date.now() >= nextReload) setReloading(true);
    };
    const timer = window.setTimeout(triggerReload, Math.max(0, nextReload - Date.now()));
    const handleVisibility = () => {
      if (document.visibilityState === "visible") triggerReload();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [nextReload]);

  useLayoutEffect(() => {
    if (!reloading || !rootRef.current) return;
    stopRotation();
    const context = gsap.context(() => {
      gsap
        .timeline({ onComplete: () => window.location.reload() })
        .to(".merch-board", {
          autoAlpha: 0,
          y: reducedMotion ? 0 : -16,
          duration: reducedMotion ? 0.01 : 0.35,
        })
        .fromTo(
          ".merch-refresh",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: reducedMotion ? 0.01 : 0.25 },
          reducedMotion ? ">" : "-=0.1",
        )
        .fromTo(
          ".merch-refresh__line",
          { scaleX: 0 },
          { scaleX: 1, duration: reducedMotion ? 0.01 : 0.75, ease: "power2.inOut" },
        )
        .to({}, { duration: reducedMotion ? 0.01 : 0.25 });
    }, rootRef);
    return () => context.revert();
  }, [reducedMotion, reloading, stopRotation]);

  const emptyMessage = getEmptyMessage(inventory.sourceCount);

  return (
    <main
      className={`merch-display merch-display--${config.displayView} merch-display--${config.density}`}
      data-connection={inventory.connection}
      data-display-view={config.displayView}
      ref={rootRef}
    >
      <div className="merch-board">
        <div
          className={`merch-board__content${
            visibleBoardPage?.sized.length && visibleBoardPage.oneSize.length
              ? " merch-board__content--split"
              : ""
          }`}
          ref={pageRef}
          style={getBoardRowStyle(visibleBoardRows)}
        >
          {filtered.candidates.length === 0 ? (
            <div className="merch-board__empty" role="status">
              <strong>{emptyMessage}</strong>
              <span>CHECK DISPLAY FILTERS OR LIVE INVENTORY STATUS</span>
            </div>
          ) : config.displayView === "mobile" ? (
            <MobileBoard
              sizedProducts={filtered.sizedProducts}
              oneSizeProducts={filtered.oneSizeProducts}
              sizes={filtered.sizeCodes}
            />
          ) : visibleBoardPage ? (
            <>
              {visibleBoardPage.sized.length > 0 && (
                <SizedBoard
                  products={visibleBoardPage.sized}
                  sizes={filtered.sizeCodes}
                  pageIndex={activePageIndex}
                  totalPages={totalPages}
                  inventory={inventory}
                  showTelemetry={!hasBothPanels}
                />
              )}
              {visibleBoardPage.oneSize.length > 0 && (
                <OneSizeBoard
                  products={visibleBoardPage.oneSize}
                  twoColumns={twoColumnOneSize}
                  pageIndex={activePageIndex}
                  totalPages={totalPages}
                  inventory={inventory}
                  showTelemetry={!hasBothPanels}
                />
              )}
            </>
          ) : null}
        </div>
      </div>

      <DisplayStatus
        conference={conference}
        config={config}
        inventory={inventory}
        pageIndex={activePageIndex}
        totalPages={totalPages}
        showPage={config.displayView !== "mobile"}
      />

      {reloading && (
        <div className="merch-refresh" role="status">
          <strong>REFRESHING INVENTORY</strong>
          <span>UPDATING DISPLAY</span>
          <i className="merch-refresh__line" aria-hidden="true" />
        </div>
      )}
    </main>
  );
}
