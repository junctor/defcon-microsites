import { useEffect, useMemo, useState } from "preact/hooks";
import TVEventCell from "./TVEventCell";
import TVClock from "./TVClock";
import { nowInLA, tabDateTitle } from "../../lib/dates";
import type { DefconSchedule, DefconEvent } from "../../types/ht";

interface Props {
  schedule: DefconSchedule;
}

function groupByDate(events: DefconSchedule): Record<string, DefconEvent[]> {
  return events.reduce<Record<string, DefconEvent[]>>((acc, ev) => {
    const day = ev.begin.slice(0, 10);
    (acc[day] ||= []).push(ev);
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
  const windowMs = Number(hParam ?? 6) * 3_600_000; // default 6h

  const [nowMs, setNowMs] = useState(() => nowInLA());
  useEffect(() => {
    const id = setInterval(() => setNowMs(nowInLA()), 30_000);
    return () => clearInterval(id);
  }, []);
  const cutoffMs = nowMs + windowMs;

  const grouped = useMemo(() => groupByDate(schedule), [schedule]);
  const [filtered, setFiltered] = useState<Map<string, DefconEvent[]>>(
    new Map()
  );

  useEffect(() => {
    const out = new Map<string, DefconEvent[]>();

    Object.entries(grouped).forEach(([day, events]) => {
      const upcoming = events.filter((ev) => {
        const startMs = (ev.begin_timestamp?.seconds ?? 0) * 1000;
        const inWindow = debug || (startMs >= nowMs && startMs <= cutoffMs);

        const matchesTag = tagId == null || ev.tag_ids?.includes(tagId);
        const matchesLoc =
          !locationQ || ev.location?.name?.toLowerCase().includes(locationQ);

        return inWindow && matchesTag && matchesLoc;
      });

      if (upcoming.length) out.set(day, upcoming);
    });

    setFiltered(out);
  }, [grouped, locationQ, tagId, windowMs, debug, nowMs]); // ✅ depend on nowMs

  useEffect(() => {
    let raf = 0;
    const step = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 2; // epsilon
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

        {/* Nice to have: empty state */}
        {filtered.size === 0 && (
          <p className="text-center text-neutral-400 py-8">
            No events in the next {windowMs / 3_600_000} hours.
          </p>
        )}
      </main>
    </div>
  );
}
