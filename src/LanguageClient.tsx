import { ReactElement, useEffect, useRef, useState } from 'react'
import { createLanguageClientManager, LanguageClientId, StatusChangeEvent, LanguageClientManager, WillShutdownParams } from '@codingame/monaco-languageclient-wrapper'

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
  /** Allows the client to reconnect to another server when it receives the willShutdown notification */
  restartAllowed?: boolean
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
  restartAllowed = true
}: LanguageClientProps): ReactElement | null {
  const onErrorRef = useRef<(error: Error) => void>()
  const onDidChangeStatusRef = useRef<(status: StatusChangeEvent) => void>()
  const onWillShutdownRef = useRef<(params: WillShutdownParams) => void>()
  const languageClientRef = useRef<LanguageClientManager>()

  const [willShutdown, setWillShutdown] = useState(false)
  const [counter, setCounter] = useState(1)

  useEffect(() => {
    if (willShutdown && restartAllowed) {
      console.info('Restarting language client because the current instance will be shutdown')
      setCounter(v => v + 1)
      setWillShutdown(false)
    }
  }, [willShutdown, restartAllowed])

  useEffect(() => {
    setWillShutdown(false)

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
  }, [getSecurityToken, id, languageServerUrl, libraryUrls, sessionId, counter, useMutualizedProxy])

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
