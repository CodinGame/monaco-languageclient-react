import { useCallback, useEffect, useRef } from 'react'

export function useLastVersion<P extends unknown[], R> (func: (...args: P) => R): (...args: P) => R {
  const ref = useRef<(...args: P) => R>(func)
  useEffect(() => {
    ref.current = func
  }, [func])
  return useCallback((...args: P) => {
    return ref.current(...args)
  }, [])
}
