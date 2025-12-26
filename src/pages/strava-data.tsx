import { useQuery } from '@tanstack/react-query'
import polyline from '@mapbox/polyline'
import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { Button } from '@mui/material'
import {
  useStravaActivityHistory,
  useStravaAuthToken,
} from '../hooks/useStravaActivityData.ts'
import { DataLoadingSpinner } from '../components/LoadingSpinner.tsx'
import { useLoadHillsDatabase } from '../hooks/useHillData.tsx'
import { useBaggedStatus } from '../hooks/baggedStatus.ts'
import { useVisitedHills } from '../hooks/useVisitedHills.ts'
import type { Feature, LineString } from 'geojson'
import type { SummaryActivity } from '../strava/Api.ts'
import './strava-data.css'
import './Map.css'

export function StravaMap({
  data,
  clearAll,
}: {
  data: Array<SummaryActivity>
  clearAll: () => void
}) {
  const { data: hillsDatabase } = useLoadHillsDatabase()
  const { bulkMarkAsBagged } = useBaggedStatus()
  const { visitedHills, calculateVisitedHills, isCalculating } =
    useVisitedHills({
      data,
      hills: hillsDatabase,
    })
  const [shouldSync, setShouldSync] = useState(false)

  useEffect(() => {
    if (shouldSync && visitedHills !== null) {
      setShouldSync(false)
      bulkMarkAsBagged(
        Array.from(visitedHills).map((n) => {
          return { id: n }
        }),
      )
    }
  }, [shouldSync, setShouldSync, visitedHills, bulkMarkAsBagged])

  const dataWithTraces = useMemo(() => {
    return data.filter((d) => d.map?.summary_polyline)
  }, [data])

  const onClickMe = () => {
    calculateVisitedHills()
    setShouldSync(true)
  }

  return (
    <div className="strava-layout">
      <div className="map-wrapper">
        <Map data={dataWithTraces} />
      </div>
      <div className="controls">
        <SyncButton isCalculating={isCalculating} onClick={onClickMe} />
        <ClearDataButton clearAll={clearAll} />
      </div>
    </div>
  )

  // We don't have Strava data, so re-authorize
  // return <StravaDataAuth />
}

function SyncButton({
  isCalculating,
  onClick,
}: {
  isCalculating: boolean
  onClick: () => void
}) {
  return (
    <>
      {!isCalculating && (
        <Button variant="contained" onClick={onClick} fullWidth>
          Sync Strava data
        </Button>
      )}

      {isCalculating && (
        <DataLoadingSpinner text="Calculating bagged summits..." />
      )}
    </>
  )
}

function ClearDataButton({ clearAll }: { clearAll: () => void }) {
  return (
    <Button variant="contained" onClick={clearAll} fullWidth>
      Clear Strava Data
    </Button>
  )
}

export function Map({ data }: { data: Array<SummaryActivity> }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null) // to prevent duplicate map instances

  useEffect(() => {
    mapRef.current?.resize()
  }, [])

  useEffect(() => {
    if (mapRef.current) return

    // todo: use temporary token from backend
    mapboxgl.accessToken =
      'pk.eyJ1Ijoiam96ZWZ0a29jeiIsImEiOiJjbWN0ajFycmYwNXZyMm1yMzlkOHRic2lqIn0.UIOgCdjRagj-EGDo5tI47g'

    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-2.5, 54.5],
      zoom: 5,
      maxZoom: 15,
    })

    mapRef.current = map

    map.on('load', () => {
      const features: Array<Feature<LineString>> = data
        .map((activity) => {
          try {
            const geo = polyline.toGeoJSON(
              activity.map!.summary_polyline!,
              5,
            ) as LineString
            return {
              type: 'Feature' as const,
              geometry: geo,
              properties: {},
            }
          } catch {
            return null
          }
        })
        .filter((f) => f !== null)

      const featureCollection = {
        type: 'FeatureCollection' as const,
        features,
      }

      map.addSource('routes', {
        type: 'geojson',
        data: featureCollection,
      })

      map.addLayer({
        id: 'routes-layer',
        type: 'line',
        source: 'routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ff0000',
          'line-width': 3,
        },
      })
    })

    return () => {
      map.remove() // clean up on unmount
      mapRef.current = null
    }
  }, [data])

  return <div ref={mapContainer} className="map" />
}

export function StravaDataAuth() {
  const { token, clearToken } = useStravaAuthToken()
  const {
    data,
    isLoading,
    clearAll: clearActivityCache,
  } = useStravaActivityHistory()

  const clearAll = () => {
    clearActivityCache()
    clearToken()
  }
  if (isLoading) {
    return <DataLoadingSpinner text="please wait..." />
  }
  if (!token && !data) {
    return <Authorize />
  }

  if (!data) {
    return <DataLoadingSpinner text="please wait, fetching..." />
  }
  // We should now be authorized, so load the map
  return <StravaMap data={data} clearAll={clearAll} />
}

export function Authorize() {
  const { data } = useQuery({
    queryKey: ['authUrl'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_BACKEND_URL}/auth-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redirectUrl: globalThis.location.origin + '/#/strava-data-import',
        }),
      })
        .then(async (r) => await r.text())
        .then((s) => JSON.parse(s) as { url: string }),
  })

  return data && <a href={data?.url}>Authorize Strava</a>
}
