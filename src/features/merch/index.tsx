import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { collection, onSnapshot } from "firebase/firestore";

import Merch from "./Merch";
import "@/index.css";
import { db } from "@/lib/firebase";
import Loading from "@/components/misc/Loading";
import ErrorView from "@/components/misc/Error";
import type { FBProduct, FBProducts } from "@/types/ht";

function MerchPage() {
  const [data, setData] = useState<FBProducts | null>(null);
  const [err, setErr] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "DC33 Merch";

    const merchRef = collection(db, "conferences", "DEFCON33", "products");

    const unsubscribe = onSnapshot(
      merchRef,
      (snap) => {
        const documents = snap.docs.map((doc) => ({
          name: doc.id,
          fields: doc.data() as FBProduct,
        }));

        setData({ documents }); // ← keep them ALL
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setErr(err);
        setLoading(false);
      }
    );

    return unsubscribe; // cleanup
  }, []);

  if (loading) return <Loading />;
  if (err || !data) return <ErrorView msg={err?.message ?? "No data"} />;

  return <Merch products={data} />;
}

render(<MerchPage />, document.body);
