import analytics from '@react-native-firebase/analytics'
import * as Sentry from '@sentry/react-native'
import { Platform } from 'react-native'
import { getVersion } from 'react-native-device-info'
import * as Keychain from 'react-native-keychain'
import { MMKV } from 'react-native-mmkv'
import RNSensitiveInfo from 'react-native-sensitive-info'
import { legacy_createStore as createStore } from 'redux'
import {
  getStoredState,
  Persistor,
  persistCombineReducers,
  persistStore,
  Storage,
} from 'redux-persist'
//@ts-ignore
import createSensitiveStorage from 'redux-persist-sensitive-storage'
import { v4 as uuidv4 } from 'uuid'
import Brand from '../global/Brand'
import { reducers } from './reducers'
import reactotron from '../../ReactotronConfig'

const commonPersistConfig = {
  key: 'primary',
  whitelist: [
    'appEnv',
    'appointmentPreferences',
    'currentFilter',
    'deviceCalendars',
    'oneTimeMoments',
    'user',
  ],
}

const defaultMMKVStorage: MMKV = new MMKV()

const keychainOptions = {
  service: `${Brand.APP_NAME_NO_SPACES}storageKey`,
}

const keychainOptionsGeneral = {
  service: `${Brand.APP_NAME_NO_SPACES}GeneralKey`,
}

const oldStorageConfig = {
  keychainService: `${Brand.APP_NAME_NO_SPACES}iOSKeychain`,
  sharedPreferencesName: `${Brand.APP_NAME_NO_SPACES}AndroidKeychain`,
  encrypt: true,
}
const oldStorage = createSensitiveStorage(oldStorageConfig)
const oldPersistConfig = { ...commonPersistConfig, storage: oldStorage }

// Exported to allow for purging of state from storage
export let persistor: Persistor | null = null
// Create the store with initial state
let store = createStore(
  persistCombineReducers(oldPersistConfig, reducers),
  __DEV__ ? reactotron.createEnhancer() : undefined,
)
// General MMKV storage
export let mmkvStorage = defaultMMKVStorage

function handleException(e: any) {
  __DEV__ ? console.log(e) : Sentry.captureException(e)
}

async function setGeneralServicePassword(key: string) {
  await Keychain.setGenericPassword(keychainOptionsGeneral.service, key, keychainOptionsGeneral)
}

async function setReduxServicePassword(key: string) {
  await Keychain.setGenericPassword(`${Brand.APP_NAME_NO_SPACES}storageKey`, key, keychainOptions)
}

async function createReduxStorage(): Promise<Storage> {
  let key = uuidv4()
  try {
    const keychainRes = await Keychain.getGenericPassword(keychainOptions)
    if (keychainRes && keychainRes.password != null && keychainRes.password !== '') {
      key = keychainRes.password
    } else {
      setReduxServicePassword(key)
    }
  } catch (e) {
    handleException(e)
    try {
      setReduxServicePassword(key)
    } catch (e) {
      handleException(e)
    }
  } finally {
    const mmkvStorage = new MMKV({ encryptionKey: key, id: `${Brand.APP_NAME_NO_SPACES}-storage` })
    return {
      setItem: (key, value) => {
        mmkvStorage.set(key, value)
        return Promise.resolve(true)
      },
      getItem: (key) => {
        const value = mmkvStorage.getString(key)
        return Promise.resolve(value)
      },
      removeItem: (key) => {
        mmkvStorage.delete(key)
        return Promise.resolve()
      },
    }
  }
}

async function createMMKVStorage() {
  let key = uuidv4()
  try {
    const keychainRes = await Keychain.getGenericPassword(keychainOptionsGeneral)
    if (keychainRes && keychainRes.password != null && keychainRes.password !== '') {
      key = keychainRes.password
    } else {
      setGeneralServicePassword(key)
    }
  } catch (e) {
    handleException(e)
    try {
      setGeneralServicePassword(key)
    } catch (e) {
      handleException(e)
    }
  } finally {
    mmkvStorage = new MMKV({ encryptionKey: key, id: `${Brand.APP_NAME_NO_SPACES}-general` })
  }
}

async function getRootReducer() {
  const storage = await createReduxStorage()
  await createMMKVStorage()
  const newPersistConfig = {
    ...commonPersistConfig,
    storage,
    migrate: async (state: any) => {
      if (state === undefined) {
        const asyncState = await getStoredState(oldPersistConfig)
        return asyncState
      } else return state
    },
  }
  return persistCombineReducers(newPersistConfig, reducers)
}

export async function loadStore() {
  const newRootReducer = await getRootReducer()
  if (defaultMMKVStorage.getString('installCheck') == undefined) {
    try {
      await analytics().logEvent('app_install', { platform: Platform.OS, version: getVersion() })
    } catch (e) {
      handleException(e)
    }
  }
  store.replaceReducer(newRootReducer)
  persistor = persistStore(store, null, async () => {
    const { currentFilter, deviceCalendars } = store.getState()
    //@ts-expect-error
    const { endDate, ...remainingFilters } = currentFilter
    const { coaches } = remainingFilters
    let updatedCurrentFilters = { ...remainingFilters }
    let currentFilterUpdateNeeded = false
    if (coaches.length > 0 && coaches.some((c) => typeof c === 'number')) {
      updatedCurrentFilters['coaches'] = [] as string[]
      currentFilterUpdateNeeded = true
    }
    // endDate was an old param that needs to be removed from the reducer
    if (endDate != null) {
      currentFilterUpdateNeeded = true
    }
    if (currentFilterUpdateNeeded) {
      store.dispatch({ type: 'clean_currentFilter' })
      store.dispatch({ payload: updatedCurrentFilters, type: 'set_currentFilter' })
    }
    // Clean device calendar state we don't actually want to persist across app loads
    store.dispatch({
      payload: { ...deviceCalendars, buttonPressed: false, events: [], listVisible: false },
      type: 'set_deviceCalendars',
    })
    // Remove the old state from keychain after a successful persist
    try {
      await RNSensitiveInfo.deleteItem('persist:primary', {
        keychainService: oldStorageConfig.keychainService,
        sharedPreferencesName: oldStorageConfig.sharedPreferencesName,
      })
    } catch (e) {
      handleException(e)
    }
    // Set install check value to any string
    try {
      defaultMMKVStorage.set('installCheck', 'complete')
    } catch (e) {
      handleException(e)
    }
    store.dispatch({ payload: { storePersisted: true }, type: 'set_appStatus' })
  })
}

export default store
