import { useState } from "react";
import { hillOptions, SelectHillType } from "../components/SelectHillType.tsx";
import { useBaggedStatus } from "../hooks/baggedStatus.ts";
import { useLoadHillsDatabase } from "../hooks/useHillData.tsx";
import { DataLoadingSpinner } from "../components/LoadingSpinner.tsx";
import type { Hill } from "../hooks/useHillData.tsx";
import type { SelectChangeEvent } from "@mui/material";

export function About() {
  const [hillClassification, setHillClassification] = useState("Tu");
  const { data, isLoading: isBaggedDataLoading } = useBaggedStatus();
  const { data: hills, isLoading: isHillsDbLoading } = useLoadHillsDatabase();

  const hillTypeName = hillOptions.find(
    (h) => h.value == hillClassification,
  )?.label;

  const showLoadingSpinner = isBaggedDataLoading || isHillsDbLoading;
  let bagged = undefined;
  let total = undefined;
  if (!showLoadingSpinner) {
    const result = crunchNumbers({
      hills,
      hillType: hillClassification,
      baggedHillIds: data as Array<{ id: number }>,
    });
    bagged = result.bagged.length;
    total = result.total;
  }

  const onSelectChange = (e: SelectChangeEvent) =>
    setHillClassification(e.target.value);

  return (
    <>
      <SelectHillType
        hillClassification={hillClassification}
        onChange={onSelectChange}
      />
      {showLoadingSpinner ? <DataLoadingSpinner text="calculating..." /> : (
        <p>
          You have done {bagged} of {total} {hillTypeName}s
        </p>
      )}
    </>
  );
}

function crunchNumbers({
  hills,
  hillType,
  baggedHillIds,
}: {
  hills: Array<Hill>;
  hillType: string;
  baggedHillIds: Array<{ id: number }>;
}) {
  const hillsOfClassification = hills.filter((d) => d[hillType] === "1");
  const bagged = hillsOfClassification.filter((h) =>
    baggedHillIds.map((i) => i.id).includes(h.Number)
  );
  return {
    bagged,
    total: hillsOfClassification.length,
  };
}
