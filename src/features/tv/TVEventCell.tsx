import { Clock, MapPin } from "lucide-react";
import { eventTime, formatSessionTime } from "../../lib/dates";
import type { DefconEvent } from "../../types/ht";

interface Props {
  event: DefconEvent;
}

export default function TVEventCell({ event }: Props) {
  /* speakers as “A, B & C” */
  const speakerNames = event.speakers?.map((s) => s.name).join(", ");

  return (
    <div className="p-4 flex space-x-4">
      {/* colour bar: use event.type.color or default */}
      <div
        className="w-2 rounded"
        style={{ backgroundColor: event.type?.color || "#FFD700" }}
      />

      {/* --- main content --------------------------------------------- */}
      <div className="flex-1 text-white">
        {/* title */}
        <h2 className="text-2xl font-semibold leading-snug break-words">
          {event.title}
        </h2>

        {/* speakers */}
        {speakerNames && (
          <p className="mt-1 text-lg text-gray-200">{speakerNames}</p>
        )}

        {/* time + location */}
        <div className="mt-2 flex flex-wrap items-center text-gray-400 space-x-4">
          <div className="flex items-center space-x-1">
            <Clock size={16} />
            <span className="text-sm">
              {prettyTimeRange(event.begin, event.end)}
            </span>
          </div>

          {event.location?.name && (
            <div className="flex items-center space-x-1">
              <MapPin size={16} />
              <span className="text-sm">{event.location.short_name}</span>
            </div>
          )}
        </div>

        {/* category badge (event type) */}
        {event.type?.name && (
          <span
            className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full"
            style={{ backgroundColor: event.type.color, color: "#fff" }}
          >
            {event.type.name}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------------------------------------------- */

function prettyTimeRange(beginISO: string, endISO: string) {
  const begin = new Date(beginISO);
  const end = new Date(endISO);
  return begin.getTime() === end.getTime()
    ? eventTime(begin, true)
    : formatSessionTime(begin, end);
}
