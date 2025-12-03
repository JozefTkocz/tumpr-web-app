import { useState } from 'react'
import { Box, Button } from '@mui/material'
import Modal from 'react-modal'
import { X } from 'lucide-react'
import type { Hill } from '@/pages/tumps'

function roundToDecimalPlaces(arg: number, n: number) {
  const divisor = 10 * n
  return Math.round(arg * divisor) / divisor
}

export function HillListItem({ hill }: { hill: Hill }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(!isModalOpen)}
        sx={{
          justifyContent: 'center', // aligns text left like a list item
          width: '100%',
          textTransform: 'none', // disables uppercase
          color: 'text.primary', // nice neutral color
          backgroundColor: 'background.paper',
          borderRadius: 2, // rounded corners
          paddingY: 1.5, // vertical padding
          paddingX: 2, // horizontal padding
          mb: 1, // margin bottom between items
          boxShadow: 1, // subtle shadow
        }}
      >
        {hill.Name} - {roundToDecimalPlaces(hill.distance, 1)} m
      </Button>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={{
          content: {
            maxWidth: '500px', // desktop max width
            width: '90%', // mobile width (and fallback)
            margin: '0 auto', // center horizontally
            inset: '50% auto auto 50%',
            transform: 'translate(-50%, -50%)', // center vertically
          },
        }}
      >
        <HillCardModel hill={hill} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </>
  )
}

function getCardinalDirection(bearing: number): string {
  if (bearing >= 0 && bearing < 22.5) {
    return 'N'
  } else if (bearing === 22.5) {
    return 'NNE'
  } else if (bearing > 22.5 && bearing < 67.5) {
    return 'NE'
  } else if (bearing === 67.5) {
    return 'ENE'
  } else if (bearing > 67.5 && bearing < 112.5) {
    return 'E'
  } else if (bearing === 112.5) {
    return 'ESE'
  } else if (bearing > 112.5 && bearing < 157.5) {
    return 'SE'
  } else if (bearing === 157.5) {
    return 'SSE'
  } else if (bearing > 157.5 && bearing < 202.5) {
    return 'S'
  } else if (bearing === 202.5) {
    return 'SSW'
  } else if (bearing > 202.5 && bearing < 247.5) {
    return 'SW'
  } else if (bearing === 247.5) {
    return 'WSW'
  } else if (bearing > 247.5 && bearing < 292.5) {
    return 'W'
  } else if (bearing === 292.5) {
    return 'WNW'
  } else if (bearing > 292.5 && bearing < 337.5) {
    return 'NW'
  } else if (bearing === 337.5) {
    return 'NNW'
  } else if (bearing > 337.5 && bearing < 360) {
    return 'N'
  } else {
    return 'undefined'
  }
}

export function HillCardModel({
  hill,
  onClose,
}: {
  hill: Hill
  onClose: () => void
}) {
  return (
    <Box display={'flex'} flexDirection={'column'}>
      <Box display={'flex'} flexDirection={'row'} justifyContent="flex-end">
        <Button onClick={onClose}>
          <X size={24}></X>
        </Button>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns="auto 1fr"
        rowGap={1}
        columnGap={2}
        alignSelf="center"
        textAlign="left"
        maxWidth="400px"
        width="100%"
      >
        <Box fontWeight="bold">Height:</Box>
        <Box>{roundToDecimalPlaces(hill.Metres, 1)}</Box>

        <Box fontWeight="bold">Summit Features:</Box>
        <Box>{hill.Feature}</Box>

        <Box fontWeight="bold">Observations:</Box>
        <Box>{hill.Observations || 'no observations'}</Box>

        <Box fontWeight="bold">Prominence:</Box>
        <Box>{roundToDecimalPlaces(hill.Drop, 1)}</Box>

        <Box fontWeight="bold">Classification Codes:</Box>
        <Box>{hill.Classification}</Box>

        <Box fontWeight="bold">Distance:</Box>
        <Box>{roundToDecimalPlaces(hill.distance, 1)}</Box>

        <Box fontWeight="bold">Bearing:</Box>
        <Box>{roundToDecimalPlaces(hill.bearing, 1)}</Box>

        <Box fontWeight="bold">Direction:</Box>
        <Box>{getCardinalDirection(hill.bearing)}</Box>
      </Box>
    </Box>
  )
}
