import { useMemo } from "preact/hooks";
import Error from "../../components/misc/Error";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import type { FBProducts } from "@/types/ht";

export default function Merch({ products }: { products: FBProducts }) {
  if (!products.documents) return <Error msg="Merch is closed" />;

  const { multiSizeProducts, oneSizeProducts, sizes } = useMemo(() => {
    // Sort and filter out sold-out items
    const docs = [...products.documents]
      .sort((a, b) => a.fields.sort_order - b.fields.sort_order)
      .filter((p) => p.fields.variants.some((v) => v.stock_status !== "OUT"));

    // Partition products
    const multi = docs.filter((p) =>
      p.fields.variants.some((v) => v.title !== "OSFA")
    );
    const one = docs.filter((p) =>
      p.fields.variants.some((v) => v.title === "OSFA")
    );

    // Collect and sort size labels
    const sizeMap = new Map<string, number>();
    multi.forEach((p) =>
      p.fields.variants.forEach((v) => {
        if (v.title !== "OSFA") sizeMap.set(v.title, v.sort_order);
      })
    );
    const sz = Array.from(sizeMap.entries())
      .sort(([, a], [, b]) => a - b)
      .map(([label]) => label);

    return { multiSizeProducts: multi, oneSizeProducts: one, sizes: sz };
  }, [products.documents]);

  const renderStatus = (status: string, label: string) => {
    const colorClass =
      {
        IN: "text-green-500",
        LOW: "text-yellow-300",
        OUT: "text-red-500",
      }[status] ?? "text-purple-500";

    return <span className={colorClass}>{label}</span>;
  };

  return (
    <div className="p-6 bg-black text-white space-y-4">
      <div className="flex space-x-2">
        {/* Multi-size table */}
        <div className="w-3/4 bg-gray-900 rounded-lg">
          <Table className="table-auto w-full">
            <TableCaption>DEF CON 33 Merch</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-white text-black py-1">Name</TableHead>
                {sizes.map((sz) => (
                  <TableHead key={sz} className="bg-white text-black py-1">
                    {sz}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {multiSizeProducts.map((p) => (
                <TableRow key={p.fields.id} className="even:bg-muted/50">
                  <TableHead className="font-bold text-white py-1">
                    {p.fields.title}
                  </TableHead>
                  {sizes.map((sz) => {
                    const variant = p.fields.variants.find(
                      (v) => v.title === sz
                    );
                    return (
                      <TableCell key={sz} className="text-center py-1">
                        {renderStatus(variant?.stock_status ?? "OUT", sz)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* One-size table */}
        <div className="w-1/4 bg-gray-900 rounded-lg">
          <Table className="table-auto w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="bg-white text-black py-1">Name</TableHead>
                <TableHead className="bg-white text-black py-1">OS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oneSizeProducts.map((p) => {
                const variant = p.fields.variants.find(
                  (v) => v.title === "One-Size"
                );
                return (
                  <TableRow key={p.fields.id} className="even:bg-muted/50">
                    <TableHead className="font-bold text-white py-1">
                      {p.fields.title}
                    </TableHead>
                    <TableCell className="text-center py-1">
                      {renderStatus(variant?.stock_status ?? "OUT", "OS")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
