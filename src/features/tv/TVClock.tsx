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
      aria-label="Current time in America/Los Angeles"
      className="
        flex items-center justify-center
        space-x-8 sm:space-x-16
        py-6 sm:py-8 px-4 sm:px-8 md:px-16
        bg-black rounded-b-3xl overflow-hidden shadow-xl
      "
    >
      {/* Title */}
      <h1
        className="
          font-mono font-bold
          text-5xl sm:text-7xl md:text-9xl
          uppercase tracking-wider
          text-[#6ce]
          [text-shadow:2px_0_#e67,-2px_0_#47a,0_2px_#cb4,0_-2px_#fff]
        "
      >
        NFO Node
      </h1>

      {/* Divider (decorative) */}
      <div
        aria-hidden="true"
        className="
          flex-shrink-0
          w-1 sm:w-2
          h-16 sm:h-20
          bg-[#6ce]/50
          animate-pulse
          rounded-2xl
        "
      />

      {/* Clock */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <time
          dateTime={new Date().toISOString()}
          className="
            font-mono font-bold
            text-5xl sm:text-7xl md:text-9xl
            drop-shadow-lg
            text-[#47a]
            [text-shadow:2px_0_#e67,-2px_0_#47a,0_2px_#cb4,0_-2px_#fff]
          "
        >
          {hh}
        </time>
        <span className="font-mono font-bold text-5xl sm:text-7xl md:text-9xl text-white drop-shadow-lg">
          :
        </span>
        <time
          className="
            font-mono font-bold
            text-5xl sm:text-7xl md:text-9xl
            drop-shadow-lg
            text-[#e67]
            [text-shadow:2px_0_#e67,-2px_0_#47a,0_2px_#cb4,0_-2px_#fff]
          "
        >
          {mm}
        </time>
        <span className="font-mono font-bold text-5xl sm:text-7xl md:text-9xl text-white drop-shadow-lg">
          :
        </span>
        <time
          className="
            font-mono font-bold
            text-5xl sm:text-7xl md:text-9xl
            drop-shadow-lg
            text-[#cb4]
            [text-shadow:2px_0_#e67,-2px_0_#47a,0_2px_#cb4,0_-2px_#fff]
          "
        >
          {ss}
        </time>
      </div>
    </header>
  );
}
