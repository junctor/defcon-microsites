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
  const larger = params.get("larger") === "true";

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

  // PERF: time-based auto-scroll (smooth at 30/60/120 Hz) + minimal layout reads
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const doc = document.scrollingElement || document.documentElement;
    // Tune: ~140 px/s works well on 30 Hz TVs. Allow override via ?speed=#
    const speedParam = Number(
      new URLSearchParams(window.location.search).get("speed")
    );
    const pxPerSec =
      Number.isFinite(speedParam) && speedParam > 0 ? speedParam : 140;

    let viewportH = window.innerHeight;
    let scrollH = doc!.scrollHeight;
    let lastDimsCheck = 0;

    const onResize = () => {
      viewportH = window.innerHeight;
      scrollH = doc!.scrollHeight;
    };
    window.addEventListener("resize", onResize, { passive: true });

    const atBottom = () =>
      Math.ceil((doc!.scrollTop || window.scrollY) + viewportH) >= scrollH - 2;

    const step = (now: number) => {
      const dt = now - last;
      last = now;

      // Refresh heights ~4×/sec to avoid layout every frame
      if (now - lastDimsCheck > 250) {
        scrollH = doc!.scrollHeight;
        lastDimsCheck = now;
      }

      if (atBottom()) {
        window.scrollTo({ top: 0, behavior: "auto" });
      } else {
        const dy = (pxPerSec * dt) / 1000;
        window.scrollBy({ top: dy, left: 0, behavior: "auto" });
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="relative min-h-screen text-white bg-black">
      <header className="sticky top-0 z-10 bg-black rounded-b-3xl overflow-hidden">
        <TVClock />
      </header>

      <main className="relative pt-4">
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
                  <TVEventCell event={ev} larger={larger} />
                </div>
              ))}
          </section>
        ))}
      </main>
    </div>
  );
}
