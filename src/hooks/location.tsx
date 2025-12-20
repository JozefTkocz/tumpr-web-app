import { useState } from 'react'

export type Coordinate = {
  latitude: number
  longitude: number
  altitude: number | null
}

export function useLocation() {
  const cachedLocationString = globalThis.sessionStorage.getItem('location')
  const cachedLocation = cachedLocationString
    ? (JSON.parse(cachedLocationString) as Coordinate)
    : null
  const [location, setLocation] = useState<Coordinate | null>(cachedLocation)
  const setLocationAndUpdateCache = (coordinate: Coordinate) => {
    setLocation(coordinate)
    globalThis.sessionStorage.setItem('location', JSON.stringify(coordinate))
  }

  const id = navigator.geolocation.watchPosition(
    (pos) =>
      setLocationAndUpdateCache({
        longitude: pos.coords.longitude,
        latitude: pos.coords.latitude,
        altitude: pos.coords.altitude,
      }),
    (err) => {
      console.log(err)
    },
    { enableHighAccuracy: true },
  )

  return { location, id }
}
