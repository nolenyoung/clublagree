import qs from 'qs'
import { Platform } from 'react-native'
import { getVersion } from 'react-native-device-info'
import { upload as uploadContacts } from 'react-native-contact-uploader'
import Config from '../../config'
import { getState, setAction } from '../redux/actions'
//@ts-ignore
import { yearInReviewEndpoint } from './Brand'

export let apiKey: string =
  Platform.OS === 'ios' ? Config.PROD_API_KEY_IOS : Config.PROD_API_KEY_ANDROID
export let baseUrl: string = Config.PROD_API_URL

const convertFormData = (data: { [key: string]: any }) => {
  let form_data = new FormData()
  for (const key in data) {
    if (key === 'Avatar') {
      //@ts-ignore
      form_data.append(key, data[key], data[key].filename)
    } else if (Array.isArray(data[key])) {
      for (const value of data[key]) {
        form_data.append(`${key}[]`, value)
      }
    } else {
      form_data.append(key, data[key])
    }
  }
  return form_data
}

export function versionCheck(minVersion: string = '0.0.0'): boolean | null {
  try {
    const currentVersion = getVersion()
    let v1Num = currentVersion.split('.').map((v: string) => Number(v))
    let v2Num = minVersion.split('.').map((v) => Number(v))
    for (let i = 0; i < v1Num.length; i++) {
      if (v1Num[i] < (v2Num[i] ?? 0)) {
        return false
      } else if (v1Num[i] > (v2Num[i] ?? 0)) {
        return true
      }
    }
    return true
  } catch (e: any) {
    return null
  }
}

async function responseHandler(res: Response, reduxState: ReduxState): Promise<any> {
  const {
    appStatus: { storePersisted },
  } = reduxState
  if (res.ok) {
    try {
      let minVersion = '0.0.0'
      for (const pair of res.headers.entries()) {
        if (pair[0]?.toLowerCase() === 'earliestversion') {
          minVersion = pair[1]
        }
      }
      const response = await res.json()
      if (storePersisted) {
        const upToDate = versionCheck(minVersion)
        if (upToDate === false) {
          setAction('appStatus', { updateNeeded: true })
        }
        if (response.code === 106) {
          setAction('appStatus', { loginNeeded: true })
        }
      }
      return response
    } catch (e) {
      __DEV__ && console.log('API Response Handler Error:', e)
      return { message: 'Server error encountered.' }
    }
  } else {
    return { message: 'Server error encountered.' }
  }
}

type CommonHeaders = {
  Accept: string
  Apikey: string
  'Client-group': string
  'Content-Type': string
  profileKey?: string
}

type HeadersAndState = {
  body: { ClientID: number | null | undefined; PersonID: string | null | undefined }
  clientId: number | null | undefined
  devMode: AppEnvState['devMode']
  groupId: string
  headers: CommonHeaders
  locationId: number | null
  personId: string | null | undefined
  profileKey: string | null | undefined
  reduxState: ReduxState
}

export function getHeadersAndState(): HeadersAndState {
  const reduxState = getState()
  const {
    appEnv,
    user: { clientId, locationId, personId, profileKey },
  } = reduxState
  const { devMode } = appEnv
  apiKey =
    devMode === 'dev'
      ? Platform.OS === 'ios'
        ? Config.DEV_API_KEY_IOS
        : Config.DEV_API_KEY_ANDROID
      : Platform.OS === 'ios'
        ? Config.PROD_API_KEY_IOS
        : Config.PROD_API_KEY_ANDROID
  baseUrl = devMode === 'dev' ? Config.DEV_API_URL : Config.PROD_API_URL
  const groupId = Config.GROUP_ID
  const body = { ClientID: clientId, PersonID: personId } as const
  let headers: CommonHeaders = {
    Accept: 'application/json',
    Apikey: apiKey,
    'Client-group': groupId,
    'Content-Type': 'application/json',
  }
  if (profileKey != null) {
    headers = { ...headers, profileKey }
  }
  return { body, clientId, devMode, groupId, headers, locationId, personId, profileKey, reduxState }
}

export const API: APITypes = {
  acceptFriendRequest: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/friend/accept`, {
        body: JSON.stringify({ Friend: data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createAppointmentBooking: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/appointment/book`, {
        body: JSON.stringify({ ...data, User: data.User ?? body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createAppointmentPrebook: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/appointment/prebook`, {
        body: JSON.stringify({ ...data, User: data.User ?? body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createChallengeSignup: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/challenge/submit`, {
        body: JSON.stringify({ ...body, ...data }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createClassBooking: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonClientID, PersonID, ...rest } = data
      return fetch(`${baseUrl}/class/book`, {
        body: JSON.stringify({
          Class: rest,
          User:
            PersonClientID != null && PersonID != null
              ? { ClientID: PersonClientID, PersonID }
              : body,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createClassBookingFriend: async function ({ classInfo, friendInfo }) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonClientID, PersonID, ...rest } = classInfo
      return fetch(`${baseUrl}/class/bookFriend2`, {
        body: JSON.stringify({
          Class: rest,
          Friend: friendInfo,
          User:
            PersonClientID != null && PersonID != null
              ? { ClientID: PersonClientID, PersonID }
              : body,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createClassPreBook: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { Friend = false, PersonClientID, PersonID, ...rest } = data
      return fetch(`${baseUrl}/class/prebook`, {
        body: JSON.stringify({
          Class: rest,
          Friend,
          User:
            PersonID != null && PersonClientID != null
              ? { ClientID: PersonClientID, PersonID }
              : body,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createEventLog: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/analytics/event`, {
        body: JSON.stringify({
          ...data,
          ClientID: data.ClientID ?? clientId,
          PersonID: data.PersonID ?? personId,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createFamilyMember: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/addfamilymember`, {
        body: JSON.stringify({ ...data, ...body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createFriend: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/friend/add`, {
        body: JSON.stringify({ Friend: data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createFriendBlock: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/friend/block`, {
        body: JSON.stringify({ Friend: data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createPurchase: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonClientID, PersonID, RegistrationID, ...rest } = data
      let params: CreatePurchaseParams & {
        ClientSignature?: string | undefined
        ProductID: string | number
      } = { ...rest, ...(RegistrationID != null ? { RegistrationID } : {}) }
      if (PersonClientID != null && PersonID != null) {
        params = { ...params, PersonClientID, PersonID }
      } else {
        params = { ...params, PersonClientID: clientId, PersonID: personId }
      }
      return fetch(`${baseUrl}/purchase`, {
        body: JSON.stringify(params),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createPurchaseAddons: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonClientID, PersonID, RegistrationID, ...rest } = data
      let params: CreatePurchaseParams & {
        AddonIDs: string | number
      } = { ...rest, ...(RegistrationID != null ? { RegistrationID } : {}) }
      if (PersonClientID != null && PersonID != null) {
        params = { ...params, PersonClientID, PersonID }
      } else {
        params = { ...params, PersonClientID: clientId, PersonID: personId }
      }
      return fetch(`${baseUrl}/purchase/addons`, {
        body: JSON.stringify(params),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createPurchaseGiftCard: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/giftcard/purchase`, {
        body: JSON.stringify(data),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createPushNoteLog: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/content/logpush`, {
        body: JSON.stringify(data),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      return {}
    }
  },
  createSessionLog: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/custom/sweathouz/session-log`, {
        body: JSON.stringify({ ...data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createSessionSelfie: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/custom/sweathouz/selfie`, {
        body: JSON.stringify({ ...data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createStudioMessage: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/studio/sendemail`, {
        body: JSON.stringify({ ...data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createTip: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { ClientID, RegistrationID, TipAmount } = data
      return fetch(`${baseUrl}/purchase/tip`, {
        body: JSON.stringify({ Class: { ClientID, RegistrationID }, TipAmount, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createUser: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/add`, {
      body: qs.stringify(data),
      headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  createUserNote: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/addnote`, {
      body: JSON.stringify({ ...data, ClientID: clientId, PersonID: personId, Source: 'app' }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  createVisitRating: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { Rating, Visit } = data
      return fetch(`${baseUrl}/visit/rating`, {
        body: JSON.stringify({ Rating, User: body, Visit }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  createWaitlistSpot: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonClientID, PersonID, ...rest } = data
      return fetch(`${baseUrl}/waitlist/add`, {
        body: JSON.stringify({
          Class: rest,
          User:
            PersonClientID != null && PersonID != null
              ? { ClientID: PersonClientID, PersonID }
              : body,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  deleteAppointmentBooking: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonID, ...rest } = data
      return fetch(`${baseUrl}/appointment/cancel`, {
        body: JSON.stringify({
          Appointment: rest,
          User: { ClientID: data.ClientID, PersonID: PersonID ?? personId },
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  deleteClassBooking: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonID, ...rest } = data
      return fetch(`${baseUrl}/class/cancel`, {
        body: JSON.stringify({
          Class: rest,
          User: { ClientID: data.ClientID, PersonID: PersonID ?? personId },
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  deleteFriendBlock: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/friend/unblock`, {
        body: JSON.stringify({ Friend: data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  deleteUserAvatar: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/removeavatar`, {
        body: JSON.stringify(body),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  // deleteUserPhoto: async function () {
  //   const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
  //   if (clientId != null && personId != null) {
  //     return fetch(`${baseUrl}/user/removephoto`, {
  //       body: JSON.stringify(body),
  //       headers,
  //       method: 'POST',
  //     }).then((res) => responseHandler(res, reduxState))
  //   } else {
  //     setAction('toast', { text: 'Please sign in.' })
  //     return {}
  //   }
  // },
  deleteWaitlistSpot: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonID, ...rest } = data
      return fetch(`${baseUrl}/waitlist/remove`, {
        body: JSON.stringify({
          Class: rest,
          User: { ClientID: data.ClientID, PersonID: PersonID ?? personId },
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getAppointmentAddOns: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/appointment/addons`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getAppointmentFilters: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/appointment/v2/filters`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getAppointmentTimes: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/appointment/v2/availabletimes`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getAppVersion: async function () {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/versioncheck`, { headers, method: 'GET' }).then((res) =>
      responseHandler(res, reduxState),
    )
  },
  getBikeSettings: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/custom/spenga/bikesettings/get`, {
        body: JSON.stringify({ User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getBillingInfo: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/billing`, {
        body: JSON.stringify(body),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getBusinessInfo: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/content/businessinfo`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getChallengeInfo: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/challenge/getinfo`, {
        body: JSON.stringify({ ...body, ...data }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getClassCount: async function (data) {
    const { body, clientId, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/class/classes`, {
      body: JSON.stringify({
        ...data,
        ClientID: data.ClientID ?? clientId,
        CountOnly: true,
        User: body,
      }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getClasses: async function (data) {
    const { body, clientId, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/class/classes`, {
      body: JSON.stringify({ ...data, ClientID: data.ClientID ?? clientId, User: body }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getClassLayout: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonID, ...rest } = data
      return fetch(`${baseUrl}/class/layout`, {
        body: JSON.stringify({
          Class: rest,
          User: PersonID != null && PersonID !== '' ? { ClientID: data.ClientID, PersonID } : body,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getCoachClasses: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/custom/solidcore/coach-schedule`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getCoaches: async function (data) {
    const { clientId, groupId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/coaches`, {
        body: JSON.stringify({ ...data, GroupID: groupId }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return []
    }
  },
  getContent: async function (data, sendUserInfo = false) {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/content/get`, {
      body: sendUserInfo ? JSON.stringify({ ...data, User: body }) : JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getContentBadges: async function () {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/content/badges`, {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getCountries: async function () {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/content/countries`, {
      headers,
      method: 'GET',
    }).then((res) => responseHandler(res, reduxState))
  },
  getDictionaryData: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/content/dictionary`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getFamilyStatus: async function () {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/familystatus`, {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getFilters: async function () {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/class/filters`, {
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getFitMetrixData: async function (data) {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/fitmetrix/get`, {
      body: JSON.stringify({ ...data, User: body }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getFriends: async function () {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/friend/getall`, {
      body: JSON.stringify({ User: body }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getFriendsBookings: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/friend/bookings`, {
        body: JSON.stringify({ User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return []
    }
  },
  getFriendsClasses: async function (data) {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/friend/classes`, {
      body: JSON.stringify({ Friend: data, User: body }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getGenderOptions: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/content/genderoptions`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getGiftCards: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/giftcard/getall`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getHomeInfo: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/status`, {
        body: JSON.stringify({ ...body, appVersion: getVersion() }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getLiabilityWaiver: async function () {
    const { clientId, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/content/waiver`, {
      body: JSON.stringify({ ClientID: clientId }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getLoginOptions: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/login/lookup`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getMarketStudios: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/studios`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getMembershipContract: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/contract/get`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getMinMaxClassDates: async function ({ ClientID, LocationID }) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/class/minmax`, {
      body: JSON.stringify({ ClientID, LocationID }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getMuscleFocus: async function () {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/custom/solidcore/musclefocus`, {
      headers,
      method: 'GET',
    }).then((res) => responseHandler(res, reduxState))
  },
  getPasswordReset: async function ({ clientId, email: Email }) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/resetpassword`, {
      body: JSON.stringify({ Email }),
      headers: { ...headers, 'Client-group': String(clientId) },
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getPerformanceActivity: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/custom/redline/performance/activity`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getPerformanceLeaderboard: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/custom/redline/performance/leaderboard`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getPerformanceOverview: async function () {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/custom/redline/performance/overview`, {
      headers,
      method: 'GET',
    }).then((res) => responseHandler(res, reduxState))
  },
  getPIQStats: async function () {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/piq/statistics`, {
      body: JSON.stringify({ User: body }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getPurchaseTotal: async function ({ ClientID, GiftCard, LocationID, ProductID, PromoCode }) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/purchase/total`, {
        body: JSON.stringify({
          ClientID,
          LocationID,
          GiftCard,
          PersonID: personId,
          PersonClientID: clientId,
          ProductID,
          PromoCode,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return { Success: 0 }
    }
  },
  getReferral: async function (data) {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/referafriend/get`, {
      body: JSON.stringify(data ?? body),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getReferralLocations: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/referafriend/locations`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getReferralSources: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/content/referralsources`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getRewardsProgram: async function () {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/rewards/program`, {
      body: JSON.stringify({ User: body }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getStates: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/content/states`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getStudioAddOns: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/studio/addons`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getStudioPricing: async function ({ ClientID, LocationID }) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/studio/pricing`, {
      body: JSON.stringify({ ClientID, LocationID, UserClientID: clientId, UserID: personId }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getStudios: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/studios`, {
      body: data != null ? JSON.stringify(data) : undefined,
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getUserBilling: async function () {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/balance`, {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getUserClasses: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/classes`, {
        body: JSON.stringify({ ...(data || {}), ...body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return []
    }
  },
  getUserFamily: async function (data) {
    const { body, headers, personId, reduxState } = getHeadersAndState()
    if (personId != null) {
      const { PersonID } = data
      return fetch(`${baseUrl}/user/familymembers`, {
        body: JSON.stringify(
          PersonID != null && PersonID !== '' ? { ClientID: data.ClientID, PersonID } : body,
        ),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      return []
    }
  },
  getUserFamilyClasses: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/familyclasses`, {
        body: JSON.stringify({ ...(data || {}), ...body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return []
    }
  },
  getUserLocations: async function () {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/locations`, {
      body: JSON.stringify({ User: body }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getUserMarkets: async function ({ email: Email }) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/markets`, {
      body: JSON.stringify({ Email }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getUserPackageDetails: async function (data) {
    const { clientId, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/packagedetails`, {
      body: JSON.stringify({ ...data, ClientID: data.ClientID ?? clientId }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getUserPIQ: async function () {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/piq/inbody-get`, {
      body: JSON.stringify({ User: body }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  getUserProfile: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/get`, {
        body: JSON.stringify(data ?? body),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getUserProfiles: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/associatedprofiles`, {
        body: JSON.stringify(body),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getUserPurchaseHistory: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/sales`, {
        body: JSON.stringify({ ...body, Sort: 'desc' }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return []
    }
  },
  getUserPurchases: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/purchases`, {
        body: JSON.stringify({ ...body, Sort: 'desc' }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getUserRewardsActivity: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/rewards/activity`, {
        body: JSON.stringify({ User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return []
    }
  },
  getUserRewardsSummary: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/rewards/user`, {
        body: JSON.stringify({ User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  getUserWorkoutCalendar: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/calendar`, {
        body: JSON.stringify({ User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return []
    }
  },
  getYearInReview: async function () {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}${yearInReviewEndpoint ?? ''}`, {
        body: JSON.stringify(body),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  login: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/login`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  loginV2: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/login/verify`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  redeemRewardsOption: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/rewards/redeem/option`, {
        body: JSON.stringify({ ...data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  redeemRewardsPurchase: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { ClientID, Friend, LocationID, OptionID, PersonID, Who = 'self' } = data
      return fetch(`${baseUrl}/rewards/redeem/purchase`, {
        body: JSON.stringify({
          ...(Friend != null ? { Friend } : {}),
          OptionID,
          Studio: { ClientID, LocationID },
          User: { ClientID, PersonID },
          Who,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  searchContacts: async function (data) {
    const { headers, personId, reduxState } = getHeadersAndState()
    const { params } = data
    if (personId != null) {
      return fetch(`${baseUrl}/contact/search?${qs.stringify(params)}`, {
        headers,
        method: 'GET',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  searchFriends: async function ({ text }) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/friend/search`, {
        body: JSON.stringify({ Searchtext: text, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return []
    }
  },
  setFriendSettings: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/friend/settings`, {
        body: JSON.stringify({ ...data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  setLoginOption: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/login/initiate`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  unlockDoor: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonID, ...rest } = data
      return fetch(`${baseUrl}/custom/solidcore/brivounlock`, {
        body: JSON.stringify({
          Class: rest,
          User: PersonID != null ? { ClientID: data.ClientID, PersonID } : body,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  updateBikeSettings: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/custom/spenga/bikesettings/set`, {
        body: JSON.stringify({ ...data, User: body }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  updateBilling: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { ClientID, PersonID, ...rest } = data
      return fetch(`${baseUrl}/user/updatebilling`, {
        body: JSON.stringify({
          ...rest,
          ...(ClientID != null && PersonID != null ? { ClientID, PersonID } : body),
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  updateClassSpot: async function (data) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonID, ...rest } = data
      return fetch(`${baseUrl}/class/spot`, {
        body: JSON.stringify({
          Class: rest,
          User: PersonID != null ? { ClientID: data.ClientID, PersonID } : body,
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  updateLiabilityRelease: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/waiver`, {
        body: JSON.stringify({ ...data, ClientID: clientId, PersonID: personId }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  updateMembershipContract: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/contract/submit`, {
      body: JSON.stringify(data),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  updatePushToken: async function ({ token }) {
    const { body, clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/status`, {
        body: JSON.stringify({
          ...body,
          appVersion: getVersion(),
          deviceToken: token,
          deviceType: Platform.OS === 'ios' ? 'iPhone' : 'Android',
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  updateUser: async function (data, familyMember) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/update`, {
        body: convertFormData({
          ...data,
          ...(familyMember != null ? familyMember : { ClientID: clientId, PersonID: personId }),
        }),
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  updateUserClassVisitStatus: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return fetch(`${baseUrl}/user/visitstatus`, {
        body: JSON.stringify(data),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  updateUserRequired: async function (data) {
    const { headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/updaterequired`, {
      body: convertFormData(data),
      headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  updateWaitlistToClass: async function (data) {
    const { clientId, headers, personId, reduxState } = getHeadersAndState()
    if (clientId != null && personId != null) {
      const { PersonID, ...rest } = data
      return fetch(`${baseUrl}/waitlist/addtoclass`, {
        body: JSON.stringify({
          Class: rest,
          User: { ClientID: data.ClientID, PersonID },
        }),
        headers,
        method: 'POST',
      }).then((res) => responseHandler(res, reduxState))
    } else {
      setAction('toast', { text: 'Please sign in.' })
      return {}
    }
  },
  uploadContacts: async function () {
    const { clientId, headers, personId } = getHeadersAndState()
    if (clientId != null && personId != null) {
      return uploadContacts({
        headers,
        method: 'POST',
        url: `${baseUrl}/contacts/upload`,
        user: { ClientID: `${clientId}`, PersonID: personId },
      })
    }
  },
  uploadUserFile: async function (data) {
    const { body, headers, reduxState } = getHeadersAndState()
    const { name, uri } = data
    return fetch(`${baseUrl}/user/fileupload`, {
      body: JSON.stringify({ ...body, Filename: name, Url: uri }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
  uploadUserPhoto: async function (data) {
    const { body, headers, reduxState } = getHeadersAndState()
    return fetch(`${baseUrl}/user/photo`, {
      body: JSON.stringify({ ...body, ...data }),
      headers,
      method: 'POST',
    }).then((res) => responseHandler(res, reduxState))
  },
}

type BasicAPIResponse = { code: number; message: string }

type APITypes = {
  acceptFriendRequest: (arg1: {
    ClientID: number
    PersonID: string
  }) => Promise<{ [key: string]: any }>
  createAppointmentBooking: (arg1: {
    AddonIDs?: string
    AppointmentDescription: string
    ClientID: number | string
    CoachID: number
    EndDateTime: string
    LocationID: number
    Notes?: string
    SessionTypeID: number | string
    StartDateTime: string
    User?: { ClientID: number | string; PersonID: string }
  }) => Promise<{ [key: string]: any }>
  createAppointmentPrebook: (arg1: {
    ClientID: number
    CoachID?: number
    LocationID: number
    SessionTypeID: number | string
    StartDateTime: string
    User?: { ClientID: number | string; PersonID: string }
  }) => Promise<{
    AllowAddons?: boolean
    AllowNotes?: boolean
    AllowUnpaid?: boolean
    code?: number
    InformationRequired: InformationRequired
    MembershipOptions: Pricing[]
    message?: string
    PackageCount?: number
    PackageOptions?: AppointmentPackageOptions[]
    Packages?: AppointmentPackage[]
  }>
  createChallengeSignup: (arg: {
    ChallengeID: number
    misc01: string
    misc02: string
    misc03: string
    misc04: string
    misc05: string
    misc06: number
    misc07: number
  }) => Promise<BasicAPIResponse>
  createClassBooking: (arg1: {
    ClientID: number
    PackageID?: number
    PersonClientID: number | null | undefined
    PersonID: string | null | undefined
    RegistrationID: number
    Spot?: number
  }) => Promise<{ [key: string]: any }>
  createClassBookingFriend: (arg1: {
    classInfo: {
      ClientID: number
      PackageID?: number
      PersonClientID: number | null | undefined
      PersonID: string | null | undefined
      ProductID?: number
      RegistrationID: number
    }
    friendInfo: FriendInfo
  }) => Promise<{
    Class?: ClassInfo
    code?: number
    message?: string
    Status?: string
  }>
  createClassPreBook: (arg1: {
    ClientID: number
    Friend?: boolean
    PersonClientID: number | null | undefined
    PersonID: string | null | undefined
    RegistrationID: number
  }) => Promise<{
    code?: number
    Class: ClassInfo
    InformationRequired: InformationRequired
    MembershipOptions: Pricing[]
    message?: string
    PackageCount: number
    Packages: Package[]
    PackageOptions: Pricing[]
    Status: { [key: string]: any }
  }>
  createEventLog: (arg: {
    ClientID: number
    EventType: 'purchase'
    PersonID: string | undefined
    ProductID: number
    RegistrationID: number
  }) => Promise<BasicAPIResponse>
  createFamilyMember: (arg1: {
    BirthDate?: string
    Email: string
    FirstName: string
    HomeStudio: string
    LastName: string
    MobilePhone: string
  }) => Promise<{ [key: string]: any }>
  createFriend: (arg1: { ClientID: number; PersonID: string }) => Promise<{ [key: string]: any }>
  createFriendBlock: (arg1: {
    ClientID: number
    PersonID: string
  }) => Promise<{ [key: string]: any }>
  createPurchase: (arg1: {
    ClientID: number
    ClientSignature?: string
    GiftCard?: string
    LocationID: number
    PersonClientID?: number | null | undefined
    PersonID?: string | null | undefined
    ProductID: number | string
    PromoCode?: string
    RegistrationID?: number
    StartDate?: string
  }) => Promise<{
    code?: number
    Details?: PurchaseDetails
    message?: string
    Success?: boolean
  }>
  createPurchaseAddons: (arg1: {
    AddonIDs: number | string
    ClientID: number
    GiftCard?: string
    LocationID: number
    PersonClientID: number | null | undefined
    PersonID: string | null | undefined
    PromoCode?: string
    RegistrationID?: number
  }) => Promise<{
    code?: number
    Details?: PurchaseDetails
    message?: string
    Success?: boolean
  }>
  createPurchaseGiftCard: (arg1: APIGiftCardPurchaseParams) => Promise<
    | {
        ClientID: number
        DeliveryDate: string
        PersonID: string
        PurchaseAmount: number
        PurchaseValue: number
      }
    | BasicAPIResponse
  >
  createPushNoteLog: (arg: { PushID: string; Source: string }) => Promise<BasicAPIResponse>
  createSessionLog: (arg: {
    ActualTime: number
    AppointmentID: number
    ClientID: number
    GoalTime: number
    RegistrationID: number
    SelfiesTaken: number
    StartTime: string
    Temperature: number
    Type: string
  }) => Promise<BasicAPIResponse>
  createSessionSelfie: (arg: {
    AppointmentID: number
    ClientID: number
    RegistrationID: number
    Selfie: string //base64 encoded
    StartTime: string
  }) => Promise<BasicAPIResponse>
  createStudioMessage: (arg1: {
    Message: string
    Studio: { ClientID: number; LocationID: number }
  }) => Promise<{ [key: string]: any }>
  createTip: (arg1: {
    ClientID: number
    RegistrationID: number
    TipAmount: number
  }) => Promise<BasicAPIResponse>
  createUser: (arg1: {
    AddressLine1?: string
    AddressLine2?: string
    BirthDate: string
    City?: string
    Country?: string
    Email: string
    EmergencyContactInfoEmail?: string
    EmergencyContactInfoName?: string
    EmergencyContactInfoPhone?: string
    EmergencyContactInfoRelationship?: string
    FirstName: string
    Gender: string
    HomeStudio: string
    LastName: string
    MobilePhone: string
    OptInText: boolean
    Password?: string
    PostalCode?: string
    ReferredBy: string
    State?: string
  }) => Promise<{ code: number; data: { [key: string]: any }; message: string }>
  createUserNote: (arg1: { Label: 'request-song'; Note: string }) => Promise<{ [key: string]: any }>
  createVisitRating: (arg1: {
    Rating: { Comments?: string; Declined?: 0 | 1; Score?: number }
    Visit: { ClientID: number; VisitRefNo: number }
  }) => Promise<{ code?: number; message?: string }>
  createWaitlistSpot: (arg1: {
    ClientID: number
    PackageID?: number
    PersonClientID: number | null | undefined
    PersonID: string | null | undefined
    RegistrationID: number
    Spot?: number
  }) => Promise<{ [key: string]: any }>
  deleteAppointmentBooking: (arg1: {
    AppointmentID: number
    ClientID: number
    PersonID: string | undefined
  }) => Promise<{ code?: number; message?: string }>
  deleteClassBooking: (arg1: {
    ClientID: number
    PersonID: string | undefined
    VisitRefNo: number
    WaitlistEntryID: number
  }) => Promise<{ code?: number; message?: string }>
  deleteFriendBlock: (arg1: { ClientID: number; PersonID: string }) => Promise<{
    [key: string]: any
  }>
  deleteUserAvatar: () => Promise<{ [key: string]: any }>
  // deleteUserPhoto: () => Promise<{ PhotoUrl: string } | BasicAPIResponse>
  deleteWaitlistSpot: (arg1: {
    ClientID: number
    PersonID: string | undefined
    VisitRefNo: number
    WaitlistEntryID: number
  }) => Promise<{ code?: number; message?: string }>
  getAppointmentAddOns: (arg1: {
    ClientID: number
    CoachID: number
  }) => Promise<Array<AppointmentAddOn> | BasicAPIResponse>
  getAppointmentFilters: (arg1: {
    Locations: string
  }) => Promise<{ SessionCategories: AppointmentFiltersCategory[] } | BasicAPIResponse>
  getAppointmentTimes: (arg1: APIAppointmentTimesArgs) => Promise<
    | {
        AvailableTimes: AppointmentAvailableTime[]
        Coaches: Coach[]
        Locations: Location[]
        SessionTypes: {
          CategoryID: string
          ClientID: number
          LocationID: number
          SessionName: string
          SessionTypeID: string
          ShowGenderFilter: boolean
          SortOrder: number
        }[]
        Settings: { AllowFamilyBooking: boolean; MaxDate: string }
      }
    | BasicAPIResponse
  >
  getAppVersion: () => Promise<{ CurrentVersion: string; EarliestVersion: string }>
  getBikeSettings: () => Promise<{
    ClientID?: number
    HandlebarForeAft?: string
    HandlebarHeight?: string
    PersonID?: string
    SeatForeAft?: string
    SeatHeight?: string
    ShoeSize?: string
  }>
  getBillingInfo: () => Promise<{ card?: number; expiration?: string; lastfour?: string }>
  getBusinessInfo: (arg1: { ClientID: number; LocationID: number }) => Promise<BusinessInformation>
  getChallengeInfo: (arg1: { ChallengeID: number }) => Promise<APIChallengeInfo | BasicAPIResponse>
  getClassCount: (arg1: {
    ClassType: Array<number>
    CoachID: Array<string>
    EndDate: string
    Locations: Array<string>
    StartDate: string
    ClientID?: number
  }) => Promise<{ ClassCount: number }>
  getClasses: (arg1: {
    ClassType: Array<number>
    ClientID?: number
    CoachID: Array<string>
    EndDate: string
    Locations: Array<string>
    StartDate: string
  }) => Promise<{ ClassCount: number; Classes: Array<ClassInfo> }>
  getClassLayout: (arg1: {
    ClientID: number
    PersonID: string | null | undefined
    RegistrationID: number
  }) => Promise<{
    Class?: ClassInfo
    code?: number
    Layout?: {
      ClientID: number
      Cols: string
      HasSpotsAvailable: boolean
      Layout: Array<ClassSpot>
      Legend: ClassLayoutLegend
      LocationID: string
      Rows: string
      Spots: string
    }
    message?: string
  }>
  getCoachClasses: (arg1: {
    ClientID: string
    CoachID: string
  }) => Promise<{ Classes: ClassInfo[]; Coach: Coach } | BasicAPIResponse>
  getCoaches: (arg1: { ClientID: number }) => Promise<Coach[] | BasicAPIResponse>
  getContent: (arg1: { Label: ContentLabel }, sendUserInfo?: boolean) => Promise<any>
  getContentBadges: () => Promise<{
    Badges: Array<Badge>
    Groups: Array<BadgeGroup>
    code?: number
    message?: string
  }>
  getCountries: () => Promise<{
    code?: number
    Countries: Array<{ Label: string; Value: string }>
    message?: string
  }>
  getDictionaryData: (arg1: {
    ClientID: number
    LocationID: number
  }) => Promise<Array<{ [key: string]: any }> | BasicAPIResponse>
  getFamilyStatus: () => Promise<
    Array<{
      ClientID: number
      DOB: string
      Email: string
      FirstName: string
      LastName: string
      LastYear: number
      Last30: number
      Last90: number
      PersonID: string
    }>
  >
  getFilters: () => Promise<{ [key: string]: any }>
  getFitMetrixData: (arg1: {
    EndDate?: string
    RegistrationID?: number
    Sort?: 'asc' | 'desc'
    StartDate?: string
    VisitRefNo?: number
  }) => Promise<Array<FitMetrixData>>
  getFriends: () => Promise<{ [key: string]: any }>
  getFriendsBookings: () => Promise<{ Classes: BookedClassInfo[] } | BasicAPIResponse>
  getFriendsClasses: (arg1: {
    ClientID: number
    PersonID: string
  }) => Promise<Array<ClassInfo> | BasicAPIResponse>
  getGenderOptions: (arg1: { ClientID: number }) => Promise<Array<string> | BasicAPIResponse>
  getGiftCards: (arg1: {
    ClientID: number
    LocationID: number
  }) => Promise<GiftCard | BasicAPIResponse>
  getHomeInfo: () => Promise<{
    ActivePackages: ActivePackage[]
    hasFamilyOptions?: boolean
    hasFutureAutopay?: boolean
    hasPricingOptions?: boolean
    hasUpcomingFriendBookings?: boolean
    homeStudio?: Location
    inRewardsProgram?: boolean
    liabilityReleased?: boolean
    MembershipContract?: MembershipInfo
    numAccounts?: number
    promptReview?: boolean
    ratingPending?: VisitRatingInfo | null | undefined
    rewardsBalance?: number
    supportsAppointments?: boolean
    totalClasses?: number
    totalClassesLast30?: number
    weekStreak?: number
  }>
  getLiabilityWaiver: () => Promise<{ LiabilityRelease?: string; message?: string }>
  getLoginOptions: (arg1: { Email: string }) => Promise<{
    LoginOptions: Array<LoginOption>
    message?: string
  }>
  getMarketStudios: (arg1: { ClientID: number }) => Promise<Location[] | BasicAPIResponse>
  getMembershipContract: (data: {
    ClientID: number
    PersonID: string
  }) => Promise<{ Contract: MembershipContract } | BasicAPIResponse>
  getMinMaxClassDates: (arg1: { ClientID: number; LocationID: number }) => Promise<{
    FirstClassAvailable: string | null | undefined
    LastClassAvailable: string | null | undefined
  }>
  getMuscleFocus: () => Promise<MuscleFocus[] | BasicAPIResponse>
  getPasswordReset: (arg1: { clientId: number; email: string }) => Promise<{ [key: string]: any }>
  getPerformanceActivity: (arg1: {
    ClientID: number
    PersonID: string
  }) => Promise<PerformanceActivity[] | BasicAPIResponse>
  getPerformanceLeaderboard: (arg1: {
    ClientID: number
    Label: string
    PersonID: string
  }) => Promise<{
    Label: string
    Location: string
    Local: Array<PerformanceLeaderboardResult>
    National: Array<PerformanceLeaderboardResult>
  }>
  getPerformanceOverview: () => Promise<PerformanceOverview[] | BasicAPIResponse>
  getPIQStats: () => Promise<PIQStats[] | BasicAPIResponse>
  getPurchaseTotal: (arg1: {
    ClientID: number
    GiftCard: string
    LocationID: number
    ProductID: number | string
    PromoCode: string
  }) => Promise<{
    code?: number
    Details?: PurchaseTotalDetails
    message?: string
    Success: 0 | 1
  }>
  getReferral: (arg1?: {
    ClientID: number
    PersonID: string
  }) => Promise<Referral | BasicAPIResponse>
  getReferralLocations: (arg1: {
    ClientID: number
    PersonID: string
  }) => Promise<{ Locations: ReferralLocation[] } | BasicAPIResponse>
  getReferralSources: (arg1: { ClientID: number }) => Promise<Array<string>>
  getRewardsProgram: () => Promise<{
    message: any
    Earn: Array<RewardsItemEarn>
    Locations: Array<RewardsItemLocation>
    Redeem: Array<RewardsItemRedeem>
  }>
  getStates: (arg1: { Country: string }) => Promise<{
    code?: number
    message?: string
    States: Array<{ Label: string; Value: string }>
  }>
  getStudioAddOns: (arg1: { ClientID: number; LocationID: number }) => Promise<Array<AddOn>>
  getStudioPricing: (arg1: { ClientID: number; LocationID: number }) => Promise<{
    ClientID: number
    GroupID: number
    LocationID: number
    Pricing: Array<Pricing>
    PricingGroups: Array<PricingGroup>
  }>
  getStudios: (data?: {
    Latitude?: number
    Longitude?: number
  }) => Promise<Location[] | BasicAPIResponse>
  getUserBilling: (arg1?: {
    ClientID: number
    PersonID: string
  }) => Promise<UserBilling | BasicAPIResponse>
  getUserClasses: (arg1?: APIGetUserClassesParams | undefined) => Promise<BookedClassInfo[]>
  getUserFamily: (arg1: {
    ClientID: number
    PersonID: string | null | undefined
  }) => Promise<Array<FamilyMember>>
  getUserFamilyClasses: (arg1?: APIGetUserClassesParams | undefined) => Promise<BookedClassInfo[]>
  getUserLocations: () => Promise<{ Locations: Location[] } | BasicAPIResponse>
  getUserMarkets: (arg1: {
    email: string
  }) => Promise<Array<{ [key: string]: any }> | BasicAPIResponse>
  getUserPackageDetails: (arg: {
    ClientID: number
    SaleID: number
  }) => Promise<UserPackageDetails[] | BasicAPIResponse>
  getUserPIQ: () => Promise<{
    code?: number
    message?: string
    PercentBodyFatHistory: Array<{ [key: string]: any }>
    PerformanceData: Array<{ [key: string]: any }>
    SkeletalMuscleMassHistory: Array<{ [key: string]: any }>
    WeightHistory: Array<{ [key: string]: any }>
  }>
  getUserProfile: (
    arg1?: { ClientID: number; PersonID: string } | null | undefined,
  ) => Promise<UsersProfile | BasicAPIResponse>
  getUserProfiles: () => Promise<Array<UserProfile> | { code?: number; message?: string }>
  getUserPurchaseHistory: () => Promise<Array<Sale> | { code?: number; message?: string }>
  getUserPurchases: () => Promise<{
    code?: number
    contracts?: Purchase[]
    message?: string
    packages?: Purchase[]
  }>
  getUserRewardsActivity: () => Promise<Array<RewardsActivity>>
  getUserRewardsSummary: () => Promise<RewardsSummary>
  getUserWorkoutCalendar: () => Promise<WorkoutCalendar | BasicAPIResponse>
  getYearInReview: () => Promise<APIYearInReview>
  login: (arg1: {
    ClientID: number
    Email: string
    Password: string
  }) => Promise<{ [key: string]: any }>
  loginV2: (arg1: { Email: string; VerifyCode: string }) => Promise<{
    altPersonID: string
    Avatar: string
    clientID: number
    code?: number
    dob: string
    email: string
    firstName: string
    groupID: string
    lastName: string
    locationID: number
    locationName: string
    message?: string
    middleName: string
    personID: string
  }>
  redeemRewardsOption: (arg1: {
    OptionID: number
  }) => Promise<{ PointBalance?: number; Voucher?: number }>
  redeemRewardsPurchase: (arg1: {
    ClientID: number
    Friend?: FriendInfo
    LocationID: number
    OptionID: number
    PersonID: string
    Who?: string
  }) => Promise<{ [key: string]: any }>
  searchContacts: (arg1: { params: { q: string } }) => Promise<{ [key: string]: any }>
  searchFriends: (arg1: { text: string }) => Promise<Array<Friend>>
  setFriendSettings: (arg1: {
    Searchable?: boolean
    Private?: boolean
  }) => Promise<BasicAPIResponse>
  setLoginOption: (arg1: { Email: string; Type: string }) => Promise<BasicAPIResponse>
  unlockDoor: (Class: { ClientID: number; PersonID: string; VisitRefNo: number }) => Promise<{
    [key: string]: any
  }>
  updateBikeSettings: (arg1: {
    HandlebarHeight: string
    SeatForeAft: string
    SeatHeight: string
    ShoeSize?: string
  }) => Promise<BasicAPIResponse>
  updateBilling: (arg1: {
    CardNumber: string
    ClientID?: number
    ExpMonth: string
    ExpYear: string
    PersonID?: string
  }) => Promise<{ [key: string]: any }>
  updateClassSpot: (arg1: {
    Action: 'Reserve' | 'Cancel'
    ClientID: number
    PersonID: string | undefined
    Spot: number
    RegistrationID: number
  }) => Promise<{ [key: string]: any }>
  updateLiabilityRelease: (arg1: { Waiver: string }) => Promise<BasicAPIResponse>
  updateMembershipContract: (data: {
    ClientContractID: number
    ClientID: number
    Contract: string
    PersonID: string
  }) => Promise<BasicAPIResponse>
  updatePushToken: (arg1: { token: string }) => Promise<{ [key: string]: any }>
  updateUser: (
    arg1: {
      AddressLine1?: string
      AddressLine2?: string
      Avatar?: { filename: string; name: string; type: string; uri: string }
      BirthDate?: string // YYYY-MM-DD,
      City?: string
      Country?: string
      Email?: string
      EmergencyContactInfoName?: string
      EmergencyContactInfoEmail?: string
      EmergencyContactInfoPhone?: string
      EmergencyContactInfoRelationship?: string
      FirstName?: string
      Gender?: string
      HomeStudio?: string
      LastName?: string
      MobilePhone?: string
      PostalCode?: string
      State?: string
    },
    arg2?: { ClientID: number; PersonID: string } | null | undefined,
  ) => Promise<{ [key: string]: any }>
  updateUserClassVisitStatus: (arg1: {
    ClientID: number
    Status: 'SignedIn'
    VisitRefNo: number
  }) => Promise<{ [key: string]: any }>
  updateUserRequired: (
    arg1: APIUserUpdateRequired,
    arg2?: { ClientID: number; PersonID: string } | null | undefined,
  ) => Promise<BasicAPIResponse>
  updateWaitlistToClass: (arg1: {
    ClientID: number
    PersonID: string
    WaitlistEntryID: number
  }) => Promise<{ [key: string]: any }>
  uploadContacts: () => Promise<{ [key: string]: any } | void>
  uploadUserFile: (arg1: { name: string; uri: string }) => Promise<{ [key: string]: any }>
  uploadUserPhoto: (arg1: {
    ClientID?: number
    PersonID?: string
    Photo: string //base64 encoded
  }) => Promise<{ ClientId: number; PhotoUrl: string } | BasicAPIResponse>
}
