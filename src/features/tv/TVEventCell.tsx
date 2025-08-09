import { Clock, MapPin } from "lucide-react";
import { eventTime, formatSessionTime } from "../../lib/dates";
import type { DefconEvent } from "../../types/ht";

interface Props {
  event: DefconEvent;
  larger: boolean;
}

export default function TVEventCell({ event, larger }: Props) {
  /* Combine speakers as “A, B & C” */
  const speakerNames = event.speakers?.map((s) => s.name).join(", ");

  // Helper to pick text size
  const size = (base: string, up: string) => (larger ? up : base);

  return (
    <div className="p-8 flex space-x-6">
      {/* color bar: use event.type.color or fallback */}
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
        <div
          className={`mt-4 flex flex-wrap items-center text-gray-400 space-x-8`}
        >
          <div className="flex items-center space-x-2">
            <Clock size={larger ? 28 : 24} />
            <span className={size("text-xl", "text-2xl")}>
              {prettyTimeRange(event.begin, event.end)}
            </span>
          </div>

          {event.location?.name && (
            <div className="flex items-center space-x-2">
              <MapPin size={larger ? 28 : 24} />
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

/* helper for displaying time ranges */
function prettyTimeRange(beginISO: string, endISO: string) {
  const begin = new Date(beginISO);
  const end = new Date(endISO);
  return begin.getTime() === end.getTime()
    ? eventTime(begin, true)
    : formatSessionTime(begin, end);
}
