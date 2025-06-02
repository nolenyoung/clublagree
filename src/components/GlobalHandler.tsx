import notifee, { EventType } from '@notifee/react-native'
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import moment from 'moment'
import * as React from 'react'
import { AppState, AppStateStatus, Linking, Platform } from 'react-native'
import { setVisibility as setSplashVisibility } from 'react-native-splash-screen'
import { useSelector } from 'react-redux'
import ModalCalendars from './ModalCalendars'
import ModalChallengeSignup from './ModalChallengeSignup'
import ModalFamilySelector from './ModalFamilySelector'
import ModalHelp from './ModalHelp'
import ModalInfoPurchaseCredits from './ModalInfoPurchaseCredits'
import ModalWebView from './ModalWebView'
import StatusBarHandler from './StatusBarHandler'
import { API } from '../global/API'
import Brand from '../global/Brand'
import {
  checkInitialLink,
  cleanImageCache,
  getPushNotificationStatus,
  getUniqueId,
  handlePushNotification,
  logError,
  logEvent,
  onHandleAppLink,
} from '../global/Functions'
import { useGetFilters, useInternetListener, useUploadContacts } from '../global/Hooks'
import { setAction } from '../redux/actions'
import { loadStore } from '../redux/store'

type Props = { navigation: RootNavigation; user: UserState }

const onCloseModalWebView = () => setAction('modals', { webView: { title: '', uri: '' } })

async function sendLocalPushNote({
  messageId,
  notification,
  data,
}: FirebaseMessagingTypes.RemoteMessage) {
  if (notification != null) {
    try {
      await notifee.displayNotification({
        android: {
          channelId: Brand.PUSH_CHANNEL_ID,
          pressAction: { id: messageId ?? getUniqueId() },
        },
        body: notification.body,
        data: data != null ? { ...data, id: `${moment().unix() - 1000000000}` } : {},
        id: messageId,
        title: notification.title,
      })
    } catch (e: any) {
      logError(e)
    }
  }
}

async function updatePushToken(token: string) {
  try {
    await API.updatePushToken({ token })
  } catch (e) {
    logError(e)
  }
}

export default function GlobalHandler(props: Props): React.ReactElement {
  const { navigation, user } = props
  const { navigate } = navigation
  const { clientId, personId, pushToken } = user
  const pushNotePermissionCheckActive = React.useRef(false)
  const { loginNeeded, storePersisted, updateNeeded } = useSelector(
    (state: ReduxState) => state.appStatus,
  )
  const {
    Class,
    modalFamilySelector,
    modalInfoPurchaseCredits,
    selectedFamilyMember,
    workshops = false,
  } = useSelector((state: ReduxState) => state.bookingDetails)
  const {
    challengeSignup: { info: challengeInfo, visible: modalChallengeSignup },
    contactUs: modalContactUs,
    webView: { title: modalWebViewTitle, uri: modalWebViewUri },
  } = useSelector((state: ReduxState) => state.modals)
  const { ClientID, PersonID } = Class ?? {}
  const loggedIn = clientId != null && personId != null
  useGetFilters(storePersisted)
  useInternetListener(storePersisted, navigation)
  useUploadContacts(storePersisted)
  React.useEffect(() => {
    setSplashVisibility(false)
    loadStore()
    ;(async function logAppOpen() {
      await logEvent('app_open')
    })()
  }, [])
  React.useEffect(() => {
    let remove: (() => void) | null = null
    let unsubscribeAndroidPushNoteEvent: (() => void) | null = null
    let unsubscribeiOSPushNoteEvent: (() => void) | null = null
    let unsubscribeNotificationOpenedApp: (() => void) | null = null
    let unsubscribeTokenRefresh: (() => void) | null = null
    if (storePersisted) {
      cleanImageCache()
      checkInitialLink(navigate, loggedIn)
      const { remove: removeListener } = Linking.addEventListener('url', (data) => {
        if (data?.url != null) {
          onHandleAppLink({ navigate, url: data.url })
        }
      })
      remove = removeListener
      unsubscribeTokenRefresh = messaging().onTokenRefresh(async (t) => {
        try {
          if (Platform.OS === 'android') {
            setAction('user', { pushToken: t })
          } else {
            const iOSToken = await messaging().getAPNSToken()
            if (iOSToken != null) {
              setAction('user', { pushToken: iOSToken })
            }
          }
        } catch (e) {
          logError(e)
        }
      })
      // Android message handler
      unsubscribeAndroidPushNoteEvent = messaging().onMessage(sendLocalPushNote)
      unsubscribeNotificationOpenedApp = messaging().onNotificationOpenedApp(async (m) => {
        handlePushNotification({ navigate, notification: m })
        try {
          const { data } = m
          await API.createPushNoteLog({
            PushID: (data?.PushID as string) ?? '',
            Source: (data?.Source as string) ?? '',
          })
        } catch (e) {
          logError(e)
        }
      })
      unsubscribeiOSPushNoteEvent = notifee.onForegroundEvent(async ({ type, detail }) => {
        const { notification } = detail
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log({ pushNoteData: detail })
        }
        if (type === EventType.PRESS) {
          handlePushNotification({ navigate, notification })
          if (notification != null) {
            try {
              await API.createPushNoteLog({
                PushID: (notification.data?.PushID as string) ?? '',
                Source: (notification.data?.Source as string) ?? '',
              })
            } catch (e) {
              logError(e)
            }
          }
        }
      })
    }
    return () => {
      remove && remove()
      unsubscribeNotificationOpenedApp != null && unsubscribeNotificationOpenedApp()
      unsubscribeTokenRefresh && unsubscribeTokenRefresh()
      unsubscribeAndroidPushNoteEvent && unsubscribeAndroidPushNoteEvent()
      unsubscribeiOSPushNoteEvent && unsubscribeiOSPushNoteEvent()
    }
  }, [storePersisted])
  React.useEffect(() => {
    ;(async function () {
      if (storePersisted && loggedIn) {
        pushNotePermissionCheckActive.current = true
        await getPushNotificationStatus({ getToken: true, requestPermission: true })
        pushNotePermissionCheckActive.current = false
      }
    })()
  }, [loggedIn, storePersisted])
  React.useEffect(() => {
    const listener = AppState.addEventListener('change', async (newState: AppStateStatus) => {
      if (newState === 'active') {
        if (storePersisted && loggedIn && !pushNotePermissionCheckActive.current) {
          pushNotePermissionCheckActive.current = true
          await getPushNotificationStatus({ getToken: true, requestPermission: false })
          pushNotePermissionCheckActive.current = false
        }
      }
    })
    if (storePersisted && loggedIn && pushToken != null) {
      updatePushToken(pushToken)
    }
    return () => {
      listener.remove()
    }
  }, [loggedIn, pushToken, storePersisted])
  React.useEffect(() => {
    if (loginNeeded) {
      setAction('toast', { text: 'Please log in again.' })
      navigate('Login')
    }
  }, [loginNeeded])
  React.useEffect(() => {
    if (updateNeeded) {
      navigate('UpdateApp')
    }
  }, [updateNeeded])
  return (
    <>
      <ModalCalendars />
      {modalChallengeSignup && challengeInfo != null && <ModalChallengeSignup {...challengeInfo} />}
      {modalInfoPurchaseCredits && <ModalInfoPurchaseCredits navigate={navigate} />}
      {modalFamilySelector && (
        <ModalFamilySelector
          ClientID={ClientID || clientId}
          navigate={navigate}
          PersonID={PersonID || personId}
          selectedMember={selectedFamilyMember}
          workshops={workshops}
        />
      )}
      {modalContactUs && <ModalHelp />}
      {modalWebViewUri !== '' && (
        <ModalWebView
          onClose={onCloseModalWebView}
          title={modalWebViewTitle}
          uri={modalWebViewUri}
        />
      )}
      <StatusBarHandler />
    </>
  )
}
