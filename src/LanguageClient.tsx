import { ReactElement, useEffect, useRef } from 'react'
import { createLanguageClientManager, LanguageServerConfig, StatusChangeEvent } from '@codingame/monaco-languageclient-wrapper'

export interface LanguageClientProps {
  languageServerConfig: LanguageServerConfig
  languageServerUrl: string
  getSecurityToken: () => Promise<string>
  libraryUrls?: string[]
  onError?: (error: Error) => void
  onDidChangeStatus?: (status: StatusChangeEvent) => void
}

function LanguageClient ({
  languageServerConfig,
  languageServerUrl,
  getSecurityToken,
  libraryUrls,
  onError,
  onDidChangeStatus
}: LanguageClientProps): ReactElement | null {
  const onErrorRef = useRef<(error: Error) => void>()
  const onDidChangeStatusRef = useRef<(status: StatusChangeEvent) => void>()
  useEffect(() => {
    console.info(`Starting language server for language ${languageServerConfig.language}`)
    const languageClient = createLanguageClientManager(languageServerUrl, getSecurityToken, languageServerConfig, libraryUrls ?? [])
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
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    onDidChangeStatusRef.current = onDidChangeStatus
  }, [onDidChangeStatus])

  return null
}

LanguageClient.defaultProps = {
  libraryUrls: []
}

export default LanguageClient
