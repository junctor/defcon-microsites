function Loading() {
  return (
    <main className="status-page" aria-live="polite">
      <div className="status-card panel">
        <div className="loading-mark" aria-hidden="true">
          DC
        </div>
        <p className="status-message">Loading live data.</p>
      </div>
    </main>
  );
}

export default Loading;
