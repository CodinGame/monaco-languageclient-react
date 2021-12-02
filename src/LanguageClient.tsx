import { ReactElement, useEffect, useRef } from 'react'
import { createLanguageClientManager, LanguageServerConfig, StatusChangeEvent } from '@codingame/monaco-languageclient-wrapper'
import { LanguageClientManager } from '@codingame/monaco-languageclient-wrapper/dist/languageClient'

export interface LanguageClientProps {
  languageServerConfig: LanguageServerConfig
  languageServerUrl: string
  getSecurityToken: () => Promise<string>
  libraryUrls?: string[]
  onError?: (error: Error) => void
  onDidChangeStatus?: (status: StatusChangeEvent) => void,
  configuration?: any
}

const defaultLibraryUrls: string[] = []

function LanguageClient ({
  languageServerConfig,
  languageServerUrl,
  getSecurityToken,
  libraryUrls = defaultLibraryUrls,
  onError,
  onDidChangeStatus,
  configuration
}: LanguageClientProps): ReactElement | null {
  const onErrorRef = useRef<(error: Error) => void>()
  const onDidChangeStatusRef = useRef<(status: StatusChangeEvent) => void>()
  const languageClientRef = useRef<LanguageClientManager>()
  useEffect(() => {
    console.info(`Starting language server for language ${languageServerConfig.language}`)
    const languageClient = createLanguageClientManager(languageServerUrl, getSecurityToken, languageServerConfig, libraryUrls)
    languageClientRef.current = languageClient
    const errorDisposable = languageClient.onError((error) => {
      if (onErrorRef.current != null) {
        onErrorRef.current(error)
      }
    })
    const statusChangeDisposable = languageClient.onDidChangeStatus(status => {
      if (onDidChangeStatusRef.current != null) {
        onDidChangeStatusRef.current(status)
      }
    })
    const startTimeout = setTimeout(() => languageClient.start())

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
  }, [getSecurityToken, languageServerConfig, languageServerUrl, libraryUrls])

  useEffect(() => {
    if (configuration != null) {
      languageClientRef.current!.updateConfiguration(configuration)
    }
  }, [configuration])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    onDidChangeStatusRef.current = onDidChangeStatus
  }, [onDidChangeStatus])

  return null
}

export default LanguageClient
