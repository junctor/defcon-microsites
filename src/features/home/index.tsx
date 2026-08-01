import { createRoot } from "react-dom/client";

import "@/index.css";
import { CONFERENCE_NAME } from "@/lib/conference";

const baseUrl = import.meta.env.BASE_URL;

function redirectStandaloneRoute() {
  const basePath = baseUrl.replace(/\/$/, "");
  const standalonePaths = new Set([`${basePath}/merch`, `${basePath}/tv`]);
  if (!standalonePaths.has(window.location.pathname)) return false;

  const destination = new URL(window.location.href);
  destination.pathname = `${destination.pathname}/`;
  window.location.replace(destination);
  return true;
}

function HomePage() {
  return (
    <main className="home-page">
      <section className="page-header home-header" aria-labelledby="home-title">
        <p className="eyebrow">{CONFERENCE_NAME}</p>
        <h1 className="page-title" id="home-title">
          Microsites
        </h1>
      </section>

      <nav className="home-nav" aria-label="Microsite pages">
        <a className="home-link panel" href={`${baseUrl}merch/`}>
          <span className="home-link__label">Merch</span>
          <span className="home-link__meta">Live stock</span>
        </a>
        <a className="home-link panel" href={`${baseUrl}tv/`}>
          <span className="home-link__label">TV</span>
          <span className="home-link__meta">Live schedule</span>
        </a>
      </nav>
    </main>
  );
}

if (!redirectStandaloneRoute()) {
  createRoot(document.getElementById("root")!).render(<HomePage />);
}
