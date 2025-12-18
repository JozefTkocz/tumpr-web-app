// import { useEffect, useState } from 'react'
import { useIndexDbStore } from './indexedDbStore.tsx'
import type { Hill } from '../pages/tumps.tsx'

export function useBaggedStatus() {
  //   const [baggedHills, setBaggedHills] = useState<Array<number>>()

  const { data, isLoading, addObject, deleteObject, isReady } =
    useIndexDbStore<{
      id: number
    }>({
      queryKey: 'bagged-status',
      storeName: 'bagged-status',
      indices: [],
    })

  //   useEffect(() => {
  //     if (data) {
  //       setBaggedHills(data.map((d) => d.id))
  //     }
  //   })

  const markAsBagged = (hill: Hill) => {
    addObject({ id: hill.Number })
  }

  const markAsNotBagged = (hill: Hill) => {
    deleteObject({ id: hill.Number })
  }

  return {
    data,
    isLoading,
    isReady,
    markAsBagged,
    markAsNotBagged,
  }
}
