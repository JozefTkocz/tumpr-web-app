import { useState } from "react";
import { Box } from "@mui/material";

import { HillListItem } from "../components/HillListItem.tsx";

import { DataLoadingSpinner } from "../components/LoadingSpinner.tsx";
import { Pagination } from "../components/PageNavigator.tsx";
import { useLocation } from "../hooks/location.tsx";
import { useHillData } from "../hooks/useHillData.tsx";
import { SelectHillType } from "../components/SelectHillType.tsx";
import type { Hill } from "../hooks/useHillData.tsx";
import type { SelectChangeEvent } from "@mui/material/Select";

const PAGINATION_CONSTANT = 5;

export function HillsList({
  isLoading,
  data,
  markAsBagged,
  markAsNotBagged,
}: {
  isLoading: boolean;
  data: Array<Hill> | undefined;
  markAsBagged: (hill: Hill) => void;
  markAsNotBagged: (hill: Hill) => void;
}) {
  if (isLoading || !data || data.length === 0) {
    return <DataLoadingSpinner text="Loading data" />;
  }

  return (
    <>
      {data.map((hill) => {
        return (
          <HillListItem
            key={hill.Name}
            hill={hill}
            isBagged={hill.isBagged}
            setIsBagged={(isBagged: boolean) =>
              isBagged ? markAsBagged(hill) : markAsNotBagged(hill)}
          />
        );
      })}
    </>
  );
}

export function HillsPage() {
  const [hillClassification, setHillClassification] = useState("Tu");
  const [pagePointer, setPagePointer] = useState<number>(0);
  const { location, hasPermission } = useLocation();

  const handleSelectChange = (event: SelectChangeEvent) => {
    setHillClassification(event.target.value);
    setPagePointer(0);
  };

  const { isLoading, data, maxItems, markAsBagged, markAsNotBagged } =
    useHillData({
      location,
      classification: hillClassification,
      pageStart: pagePointer,
      itemsPerPage: PAGINATION_CONSTANT,
    });

  if (!hasPermission) {
    return <span>You must enable location in your browser to use TUMPr</span>;
  }

  if (!location) {
    return <DataLoadingSpinner text="Waiting to get location..." />;
  }
  return (
    <Box display="flex" flexDirection="column" paddingTop={8}>
      <Box
        display="flex"
        flexDirection="column"
        alignSelf="center"
        alignItems="center" // centers children horizontally
        gap={3} // nice spacing
        width="100%"
        maxWidth="400px"
      >
        <Box
          width="100%"
          maxWidth="400px" // keeps the select nicely sized on desktop
        >
          <SelectHillType
            hillClassification={hillClassification}
            onChange={handleSelectChange}
          />
        </Box>

        <HillsList
          isLoading={isLoading}
          data={data}
          markAsBagged={markAsBagged}
          markAsNotBagged={markAsNotBagged}
        />

        <Box display="flex" justifyContent="center" width="100%">
          <Pagination
            currentPage={pagePointer}
            setCurrentPage={setPagePointer}
            maxItems={maxItems || 0}
            pageLength={PAGINATION_CONSTANT}
          />
        </Box>
      </Box>
    </Box>
  );
}
