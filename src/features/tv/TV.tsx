import { useEffect, useMemo, useState } from "preact/hooks";
import TVEventCell from "./TVEventCell";
import TVClock from "./TVClock";
import { tabDateTitle } from "../../lib/dates";
import type { DefconSchedule, DefconEvent } from "../../types/ht";

interface Props {
  /** Full flat schedule for the conference */
  schedule: DefconSchedule;
}

/** Group events by UTC date (YYYY-MM-DD) */
function groupByDate(events: DefconSchedule): Record<string, DefconEvent[]> {
  return events.reduce<Record<string, DefconEvent[]>>((acc, ev) => {
    const day = ev.begin.slice(0, 10); // fast substring
    (acc[day] ||= []).push(ev);
    return acc;
  }, {});
}

export default function TV({ schedule }: Props) {
  /* ------------------------------------------------------------------
     URL params — /lv?l=track%201&tag=47607&h=6&debug=true
     ------------------------------------------------------------------ */
  const params = new URLSearchParams(window.location.search);
  const lParam = params.get("l") ?? "";
  const tagParam = params.get("tag");
  const hParam = params.get("h");
  const debug = params.get("debug") === "true";

  const tagId = tagParam ? Number(tagParam) : null;
  const locationQ = lParam.toLowerCase();
  const windowMs = Number(hParam ?? 6) * 3_600_000; // default six hours
  const nowMs = Date.now();
  const cutoffMs = nowMs + windowMs;

  /* ------------------------------------------------------------------
     Group once, then filter whenever params or time slice change
     ------------------------------------------------------------------ */
  const grouped = useMemo(() => groupByDate(schedule), [schedule]);
  const [filtered, setFiltered] = useState<Map<string, DefconEvent[]>>(
    new Map()
  );

  useEffect(() => {
    const out = new Map<string, DefconEvent[]>();

    Object.entries(grouped).forEach(([day, events]) => {
      const dayMs = new Date(day).getTime();
      if (!debug && dayMs < nowMs) return; // skip days in the past

      const upcoming = events.filter((ev) => {
        const startMs = ev.begin_timestamp?.seconds
          ? ev.begin_timestamp.seconds * 1000
          : 0;
        const inWindow = debug || (startMs >= nowMs && startMs <= cutoffMs);

        const matchesTag = tagId ? ev.tag_ids?.includes(tagId) : true;
        const matchesLoc = locationQ
          ? ev.location?.name?.toLowerCase().includes(locationQ)
          : true;

        return inWindow && matchesTag && matchesLoc;
      });

      if (upcoming.length) out.set(day, upcoming);
    });

    setFiltered(out);
  }, [grouped, locationQ, tagId, windowMs, debug]);

  /* ------------------------------------------------------------------ */
  /* Simple auto-scroll “ticker” for TV mode                            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let frame = 0;
    const stepPx = 1;

    const loop = () => {
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight;

      if (atBottom) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollBy({ top: stepPx, left: 0 });
      }
      frame = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(frame);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div>
      <header className="sticky top-0 z-10 bg-black rounded-b-3xl overflow-hidden shadow-lg">
        <TVClock />
      </header>

      <main className="pt-4">
        {Array.from(filtered.entries()).map(([day, events]) => (
          <section key={day} className="date-events mb-6">
            <div className="border-4 border-[#6CE] rounded-b-lg">
              <p className="text-[#E67] text-4xl p-2 ml-1 font-extrabold">
                {tabDateTitle(day)}
              </p>
            </div>
            {events
              .sort(
                (a, b) =>
                  (a.begin_timestamp?.seconds ?? 0) -
                  (b.begin_timestamp?.seconds ?? 0)
              )
              .map((ev) => (
                <div key={ev.id} className="event" aria-hidden="true">
                  <TVEventCell event={ev} />
                </div>
              ))}
          </section>
        ))}
      </main>
    </div>
  );
}
