import { useEffect, useState } from "react";

export type Coordinate = {
  latitude: number;
  longitude: number;
  altitude: number | null;
};

export function useLocation(): {
  location: Coordinate | undefined;
  id: number;
  hasPermission: boolean;
} {
  const cachedLocationString = globalThis.sessionStorage.getItem("location");
  const cachedLocation = cachedLocationString
    ? (JSON.parse(cachedLocationString) as Coordinate)
    : undefined;
  const [location, setLocation] = useState<Coordinate | undefined>(
    cachedLocation,
  );
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      result.state === "denied"
        ? setHasPermission(false)
        : setHasPermission(true);
    });
  });

  const setLocationAndUpdateCache = (coordinate: Coordinate) => {
    setLocation(coordinate);
    globalThis.sessionStorage.setItem("location", JSON.stringify(coordinate));
  };

  const id = navigator.geolocation.watchPosition(
    (pos) =>
      setLocationAndUpdateCache({
        longitude: pos.coords.longitude,
        latitude: pos.coords.latitude,
        altitude: pos.coords.altitude,
      }),
    (err) => {
      console.log(err);
    },
    { enableHighAccuracy: true },
  );

  return { location, id, hasPermission };
}
