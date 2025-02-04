import { ReactElement, useEffect, useRef, useState } from 'react'
import { createLanguageClientManager, LanguageClientId, StatusChangeEvent as WrapperStatusChangeEvent, LanguageClientManager, WillShutdownParams, Infrastructure, LanguageClientOptions, LanguageClientManagerOptions } from '@codingame/monaco-languageclient-wrapper'
import { useLocalStorage, writeStorage } from '@rehooks/local-storage'
import { v4 as uuidv4 } from 'uuid'
import { initializePromise } from '@codingame/monaco-editor-wrapper'
import useIsUserActive from './hooks/useIsUserActive.js'
import useShouldShutdownLanguageClient from './hooks/useShouldShutdownLanguageClient.js'
import { useLastVersion } from './hooks/useLastVersion.js'

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
  /** Allow only a single tab to have active language clients (the most recently focused one) */
  singleActiveTab?: boolean
}

const noop = () => null

const ACTIVE_TAB_LOCAL_STORAGE_KEY = 'monaco-lsp-active-tab'
const currentTab = uuidv4()
let languageClientCount = 0

window.addEventListener('focus', () => {
  if (languageClientCount > 0) {
    writeStorage(ACTIVE_TAB_LOCAL_STORAGE_KEY, currentTab)
  }
})

function LanguageClient ({
  id,
  infrastructure,
  clientOptions,
  clientManagerOptions,
  onError: _onError,
  onDidChangeStatus: _onDidChangeStatus,
  onWillShutdown: _onWillShutdown,
  userInactivityDelay = 30 * 1000,
  userInactivityShutdownDelay = 60 * 1000,
  singleActiveTab = true
}: LanguageClientProps): ReactElement | null {
  const onError = useLastVersion(_onError ?? noop)
  const onDidChangeStatus = useLastVersion(_onDidChangeStatus ?? noop)
  const onWillShutdown = useLastVersion(_onWillShutdown ?? noop)

  const languageClientRef = useRef<LanguageClientManager>(undefined)

  const [willShutdown, setWillShutdown] = useState(false)
  const [counter, setCounter] = useState(1)
  const [servicesReady, setServicesReady] = useState(false)
  useEffect(() => {
    void (async () => {
      await initializePromise
      setServicesReady(true)
    })()
  }, [])

  const isUserActive = useIsUserActive(userInactivityDelay)
  const shouldShutdownLanguageClientForInactivity = useShouldShutdownLanguageClient(isUserActive, userInactivityShutdownDelay)
  const restartAllowed = !isUserActive

  const [activeTab] = useLocalStorage(ACTIVE_TAB_LOCAL_STORAGE_KEY)
  const shouldShutdownLanguageClientAsNotActiveTab = singleActiveTab && activeTab !== currentTab

  useEffect(() => {
    if (willShutdown && restartAllowed) {
      // eslint-disable-next-line no-console
      console.info('Restarting language client because the current instance will be shutdown')
      setCounter(v => v + 1)
      setWillShutdown(false)
    }
  }, [willShutdown, restartAllowed])

  useEffect(() => {
    languageClientCount++
    // As soon as a new language client is requested and we have a focus, let's become the active tab
    if (window.document.hasFocus()) {
      writeStorage(ACTIVE_TAB_LOCAL_STORAGE_KEY, currentTab)
    }
    return () => {
      languageClientCount--
    }
  }, [])

  useEffect(() => {
    if (!servicesReady) {
      return
    }
    setWillShutdown(false)

    if (shouldShutdownLanguageClientForInactivity || shouldShutdownLanguageClientAsNotActiveTab) {
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
      setTimeout(() => {
        // Close in a timeout so the languageclient is not disposed at the exact same time as a model
        // Or a error is displayed because it fails to send the didClose notification
        languageClient.dispose().then(() => {
          // eslint-disable-next-line no-console
          console.info('Language server shut down')
        }, err => {
          console.error('Unable to dispose language client', err)
        })
      })
    }
  }, [id, counter, shouldShutdownLanguageClientForInactivity, onError, onDidChangeStatus, onWillShutdown, infrastructure, clientOptions, clientManagerOptions, shouldShutdownLanguageClientAsNotActiveTab, servicesReady])

  return null
}

export default LanguageClient
