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
    const docs = [...products.documents]
      .sort((a, b) => a.fields.sort_order - b.fields.sort_order)
      .filter((p) => p.fields.variants.some((v) => v.stock_status !== "OUT"));

    const multi = docs.filter((p) =>
      p.fields.variants.some((v) => v.code !== "OSFA")
    );
    const one = docs.filter((p) =>
      p.fields.variants.some((v) => v.code === "OSFA")
    );

    const sizeMap = new Map<string, number>();
    multi.forEach((p) =>
      p.fields.variants.forEach((v) => {
        if (v.title !== "OSFA") sizeMap.set(v.code, v.sort_order);
      })
    );
    const sz = Array.from(sizeMap.entries())
      .sort(([, a], [, b]) => a - b)
      .map(([label]) => label);

    return { multiSizeProducts: multi, oneSizeProducts: one, sizes: sz };
  }, [products.documents]);

  const renderStatus = (status: string, label: string) => {
    if (status === "OUT") {
      return <span className="text-red-500 italic font-bold">-</span>;
    } else if (status === "IN") {
      return <span className="text-green-500">{label}</span>;
    } else if (status === "LOW") {
      return <span className="text-yellow-300">{label}</span>;
    }
    return <span className="text-purple-500">{label}</span>;
  };

  return (
    <div className="p-6 bg-black text-white space-y-4">
      <div className="flex space-x-2">
        {/* Multi-size table */}
        <div className="flex-1 bg-gray-900 rounded-lg overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableCaption className="caption-bottom">
              DEF CON 33 Merch
            </TableCaption>
            <colgroup>
              <col className="min-w-[150px] w-[250px]" />
              {sizes.map((sz) => (
                <col key={sz} className="w-[30px]" />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-white text-black py-1 text-left">
                  Name
                </TableHead>
                {sizes.map((sz) => (
                  <TableHead
                    key={sz}
                    className="bg-white text-black py-1 text-center"
                  >
                    {sz}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {multiSizeProducts.map((p) => (
                <TableRow key={p.fields.id} className="even:bg-muted/50">
                  <TableCell className="font-bold text-white py-1 text-left break-words whitespace-normal">
                    {p.fields.title}
                  </TableCell>
                  {sizes.map((sz) => {
                    const v = p.fields.variants.find((v) => v.code === sz);
                    return (
                      <TableCell key={sz} className="text-center py-1">
                        {renderStatus(v?.stock_status ?? "OUT", sz)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* One-size table */}
        <div className="flex-none w-1/4 bg-gray-900 rounded-lg overflow-x-auto">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="min-w-[150px] w-auto" />
              <col className="w-[35px]" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-white text-black py-1 text-left">
                  Name
                </TableHead>
                <TableHead className="bg-white text-black py-1 text-center">
                  OS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oneSizeProducts.map((p) => {
                const v = p.fields.variants.find((v) => v.code === "OSFA");
                return (
                  <TableRow key={p.fields.id} className="even:bg-muted/50">
                    <TableCell className="font-bold text-white py-1 text-left break-words whitespace-normal">
                      {p.fields.title}
                    </TableCell>
                    <TableCell className="text-center py-1">
                      {renderStatus(v?.stock_status ?? "OUT", "OS")}
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
