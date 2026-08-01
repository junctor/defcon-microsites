export default function MerchLoading({ offline = false }: { offline?: boolean }) {
  return (
    <main className="merch-loading" aria-live="polite">
      <div className="merch-loading__frame" aria-hidden="true">
        <span className="merch-loading__signal" />
      </div>
      <div className="merch-loading__label">
        <span>DEF CON MERCH / INVENTORY</span>
        <strong>{offline ? "INVENTORY TEMPORARILY UNAVAILABLE" : "CONNECTING TO INVENTORY"}</strong>
        <small>{offline ? "AUTOMATIC RETRY ACTIVE" : "ESTABLISHING LIVE FEED"}</small>
      </div>
    </main>
  );
}
