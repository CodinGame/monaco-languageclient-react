import { CodinGameInfrastructure, Infrastructure, LanguageClientId, loadExtensionConfigurations, registerLanguageClient, WorkspaceFolder } from '@codingame/monaco-languageclient-wrapper'
import LanguageClient, { LanguageClientProps, StatusChangeEvent } from './LanguageClient.js'

export default LanguageClient
export {
  loadExtensionConfigurations,
  registerLanguageClient,
  CodinGameInfrastructure
}
export type {
  LanguageClientProps,
  LanguageClientId,
  StatusChangeEvent,
  Infrastructure,
  WorkspaceFolder
}
