import { useState } from "react";

export type Coordinate = {
  latitude: number;
  longitude: number;
  altitude: number | null;
};

export function useLocation() {
  const [location, setLocation] = useState<Coordinate>();

  const id = navigator.geolocation.watchPosition(
    (pos) =>
      setLocation({
        longitude: pos.coords.longitude,
        latitude: pos.coords.latitude,
        altitude: pos.coords.altitude,
      }),
    (err) => {
      console.log(err);
    },
    { enableHighAccuracy: true },
  );

  return { location, id };
}
