import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { collection, onSnapshot } from "firebase/firestore";

import "@/index.css";
import { db } from "@/lib/firebase";
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
    document.title = "DC33 TV";

    const tvRef = collection(db, "conferences", "DEFCON33", "events");

    const unsubscribe = onSnapshot(
      tvRef,
      (snap) => {
        /* Firestore → plain array of DefconEvent -------------------- */
        const events: DefconSchedule = snap.docs.map((doc) => {
          const data = doc.data() as DefconEvent;

          // ensure "id" exists (Firestore doc IDs are strings)
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
      }
    );

    return unsubscribe; // cleanup on unmount
  }, []);

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  if (loading) return <Loading />;
  if (err || !schedule) return <ErrorView msg={err?.message ?? "No data"} />;

  console.log("TV schedule loaded", schedule.length, "events");
  console.log("TV schedule first event:", schedule[0]);

  return <TV schedule={schedule} />;
}

render(<TVPage />, document.body);
