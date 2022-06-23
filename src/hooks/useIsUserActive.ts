import { useEffect, useState } from 'react'
import createActivityDetector from 'activity-detector'

export default function useIsUserActive (timeToIdle: number): boolean {
  const [active, setActive] = useState(true)
  useEffect(() => {
    const activityDetector = createActivityDetector({
      timeToIdle
    })
    activityDetector.on('idle', () => {
      setActive(false)
    })
    activityDetector.on('active', () => {
      setActive(true)
    })
    return () => {
      activityDetector.stop()
    }
  }, [timeToIdle])
  return active
}
