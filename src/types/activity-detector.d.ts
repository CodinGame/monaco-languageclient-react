declare module 'activity-detector' {
  class ActivityDetector {
    public on (event: 'idle' | 'active', cb: () => void)
    public init(): void
    public stop(): void
  }
  const createActivityDetector: (options?: {
    /** number of milliseconds of inactivity which makes activity detector transition to 'idle' (30000 by default) */
    timeToIdle?: number
    /** the user events which make activity detector transition from 'idle' to 'active'. The default list of activityEvents is ['click', 'mousemove', 'keydown', 'DOMMouseScroll', 'mousewheel', 'mousedown', 'touchstart', 'touchmove', 'focus'] */
    activityEvents?: string[]
    /** the list of events which make the activity detector transition from 'active' to 'idle' without waiting for timeToIdle timeout. By default: ['blur'] */
    inactivityEvents?: string[]
    /** list of events to ignore in idle state. By default: ['mousemove'] */
    ignoredEventsWhenIdle?: string[]
    /** can be "idle" or "active" ("active" by default) */
    initialState?: string
    /** when true the activity detector starts just after creation, when false, it doesn't start until you call the .init() method (true by default) */
    autoInit?: boolean
  }) => ActivityDetector

  export default createActivityDetector
}
