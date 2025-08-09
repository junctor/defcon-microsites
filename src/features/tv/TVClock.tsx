import { useEffect, useMemo, useState } from "preact/hooks";

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
    []
  );

  const [timeStr, setTimeStr] = useState(() => fmt.format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTimeStr(fmt.format(new Date())), 1000);
    return () => clearInterval(id);
  }, [fmt]);

  const [hh, mm, ss] = timeStr.split(":");

  return (
    <header
      aria-label="Current time in America/Los_Angeles"
      className="
        flex items-center justify-center
        gap-6 sm:gap-10
        py-4 sm:py-5 px-4 sm:px-8
        bg-black border-b-2 border-[#6ce]
      "
    >
      {/* Title */}
      <h1
        className="
          font-mono font-bold uppercase tracking-wide
          text-3xl sm:text-5xl md:text-6xl
          text-[#6ce]
        "
      >
        NFO Node
      </h1>

      {/* Static divider */}
      <div
        aria-hidden="true"
        className="w-px sm:w-1 h-10 sm:h-12 bg-[#6ce]/60"
      />

      {/* Clock */}
      <div className="flex items-center gap-2 sm:gap-3 font-mono font-bold tabular-nums">
        <time
          aria-label="Hour"
          className="text-4xl sm:text-6xl md:text-7xl text-[#47a]"
        >
          {hh}
        </time>
        <span className="text-4xl sm:text-6xl md:text-7xl text-white">:</span>
        <time
          aria-label="Minute"
          className="text-4xl sm:text-6xl md:text-7xl text-[#e67]"
        >
          {mm}
        </time>
        <span className="text-4xl sm:text-6xl md:text-7xl text-white">:</span>
        <time
          aria-label="Second"
          className="text-4xl sm:text-6xl md:text-7xl text-[#cb4]"
        >
          {ss}
        </time>
      </div>
    </header>
  );
}
