import { NativeModules, Platform } from 'react-native'
import type { UploadOptions, UploadResponse } from './NativeContactUploader'

const LINKING_ERROR =
  `The package 'react-native-contact-uploader' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null

const ContactUploaderModule = isTurboModuleEnabled
  ? require('./NativeContactUploader').default
  : NativeModules.ContactUploader

const ContactUploader = ContactUploaderModule
  ? ContactUploaderModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      },
    )

export function upload(data: UploadOptions): UploadResponse {
  return ContactUploader.upload(data)
}
