import { useEffect, useMemo, useState } from "react";
import { CONFERENCE_NAME } from "@/lib/conference";

export default function TVClock() {
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour12: false,
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [],
  );

  const [timeStr, setTimeStr] = useState(() => fmt.format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTimeStr(fmt.format(new Date())), 1000);
    return () => clearInterval(id);
  }, [fmt]);

  const [hh, mm, ss] = timeStr.split(":");

  return (
    <header aria-label="Current time in America/Los_Angeles" className="tv-clock">
      <h1 className="tv-clock__title">{CONFERENCE_NAME}</h1>

      <div aria-hidden="true" className="tv-clock__divider" />

      <div className="tv-clock__time">
        <time aria-label="Hour" className="tv-clock__unit tv-clock__unit--hour">
          {hh}
        </time>
        <span className="tv-clock__unit" aria-hidden="true">
          :
        </span>
        <time aria-label="Minute" className="tv-clock__unit tv-clock__unit--minute">
          {mm}
        </time>
        <span className="tv-clock__unit" aria-hidden="true">
          :
        </span>
        <time aria-label="Second" className="tv-clock__unit tv-clock__unit--second">
          {ss}
        </time>
      </div>
    </header>
  );
}
