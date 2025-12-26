import { useSuspenseQuery } from "@tanstack/react-query";
import * as Papa from "papaparse";
import { useBaggedStatus } from "./baggedStatus.ts";
import haversineDistance from "haversine-distance";

const csvUrl = `${import.meta.env.BASE_URL}data/DoBIH_v18_3.csv`;

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
  & { distance: number; bearing: number }
  & {
    Number: number;
  }
  & { isBagged: boolean };

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

export async function loadHillsDatabase(): Promise<Array<Hill>> {
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

export function useLoadHillsDatabase() {
  const { data, isLoading } = useSuspenseQuery({
    queryKey: ["database"],
    queryFn: loadHillsDatabase,
  });
  return {
    data,
    isLoading,
  };
}

export function useHillData({
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
  data:
    | Array<
      Hill & {
        isBagged: boolean;
      }
    >
    | undefined;
  markAsBagged: (hill: Hill) => void;
  markAsNotBagged: (hill: Hill) => void;
  isLoading: boolean;
  maxItems: number | undefined;
} {
  const { data, isLoading } = useLoadHillsDatabase();

  // Load in a list of hill IDs that have been bagged from indexedDB
  const {
    data: baggedIds,
    markAsBagged,
    markAsNotBagged,
    canEdit,
  } = useBaggedStatus();

  // Filter out only the hills that have the relevant classification
  const hillsOfClassification = data?.filter((d) => d[classification] === "1");

  // Compute the haversine distance to each hill in the list and sort ascending
  type SortPosition = {
    idx: number;
    distance: number;
  };

  const distances: Array<SortPosition> | undefined | null = location &&
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

  const nearestHillsWithBearings = nearestHills?.map((h) =>
    setBearing(h, location!)
  );

  // This must be calculated first so the check for already-bagged
  // hills works as intended below
  const final = nearestHillsWithBearings?.map((h) =>
    baggedIds?.map((b) => b.id).includes(h.Number)
      ? { ...h, isBagged: true }
      : { ...h, isBagged: false }
  ) as Array<Hill> | undefined;

  // if we are within 20m of any of the nearby hills, auto-update the
  // bagged hills database.
  final?.forEach((hill) => {
    if (hill.distance < 20 && !hill.isBagged && canEdit) {
      markAsBagged(hill);
    }
  });

  return {
    data: final,
    markAsBagged,
    markAsNotBagged,
    isLoading,
    maxItems: hillsOfClassification?.length,
  };
}
