import { useState } from "react";
import { Box } from "@mui/material";
import haversineDistance from "haversine-distance";

import Select from "@mui/material/Select";
import Papa from "papaparse";
import { useQuery } from "@tanstack/react-query";
import MenuItem from "@mui/material/MenuItem";
import type { SelectChangeEvent } from "@mui/material/Select";

import { HillListItem } from "@/components/HillListItem";
import { DataLoadingSpinner } from "@/components/LoadingSpinner";
import { Pagination } from "@/components/PageNavigator";
import { useLocation } from "@/hooks/location";

const csvUrl = "public/data/DoBIH_v18_3.csv";
const PAGINATION_CONSTANT = 5;

export interface Coordinate {
  latitude: number;
  longitude: number;
}

type ClassificationsTable = Record<string, "0" | "1">;

interface HillDescription {
  Name: string;
  Latitude: number;
  Longitude: number;
  Classification: string;
  Metres: number;
  Feature: string;
  Observations: string;
  Drop: number;
}

export type Hill =
  & HillDescription
  & ClassificationsTable
  & { distance: number; bearing: number };

export const hillType = {
  Tump: "Tu",
  Munro: "M",
  Corbett: "C",
  Graham: "G",
  Donald: "D",
  "Munro Top": "MT",
  "Corbett Top": "CT",
  "Graham Top": "GT",
  "Donald Top": "DT",
  Marilyn: "Ma",
  Hump: "Hu",
  Simm: "Sim",
  Furth: "F",
  Wainwright: "W",
};

function populateOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  for (const [name, code] of Object.entries(hillType)) {
    options.push({ value: code, label: name });
  }
  return options;
}

export const hillOptions = populateOptions();

async function loadHillsDatabase(): Promise<Array<Hill>> {
  const response = await fetch(csvUrl);
  const arrayBuffer = await response.text();
  const hillsData = Papa.parse(arrayBuffer, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
  });
  return hillsData.data as unknown as Array<Hill>;
}

function radians(n: number) {
  return n * (Math.PI / 180);
}
function degrees(n: number) {
  return n * (180 / Math.PI);
}

function calculateBearing(
  startPosition: Coordinate,
  endPosition: Coordinate,
): number {
  const startLat = radians(startPosition.latitude);
  const startLong = radians(startPosition.longitude);
  const endLat = radians(endPosition.latitude);
  const endLong = radians(endPosition.longitude);

  let dLong = endLong - startLong;

  const dPhi = Math.log(
    Math.tan(endLat / 2.0 + Math.PI / 4.0) /
      Math.tan(startLat / 2.0 + Math.PI / 4.0),
  );
  if (Math.abs(dLong) > Math.PI) {
    if (dLong > 0.0) dLong = -(2.0 * Math.PI - dLong);
    else dLong = 2.0 * Math.PI + dLong;
  }

  return (degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
}

function setBearing(hill: Hill, location: Coordinate): Hill {
  return {
    ...hill,
    bearing: calculateBearing(location, {
      latitude: hill.Latitude,
      longitude: hill.Longitude,
    }),
  } as Hill;
}

function useHillData({
  location,
  classification,
  pageStart,
  itemsPerPage,
}: {
  location: Coordinate | undefined;
  classification: string;
  pageStart: number;
  itemsPerPage: number;
}): {
  data: Array<Hill> | undefined;
  isLoading: boolean;
  maxItems: number | undefined;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["database"],
    queryFn: loadHillsDatabase,
  });
  // Filter out only the hills that have the relevant classification
  const hillsOfClassification = data?.filter((d) => d[classification] === "1");

  // Compute the haversine distance to each hill in the list and sort ascending
  type SortPosition = {
    idx: number;
    distance: number;
  };

  const distances: Array<SortPosition> | undefined = location &&
    hillsOfClassification &&
    hillsOfClassification.map((hill, idx) => {
      const distance = haversineDistance(location, {
        latitude: hill.Latitude,
        longitude: hill.Longitude,
      });
      return { idx, distance };
    });

  const sortedDistances = distances?.sort(function (a, b) {
    return a.distance - b.distance;
  });

  // Extract the corresponding sort indices appropriate for this page of results, and
  // index the data list by these indices
  const closestPositions = sortedDistances?.slice(
    pageStart * itemsPerPage,
    (pageStart + 1) * itemsPerPage,
  );

  const nearestHills = hillsOfClassification &&
    (closestPositions?.map((position) => {
      return {
        ...hillsOfClassification[position.idx],
        distance: position.distance,
      };
    }) as Array<Hill> | undefined);

  return {
    data: nearestHills?.map((h) => setBearing(h, location!)),
    isLoading,
    maxItems: hillsOfClassification?.length,
  };
}

export function HillsList({
  isLoading,
  data,
}: {
  isLoading: boolean;
  data: Array<Hill> | undefined;
}) {
  if (isLoading) {
    return <DataLoadingSpinner text="Loading data" />;
  }

  return (
    <>
      {data?.map((d) => <HillListItem key={d.Name} hill={d} />)}
    </>
  );
}

export function HillsPage() {
  const [hillClassification, setHillClassification] = useState("Tu");
  const [pagePointer, setPagePointer] = useState<number>(0);
  const { location } = useLocation();

  const handleChange = (event: SelectChangeEvent) => {
    setHillClassification(event.target.value);
    setPagePointer(0);
  };

  const { isLoading, data, maxItems } = useHillData({
    location,
    classification: hillClassification,
    pageStart: pagePointer,
    itemsPerPage: PAGINATION_CONSTANT,
  });

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
          <Select
            fullWidth
            value={hillClassification}
            label="Classification"
            onChange={handleChange}
            sx={{
              textAlign: "center",
              borderRadius: 2, // rounded corners
              backgroundColor: "background.paper",
              boxShadow: 1, // subtle shadow
              "& .MuiSelect-select": {
                paddingY: 1, // vertical padding
                paddingX: 2, // horizontal padding
              },
            }}
          >
            {hillOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <HillsList isLoading={isLoading} data={data} />

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
