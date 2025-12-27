import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@mui/material'
import {
  useStravaActivityHistory,
  useStravaAuthToken,
} from '../hooks/useStravaActivityData.ts'
import { DataLoadingSpinner } from '../components/LoadingSpinner.tsx'
import { useLoadHillsDatabase } from '../hooks/useHillData.tsx'
import { useBaggedStatus } from '../hooks/baggedStatus.ts'
import { useVisitedHills } from '../hooks/useVisitedHills.ts'
import { JourneyMap } from '../components/Map.tsx'
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
        <JourneyMap stravaData={dataWithTraces} />
      </div>
      <div className="controls">
        <SyncButton isCalculating={isCalculating} onClick={onClickMe} />
        <ClearDataButton clearAll={clearAll} />
      </div>
    </div>
  )
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
          redirectUrl: globalThis.location.href,
        }),
      })
        .then(async (r) => await r.text())
        .then((s) => JSON.parse(s) as { url: string }),
  })

  return data && <a href={data?.url}>Authorize Strava</a>
}
