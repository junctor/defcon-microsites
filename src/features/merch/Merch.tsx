import { useMemo } from "react";
import Error from "../../components/misc/Error";
import { CONFERENCE_NAME, CONFERENCE_THEME } from "@/lib/conference";
import type { FBProducts } from "@/types/ht";

export default function Merch({ products }: { products: FBProducts }) {
  if (!products.documents) return <Error msg="Merch is closed" />;

  const { multiSizeProducts, oneSizeProducts, sizes } = useMemo(() => {
    const docs = [...products.documents]
      .sort((a, b) => a.fields.sort_order - b.fields.sort_order)
      .filter((p) => p.fields.variants.some((v) => v.stock_status !== "OUT"));

    const multi = docs.filter((p) => p.fields.variants.some((v) => v.code !== "OSFA"));
    const one = docs.filter((p) => p.fields.variants.some((v) => v.code === "OSFA"));

    const sizeMap = new Map<string, number>();
    multi.forEach((p) =>
      p.fields.variants.forEach((v) => {
        if (v.title !== "OSFA") sizeMap.set(v.code, v.sort_order);
      }),
    );
    const sz = Array.from(sizeMap.entries())
      .sort(([, a], [, b]) => a - b)
      .map(([label]) => label);

    return { multiSizeProducts: multi, oneSizeProducts: one, sizes: sz };
  }, [products.documents]);

  const renderStatus = (status: string, label: string) => {
    if (status === "OUT") {
      return <span className="stock-status stock-status--out">-</span>;
    }
    if (status === "IN") {
      return <span className="stock-status stock-status--in">{label}</span>;
    }
    if (status === "LOW") {
      return <span className="stock-status stock-status--low">{label}</span>;
    }
    return <span className="stock-status stock-status--unknown">{label}</span>;
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <p className="eyebrow">{CONFERENCE_THEME} inventory</p>
        <h1 className="page-title">{CONFERENCE_NAME} Merch</h1>
        <p className="page-summary">
          Live availability for on-site merchandise. Stock changes are shown plainly so attendees
          can make quick, informed choices.
        </p>
      </header>

      <div className="merch-layout" aria-label="Merchandise availability">
        <section className="panel merch-panel" aria-labelledby="sized-products">
          <div className="table-scroll">
            <table className="inventory-table">
              <caption id="sized-products">Sized products</caption>
              <colgroup>
                <col className="w-[16rem]" />
                {sizes.map((sz) => (
                  <col key={sz} className="w-[3rem]" />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  {sizes.map((sz) => (
                    <th key={sz} scope="col">
                      {sz}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {multiSizeProducts.map((p) => (
                  <tr key={p.fields.id}>
                    <td className="product-name">{p.fields.title}</td>
                    {sizes.map((sz) => {
                      const v = p.fields.variants.find((v) => v.code === sz);
                      return <td key={sz}>{renderStatus(v?.stock_status ?? "OUT", sz)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel merch-panel" aria-labelledby="one-size-products">
          <div className="table-scroll">
            <table className="inventory-table inventory-table--compact">
              <caption id="one-size-products">One-size products</caption>
              <colgroup>
                <col />
                <col className="w-[3.25rem]" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">OS</th>
                </tr>
              </thead>
              <tbody>
                {oneSizeProducts.map((p) => {
                  const v = p.fields.variants.find((v) => v.code === "OSFA");
                  return (
                    <tr key={p.fields.id}>
                      <td className="product-name">{p.fields.title}</td>
                      <td>{renderStatus(v?.stock_status ?? "OUT", "OS")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
