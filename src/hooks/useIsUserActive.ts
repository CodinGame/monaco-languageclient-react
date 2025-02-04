import { useEffect, useState } from 'react'

enum State {
  idle = 'idle',
  active = 'active'
}

const DEFAULT_INITIAL_STATE = State.active

const DEFAULT_ACTIVITY_EVENTS = [
  'click',
  'mousemove',
  'keydown',
  'DOMMouseScroll',
  'mousewheel',
  'mousedown',
  'touchstart',
  'touchmove',
  'focus'
]

const DEFAULT_INACTIVITY_EVENTS = ['blur', 'visibilitychange']

const DEFAULT_IGNORED_EVENTS_WHEN_IDLE = ['mousemove']

let hidden: 'hidden' | undefined, visibilityChangeEvent: 'visibilitychange' | undefined
if (typeof document.hidden !== 'undefined') {
  hidden = 'hidden'
  visibilityChangeEvent = 'visibilitychange'
} else {
  const prefixes = ['webkit', 'moz', 'ms']
  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i]
    if (
      typeof (document as unknown as Record<string, unknown>)[`${prefix}Hidden`] !== 'undefined'
    ) {
      hidden = `${prefix}Hidden` as 'hidden'
      visibilityChangeEvent = `${prefix}visibilitychange` as 'visibilitychange'
      break
    }
  }
}

interface ActivityDetectorParams {
  /**
   * Events which force a transition to 'active'
   */
  activityEvents?: string[]
  /**
   * Events which force a transition to 'idle'
   */
  inactivityEvents?: string[]
  /**
   * Events that are ignored in 'idle' state
   */
  ignoredEventsWhenIdle?: string[]
  /**
   * Inactivity time in ms to transition to 'idle'
   */
  timeToIdle?: number
  /**
   * One of 'active' or 'idle'
   */
  initialState?: State
  autoInit?: boolean
}
function createActivityDetector({
  activityEvents = DEFAULT_ACTIVITY_EVENTS,
  inactivityEvents = DEFAULT_INACTIVITY_EVENTS,
  ignoredEventsWhenIdle = DEFAULT_IGNORED_EVENTS_WHEN_IDLE,
  timeToIdle = 30000,
  initialState = DEFAULT_INITIAL_STATE,
  autoInit = true
}: ActivityDetectorParams = {}) {
  const listeners: Record<State, (() => void)[]> = { [State.active]: [], [State.idle]: [] }
  let state: State
  let timer: number

  const setState = (newState: State) => {
    clearTimeout(timer)
    if (newState === State.active) {
      timer = window.setTimeout(() => setState(State.idle), timeToIdle)
    }
    if (state !== newState) {
      state = newState
      listeners[state].forEach((l) => l())
    }
  }

  const handleUserActivityEvent = (event: Event) => {
    if (state === State.active || ignoredEventsWhenIdle.indexOf(event.type) < 0) {
      setState(State.active)
    }
  }

  const handleUserInactivityEvent = () => {
    setState(State.idle)
  }

  const handleVisibilityChangeEvent = () => {
    setState(document[hidden!] ? State.idle : State.active)
  }

  /**
   * Starts the activity detector with the given state.
   */
  const init = (firstState = DEFAULT_INITIAL_STATE) => {
    setState(firstState === State.active ? State.active : State.idle)
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, handleUserActivityEvent)
    )

    inactivityEvents
      .filter((eventName) => eventName !== 'visibilitychange')
      .forEach((eventName) => window.addEventListener(eventName, handleUserInactivityEvent))

    if (inactivityEvents.indexOf('visibilitychange') >= 0 && visibilityChangeEvent != null) {
      document.addEventListener(visibilityChangeEvent, handleVisibilityChangeEvent)
    }
  }

  /**
   * Register an event listener for the required event
   */
  const on = (eventName: State, listener: () => void) => {
    listeners[eventName].push(listener)
    const off = () => {
      const index = listeners[eventName].indexOf(listener)
      if (index >= 0) {
        listeners[eventName].splice(index, 1)
      }
    }
    return off
  }

  /**
   * Stops the activity detector and clean the listeners
   */
  const stop = () => {
    listeners[State.active] = []
    listeners[State.idle] = []

    clearTimeout(timer)

    activityEvents.forEach((eventName) =>
      window.removeEventListener(eventName, handleUserActivityEvent)
    )

    inactivityEvents.forEach((eventName) =>
      window.removeEventListener(eventName, handleUserInactivityEvent)
    )

    if (visibilityChangeEvent != null) {
      document.removeEventListener(visibilityChangeEvent, handleVisibilityChangeEvent)
    }
  }

  if (autoInit) {
    init(initialState)
  }

  return { on, stop, init }
}

export default function useIsUserActive(timeToIdle: number): boolean {
  const [active, setActive] = useState(true)
  useEffect(() => {
    const activityDetector = createActivityDetector({
      timeToIdle
    })
    activityDetector.on(State.idle, () => {
      setActive(false)
    })
    activityDetector.on(State.active, () => {
      setActive(true)
    })
    return () => {
      activityDetector.stop()
    }
  }, [timeToIdle])
  return active
}
