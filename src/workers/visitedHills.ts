import haversineDistance from "haversine-distance";
import { decode } from "@googlemaps/polyline-codec";
import type { Coordinate, Hill } from "../hooks/useHillData.tsx";
import type { SummaryActivity } from "../strava/Api.ts";

// Background web worker to offload CPU-intensive task and not block the UI thread
self.onmessage = (
  event: MessageEvent<{ data: Array<SummaryActivity>; hills: Array<Hill> }>,
) => {
  const result = getVisitedHills(event.data);
  self.postMessage(result);
};

function getVisitedHills({
  data,
  hills,
}: {
  data: Array<SummaryActivity>;
  hills: Array<Hill>;
}) {
  const visitedGpsPoints = getVisitedGpsLocations(data, 5);
  return findVisitedHills({
    journeys: visitedGpsPoints,
    hills,
    threshold: 20,
  });
}

function findVisitedHills({
  journeys,
  hills,
  threshold,
}: {
  journeys: Array<Array<Coordinate>>;
  hills: Array<Hill>;
  threshold: number;
}) {
  // trim the search space
  const errorThreshold = 0.01;
  const visitedHills = new Set<number>();
  for (const journey of journeys) {
    const journeyLats = journey.map((c) => c.latitude);
    const journeyLngs = journey.map((c) => c.longitude);

    const maxLat = Math.max(...journeyLats) + errorThreshold;
    const minLat = Math.min(...journeyLats) - errorThreshold;
    const maxLng = Math.max(...journeyLngs) + errorThreshold;
    const minLng = Math.min(...journeyLngs) - errorThreshold;

    const candidateHills = hills.filter(
      (h) =>
        h.Latitude > minLat &&
        h.Latitude < maxLat &&
        h.Longitude > minLng &&
        h.Longitude < maxLng,
    );

    for (const coordinate of journey) {
      for (const hill of candidateHills) {
        const distance = haversineDistance(
          { lat: hill.Latitude, lng: hill.Longitude },
          coordinate,
        );

        if (distance < threshold) {
          visitedHills.add(hill.Number);
        }
      }
    }
  }
  return visitedHills;
}

function decodeMapTraces(
  data: Array<SummaryActivity>,
): Array<Array<Coordinate>> {
  // decodes to lat lng pairs
  return data.map((d) =>
    decode(d.map!.summary_polyline as string, 5).map((c) => {
      return {
        latitude: c[0],
        longitude: c[1],
        altitude: null,
      };
    })
  );
}

// Tested by eyeballing in a map plot
function interpolatePolylinePoints({
  gpsCoords,
  sampleIntervalMetres,
}: {
  gpsCoords: Array<Coordinate>;
  sampleIntervalMetres: number;
}) {
  const upSampledData = [];
  for (let i = 0; i < gpsCoords.length - 1; i++) {
    const start = gpsCoords[i];
    const stop = gpsCoords[i + 1];

    // compute straight line distance between points
    // decoded polyline comes as [lat, lng] pair
    const distance = haversineDistance(
      { lat: start.latitude, lng: start.longitude },
      { lat: stop.latitude, lng: stop.longitude },
    );

    // determine how many samples to add
    const pointsToAdd = distance / sampleIntervalMetres;

    // Upsample the points using linear interpolation
    const latInterval = (stop.latitude - start.latitude) / pointsToAdd;
    const lngInterval = (stop.longitude - start.longitude) / pointsToAdd;

    const newCoords: Array<Coordinate> = [];

    for (let l = 0; l < pointsToAdd; l++) {
      const newLat = start.latitude + l * latInterval;
      const newLng = start.longitude + l * lngInterval;

      newCoords.push({ latitude: newLat, longitude: newLng });
    }
    upSampledData.push(newCoords);
  }
  return upSampledData.flat();
}

export function getVisitedGpsLocations(
  activities: Array<SummaryActivity>,
  sampleIntervalMetres: number = 5,
): Array<Array<Coordinate>> {
  const coords = decodeMapTraces(activities);
  return coords.map((c) =>
    interpolatePolylinePoints({ gpsCoords: c, sampleIntervalMetres })
  );
}
