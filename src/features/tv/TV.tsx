import { useEffect, useMemo, useState } from "preact/hooks";
import TVEventCell from "./TVEventCell";
import TVClock from "./TVClock";
import { midnightLA, TZ, tabDateTitle } from "../../lib/dates";
import type { DefconSchedule, DefconEvent } from "../../types/ht";

interface Props {
  schedule: DefconSchedule;
}

function groupByDate(events: DefconSchedule): Record<string, DefconEvent[]> {
  return events.reduce<Record<string, DefconEvent[]>>((acc, ev) => {
    const dayKey = new Date(ev.begin).toLocaleDateString("en-CA", {
      timeZone: TZ,
    });
    (acc[dayKey] ||= []).push(ev);
    return acc;
  }, {});
}

export default function TV({ schedule }: Props) {
  const params = new URLSearchParams(window.location.search);
  const lParam = params.get("l") ?? "";
  const tagParam = params.get("tag");
  const hParam = params.get("h");
  const debug = params.get("debug") === "true";

  const tagId = tagParam ? Number(tagParam) : null;
  const locationQ = lParam.toLowerCase();
  const windowMs = Number(hParam ?? 6) * 3_600_000; // default six hours

  const grouped = useMemo(() => groupByDate(schedule), [schedule]);
  const [filtered, setFiltered] = useState<Map<string, DefconEvent[]>>(
    new Map()
  );

  // Re-run filtering as time moves forward (every 30s)
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNowTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const out = new Map<string, DefconEvent[]>();

    // ✅ Use true UTC "now" for comparisons
    const nowMs = Date.now();
    const cutoffMs = nowMs + windowMs;

    const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
    const todayMidLA = midnightLA(todayKey);

    Object.entries(grouped).forEach(([dayKey, events]) => {
      const dayMs = midnightLA(dayKey);
      if (!debug && dayMs < todayMidLA) return;

      const upcoming = events.filter((ev) => {
        const matchesTag = tagId == null || ev.tag_ids?.includes(tagId);
        const matchesLoc =
          !locationQ || ev.location?.name?.toLowerCase().includes(locationQ);

        if (debug) return matchesTag && matchesLoc;

        const startMs = (ev.begin_timestamp?.seconds ?? 0) * 1000;
        const inWindow = startMs >= nowMs && startMs <= cutoffMs;
        return inWindow && matchesTag && matchesLoc;
      });

      if (upcoming.length) out.set(dayKey, upcoming);
    });

    setFiltered(out);
  }, [grouped, locationQ, tagId, windowMs, debug, nowTick]);

  useEffect(() => {
    let raf = 0;
    const step = () => {
      const doc = document.documentElement;
      const atBottom =
        Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight - 2;
      if (atBottom) {
        window.scrollTo({ top: 0, behavior: "auto" });
      } else {
        window.scrollBy({ top: 1, left: 0 });
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

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
