import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { collection, onSnapshot } from "firebase/firestore";

import "@/index.css";
import { db } from "@/lib/firebase";
import { CONFERENCE_CODE, CONFERENCE_NAME } from "@/lib/conference";
import Loading from "@/components/misc/Loading";
import ErrorView from "@/components/misc/Error";
import TV from "./TV";

import type { DefconSchedule, DefconEvent } from "@/types/ht";

/* ------------------------------------------------------------------ */
/* TV page                                                             */
/* ------------------------------------------------------------------ */
function TVPage() {
  const [schedule, setSchedule] = useState<DefconSchedule | null>(null);
  const [err, setErr] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${CONFERENCE_NAME} TV`;

    const tvRef = collection(db, "conferences", CONFERENCE_CODE, "events");

    const unsubscribe = onSnapshot(
      tvRef,
      (snap) => {
        const events: DefconSchedule = snap.docs.map((doc) => {
          const data = doc.data() as DefconEvent;

          if (typeof data.id === "undefined") {
            const numericId = Number(doc.id);
            (data as DefconEvent).id = isNaN(numericId) ? -1 : numericId;
          }
          return data;
        });

        setSchedule(events);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setErr(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  if (loading) return <Loading />;
  if (err || !schedule) return <ErrorView msg={err?.message ?? "No data"} />;

  return <TV schedule={schedule} />;
}

createRoot(document.getElementById("root")!).render(<TVPage />);
