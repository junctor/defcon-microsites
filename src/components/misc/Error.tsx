export default function Error({ msg }: { msg?: string }) {
  return (
    <main className="status-page">
      <div className="status-card panel" role="alert">
        <h1 className="status-title">Unable to Load</h1>
        <p className="status-message">{msg ?? "Live data is unavailable."}</p>
        <a className="status-link" href={import.meta.env.BASE_URL}>
          Return home
        </a>
      </div>
    </main>
  );
}
