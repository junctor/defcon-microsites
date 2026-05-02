import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { collection, onSnapshot } from "firebase/firestore";

import Merch from "./Merch";
import "@/index.css";
import { db } from "@/lib/firebase";
import { CONFERENCE_CODE, CONFERENCE_NAME } from "@/lib/conference";
import Loading from "@/components/misc/Loading";
import ErrorView from "@/components/misc/Error";
import type { FBProduct, FBProducts } from "@/types/ht";

function MerchPage() {
  const [data, setData] = useState<FBProducts | null>(null);
  const [err, setErr] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${CONFERENCE_NAME} Merch`;

    const merchRef = collection(db, "conferences", CONFERENCE_CODE, "products");

    const unsubscribe = onSnapshot(
      merchRef,
      (snap) => {
        const documents = snap.docs.map((doc) => ({
          name: doc.id,
          fields: doc.data() as FBProduct,
        }));

        setData({ documents });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setErr(err);
        setLoading(false);
      },
    );

    return unsubscribe; // cleanup
  }, []);

  if (loading) return <Loading />;
  if (err || !data) return <ErrorView msg={err?.message ?? "No data"} />;

  return <Merch products={data} />;
}

createRoot(document.getElementById("root")!).render(<MerchPage />);
