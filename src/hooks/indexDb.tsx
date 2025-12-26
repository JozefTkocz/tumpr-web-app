import { openDB } from "idb";
import { useQuery } from "@tanstack/react-query";
import type { DBSchema, OpenDBCallbacks } from "idb";

type DatabaseTable = "bagged-status" | "strava-data";

const DB_VERSION = 1;

// Centralized schema definition
const schemaUpgrades: Record<DatabaseTable, OpenDBCallbacks<unknown>> = {
  "bagged-status": {
    upgrade(db) {
      if (!db.objectStoreNames.contains("bagged-status")) {
        db.createObjectStore("bagged-status", { keyPath: "id" });
      }
    },
  },
  "strava-data": {
    upgrade(db) {
      if (!db.objectStoreNames.contains("strava-data")) {
        db.createObjectStore("strava-data", { keyPath: "id" });
      }
    },
  },
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const useIndexedDb = <DBTypes extends DBSchema | unknown = unknown>(
  name: DatabaseTable,
  _version?: number, // ignored on purpose
  _config?: OpenDBCallbacks<DBTypes>, // ignored on purpose
) => {
  const {
    data: indexedDb,
    isLoading: isConnecting,
    isSuccess: isDbReady,
  } = useQuery({
    queryKey: ["indexed-db", name],
    queryFn: async () => {
      const db = await openDB(name, DB_VERSION, schemaUpgrades[name]);

      // Final safety guard — this guarantees correctness
      if (!db.objectStoreNames.contains(name)) {
        db.close();
        throw new Error(`IndexedDB store "${name}" was not created`);
      }

      return db;
    },
    staleTime: Infinity,
  });

  return {
    indexedDb,
    isConnecting,
    isDbReady,
  };
};
