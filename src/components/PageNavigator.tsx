import { Box, Button } from '@mui/material'

function usePagination({
  currentPage,
  setCurrentPage,
  maxItems,
  pageLength,
}: {
  currentPage: number
  setCurrentPage: (n: number) => void
  maxItems: number
  pageLength: number
}): {
  currentPage: number

  incrementPage: () => void
  decrementPage: () => void
  isPrevActive: boolean
  isNextActive: boolean
  maxPages: number
} {
  const maxPages = Math.ceil(maxItems / pageLength)
  const incrementPage = () => setCurrentPage(currentPage + 1)
  const decrementPage = () => setCurrentPage(currentPage - 1)
  const isPrevActive = currentPage > 0
  const isNextActive = currentPage < maxPages
  return {
    currentPage,
    incrementPage,
    decrementPage,
    isPrevActive,
    isNextActive,
    maxPages,
  }
}

export function PageNavigationButton({
  isActive,
  direction,
  onClick,
}: {
  isActive: boolean
  direction: 'forwards' | 'backwards'
  onClick: () => void
}) {
  const displayText = direction === 'forwards' ? 'Next' : 'Prev'
  return (
    <Button variant="contained" onClick={onClick} disabled={!isActive}>
      {displayText}
    </Button>
  )
}

export function Pagination({
  maxItems,
  pageLength,
  currentPage,
  setCurrentPage,
}: {
  maxItems: number
  pageLength: number
  currentPage: number
  setCurrentPage: (n: number) => void
}) {
  const { incrementPage, decrementPage, isPrevActive, isNextActive, maxPages } =
    usePagination({ maxItems, pageLength, currentPage, setCurrentPage })
  return (
    <Box display="flex" flexDirection="row" gap={2}>
      <PageNavigationButton
        isActive={isPrevActive}
        direction={'backwards'}
        onClick={decrementPage}
      />
      Page {currentPage} of {maxPages}
      <PageNavigationButton
        isActive={isNextActive}
        direction={'forwards'}
        onClick={incrementPage}
      />
    </Box>
  )
}
