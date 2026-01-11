// import { useEffect, useState } from 'react'
import { useIndexDbStore } from "./indexedDbStore.tsx";
import type { Hill } from "./useHillData.tsx";

export function useBaggedStatus() {
  const {
    data,
    isLoading,
    addObject,
    isAddPending,
    deleteObject,
    isDeletePending,
    isReady,
    addMany,
    isAddManyPending,
  } = useIndexDbStore<{
    id: number;
  }>({
    queryKey: "bagged-status",
    storeName: "bagged-status",
    indices: [],
  });

  const markAsBagged = (hill: Hill) => {
    addObject({ id: hill.Number });
  };

  const markAsNotBagged = (hill: Hill) => {
    deleteObject({ id: hill.Number });
  };

  const bulkMarkAsBagged = (hillIds: Array<{ id: number }>) => {
    addMany(hillIds);
  };

  const addIsBaggedPropertyToHill = (hill: Hill) =>
    data?.map((b) => b.id).includes(hill.Number)
      ? { ...hill, isBagged: true }
      : { ...hill, isBagged: false };

  return {
    data,
    isLoading,
    isReady,
    canEdit: !isAddPending && !isDeletePending && !isAddManyPending && isReady,
    markAsBagged,
    markAsNotBagged,
    bulkMarkAsBagged,
    addIsBaggedPropertyToHill,
  };
}
