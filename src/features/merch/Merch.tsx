import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import type { MerchConfig } from "./merchConfig";
import type { MerchInventoryState } from "./useMerchInventory";

type MerchProps = {
  products: FBProducts;
  config: MerchConfig;
  conference: ConferenceConfig;
  inventory: MerchInventoryState;
};

type BoardPage = {
  kind: "sized" | "one-size";
  products: FBProductDocument[];
};

const syncTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  minute: "2-digit",
});

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
      {state === "low" && (
        <>
          {!oneSize && <span>{size}</span>}
          <small>LOW</small>
        </>
      )}
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
}: {
  products: FBProductDocument[];
  sizes: string[];
  pageIndex: number;
  totalPages: number;
  inventory: MerchInventoryState;
}) {
  return (
    <section className="merch-board__section" aria-labelledby="sized-products">
      <div className="merch-board__table-wrap">
        <table className="merch-board__table">
          <caption id="sized-products">Sized merchandise availability</caption>
          <colgroup>
            <col className="merch-board__product-column" />
            {sizes.map((size) => (
              <col key={size} />
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
}: {
  products: FBProductDocument[];
  twoColumns: boolean;
  pageIndex: number;
  totalPages: number;
  inventory: MerchInventoryState;
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
                    showTelemetry={columnIndex === 0}
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

function CardsBoard({
  products,
  sizes,
  pageIndex,
  totalPages,
  inventory,
}: {
  products: FBProductDocument[];
  sizes: string[];
  pageIndex: number;
  totalPages: number;
  inventory: MerchInventoryState;
}) {
  return (
    <section className="merch-cards-board" aria-label="Merchandise availability cards">
      <div className="merch-cards-board__header">
        <BoardHeading
          title="Merch products"
          pageIndex={pageIndex}
          totalPages={totalPages}
          inventory={inventory}
        />
      </div>
      <div className="merch-cards">
        {products.map((product) => {
          const oneSize = isOneSizeProduct(product);
          const variants = oneSize
            ? product.fields.variants.filter((variant) => variant.code.toUpperCase() === "OSFA")
            : sizes
                .map((size) =>
                  product.fields.variants.find((variant) => variant.code.toUpperCase() === size),
                )
                .filter((variant): variant is FBVariant => variant != null);
          return (
            <article
              className={`merch-card${isSoldOut(product) ? " merch-card--sold-out" : ""}`}
              key={product.fields.id}
              data-merch-page-row
            >
              <ProductName product={product} />
              <div className="merch-card__stock">
                {variants.map((variant) => (
                  <StockCell
                    key={variant.variant_id}
                    variant={variant}
                    size={oneSize ? "OS" : variant.code.toUpperCase()}
                    oneSize={oneSize}
                    productId={product.fields.id}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getEmptyMessage(sourceCount: number, matchingBeforeSoldOut: number, config: MerchConfig) {
  if (sourceCount === 0) return "INVENTORY SOURCE CONTAINS NO PRODUCTS";
  if (config.hideSoldOut && matchingBeforeSoldOut > 0) {
    return "ALL SELECTED PRODUCTS ARE SOLD OUT";
  }
  return "NO PRODUCTS MATCH THIS DISPLAY";
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
  const twoColumnOneSize = viewport.width > 1100;
  const oneSizePageSize = rowsPerPage * (twoColumnOneSize ? 2 : 1);
  const cardPageSize = Math.max(4, Math.min(12, Math.floor(rowsPerPage / 2) * 2));
  const boardPages = useMemo<BoardPage[]>(
    () => [
      ...paginate(filtered.sizedProducts, rowsPerPage).map((page) => ({
        kind: "sized" as const,
        products: page,
      })),
      ...paginate(filtered.oneSizeProducts, oneSizePageSize).map((page) => ({
        kind: "one-size" as const,
        products: page,
      })),
    ],
    [filtered.oneSizeProducts, filtered.sizedProducts, oneSizePageSize, rowsPerPage],
  );
  const cardPages = useMemo(
    () => paginate(filtered.candidates, cardPageSize),
    [cardPageSize, filtered.candidates],
  );
  const totalPages = config.view === "cards" ? cardPages.length : boardPages.length;
  const [pageIndex, setPageIndex] = useState(() => Math.max(0, (config.page ?? 1) - 1));
  const [reloading, setReloading] = useState(false);
  const [nextReload] = useState<number | null>(() =>
    config.reloadMinutes > 0 ? Date.now() + config.reloadMinutes * 60_000 : null,
  );
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const activePageIndex = totalPages > 0 ? Math.min(pageIndex, totalPages - 1) : 0;
  const visibleBoardPage = boardPages[activePageIndex] ?? null;
  const visibleCards = cardPages[activePageIndex] ?? [];

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
    if (!pageRef.current || reloading) return;
    const rows = pageRef.current.querySelectorAll("[data-merch-page-row]");
    if (rows.length === 0) return;
    const context = gsap.context(() => {
      const landingDuration = reducedMotion ? 0.01 : 0.36;
      const clackHold = reducedMotion ? 0 : 0.04;
      const rowStagger = reducedMotion ? 0 : 0.075;
      gsap
        .timeline()
        .fromTo(
          rows,
          {
            opacity: reducedMotion ? 1 : 0.7,
            backfaceVisibility: "hidden",
            force3D: true,
            rotationX: reducedMotion ? 0 : -8,
            scaleY: reducedMotion ? 1 : 0.95,
            transformOrigin: "50% 0%",
            transformPerspective: 700,
            willChange: "transform,opacity",
            y: reducedMotion ? 0 : 8,
          },
          {
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
            duration: reducedMotion ? 0.01 : 0.14,
            ease: "power1.out",
            stagger: rowStagger,
            clearProps: "transform,transformOrigin,opacity,willChange,backfaceVisibility",
          },
          landingDuration + clackHold,
        );
    }, pageRef);
    return () => context.revert();
  }, [activePageIndex, reducedMotion, reloading]);

  const advancePage = useCallback(() => {
    if (totalPages <= 1 || reloading || !pageRef.current) return;
    stopRotation();
    const rows = pageRef.current.querySelectorAll("[data-merch-page-row]");
    if (rows.length === 0) return;
    rotationTimelineRef.current = gsap.timeline({
      onComplete: () => {
        rotationTimelineRef.current = null;
        gsap.set(rows, {
          clearProps: "transform,transformOrigin,opacity,willChange,backfaceVisibility",
        });
        setPageIndex((current) => (current + 1) % totalPages);
      },
    });
    rotationTimelineRef.current.to(rows, {
      opacity: reducedMotion ? 1 : 0.7,
      backfaceVisibility: "hidden",
      force3D: true,
      rotationX: reducedMotion ? 0 : 4,
      scaleY: reducedMotion ? 1 : 0.97,
      transformOrigin: "50% 100%",
      transformPerspective: 700,
      willChange: "transform,opacity",
      duration: reducedMotion ? 0.01 : 0.18,
      ease: reducedMotion ? "none" : "steps(3)",
      stagger: reducedMotion ? 0 : 0.025,
    });
  }, [reducedMotion, reloading, stopRotation, totalPages]);

  useEffect(() => {
    if (config.rotateSeconds === 0 || totalPages <= 1 || reloading) return;
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
  }, [activePageIndex, advancePage, config.rotateSeconds, reloading, stopRotation, totalPages]);

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
    if (config.reloadMinutes === 0 || nextReload == null) return;
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
  }, [config.reloadMinutes, nextReload]);

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

  const emptyMessage = getEmptyMessage(
    inventory.sourceCount,
    filtered.matchingBeforeSoldOut,
    config,
  );

  return (
    <main
      className={`merch-display merch-display--${config.density}`}
      data-connection={inventory.connection}
      ref={rootRef}
    >
      <div className="merch-board">
        <div className="merch-board__content" ref={pageRef}>
          {filtered.candidates.length === 0 ? (
            <div className="merch-board__empty" role="status">
              <strong>{emptyMessage}</strong>
              <span>CHECK DISPLAY FILTERS OR LIVE INVENTORY STATUS</span>
            </div>
          ) : config.view === "cards" ? (
            <CardsBoard
              products={visibleCards}
              sizes={filtered.sizeCodes}
              pageIndex={activePageIndex}
              totalPages={totalPages}
              inventory={inventory}
            />
          ) : visibleBoardPage?.kind === "sized" ? (
            <SizedBoard
              products={visibleBoardPage.products}
              sizes={filtered.sizeCodes}
              pageIndex={activePageIndex}
              totalPages={totalPages}
              inventory={inventory}
            />
          ) : visibleBoardPage ? (
            <OneSizeBoard
              products={visibleBoardPage.products}
              twoColumns={twoColumnOneSize}
              pageIndex={activePageIndex}
              totalPages={totalPages}
              inventory={inventory}
            />
          ) : null}
        </div>
      </div>

      {config.debug && (
        <aside className="merch-debug" aria-label="Display diagnostics">
          <strong>MERCH DISPLAY DEBUG</strong>
          <span>conference={conference.code}</span>
          <span>
            show={config.show} view={config.view} oneSize={String(config.showOneSize)}
          </span>
          <span>
            density={config.density} rows={rowsPerPage} limit={config.limit ?? "none"}{" "}
            requestedPage=
            {config.page ?? "auto"}
          </span>
          <span>
            source={inventory.sourceCount} filtered={filtered.candidates.length}
          </span>
          <span>
            page={totalPages === 0 ? 0 : activePageIndex + 1}/{totalPages}
          </span>
          <span>
            rotate={config.rotateSeconds}s refresh={config.refreshSeconds}s reload=
            {config.reloadMinutes}m
          </span>
          <span>
            connection={inventory.connection} viewport={viewport.width}x{viewport.height}
          </span>
          <span>
            lastSync=
            {inventory.lastSuccessfulSync
              ? new Date(inventory.lastSuccessfulSync).toISOString()
              : "none"}
          </span>
          <span>
            nextRefresh=
            {inventory.nextReconciliation
              ? new Date(inventory.nextReconciliation).toISOString()
              : "disabled"}
          </span>
          <span>nextReload={nextReload ? new Date(nextReload).toISOString() : "disabled"}</span>
        </aside>
      )}

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
