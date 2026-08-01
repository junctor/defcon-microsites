import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ConferenceCode } from "@/lib/conference";
import type { FBProduct, FBProducts } from "@/types/ht";

const MERCH_STALE_AFTER_MS = 3 * 60_000;
const MERCH_RETRY_AFTER_MS = 15_000;

export type MerchConnectionState = "live" | "syncing" | "stale" | "offline";

export type MerchInventoryState = {
  data: FBProducts | null;
  connection: MerchConnectionState;
  lastSuccessfulSync: number | null;
  nextReconciliation: number | null;
  sourceCount: number;
};

export function useMerchInventory(
  refreshSeconds: number,
  conferenceCode: ConferenceCode,
): MerchInventoryState {
  const [data, setData] = useState<FBProducts | null>(null);
  const [connection, setConnection] = useState<MerchConnectionState>("syncing");
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<number | null>(null);
  const [nextReconciliation, setNextReconciliation] = useState<number | null>(null);
  const lastSyncRef = useRef<number | null>(null);

  useEffect(() => {
    const merchRef = collection(db, "conferences", conferenceCode, "products");
    const firstAttemptAt = Date.now();
    let unsubscribe: Unsubscribe | null = null;
    let reconciliationTimer: number | null = null;
    let reconciliationDueAt: number | null = null;
    let stopped = false;
    let generation = 0;
    let hasCommittedData = false;

    const scheduleReconciliation = (delayMs: number | null) => {
      if (reconciliationTimer != null) window.clearTimeout(reconciliationTimer);
      reconciliationTimer = null;
      reconciliationDueAt = delayMs == null ? null : Date.now() + delayMs;
      setNextReconciliation(reconciliationDueAt);

      if (delayMs == null) return;
      reconciliationTimer = window.setTimeout(() => {
        reconciliationTimer = null;
        if (stopped || document.visibilityState !== "visible") return;
        if (!navigator.onLine) {
          setConnection("offline");
          return;
        }
        subscribe();
      }, delayMs);
    };

    const subscribe = () => {
      if (stopped) return;
      unsubscribe?.();
      const subscriptionGeneration = ++generation;
      setConnection(navigator.onLine ? "syncing" : "offline");
      scheduleReconciliation(refreshSeconds > 0 ? refreshSeconds * 1_000 : null);

      unsubscribe = onSnapshot(
        merchRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (stopped || subscriptionGeneration !== generation) return;
          const documents = snapshot.docs.map((document) => ({
            name: document.id,
            fields: document.data() as FBProduct,
          }));
          // Reconciliations can briefly emit an empty cache snapshot before the server
          // responds. Keep the last committed inventory until an authoritative result
          // arrives, while still allowing cached data to populate the first load.
          if (!snapshot.metadata.fromCache || !hasCommittedData) {
            hasCommittedData = true;
            setData({ documents });
          }

          if (!navigator.onLine) {
            setConnection("offline");
            return;
          }
          if (snapshot.metadata.fromCache) {
            setConnection("syncing");
            return;
          }

          const syncedAt = Date.now();
          lastSyncRef.current = syncedAt;
          setLastSuccessfulSync(syncedAt);
          setConnection("live");
        },
        (error) => {
          console.error("Merch inventory listener failed", error);
          if (!stopped && subscriptionGeneration === generation) {
            setConnection("offline");
            scheduleReconciliation(MERCH_RETRY_AFTER_MS);
          }
        },
      );
    };

    const handleOnline = () => subscribe();
    const handleOffline = () => setConnection("offline");
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const lastSync = lastSyncRef.current;
      if (!navigator.onLine) {
        setConnection("offline");
      } else if (
        (reconciliationDueAt != null && Date.now() >= reconciliationDueAt) ||
        lastSync == null ||
        Date.now() - lastSync > MERCH_STALE_AFTER_MS
      ) {
        subscribe();
      }
    };

    subscribe();
    const staleTimer = window.setInterval(() => {
      const lastSync = lastSyncRef.current;
      if (!navigator.onLine) {
        setConnection("offline");
      } else if (
        (lastSync != null && Date.now() - lastSync > MERCH_STALE_AFTER_MS) ||
        (lastSync == null && hasCommittedData && Date.now() - firstAttemptAt > MERCH_STALE_AFTER_MS)
      ) {
        setConnection("stale");
      }
    }, 15_000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopped = true;
      generation += 1;
      unsubscribe?.();
      if (reconciliationTimer != null) window.clearTimeout(reconciliationTimer);
      window.clearInterval(staleTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [conferenceCode, refreshSeconds]);

  return {
    data,
    connection,
    lastSuccessfulSync,
    nextReconciliation,
    sourceCount: data?.documents.length ?? 0,
  };
}
