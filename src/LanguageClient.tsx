import { ReactElement, useEffect, useRef, useState } from 'react'
import { createLanguageClientManager, LanguageClientId, StatusChangeEvent, LanguageClientManager, WillShutdownParams } from '@codingame/monaco-languageclient-wrapper'
import useIsUserActive from './hooks/useIsUserActive'
import useShouldShutdownLanguageClient from './hooks/useShouldShutdownLanguageClient'
import { useLastVersion } from './hooks/useLastVersion'

export interface LanguageClientProps {
  id: LanguageClientId
  sessionId?: string
  languageServerUrl: string
  useMutualizedProxy?: boolean
  getSecurityToken: () => Promise<string>
  libraryUrls?: string[]
  onError?: (error: Error) => void
  onDidChangeStatus?: (status: StatusChangeEvent) => void
  /** The language client will be shutdown by the server */
  onWillShutdown?: (status: WillShutdownParams) => void
  /** User is considered inactive when there is no event during this delay (default 30 seconds) or when the tab is blurred */
  userInactivityDelay?: number
  /** Shutdown the language client when the user stay inactive during this duration (default 60 seconds) */
  userInactivityShutdownDelay?: number
}

const defaultLibraryUrls: string[] = []

const noop = () => null

function LanguageClient ({
  id,
  sessionId,
  languageServerUrl,
  useMutualizedProxy,
  getSecurityToken,
  libraryUrls = defaultLibraryUrls,
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

  const isUserInactive = useIsUserActive(userInactivityDelay)
  const shouldShutdownLanguageClient = useShouldShutdownLanguageClient(isUserInactive, userInactivityShutdownDelay)
  const restartAllowed = !isUserInactive

  useEffect(() => {
    if (willShutdown && restartAllowed) {
      console.info('Restarting language client because the current instance will be shutdown')
      setCounter(v => v + 1)
      setWillShutdown(false)
    }
  }, [willShutdown, restartAllowed])

  useEffect(() => {
    setWillShutdown(false)

    if (shouldShutdownLanguageClient) {
      return
    }

    console.info(`Starting language server for language ${id}`)
    const languageClient = createLanguageClientManager(id, sessionId, languageServerUrl, getSecurityToken, libraryUrls, useMutualizedProxy)
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
      console.info('Shutting down language server')
      clearTimeout(startTimeout)
      languageClient.dispose().then(() => {
        console.info('Language server shut down')
      }, err => {
        console.error('Unable to dispose language client', err)
      })
    }
  }, [getSecurityToken, id, languageServerUrl, libraryUrls, sessionId, counter, useMutualizedProxy, shouldShutdownLanguageClient, onError, onDidChangeStatus, onWillShutdown])

  return null
}

export default LanguageClient
