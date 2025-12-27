import { useState } from 'react'
import { SelectHillType, hillOptions } from '../components/SelectHillType.tsx'
import { useBaggedStatus } from '../hooks/baggedStatus.ts'
import { useLoadHillsDatabase } from '../hooks/useHillData.tsx'
import { DataLoadingSpinner } from '../components/LoadingSpinner.tsx'
import { useStravaActivityHistory } from '../hooks/useStravaActivityData.ts'
import { JourneyMap } from '../components/Map.tsx'
import type { Hill } from '../hooks/useHillData.tsx'
import type { SelectChangeEvent } from '@mui/material'
import './Map.css'
import './strava-data.css'

export function About() {
  const [hillClassification, setHillClassification] = useState('Tu')
  const { data, isLoading: isBaggedDataLoading } = useBaggedStatus()
  const { data: hills, isLoading: isHillsDbLoading } = useLoadHillsDatabase()
  const { data: stravaData } = useStravaActivityHistory()

  const hillTypeName = hillOptions.find(
    (h) => h.value == hillClassification,
  )?.label

  const showLoadingSpinner = isBaggedDataLoading || isHillsDbLoading
  let bagged = undefined
  let total = undefined
  if (!showLoadingSpinner) {
    const result = crunchNumbers({
      hills,
      hillType: hillClassification,
      baggedHillIds: data as Array<{ id: number }>,
    })
    bagged = result.bagged.length
    total = result.total
  }

  const hillIds = data?.map((d) => d.id)

  const hillsOfClassification = hills.filter(
    (h) => h[hillClassification] === '1',
  )

  const visitedHills = hillsOfClassification.filter((h) =>
    hillIds?.includes(h.Number),
  )

  const unvisitedHills = hillsOfClassification.filter(
    (h) => !hillIds?.includes(h.Number),
  )

  const onSelectChange = (e: SelectChangeEvent) =>
    setHillClassification(e.target.value)

  return (
    <>
      <SelectHillType
        hillClassification={hillClassification}
        onChange={onSelectChange}
      />
      {showLoadingSpinner ? (
        <DataLoadingSpinner text="calculating..." />
      ) : (
        <>
          <p>
            You have done {bagged} of {total} {hillTypeName}s
          </p>
          {stravaData && (
            <div className="strava-layout">
              <div className="map-wrapper">
                <JourneyMap
                  stravaData={stravaData}
                  summits={unvisitedHills}
                  visitedSummits={visitedHills}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

function crunchNumbers({
  hills,
  hillType,
  baggedHillIds,
}: {
  hills: Array<Hill>
  hillType: string
  baggedHillIds: Array<{ id: number }>
}) {
  const hillsOfClassification = hills.filter((d) => d[hillType] === '1')
  const bagged = hillsOfClassification.filter((h) =>
    baggedHillIds.map((i) => i.id).includes(h.Number),
  )
  return {
    bagged,
    total: hillsOfClassification.length,
  }
}
