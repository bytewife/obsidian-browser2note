import { useStorageLocal } from '~/composables/useStorageLocal'
import { NULL_FILENAME, NULL_LINENUMBER } from '~/constants'

export const apiKey = useStorageLocal('apiKey', '', { listenToStorageChanges: true })
export const allFilenamesCached = useStorageLocal('filenames', [''], { listenToStorageChanges: true })
export const selectedFileCached = useStorageLocal('selectedFile', NULL_FILENAME, { listenToStorageChanges: true })
export const selectedLineNumberCached = useStorageLocal('selectedLineNumber', NULL_LINENUMBER, { listenToStorageChanges: true })
