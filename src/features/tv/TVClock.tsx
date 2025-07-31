import { useEffect, useMemo, useState } from "preact/hooks";

function TVClock() {
  /* formatter for LA, 24-hour HH:MM:SS */
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour12: false,
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    []
  );

  const [timeStr, setTimeStr] = useState(() => fmt.format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTimeStr(fmt.format(new Date())), 1_000);
    return () => clearInterval(id);
  }, [fmt]);

  const [hh, mm, ss] = timeStr.split(":");

  return (
    <div className="grid place-items-center text-center mx-5">
      <div className="grid grid-flow-col md:auto-cols-max gap-0 text-center">
        <TimeChunk value={hh} color="#47A" />
        <Colon />
        <TimeChunk value={mm} color="#E67" />
        <Colon />
        <TimeChunk value={ss} color="#CB4" />
      </div>
    </div>
  );
}

/* helpers ---------------------------------------------------------- */

const TimeChunk = ({ value, color }: { value: string; color: string }) => (
  <span
    className="font-mono font-bold text-xl sm:text-2xl md:text-4xl lg:text-7xl"
    style={{ color }}
  >
    {value}
  </span>
);

const Colon = () => (
  <span className="font-mono font-bold text-xl sm:text-2xl md:text-4xl lg:text-7xl text-white">
    :
  </span>
);

export default TVClock;
