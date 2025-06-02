import { NativeModules, Platform } from 'react-native'

const LINKING_ERROR =
  `The package 'react-native-keep-awake' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n'

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null

const KeepAwakeModule = isTurboModuleEnabled
  ? require('./NativeKeepAwake').default
  : NativeModules.KeepAwake

const KeepAwake = KeepAwakeModule
  ? KeepAwakeModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      },
    )

export function activate(): Promise<void> {
  return KeepAwake.activate()
}

export function deactivate(): Promise<void> {
  return KeepAwake.deactivate()
}
