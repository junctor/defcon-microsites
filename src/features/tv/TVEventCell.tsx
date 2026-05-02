import { memo, useMemo, type CSSProperties } from "react";
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
    [event.speakers],
  );

  const timeLabel = useMemo(() => {
    const begin = new Date(event.begin);
    const end = new Date(event.end);
    return begin.getTime() === end.getTime()
      ? eventTime(begin, true)
      : formatSessionTime(begin, end);
  }, [event.begin, event.end]);

  const eventStyle = {
    "--event-color": event.type?.color,
  } as CSSProperties;

  return (
    <article className="tv-event" style={eventStyle}>
      <div className="tv-event__stripe" aria-hidden="true" />

      <div className="tv-event__body">
        <h2 className={larger ? "tv-event__title tv-event__title--large" : "tv-event__title"}>
          {event.title}
        </h2>

        {speakerNames && (
          <p
            className={
              larger ? "tv-event__speakers tv-event__speakers--large" : "tv-event__speakers"
            }
          >
            {speakerNames}
          </p>
        )}

        <div className="tv-event__meta">
          <div className="tv-event__meta-item">
            <Clock aria-hidden="true" size={larger ? 30 : 24} />
            <span>{timeLabel}</span>
          </div>

          {event.location?.name && (
            <div className="tv-event__meta-item">
              <MapPin aria-hidden="true" size={larger ? 30 : 24} />
              <span>{event.location.short_name}</span>
            </div>
          )}
        </div>

        {event.type?.name && <span className="tv-event__type">{event.type.name}</span>}
      </div>
    </article>
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
      (next.event.speakers?.map((s) => s.name).join(", ") ?? ""),
);
