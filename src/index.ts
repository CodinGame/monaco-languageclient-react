import { LanguageClientId, loadExtensionConfigurations, registerLanguageClient } from '@codingame/monaco-languageclient-wrapper'
import LanguageClient, { LanguageClientProps, StatusChangeEvent } from './LanguageClient'

export default LanguageClient
export {
  loadExtensionConfigurations,
  registerLanguageClient
}
export type {
  LanguageClientProps,
  LanguageClientId,
  StatusChangeEvent
}
