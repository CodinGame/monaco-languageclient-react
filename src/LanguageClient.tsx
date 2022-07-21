import { ReactElement, useEffect, useRef, useState } from 'react'
import { createLanguageClientManager, LanguageClientId, StatusChangeEvent as WrapperStatusChangeEvent, LanguageClientManager, WillShutdownParams, Infrastructure, LanguageClientOptions, LanguageClientManagerOptions } from '@codingame/monaco-languageclient-wrapper'
import useIsUserActive from './hooks/useIsUserActive'
import useShouldShutdownLanguageClient from './hooks/useShouldShutdownLanguageClient'
import { useLastVersion } from './hooks/useLastVersion'

export interface StatusChangeEvent {
  status: WrapperStatusChangeEvent['status'] | 'inactivityShutdown'
}

export interface LanguageClientProps {
  id: LanguageClientId
  infrastructure: Infrastructure
  clientOptions?: LanguageClientOptions
  clientManagerOptions?: LanguageClientManagerOptions
  onError?: (error: Error) => void
  onDidChangeStatus?: (status: StatusChangeEvent) => void
  /** The language client will be shutdown by the server */
  onWillShutdown?: (status: WillShutdownParams) => void
  /** User is considered inactive when there is no event during this delay (default 30 seconds) or when the tab is blurred */
  userInactivityDelay?: number
  /** Shutdown the language client when the user stay inactive during this duration (default 60 seconds) */
  userInactivityShutdownDelay?: number
}

const noop = () => null

function LanguageClient ({
  id,
  infrastructure,
  clientOptions,
  clientManagerOptions,
  onError: _onError,
  onDidChangeStatus: _onDidChangeStatus,
  onWillShutdown: _onWillShutdown,
  userInactivityDelay = 30 * 1000,
  userInactivityShutdownDelay = 60 * 1000
}: LanguageClientProps): ReactElement | null {
  const onError = useLastVersion(_onError ?? noop)
  const onDidChangeStatus = useLastVersion(_onDidChangeStatus ?? noop)
  const onWillShutdown = useLastVersion(_onWillShutdown ?? noop)

  const languageClientRef = useRef<LanguageClientManager>()

  const [willShutdown, setWillShutdown] = useState(false)
  const [counter, setCounter] = useState(1)

  const isUserActive = useIsUserActive(userInactivityDelay)
  const shouldShutdownLanguageClientForInactivity = useShouldShutdownLanguageClient(isUserActive, userInactivityShutdownDelay)
  const restartAllowed = !isUserActive

  useEffect(() => {
    if (willShutdown && restartAllowed) {
      // eslint-disable-next-line no-console
      console.info('Restarting language client because the current instance will be shutdown')
      setCounter(v => v + 1)
      setWillShutdown(false)
    }
  }, [willShutdown, restartAllowed])

  useEffect(() => {
    setWillShutdown(false)

    if (shouldShutdownLanguageClientForInactivity) {
      onDidChangeStatus({
        status: 'inactivityShutdown'
      })
      return
    }

    // eslint-disable-next-line no-console
    console.info(`Starting language server for language ${id}`)
    const languageClient = createLanguageClientManager(id, infrastructure, clientOptions, clientManagerOptions)
    languageClientRef.current = languageClient
    const errorDisposable = languageClient.onError(onError)
    const statusChangeDisposable = languageClient.onDidChangeStatus(onDidChangeStatus)
    const startTimeout = setTimeout(() => languageClient.start())

    languageClient.onWillShutdown((params: WillShutdownParams) => {
      onWillShutdown(params)
      setWillShutdown(true)
    })

    return () => {
      errorDisposable.dispose()
      statusChangeDisposable.dispose()
      // eslint-disable-next-line no-console
      console.info('Shutting down language server')
      clearTimeout(startTimeout)
      languageClient.dispose().then(() => {
        // eslint-disable-next-line no-console
        console.info('Language server shut down')
      }, err => {
        console.error('Unable to dispose language client', err)
      })
    }
  }, [id, counter, shouldShutdownLanguageClientForInactivity, onError, onDidChangeStatus, onWillShutdown, infrastructure, clientOptions, clientManagerOptions])

  return null
}

export default LanguageClient
