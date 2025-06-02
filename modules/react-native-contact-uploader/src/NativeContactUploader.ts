import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

export type UploadOptions = {
  headers?: { [key: string]: string }
  method: string
  url: string
  user: { ClientID: string; PersonID: string }
}

export type UploadResponse = Promise<
  { error: boolean; message: string } | { error: boolean; response: { [key: string]: any } } | void
>

export interface Spec extends TurboModule {
  upload: (data: UploadOptions) => UploadResponse
}

export default TurboModuleRegistry.getEnforcing<Spec>('ContactUploader')
