import { useMemo } from "preact/hooks";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import type { FBProducts } from "@/types/ht";

function statusToBadge(status: string) {
  switch (status) {
    case "IN":
      return <Badge variant="default">In Stock</Badge>;
    case "LOW":
      return <Badge variant="secondary">Low</Badge>;
    case "OUT":
    default:
      return <Badge variant="destructive">Sold Out</Badge>;
  }
}

export default function Merch({ products }: { products: FBProducts }) {
  /** Sort docs and hide items that are completely sold out */
  const docs = useMemo(() => {
    return [...products.documents].sort(
      (a, b) => +a.fields.sort_order - +b.fields.sort_order
    );
    // .filter((p) => p.fields.variants.some((v) => v.stock_status !== "OUT"));
  }, [products.documents]);

  /** Collect variant sizes (keeps One-Size, S-M-L, etc.) */
  const sizes = useMemo(() => {
    const map = new Map<string, number>();
    products.documents.forEach((p) =>
      p.fields.variants.forEach((v) => map.set(v.title, +v.sort_order))
    );
    return Array.from(map.entries())
      .sort(([, a], [, b]) => a - b)
      .map(([size]) => size);
  }, [products.documents]);

  return (
    <div className="p-6 bg-black text-white">
      <div className="flex justify-between mb-4">
        <h2 className="text-3xl font-semibold">DEF CON Merch</h2>
      </div>

      <div className="overflow-x-auto rounded-lg bg-gray-900">
        <Table className="min-w-[700px]">
          <TableHeader className="sticky top-0 bg-gray-800">
            <TableRow>
              <TableHead className="!py-3">Product</TableHead>
              {sizes.map((sz) => (
                <TableHead key={sz} className="!py-3 text-center">
                  {sz}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {docs.map((p, i) => (
              <TableRow
                key={p.fields.id}
                className={i % 2 === 0 ? "bg-gray-800" : ""}
              >
                <TableCell className="flex items-center gap-3 !py-3">
                  <span className="font-medium">{p.fields.title}</span>
                </TableCell>

                {sizes.map((sz) => {
                  const variant = p.fields.variants.find((v) => v.title === sz);
                  const status = variant?.stock_status || "OUT";
                  return (
                    <TableCell key={sz} className="!py-3 text-center">
                      {statusToBadge(status)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
