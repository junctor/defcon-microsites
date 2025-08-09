import { memo } from "preact/compat";
import { useMemo } from "preact/hooks";
import { Clock, MapPin } from "lucide-react";
import { eventTime, formatSessionTime } from "../../lib/dates";
import type { DefconEvent } from "../../types/ht";

interface Props {
  event: DefconEvent;
  larger: boolean;
}

function TVEventCellInner({ event, larger }: Props) {
  const speakerNames = useMemo(
    () => event.speakers?.map((s) => s.name).join(", "),
    [event.speakers]
  );

  const timeLabel = useMemo(() => {
    const begin = new Date(event.begin);
    const end = new Date(event.end);
    return begin.getTime() === end.getTime()
      ? eventTime(begin, true)
      : formatSessionTime(begin, end);
  }, [event.begin, event.end]);

  // Helper to pick text size
  const size = (base: string, up: string) => (larger ? up : base);

  return (
    <div
      className="p-8 flex space-x-6"
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "1px 320px",
      }}
    >
      <div
        className="w-4 rounded"
        style={{ backgroundColor: event.type?.color || "#FFD700" }}
      />

      {/* main content */}
      <div className="flex-1 text-white">
        {/* title */}
        <h2
          className={`${size(
            "text-4xl",
            "text-5xl"
          )} font-semibold leading-snug break-words`}
        >
          {event.title}
        </h2>

        {/* speakers */}
        {speakerNames && (
          <p className={`mt-2 ${size("text-2xl", "text-3xl")} text-gray-200`}>
            {speakerNames}
          </p>
        )}

        {/* time + location */}
        <div className="mt-4 flex flex-wrap items-center text-gray-400 space-x-8">
          <div className="flex items-center space-x-2">
            <Clock size={larger ? 28 : 24} aria-hidden />
            <span className={size("text-xl", "text-2xl")}>{timeLabel}</span>
          </div>

          {event.location?.name && (
            <div className="flex items-center space-x-2">
              <MapPin size={larger ? 28 : 24} aria-hidden />
              <span className={size("text-xl", "text-2xl")}>
                {event.location.short_name}
              </span>
            </div>
          )}
        </div>

        {/* category badge */}
        {event.type?.name && (
          <span
            className={`inline-block mt-4 px-3 py-2 ${size(
              "text-lg",
              "text-xl"
            )} font-medium rounded-full`}
            style={{ backgroundColor: event.type.color, color: "#fff" }}
          >
            {event.type.name}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(
  TVEventCellInner,
  (prev, next) =>
    prev.larger === next.larger &&
    prev.event.id === next.event.id &&
    prev.event.begin === next.event.begin &&
    prev.event.end === next.event.end &&
    prev.event.location?.short_name === next.event.location?.short_name &&
    prev.event.type?.color === next.event.type?.color &&
    prev.event.type?.name === next.event.type?.name &&
    // If you change speakers/time in-place, include the string check:
    (prev.event.speakers?.map((s) => s.name).join(", ") ?? "") ===
      (next.event.speakers?.map((s) => s.name).join(", ") ?? "")
);
