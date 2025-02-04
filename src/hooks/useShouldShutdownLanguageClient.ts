import { useEffect, useState } from 'react'

export default function useShouldShutdownLanguageClient(
  userActive: boolean,
  delay: number
): boolean {
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    setPaused(false)
    if (!userActive) {
      const timeout = setTimeout(() => {
        setPaused(true)
      }, delay)
      return () => {
        clearTimeout(timeout)
      }
    }
    return () => {}
  }, [userActive, delay])
  return paused
}
