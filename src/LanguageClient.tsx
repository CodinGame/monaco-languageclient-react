import { ReactElement, useEffect, useRef, useState } from 'react'
import { createLanguageClientManager, LanguageClientId, StatusChangeEvent, LanguageClientManager, WillShutdownParams } from '@codingame/monaco-languageclient-wrapper'
import useIsUserActive from './hooks/useIsUserActive'
import useShouldShutdownLanguageClient from './hooks/useShouldShutdownLanguageClient'

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

function LanguageClient ({
  id,
  sessionId,
  languageServerUrl,
  useMutualizedProxy,
  getSecurityToken,
  libraryUrls = defaultLibraryUrls,
  onError,
  onDidChangeStatus,
  onWillShutdown,
  userInactivityDelay = 30 * 1000,
  userInactivityShutdownDelay = 60 * 1000
}: LanguageClientProps): ReactElement | null {
  const onErrorRef = useRef<(error: Error) => void>()
  const onDidChangeStatusRef = useRef<(status: StatusChangeEvent) => void>()
  const onWillShutdownRef = useRef<(params: WillShutdownParams) => void>()
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
    const errorDisposable = languageClient.onError((error: Error) => {
      if (onErrorRef.current != null) {
        onErrorRef.current(error)
      }
    })
    const statusChangeDisposable = languageClient.onDidChangeStatus((status: StatusChangeEvent) => {
      if (onDidChangeStatusRef.current != null) {
        onDidChangeStatusRef.current(status)
      }
    })
    const startTimeout = setTimeout(() => languageClient.start())

    languageClient.onWillShutdown((params: WillShutdownParams) => {
      if (onWillShutdownRef.current != null) {
        onWillShutdownRef.current(params)
      }
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
  }, [getSecurityToken, id, languageServerUrl, libraryUrls, sessionId, counter, useMutualizedProxy, shouldShutdownLanguageClient])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    onDidChangeStatusRef.current = onDidChangeStatus
  }, [onDidChangeStatus])

  useEffect(() => {
    onWillShutdownRef.current = onWillShutdown
  }, [onWillShutdown])

  return null
}

export default LanguageClient
