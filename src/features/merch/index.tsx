import { useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";

import Merch from "./Merch";
import MerchLoading from "./MerchLoading";
import { parseMerchConfig } from "./merchConfig";
import { useMerchInventory } from "./useMerchInventory";
import "@/index.css";
import { parseConferenceConfig } from "@/lib/conference";

function MerchPage() {
  const config = useMemo(() => parseMerchConfig(), []);
  const conference = useMemo(() => parseConferenceConfig(), []);
  const inventory = useMerchInventory(config.refreshSeconds, conference.code);

  useEffect(() => {
    document.title = `${conference.name} Merch`;
  }, [conference.name]);

  const waitingForFirstServerResult =
    inventory.data?.documents.length === 0 &&
    inventory.lastSuccessfulSync == null &&
    inventory.connection !== "live";

  if (!inventory.data || waitingForFirstServerResult) {
    return <MerchLoading offline={inventory.connection === "offline"} />;
  }

  return (
    <Merch
      products={inventory.data}
      config={config}
      conference={conference}
      inventory={inventory}
    />
  );
}

createRoot(document.getElementById("root")!).render(<MerchPage />);
