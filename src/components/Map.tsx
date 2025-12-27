import polyline from "@mapbox/polyline";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { SummaryActivity } from "../strava/Api.ts";
import type { Hill } from "../hooks/useHillData.tsx";
import "mapbox-gl/dist/mapbox-gl.css";

export function JourneyMap({
  stravaData,
  summits,
  visitedSummits,
}: {
  stravaData: Array<SummaryActivity>;
  summits?: Array<Hill>;
  visitedSummits?: Array<Hill>;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null); // to prevent duplicate map instances

  useEffect(() => {
    mapRef.current?.resize();
  }, []);

  useEffect(() => {
    if (mapRef.current) return;

    // todo: use temporary token from backend
    mapboxgl.accessToken =
      "pk.eyJ1Ijoiam96ZWZ0a29jeiIsImEiOiJjbWN0ajFycmYwNXZyMm1yMzlkOHRic2lqIn0.UIOgCdjRagj-EGDo5tI47g";

    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [-2.5, 54.5],
      zoom: 5,
      maxZoom: 15,
    });

    mapRef.current = map;

    map.on("load", () => {
      const features: Array<Feature<LineString>> = stravaData
        .map((activity) => {
          try {
            const geo = polyline.toGeoJSON(activity.map!.summary_polyline!, 5);
            return {
              type: "Feature" as const,
              geometry: geo,
              properties: {},
            };
          } catch {
            return null;
          }
        })
        .filter((f) => f !== null);

      const featureCollection = {
        type: "FeatureCollection" as const,
        features,
      };

      map.addSource("routes", {
        type: "geojson",
        data: featureCollection,
      });

      map.addLayer({
        id: "routes-layer",
        type: "line",
        source: "routes",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ff6600",
          "line-width": 2,
        },
      });

      if (summits) {
        map.addSource("summit-points", {
          type: "geojson",
          data: hillToGeoJson(summits),
        });

        map.addLayer({
          id: "summit-layer",
          type: "circle",
          source: "summit-points",
          paint: {
            "circle-radius": 6,
            "circle-color": "#bf0000",
          },
        });

        map.on("click", "summit-layer", (e) => {
          const feature = e.features?.[0];

          // @ts-ignore I hate mapbox-gl
          const coordinates = feature?.geometry.coordinates.slice();
          const name = feature?.properties?.Name;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>${name}</strong>`)
            .addTo(map);
        });
        map.on("mouseenter", "summit-layer", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "summit-layer", () => {
          map.getCanvas().style.cursor = "";
        });
      }

      if (visitedSummits) {
        map.addSource("visited-points", {
          type: "geojson",
          data: hillToGeoJson(visitedSummits),
        });

        map.addLayer({
          id: "visited-layer",
          type: "circle",
          source: "visited-points",
          paint: {
            "circle-radius": 6,
            "circle-color": "#bfaf00",
          },
        });

        map.on("click", "visited-layer", (e) => {
          const feature = e.features?.[0];

          // @ts-ignore I hate mapbox-gl
          const coordinates = feature?.geometry.coordinates.slice();
          const name = feature?.properties?.Name;

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>${name}</strong>`)
            .addTo(map);
        });
        map.on("mouseenter", "visited-layer", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "visited-layer", () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    return () => {
      map.remove(); // clean up on unmount
      mapRef.current = null;
    };
  }, [stravaData, summits]);

  return <div ref={mapContainer} className="map" />;
}

function hillToGeoJson(coords: Array<Hill>): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: coords.map((hill) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [hill.Longitude, hill.Latitude], // GeoJSON uses [lng, lat]
      },
      properties: {
        ...hill,
      },
    })),
  };
}
