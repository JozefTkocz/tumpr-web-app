import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIndexedDb } from "./indexDb.tsx";

interface Addressable {
  id: number;
}

export function useIndexDbStore<T extends Addressable>({
  queryKey,
  storeName,
  indices,
}: {
  queryKey: string;
  storeName: string;
  indices: Array<keyof T & string>;
}) {
  const queryClient = useQueryClient();
  const { indexedDb, isConnecting, isDbReady } = useIndexedDb(
    storeName,
    undefined,
    {
      upgrade(database) {
        if (!database.objectStoreNames.contains(storeName)) {
          const objectStore = database.createObjectStore(storeName, {
            keyPath: "id",
          });

          indices.forEach((index) => {
            objectStore.createIndex(index, index, { unique: false });
          });
        }
      },
    },
  );

  const { data, isLoading } = useQuery<Array<T>>({
    queryKey: [queryKey],
    queryFn: async () => {
      try {
        if (!indexedDb) {
          return [];
        }
        const queryResult = (await indexedDb.getAll(storeName)) as
          | Array<T>
          | undefined;
        return queryResult || [];
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    enabled: isDbReady,
  });

  const { mutateAsync: addObject, isPending: isAddPending } = useMutation({
    mutationFn: async (object: T) => {
      if (!indexedDb) {
        throw new Error(`${storeName} NOT READY`);
      }
      await indexedDb.put(storeName, object);
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [queryKey],
      });
    },
  });

  const { mutateAsync: addMany, isPending: isAddManyPending } = useMutation({
    mutationFn: async (objects: Array<T>) => {
      if (!indexedDb) {
        throw new Error(`${storeName} NOT READY`);
      }
      {
        const tx = indexedDb.transaction(storeName, "readwrite");
        objects.forEach((o) => {
          tx.store.put(o);
        });

        await tx.done;
      }
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [queryKey],
      });
    },
  });

  const { mutateAsync: deleteObject, isPending: isDeletePending } = useMutation(
    {
      mutationFn: async (object: Addressable) => {
        if (!indexedDb) {
          throw new Error(`${storeName} NOT READY`);
        }
        await indexedDb.delete(storeName, object.id);
      },
      onSuccess() {
        queryClient.invalidateQueries({
          queryKey: [queryKey],
        });
      },
    },
  );

  return {
    indexedDb,
    data,
    isLoading: isConnecting || isLoading,
    isReady: isDbReady,
    addObject,
    isAddPending,
    deleteObject,
    isDeletePending,
    addMany,
    isAddManyPending,
  };
}
