import { Notification } from '@notifee/react-native'
import Geolocation from '@react-native-community/geolocation'
import analytics from '@react-native-firebase/analytics'
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import * as Sentry from '@sentry/react-native'
import * as turfHelpers from '@turf/helpers'
import turfLength from '@turf/length'
import {
  AsYouType,
  CountryCode,
  isSupportedCountry,
  isValidPhoneNumber,
} from 'libphonenumber-js/mobile'
import moment from 'moment'
import momentTimezone from 'moment-timezone'
import postalCodes from 'postal-codes-js'
import qs from 'qs'
import * as React from 'react'
import { Linking, Platform, Text, TextStyle, ViewStyle } from 'react-native'
import Calendar, { CalendarEventWritable } from 'react-native-calendar-events'
import { getDeviceId, getVersion } from 'react-native-device-info'
import {
  checkNotifications,
  requestNotifications,
  RESULTS,
  PermissionStatus,
} from 'react-native-permissions'
import { TChildrenRenderer } from 'react-native-render-html'
import { v4 as uuidv4 } from 'uuid'
import { API } from './API'
//@ts-ignore
import Brand, { customLogging, getEventMessage, getLocation } from './Brand'
import {
  cardRegex,
  cvvRegex,
  dollarAmountRegex,
  emailRegex,
  FILE_LOCATIONS,
  FILE_PREFIX,
  numberRegex,
  passwordRegex,
  pickedImagesFolderAndroid,
  PROVIDER_TYPES,
  STORAGE_KEYS,
} from './Constants'
import * as ImageCaching from './ImageCaching'
import { cleanAction, getState, setAction } from '../redux/actions'
import { initialCurrentFilter } from '../redux/reducers'
import Config from '../../config'
import { mmkvStorage } from '../redux/store'

export * from './Brand'

export const formatEventInfo = (
  classInfo: Partial<ClassInfo> | Partial<BookedClassInfo>,
): CalendarEventWritable & { title: string } => {
  const { Coach, EndDateTime = '', Location, Name = '', StartDateTime = '' } = classInfo
  const { IsWaitlist = false } = classInfo as Partial<BookedClassInfo>
  const {
    Address = '',
    City = '',
    State = '',
    TimeZone = '',
    Virtual,
    Zip: zip = '',
  } = Location ?? {}
  const startDate = moment
    .utc(momentTimezone.tz(StartDateTime, 'YYYY-MM-DD HH:mm:ss', TimeZone))
    .toISOString()
  const endDate = moment
    .utc(momentTimezone.tz(EndDateTime, 'YYYY-MM-DD HH:mm:ss', TimeZone))
    .toISOString()
  const location = getLocation
    ? getLocation(Location)
    : Virtual == '1'
      ? 'This is a virtual class.'
      : Address + ', ' + City + ', ' + State + ', ' + zip
  const trainerName = formatCoachName({ coach: Coach, lastInitialOnly: false })
  const title = `${IsWaitlist ? 'WAITLIST: ' : ''}${Brand.APP_NAME} - ${Name}`
  const description = getEventMessage
    ? getEventMessage({ classInfo, formatDate })
    : `${title} at ${location} on ${moment(StartDateTime, 'YYYY-MM-DD HH:mm:ss').format(
        formatDate('MMMM D, YYYY'),
      )} from ${moment(StartDateTime, 'YYYY-MM-DD HH:mm:ss').format('h:mm A')} to ${moment(
        EndDateTime,
        'YYYY-MM-DD HH:mm:ss',
      ).format('h:mm A')} with ${trainerName}`
  return {
    ...(Platform.OS === 'android' ? { description } : { notes: description }),
    allDay: false,
    endDate,
    location,
    startDate,
    title,
  }
}

function handlePermissionResult(res: PermissionStatus): boolean | undefined {
  return res === RESULTS.GRANTED || res === RESULTS.LIMITED
    ? true
    : res === RESULTS.BLOCKED
      ? false
      : undefined
}

export const addToCalendar = async (
  bookedClasses: Partial<BookedClassInfo>[],
  buttonPressed: boolean = false,
): Promise<boolean> => {
  try {
    let permission = await getPermissionCalendar(true)
    if (permission) {
      setAction('deviceCalendars', { buttonPressed, events: bookedClasses, listVisible: true })
      return true
    } else {
      setAction('toast', { text: 'Full calendar access required. Update in phone settings.' })
      return false
    }
  } catch {
    return false
  }
}

// const calendarRationale = {
//   buttonPositive: 'Continue',
//   buttonNegative: `Don't Allow`,
//   message: `${Brand.APP_NAME} would like access to your calendar to add upcoming bookings and remove cancelled bookings.`,
//   title: 'Calendar Access',
// } as const

export async function getPermissionCalendar(
  request: boolean = false,
): Promise<boolean | undefined> {
  let permission
  try {
    if (request) {
      const res = await Calendar.requestPermissions(false)
      permission = res === 'undetermined' ? undefined : res === 'authorized'
    } else {
      const res = await Calendar.checkPermissions(false)
      permission = res === 'undetermined' ? undefined : res === 'authorized'
    }
    return permission
  } catch {
    return false
  }
}

export async function checkForExistingCalendarEntries(event: Partial<BookedClassInfo>) {
  const { EndDateTime = '', Location, Name = '', StartDateTime = '' } = event
  const { TimeZone = '' } = Location ?? {}
  try {
    const granted = await getPermissionCalendar()
    if (granted) {
      const startDate = moment
        .utc(momentTimezone.tz(StartDateTime, 'YYYY-MM-DD HH:mm:ss', TimeZone))
        .toISOString()
      const endDate = moment
        .utc(momentTimezone.tz(EndDateTime, 'YYYY-MM-DD HH:mm:ss', TimeZone))
        .toISOString()
      const events = await Calendar.getEvents(startDate, endDate)
      const existingEvents = events.filter((e) => e.title === `${Brand.APP_NAME} - ${Name}`)
      return existingEvents
    }
  } catch (e) {
    logError(e)
  }
}

export async function removeEventFromCalendar(eventId: string) {
  try {
    await Calendar.removeEvent(eventId)
  } catch {
    return
  }
}

// Can be replaced by Promise.allSettled when added to Promise
export function allSettled(promises: Array<Promise<any>>): Promise<Array<any>> {
  let wrappedPromises = promises.map((p: any) =>
    Promise.resolve(p).then(
      (val) => ({ status: 'fulfilled', value: val }),
      (err) => ({ status: 'rejected', reason: err }),
    ),
  )
  return Promise.all(wrappedPromises)
}

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  units: turfHelpers.Units = 'miles',
): any => {
  const line = turfHelpers.lineString([
    [lng1, lat1],
    [lng2, lat2],
  ])
  return turfLength(line, { units })
}

export async function cancelReservation(params: CancelReservationParams) {
  const { item, onRefresh, type } = params
  const { ClientID, PersonID, VisitRefNo, WaitlistEntryID } = item
  const UserStatus = 'UserStatus' in item ? item.UserStatus : undefined
  try {
    setAction('loading', { loading: true })
    let response = null
    if (type === 'appointment') {
      const data = { AppointmentID: VisitRefNo ?? 0, ClientID: ClientID ?? 0, PersonID }
      response = await API.deleteAppointmentBooking(data)
    } else {
      const data = {
        ClientID: ClientID ?? 0,
        PersonID,
        VisitRefNo: VisitRefNo ?? UserStatus?.VisitRefNo ?? 0,
        WaitlistEntryID: WaitlistEntryID ?? UserStatus?.WaitlistEntryID ?? 0,
      }
      if (type === 'class') {
        response = await API.deleteClassBooking(data)
      } else {
        response = await API.deleteWaitlistSpot(data)
      }
    }
    if (response.code === 200) {
      await logEvent(`confirm_cancellation_${type}`)
      try {
        const calendarEvents = await checkForExistingCalendarEntries(item)
        if (calendarEvents != null) {
          for (const event of calendarEvents) {
            await removeEventFromCalendar(event.id)
          }
        }
      } catch (e) {
        logError(e)
      } finally {
        onRefresh(item)
      }
    } else {
      cleanAction('loading')
      setAction('toast', { text: response?.message ?? 'Unable to cancel your reservation.' })
    }
  } catch (e: any) {
    logError(e)
    cleanAction('loading')
    setAction('toast', { text: 'Unable to cancel reservation.' })
  }
}

export function checkClassSpots(
  classInfo: Partial<BookingDetailsState> | null | undefined,
  navigate: Navigate,
  workshops?: boolean,
) {
  cleanAction('loading')
  let bookingDetails = classInfo
  if (bookingDetails == null) {
    bookingDetails = getState().bookingDetails
    setAction('bookingDetails', { modalFamilySelector: false })
  }
  const { Layout = [], NoSpotsAvailable } = bookingDetails?.Layout ?? {}
  const { isClassFull } = bookingDetails?.Status ?? {}
  const goToSpots = Brand.UI_PICK_SPOT && Layout?.length > 0 && !NoSpotsAvailable && !isClassFull
  if (goToSpots) {
    workshops
      ? navigate('Workshops', { screen: 'WorkshopsBookingSpot' })
      : navigate('ClassSchedule', { screen: 'ClassBookingSpot' })
  } else {
    navigate('ClassSchedule', { screen: 'ClassBooking' })
  }
}

export function checkInformationRequired(requiredInfo: InformationRequired | null) {
  const { AddressRequired, BillingInfo, EmergencyContact, MissingFields = [] } = requiredInfo ?? {}
  if (AddressRequired || BillingInfo || EmergencyContact || MissingFields.length > 0) {
    return requiredInfo
  }
  return null
}

export async function checkInitialLink(navigate: Navigate, loggedIn: boolean) {
  let initialUrl = null
  try {
    const initialMessage = await messaging().getInitialNotification()
    initialUrl = await Linking.getInitialURL()
    if (initialUrl != null) {
      setAction('appLink', { url: initialUrl })
      onHandleAppLink({ navigate, url: initialUrl })
    } else {
      if (
        initialMessage != null &&
        !handlePushNotification({ navigate, notification: initialMessage })
      ) {
        return
      }
      if (loggedIn) {
        navigate('Home')
      } else {
        navigate('Auth')
      }
    }
  } catch (e: any) {
    logError(e)
    if (initialUrl != null) {
      onHandleAppLink({ navigate, url: initialUrl })
    } else {
      if (loggedIn) {
        navigate('Home')
      } else {
        navigate('Auth')
      }
    }
  }
}

export const cleanImageCache = ImageCaching.cleanImageCache

type FetchBookingsParams = {
  apiParams: APIGetUserClassesParams
  hasUpcomingFriendBookings: boolean
}

export async function fetchBookings(params: FetchBookingsParams) {
  const { apiParams, hasUpcomingFriendBookings = false } = params
  const { PastOnly } = apiParams
  let allClasses: BookedClassInfo[] = []
  let allFamily: { [key: string]: Partial<FamilyMember> } = {}
  let fitMetrixData: Array<FitMetrixData> = []
  try {
    setAction('loading', { loading: true })
    let apiRequests = [
      API.getUserClasses(apiParams)
        .then((res) => res)
        .catch((e) => e),
    ]
    if (Brand.UI_FAMILY_BOOKING) {
      apiRequests.push(
        API.getUserFamilyClasses(apiParams)
          .then((res) => res)
          .catch((e) => e),
      )
    }
    if (hasUpcomingFriendBookings) {
      apiRequests.push(
        API.getFriendsBookings()
          .then((res) => res)
          .catch((e) => e),
      )
    }
    let responses = await allSettled(apiRequests)
    const myResponse = responses[0]
    const familyResponse = Brand.UI_FAMILY_BOOKING ? responses[1] : undefined
    const friendResponse = !Brand.UI_FAMILY_BOOKING ? responses[1] : responses[2]
    if (PastOnly && Brand.UI_FITMETRIX_STATS) {
      let fitMetrixResponse = await API.getFitMetrixData({ Sort: 'desc' })
      if (Array.isArray(fitMetrixResponse)) {
        fitMetrixData = fitMetrixResponse
      }
    }
    // Process user classes
    if (myResponse.status === 'fulfilled' && Array.isArray(myResponse.value)) {
      for (const item of myResponse.value) {
        let updatedItem = { ...item, hideFamilyTag: !Brand.UI_FAMILY_BOOKING }
        const { FirstName, LastName, PersonID } = updatedItem
        if (allFamily[`${FirstName}${LastName}${PersonID}`] == null) {
          allFamily[`${FirstName}${LastName}${PersonID}`] = { FirstName, LastName, PersonID }
        }
        if (fitMetrixData.length > 0) {
          const fitData = fitMetrixData.find(
            (d) =>
              d.ClientID === updatedItem.ClientID &&
              d.LocationID === updatedItem.LocationID &&
              d.RegistrationID === updatedItem.RegistrationID &&
              d.VisitRefNo === updatedItem.VisitRefNo,
          )
          if (fitData != null) {
            allClasses.push({ ...updatedItem, FitMetrixData: fitData })
          } else {
            allClasses.push(updatedItem)
          }
        } else {
          allClasses.push(updatedItem)
        }
      }
    }
    // Process family classes
    if (
      familyResponse != undefined &&
      familyResponse.status === 'fulfilled' &&
      Array.isArray(familyResponse.value)
    ) {
      for (const member of familyResponse.value) {
        if (Array.isArray(member)) {
          if (member[0] != null) {
            const { FirstName, LastName, PersonID } = member[0]
            if (allFamily[`${FirstName}${LastName}${PersonID}`] == null) {
              allFamily[`${FirstName}${LastName}${PersonID}`] = { FirstName, LastName, PersonID }
            }
          }
          for (const classInfo of member) {
            allClasses.push({ ...classInfo, hideFamilyTag: false })
          }
        }
      }
    }
    // Process friend classes
    if (
      friendResponse != undefined &&
      friendResponse.status === 'fulfilled' &&
      Array.isArray(friendResponse.value.Classes)
    ) {
      for (const item of friendResponse.value.Classes) {
        const { FirstName, LastName, PersonID } = item
        if (allFamily[`${FirstName}${LastName}${PersonID}`] == null) {
          allFamily[`${FirstName}${LastName}${PersonID}`] = { FirstName, LastName, PersonID }
        }
        allClasses.push({ ...item, hideFamilyTag: false })
      }
    }
    allClasses.sort((a, b) => {
      const aFormatted = momentTimezone
        .tz(a.StartDateTime, a.TimeZone.timezone ?? a.TimeZone)
        .valueOf()
      const bFormatted = momentTimezone
        .tz(b.StartDateTime, b.TimeZone.timezone ?? b.TimeZone)
        .valueOf()
      if (aFormatted < bFormatted) {
        return PastOnly ? 1 : -1
      } else if (aFormatted > bFormatted) {
        return PastOnly ? -1 : 1
      }
      return 0
    })
  } catch (e: any) {
    logError(e)
    setAction('toast', { text: 'Unable to get classes.' })
  } finally {
    return { classes: allClasses, family: Object.values(allFamily) }
  }
}

type FetchClassesData = Partial<Omit<CurrentFilterState, 'endTime' | 'startTime'>> & {
  ClientID?: number
  CountOnly?: boolean
  endDate?: string
  endTime?: number | string
  FutureOnly?: boolean
  hideLoader?: boolean
  similarClassesAs?: string
  startTime?: number | string
  workshops?: boolean
}

export const fetchClasses = async (
  data: FetchClassesData,
): Promise<{ ClassCount: number } | Array<ClassInfo> | undefined> => {
  const {
    classTypes = [],
    ClientID,
    coaches = [],
    CountOnly = false,
    endDate = '',
    endTime = Brand.DEFAULT_FILTER_END_TIME,
    FutureOnly = false,
    hideLoader = false,
    locations = [],
    similarClassesAs,
    startDate,
    startTime = Brand.DEFAULT_FILTER_START_TIME,
    workshops,
  } = data
  !hideLoader && setAction('loading', { loading: true })
  try {
    let params = {
      ...(ClientID != null ? { ClientID } : {}),
      ...(similarClassesAs ? { similarClassesAs } : {}),
      ...(workshops ? { workshopsOnly: true } : { excludeWorkshops: true }),
      ClassType: classTypes,
      CoachID: coaches,
      EndDate: endDate !== '' ? moment(`${endDate}`, 'YYYY-MM-DD').format('YYYY-MM-DD') : '',
      EndTime:
        endTime !== 0 && endTime != null
          ? String(endTime).length < 3
            ? formatTimeWithZeros(endTime)
            : endTime
          : '',
      FutureOnly,
      Locations: locations,
      StartDate: startDate !== '' ? moment(`${startDate}`, 'YYYY-MM-DD').format('YYYY-MM-DD') : '',
      StartTime:
        startTime !== 0 && startTime != null
          ? String(startTime).length < 3
            ? formatTimeWithZeros(startTime)
            : startTime
          : '',
    }
    if (CountOnly) {
      let response = await API.getClassCount(params)
      setAction('currentFilter', { classCount: response?.ClassCount ?? 0 })
      return response
    } else {
      let response = await API.getClasses(params)
      return response?.Classes || []
    }
  } catch (e: any) {
    logError(e)

    setAction('toast', { text: `Unable to get ${CountOnly ? 'class count' : 'classes'}` })
  } finally {
    !hideLoader && cleanAction('loading')
  }
}

export async function fetchClassFilters(lastUpdated?: string | null) {
  if (
    lastUpdated == null ||
    (lastUpdated != null && moment().isSameOrAfter(moment(lastUpdated).add(1, 'hours')))
  ) {
    try {
      let response = await API.getFilters()
      const { ClassTypes, Coaches = [], Friends = [] } = response
      mmkvStorage.set(
        STORAGE_KEYS.classFilters,
        JSON.stringify({
          classTypes: ClassTypes,
          coaches: Coaches.sort(sortProviders),
          friends: Friends,
          lastUpdated: moment().toISOString(),
        }),
      )
    } catch (e: any) {
      logError(e)
    }
  }
}

export const fetchImage = ImageCaching.fetchImage

export const formatCoachName = (data: FormatCoachName): string => {
  const { addWith, coach, lastInitialOnly = Brand.UI_COACH_LAST_INITIAL_ONLY } = data
  const { FirstName, LastName, Nickname, Type } = coach ?? {}
  let firstResult = FirstName ?? ''
  let lastResult =
    LastName != null
      ? lastInitialOnly && !/\p{Emoji}/u.test(LastName ?? '')
        ? LastName.substring(0, 1).toUpperCase()
        : LastName
      : ''
  if (Brand.UI_COACH_NICKNAME) {
    firstResult = Nickname || firstResult
    lastResult = ''
  }
  const finalResult =
    firstResult +
    (firstResult !== '' && lastResult !== '' ? ` ${lastResult}${lastInitialOnly ? '.' : ''}` : '')
  return addWith &&
    finalResult !== '' &&
    (Type === PROVIDER_TYPES.female || Type === PROVIDER_TYPES.male || Type == undefined)
    ? `w/ ${finalResult}`
    : finalResult
}

export const formatContacts = (data: Array<{ [key: string]: any }>, callback: any) => {
  let sortedData = [...data]
  sortedData.sort(function (a, b) {
    const aSort =
      a.lastName != null
        ? a.lastName.substring(0, 1).toLowerCase()
        : (a.firstName?.substring(0, 1)?.toLowerCase() ?? '')
    const bSort =
      b.lastName != null
        ? b.lastName.substring(0, 1).toLowerCase()
        : (b.firstName?.substring(0, 1)?.toLowerCase() ?? '')
    if (aSort < bSort) {
      return -1
    }
    if (aSort > bSort) {
      return 1
    }
    return 0
  })
  let sections: Array<{ data: Array<{ [key: string]: any }>; key: string; title: string }> = []
  if (sortedData.length === 1) {
    const key =
      sortedData[0].lastName != null
        ? sortedData[0].lastName.substring(0, 1).toUpperCase()
        : (sortedData[0].firstName?.substring(0, 1).toUpperCase() ?? '')
    if (sortedData[0].favorites === 1) {
      sections[0] = {
        data: [{ ...sortedData[0], favoriteList: true }],
        key: 'Favorites',
        title: 'Favorites',
      }
      sections[1] = { data: [sortedData[0]], key, title: key }
    } else {
      sections[0] = { data: [sortedData[0]], key, title: key }
    }
  } else if (sortedData.length > 1) {
    for (const contact of sortedData) {
      const { favorite, firstName, lastName } = contact
      const firstLetter =
        lastName != null
          ? lastName.substring(0, 1).toUpperCase()
          : (firstName?.substring(0, 1).toUpperCase() ?? '')
      if (favorite === 1) {
        if (sections[0]?.key === 'Favorites') {
          sections[0] = {
            data: [...sections[0].data, { ...contact, favoriteList: true }],
            key: 'Favorites',
            title: 'Favorites',
          }
        } else {
          sections.splice(0, 0, {
            data: [{ ...contact, favoriteList: true }],
            key: 'Favorites',
            title: 'Favorites',
          })
        }
      }
      const sectionIndex = sections.findIndex((s) => s.key === firstLetter)
      if (sectionIndex !== -1) {
        sections[sectionIndex] = {
          ...sections[sectionIndex],
          data: [...sections[sectionIndex].data, contact],
        }
      } else {
        sections.push({ data: [contact], key: firstLetter, title: firstLetter })
      }
    }
  }
  callback(sections)
}

export const formatCreditCard = (number: string): string => {
  let replacedNumber = number?.replace(/\D/g, '')
  let type = ''
  for (let key in cardRegex) {
    if (cardRegex[key as keyof typeof cardRegex].test(replacedNumber)) {
      type = key
      break
    }
  }
  const length = replacedNumber.length
  if (type === 'amex') {
    return (
      replacedNumber.substring(0, 4) +
      (length > 4 ? ' ' : '') +
      (length > 4 ? replacedNumber.substring(4, 10) : '') +
      (length > 10 ? ' ' : '') +
      (length > 10 ? replacedNumber.substring(10, 15) : '')
    )
  } else {
    return (
      replacedNumber.substring(0, 4) +
      (length > 4 ? ' ' : '') +
      (length > 4 ? replacedNumber.substring(4, 8) : '') +
      (length > 8 ? ' ' : '') +
      (length > 8 ? replacedNumber.substring(8, 12) : '') +
      (length > 12 ? ' ' : '') +
      (length > 12 ? replacedNumber.substring(12, 16) : '') +
      (length > 16 ? ' ' : '') +
      (length > 16 ? replacedNumber.substring(16, 19) : '')
    )
  }
}

export function formatDate(format: string, code?: string): string {
  const country = code ?? getState().user.Country ?? Brand.DEFAULT_COUNTRY
  const dayFirstCountry =
    country === 'AU' || country === 'BH' || country === 'GB' || country === 'NZ' || country === 'UK'
  switch (format) {
    case 'MMMM D, YYYY': {
      if (dayFirstCountry) {
        return 'D MMMM YYYY'
      } else {
        return 'MMMM D, YYYY'
      }
    }
    case 'MMM DD, YYYY': {
      if (dayFirstCountry) {
        return 'DD MMM YYYY'
      } else {
        return 'MMM DD, YYYY'
      }
    }
    case 'MMM D, YYYY': {
      if (dayFirstCountry) {
        return 'D MMM YYYY'
      } else {
        return 'MMM D, YYYY'
      }
    }
    case 'M/D/YY': {
      if (dayFirstCountry) {
        return 'D/M/YY'
      } else {
        return 'M/D/YY'
      }
    }
    case 'dddd, MMMM D [at] h:mma': {
      if (dayFirstCountry) {
        return 'dddd, D MMMM [at] h:mma'
      } else {
        return 'dddd, MMMM D [at] h:mma'
      }
    }
    case 'dddd, MMMM D': {
      if (dayFirstCountry) {
        return 'dddd, D MMMM'
      } else {
        return 'dddd, MMMM D'
      }
    }
    case 'dddd, MMM D': {
      if (dayFirstCountry) {
        return 'dddd, D MMM'
      } else {
        return 'dddd, MMM D'
      }
    }
    case 'dddd, MMMM D, YYYY': {
      if (dayFirstCountry) {
        return 'dddd, D MMMM, YYYY'
      } else {
        return 'dddd, MMMM D, YYYY'
      }
    }
    case '[on] dddd, MMMM D, YYYY': {
      if (dayFirstCountry) {
        return '[on] dddd, D MMMM, YYYY'
      } else {
        return '[on] dddd, MMMM D, YYYY'
      }
    }
    case 'ddd M/D': {
      if (dayFirstCountry) {
        return 'ddd D/M'
      } else {
        return 'ddd M/D'
      }
    }
    case 'M/D':
      if (dayFirstCountry) {
        return 'D/M'
      } else {
        return 'M/D'
      }
    default:
      return format
  }
}

export function formatDateBirthday(date: Date | null, country: string = 'US'): string {
  return date != null ? moment(date).format(formatDate('MMMM D, YYYY', country)) : 'Date of Birth'
}

export function formatDateFuture(format: string) {
  const usedInSentence = format.includes('[on]')
  return {
    sameDay: usedInSentence ? '[today]' : '[Today]',
    nextDay: usedInSentence ? '[tomorrow]' : '[Tomorrow]',
    nextWeek: formatDate(format) as string,
    sameElse: formatDate(format) as string,
  } as const
}

export const formatDateHistory = {
  sameDay: '[Today]',
  lastDay: '[Yesterday]',
  lastWeek: formatDate('M/D/YY') as string,
  sameElse: formatDate('M/D/YY') as string,
} as const

export function formatMarketSections<V extends Partial<Location>>(locations: V[]) {
  let markets: MarketSection<V>[] = []
  let objMap: { [key: string]: number | string | undefined } = {}
  let locationsWithSearchTerms: (V & { searchTerms: string[] })[] = []
  for (const loc of locations) {
    const {
      City = '',
      ClientID = 0,
      LocationID = 0,
      MarketName = '',
      Nickname = '',
      StateLong = '',
    } = loc
    const marketIndex = markets.findIndex((m) => m.id === loc[Brand.UI_CLASS_FILTERS_MARKET_KEY])
    const searchTerms = [City, MarketName, Nickname, ...(StateLong ? [StateLong] : [])]
    if (marketIndex !== -1) {
      let updatedSearchTerms = [...(markets[marketIndex].searchTerms ?? [])]
      if (!updatedSearchTerms.includes(City)) {
        updatedSearchTerms.push(City)
      }
      if (!updatedSearchTerms.includes(MarketName)) {
        updatedSearchTerms.push(MarketName)
      }
      if (!updatedSearchTerms.includes(Nickname)) {
        updatedSearchTerms.push(Nickname)
      }
      if (StateLong != null && !updatedSearchTerms.includes(StateLong)) {
        updatedSearchTerms.push(StateLong)
      }
      markets[marketIndex] = {
        ...markets[marketIndex],
        data: [...markets[marketIndex].data, loc].sort((a, b) =>
          sortByString({ a, b, key: 'Nickname' }),
        ),
        searchTerms: updatedSearchTerms,
      }
    } else {
      markets.push({
        data: [loc],
        id: loc[Brand.UI_CLASS_FILTERS_MARKET_KEY] ?? '',
        key: loc[Brand.UI_CLASS_FILTERS_MARKET_LABEL] ?? '',
        searchTerms,
        title: loc[Brand.UI_CLASS_FILTERS_MARKET_LABEL] ?? '',
      })
    }
    locationsWithSearchTerms.push({ ...loc, searchTerms })
    objMap[`${ClientID}-${LocationID}`] = loc[Brand.UI_CLASS_FILTERS_MARKET_KEY]
  }
  markets.sort((a, b) => sortByString({ a, b, key: 'title' }))
  return { locationMap: objMap, locationsWithSearchTerms, marketLocations: markets }
}

export const formatName = (firstName?: string | null, lastName?: string | null): string => {
  return (
    (firstName != null ? firstName : '') +
    (lastName != null ? (firstName != null ? ' ' : '') + lastName : '')
  )
}

export const formatNameWithLastInitial = (
  firstName?: string | null,
  lastName?: string | null,
  addWith?: boolean,
): string => {
  const firstResult = firstName != null ? firstName : ''
  const lastResult = lastName != null ? lastName.substring(0, 1).toUpperCase() : ''
  const finalResult =
    firstResult + (firstResult !== '' && lastResult !== '' ? ` ${lastResult}.` : '')
  return addWith && finalResult !== ''
    ? `${Brand.UI_COACH_IS_ROOM ? 'in' : 'w/'} ${finalResult}`
    : finalResult
}

export const formatPhoneNumber = (
  number: string,
  country: string = Brand.DEFAULT_COUNTRY,
): any | string => {
  const replacedNumber = number?.replace(/(?![*|#|+])\D/g, '') ?? ''
  if (replacedNumber.length <= 3) {
    return number
  }
  const correctCountry =
    country === ('UK' as CountryCode) ? ('GB' as CountryCode) : (country as CountryCode)
  const isSupported = isSupportedCountry(correctCountry)
  if (isSupported) {
    return new AsYouType(correctCountry).input(replacedNumber) ?? number
  }
  return number
}

export function formatSelectedMarketLocations<V extends Partial<Location>>(
  allLocations: V[],
  selectedLocations: string[],
) {
  let markets: MarketSection<V>[] = []
  for (const loc of selectedLocations) {
    const locationDetails = allLocations.find((l) => `${l.ClientID}-${l.LocationID}` === loc)
    if (locationDetails != null) {
      const marketIndex = markets.findIndex(
        (m) => m.id === locationDetails[Brand.UI_CLASS_FILTERS_MARKET_KEY],
      )
      if (marketIndex !== -1) {
        markets[marketIndex] = {
          ...markets[marketIndex],
          data: [...markets[marketIndex].data, locationDetails].sort((a, b) =>
            sortByString({ a, b, key: 'Nickname' }),
          ),
        }
      } else {
        markets.push({
          data: [locationDetails],
          id: locationDetails[Brand.UI_CLASS_FILTERS_MARKET_KEY] ?? '',
          key: `Selected${locationDetails[Brand.UI_CLASS_FILTERS_MARKET_LABEL]}`,
          searchTerms: locationDetails.Nickname != null ? [locationDetails.Nickname] : [],
          title: locationDetails[Brand.UI_CLASS_FILTERS_MARKET_LABEL] ?? '',
        })
      }
    }
  }
  markets.sort((a, b) => sortByString({ a, b, key: 'title' }))
  return markets
}

export const formatTimeWithZeros = (time: string | number): string => {
  let stringTime = String(time)
  if (stringTime.length === 1) {
    stringTime = '0' + stringTime
  }
  return `${stringTime}:00:00`
}

export async function getAppointmentPrebookInfo(
  item: AppointmentTimeSlot,
  multipleCheck: boolean = false,
  selectedFamilyMember: AppointmentBookingState['selectedFamilyMember'],
) {
  if (!multipleCheck) {
    setAction('loading', { loading: true })
  }
  try {
    let response = await API.createAppointmentPrebook({
      ClientID: item.ClientID,
      LocationID: item.LocationID,
      SessionTypeID: item.SessionTypeID,
      StartDateTime: item.StartDateTime,
      User: selectedFamilyMember,
    })
    const {
      code = 200,
      MembershipOptions = [],
      message,
      PackageCount = 0,
      Packages = [],
      PackageOptions = [],
    } = response
    let addOnsResponse: Array<AppointmentAddOn> | { code: number; message: string } = []
    if (code !== 200) {
      if (multipleCheck) {
        return null
      }
      cleanAction('appointmentBooking')
      setAction('toast', { text: message ?? 'Unable to fetch booking details', type: 'error' })
      return null
    }
    if (PackageCount === 0 && Brand.UI_PACKAGE_OPTIONS_BEFORE) {
      setAction('bookingDetails', { modalInfoPurchaseCredits: true })
      return null
    }
    if (response.AllowAddons) {
      addOnsResponse = await API.getAppointmentAddOns({
        ClientID: item.ClientID,
        CoachID: item.Coach.CoachID,
      })
    }
    let highlightedOptions: Array<AppointmentPackageOptions> = []
    let regularOptions: Array<AppointmentPackageOptions> = []
    for (const option of PackageOptions) {
      option.Highlight == 1 ? highlightedOptions.push(option) : regularOptions.push(option)
    }
    if (response.Packages && response.PackageOptions) {
      const requiredInfo = checkInformationRequired(response.InformationRequired)
      const bookingData = {
        addOns: Array.isArray(addOnsResponse) ? addOnsResponse : [],
        allowAddons: response.AllowAddons,
        allowNotes: response.AllowNotes,
        allowUnpaid: response.AllowUnpaid,
        informationRequired: requiredInfo,
        packageCount: response.PackageCount,
        packageOptions: [
          ...highlightedOptions,
          ...MembershipOptions.map((option) => ({ ...option, isMembership: true })),
          ...regularOptions,
        ],
        packages: Packages,
        timeSlots: [item],
      }
      if (!multipleCheck) {
        setAction('appointmentBooking', bookingData)
      }
      return bookingData
    } else {
      setAction('toast', { text: response.message ?? 'Unable to get session details.' })
      return null
    }
  } catch (e) {
    logError(e)
  } finally {
    if (!multipleCheck) {
      cleanAction('loading')
    }
  }
}

type ButtonStyleParams = {
  color: string
  disabled: boolean
  disabledStyling: boolean
  small: boolean
  textColor: ColorKeys | null | undefined
  themeStyle: ThemeStyle
  width: ViewStyle['width']
}

export const getButtonStyle = (
  data: ButtonStyleParams,
): {
  button: ViewStyle
  leftIcon: TextStyle
  loadingCircle: {
    backgroundColor: any
    borderRadius: any
    height: any
    marginHorizontal: any
    width: ViewStyle['width']
  }
  rightIcon: TextStyle
  text: TextStyle
} => {
  const { color, disabled, disabledStyling, small, textColor, themeStyle, width } = data
  const calculatedTextColor: ColorKeys =
    disabled && disabledStyling
      ? ('textWhite' as ColorKeys)
      : textColor != null
        ? textColor
        : (Brand.BUTTON_TEXT_COLOR as ColorKeys)
  const icon = {
    color: themeStyle[calculatedTextColor],
    fontSize: themeStyle.scale(small ? 9 : 16),
    opacity: disabled && disabledStyling ? 0.5 : 1,
    textAlign: 'center' as 'center',
  } as const
  return {
    button: {
      ...themeStyle.viewCentered,
      backgroundColor: color,
      borderColor: !small
        ? disabled
          ? themeStyle.darkGray
          : Brand.BUTTON_LARGE_BORDER_COLOR != null
            ? (themeStyle[Brand.BUTTON_LARGE_BORDER_COLOR as ColorKeys] ?? color)
            : undefined
        : Brand.BUTTON_SMALL_BORDER_COLOR != null
          ? (themeStyle[Brand.BUTTON_SMALL_BORDER_COLOR as ColorKeys] ?? color)
          : undefined,
      borderRadius: themeStyle.scale(small ? Brand.BUTTON_SMALL_RADIUS : Brand.BUTTON_LARGE_RADIUS),
      borderWidth: !small
        ? Brand.BUTTON_LARGE_BORDER_COLOR != null
          ? themeStyle.scale(1)
          : 0
        : Brand.BUTTON_SMALL_BORDER_COLOR != null
          ? themeStyle.scale(1)
          : 0,
      height: themeStyle.scale(small ? 31 : 61),
      overflow: 'hidden',
      paddingHorizontal: themeStyle.scale(12),
      width,
    },
    leftIcon: { ...icon, marginRight: themeStyle.scale(8) },
    loadingCircle: {
      backgroundColor: themeStyle[calculatedTextColor],
      borderRadius: themeStyle.scale(small ? 3 : 6),
      height: themeStyle.scale(small ? 6 : 12),
      marginHorizontal: themeStyle.scale(small ? 2 : 4),
      width: themeStyle.scale(small ? 6 : 12),
    },
    rightIcon: { ...icon, marginLeft: themeStyle.scale(8) },
    text: {
      color: themeStyle[calculatedTextColor as ColorKeys],
      fontFamily:
        themeStyle[(small ? Brand.BUTTON_SMALL_FONT : Brand.BUTTON_LARGE_FONT) as FontKeys],
      fontSize: themeStyle.scale(small ? 12 : Brand.BUTTON_LARGE_TEXT_SIZE),
      opacity: disabled && disabledStyling ? 0.6 : 1,
      textAlign: 'center' as 'center',
      textTransform: small
        ? (Brand.TRANSFORM_BUTTON_SMALL_TEXT as TextTransform)
        : (Brand.TRANSFORM_BUTTON_LARGE_TEXT as TextTransform),
    },
  }
}

export function getCurrentLocation(
  setUserLocation: (loc: { Latitude: number; Longitude: number }) => void,
  setLoading: (loading: boolean) => void,
) {
  Geolocation.getCurrentPosition(
    (loc) => {
      setUserLocation({ Latitude: loc.coords.latitude, Longitude: loc.coords.longitude })
    },
    () => {
      setLoading(false)
      cleanAction('loading')
      setAction('toast', { text: 'Unable to get your location.' })
    },
    { distanceFilter: 5, maximumAge: 0, timeout: 5000 },
  )
}

export async function getPhoneCalendars() {
  try {
    const permission = await getPermissionCalendar(true)
    if (permission) {
      const calendars = await Calendar.getCalendars()
      return calendars.filter((cal) => cal.allowsModifications)
    } else {
      setAction('toast', {
        text: 'Permission needed to access calendar. Permission can be granted in OS settings.',
      })
      return []
    }
  } catch (e) {
    logError(e)
    setAction('toast', { text: 'Unable to get your available calendars' })
    return []
  }
}

export function getFamilyMemberKey(item: Partial<FamilyMember> | BookedClassInfo): string {
  return `${item.FirstName}${item.LastName}${item.PersonID}`
}

export function getFitMetrixChartType(data: FitMetrixData): '' | 'rpm' {
  const {
    Zone0ptpTime,
    Zone1ptpTime,
    Zone2ptpTime,
    Zone3ptpTime,
    Zone4ptpTime,
    Zone0rpmTime,
    Zone1rpmTime,
    Zone2rpmTime,
    Zone3rpmTime,
    Zone4rpmTime,
  } = data
  const totalPTPTime =
    Number(Zone0ptpTime) +
    Number(Zone1ptpTime) +
    Number(Zone2ptpTime) +
    Number(Zone3ptpTime) +
    Number(Zone4ptpTime)
  const totalRPMTime =
    Number(Zone0rpmTime) +
    Number(Zone1rpmTime) +
    Number(Zone2rpmTime) +
    Number(Zone3rpmTime) +
    Number(Zone4rpmTime)
  if (totalRPMTime + totalPTPTime > 0) {
    return 'rpm'
  }
  return ''
}

export function getLocalImagePath(localPath: string): { path: string; rebuilt: boolean } {
  if (localPath.includes(FILE_LOCATIONS.cachedImages.folder)) {
    const stringParts = localPath.split(FILE_LOCATIONS.cachedImages.folder)
    return {
      path: `${FILE_PREFIX}${FILE_LOCATIONS.cachedImages.path}${stringParts[1]}`,
      rebuilt: true,
    }
  } else if (localPath.includes(FILE_LOCATIONS.pickedImages.folder)) {
    const stringParts = localPath.split(FILE_LOCATIONS.pickedImages.folder)
    return {
      path: `${FILE_PREFIX}${FILE_LOCATIONS.pickedImages.path}${stringParts[1]}`,
      rebuilt: true,
    }
  } else if (
    Platform.OS === 'android' &&
    (localPath.includes(pickedImagesFolderAndroid) || localPath.startsWith('file://'))
  ) {
    return { path: localPath, rebuilt: true }
  }
  return { path: localPath, rebuilt: false }
}

type PushNoteStatusParams = { getToken?: boolean; requestPermission?: boolean }

export async function getPushNotificationStatus(
  params?: PushNoteStatusParams,
): Promise<{ permission: boolean | undefined; token: string | null }> {
  const { getToken = false, requestPermission = false } = params ?? {}
  let permission
  let token = null
  try {
    if (requestPermission) {
      const { status } = await requestNotifications(['alert', 'badge', 'sound'])
      permission = handlePermissionResult(status)
    } else {
      const { status } = await checkNotifications()
      permission = handlePermissionResult(status)
    }
    if (permission && getToken) {
      if (Platform.OS === 'ios') {
        token = await messaging().getAPNSToken()
      } else {
        token = await messaging().getToken()
      }
    }
    setAction('user', { pushToken: token })
    return { permission, token }
  } catch {
    return { permission, token }
  }
}

type PrebookInfoParams = {
  navigate: Navigate
  onClose?: () => void
  selectedClass: { ClientID: number; RegistrationID: number } | ClassInfo
  selectedFamilyMember?: FamilyMember
  setModalFitMetrixBooking?: (arg1: boolean) => void
  setSelectedClass?: (arg1: { ClientID: number; RegistrationID: number } | ClassInfo) => void
  workshops?: boolean
}

export async function getPrebookInfo(params: PrebookInfoParams) {
  const {
    navigate,
    onClose,
    selectedClass,
    selectedFamilyMember,
    setModalFitMetrixBooking,
    setSelectedClass,
    workshops = false,
  } = params
  const { ClientID, RegistrationID } = selectedClass
  selectedFamilyMember != null && setAction('bookingDetails', { modalFamilySelector: false })
  setAction('loading', { loading: true })
  try {
    let apiParams = {
      ClientID,
      PersonClientID: selectedFamilyMember?.ClientID,
      PersonID: selectedFamilyMember?.PersonID,
      RegistrationID,
    }
    let response = await API.createClassPreBook(apiParams)
    const {
      code = 200,
      InformationRequired,
      MembershipOptions = [],
      message,
      PackageCount,
      Packages = [],
      PackageOptions = [],
      Status,
    } = response
    if (code !== 200) {
      cleanAction('loading')
      cleanAction('bookingDetails')
      setAction('toast', { text: message ?? 'Unable to fetch booking details', type: 'error' })
      return
    }
    const { allowFamilyBooking } = Status ?? {}
    if (PackageCount === 0 && Brand.UI_PACKAGE_OPTIONS_BEFORE) {
      cleanAction('loading')
      setAction('bookingDetails', { modalInfoPurchaseCredits: true })
      return
    }
    if (selectedFamilyMember != null) {
      cleanAction('bookingDetails')
    }
    if (Brand.UI_FITMETRIX_BOOKING && Packages.length > 0) {
      setSelectedClass && setSelectedClass(selectedClass)
      setModalFitMetrixBooking && setModalFitMetrixBooking(true)
      return
    }
    let highlightedOptions: Array<Pricing> = []
    let regularOptions: Array<Pricing> = []
    for (const option of PackageOptions) {
      option.Highlight == 1 ? highlightedOptions.push(option) : regularOptions.push(option)
    }
    const requiredInfo = checkInformationRequired(InformationRequired)
    setAction('bookingDetails', {
      ...response,
      Class: {
        ...response.Class,
        PersonClientID: selectedFamilyMember?.ClientID,
        PersonID: selectedFamilyMember?.PersonID ?? '',
      },
      familyBooking: selectedFamilyMember != null,
      informationRequired: requiredInfo,
      PackageOptions: [
        ...highlightedOptions,
        ...MembershipOptions.map((option) => ({ ...option, isMembership: true })),
        ...regularOptions,
      ],
      selectedFamilyMember,
      workshops,
    })
    if (allowFamilyBooking && selectedFamilyMember == null) {
      if (onClose) {
        onClose()
        setTimeout(() => setAction('bookingDetails', { modalFamilySelector: true }), 300)
      } else {
        setAction('bookingDetails', { modalFamilySelector: true })
      }
    } else {
      checkClassSpots(response, navigate, workshops)
    }
  } catch (e: any) {
    logError(e)
    cleanAction('loading')
    setAction('toast', { text: 'Unable to prepare your booking.' })
    selectedFamilyMember != null && setAction('bookingDetails', { modalFamilySelector: true })
  }
}

export function getScheduleDates(maxDate: string) {
  // Add days before today and days after max date that will be disabled but complete visible week
  const today = moment()
  const lastDay = moment(maxDate)
  const dayOfCurrentWeek = today.day()
  const lastWeekDiff = 6 - lastDay.day()
  let dateArray: { date: string; disabled: boolean }[] = []
  for (
    let i = -dayOfCurrentWeek;
    moment().add(i, 'days').isSameOrBefore(moment(maxDate).add(lastWeekDiff, 'days'), 'day');
    i++
  ) {
    const date = moment().add(i, 'days').format('YYYY-MM-DD')
    dateArray.push({
      date,
      disabled: moment(date).isBefore(today, 'days') || moment(date).isAfter(lastDay, 'days'),
    })
  }
  return dateArray
}

export function getTimeOfDay() {
  const currentTime = new Date()
  const hour = currentTime.getHours()
  const minute = currentTime.getMinutes()
  if (((hour === 4 && minute >= 30) || hour >= 5) && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  return 'Evening'
}

export function getUniqueId() {
  return uuidv4()
}

export function handlePushNotification({
  navigate,
  notification,
}: {
  navigate: RootNavigation['navigate']
  notification: FirebaseMessagingTypes.RemoteMessage | Notification | undefined
}): boolean {
  if (notification?.data != null) {
    const { data } = notification
    const id = getState().user.clientId
    if (data.clientId !== id) {
      return false
    }
    if (id != null && data.screen != null) {
      if (data.type === 'booking' && data.info != null) {
        cleanAction('bookingDetails')
        setAction('bookingDetails', data.info as { [key: string]: any })
      }
      navigate(data.screen as string)
      return true
    }
  }
  return false
}

export function humanizeDuration(seconds: number): string {
  const isHoursMode = seconds >= 3600
  let hours = Math.floor(seconds / 3600)
  let minutes = Math.floor(seconds / 60 - hours * 60)
  let secs = Math.floor(seconds - hours * 3600 - minutes * 60)
  return isHoursMode
    ? padWithZero(hours) + ':' + padWithZero(minutes) + ':' + padWithZero(secs)
    : padWithZero(minutes) + ':' + padWithZero(secs)
}

export function logError(e: any, details?: { [key: string]: any }) {
  if (
    __DEV__ ||
    e.message === 'Network request failed' ||
    e === 'TypeError: Network request failed' ||
    e.message === 'Network request timed out' ||
    e === 'TypeError: Network request timed out'
  ) {
    // eslint-disable-next-line no-console
    console.log(e)
  } else {
    if (details) {
      Sentry.withScope((scope) => {
        if (details.tag) {
          for (let [key, value] of Object.entries(details.tag)) {
            scope.setTag(key, value as string)
          }
        }
        if (details.extra) {
          for (let [key, value] of Object.entries(details.extra)) {
            scope.setExtra(key, value)
          }
        }
        Sentry.captureException(e)
      })
    } else {
      Sentry.captureException(e)
    }
  }
}

export async function logEvent(key: string, value: { [key: string]: any } = {}) {
  if (__DEV__) {
    return
  }
  const defaultEventParams = {
    deviceTypeId: getDeviceId(),
    platform: Platform.OS,
    version: getVersion(),
  } as const
  const allParams = { ...value, ...defaultEventParams } as const
  try {
    await analytics().logEvent(key, allParams)
    customLogging != null && customLogging({ key, logError, params: allParams })
  } catch (e: any) {
    logError(e)
  }
}

export async function logout(navigate: Navigate) {
  cleanAction('bookingDetails')
  cleanAction('currentFilter')
  cleanAction('dashboard')
  cleanAction('deviceCalendars')
  mmkvStorage.delete(STORAGE_KEYS.classFilters)
  cleanAction('user')
  navigate('Auth')
  await logEvent('logout')
}

export async function logUserContext(user: { clientId: number; personId: string }) {
  const { clientId, personId } = user
  Sentry.setUser({ id: personId })
  Sentry.setExtra('clientId', clientId)
  Sentry.setExtra('groupId', Config.GROUP_ID)
  await analytics().setUserId(`${clientId}-${personId}`)
}

export const openExternalLink = async (url: string, error?: string) => {
  try {
    await Linking.openURL(url)
  } catch {
    setAction('toast', { text: error ?? 'Cannot open external link.' })
  }
}

type AppLinkParams = { navigate: Navigate; url: string }

export const onHandleAppLink = async ({ navigate, url = '' }: AppLinkParams) => {
  const appLink = url.includes(Brand.LINK_BASE_URL)
  const urlNoApp = url.replace(Brand.LINK_BASE_URL, '')
  const endScreenIndex = urlNoApp.indexOf('?')
  let screen = null
  let params: Record<string, any> = {}
  if (endScreenIndex !== -1) {
    if (appLink) {
      screen = urlNoApp.substring(0, endScreenIndex)
    }
    const linkParams = urlNoApp.substring(endScreenIndex + 1, urlNoApp.length)
    params = qs.parse(linkParams)
  } else if (appLink) {
    screen = urlNoApp
  }
  if (screen != null) {
    if (screen === 'ChallengeSignup') {
      try {
        setAction('loading', { loading: true })
        let response = await API.getChallengeInfo({ ChallengeID: params.id })
        if ('Challenge' in response) {
          setAction('modals', { challengeSignup: { info: response, visible: true } })
        } else if (response.message != null) {
          setAction('toast', { text: response.message, type: 'error' })
        } else {
          throw new Error()
        }
      } catch {
        setAction('toast', { text: 'Unable to get challenge info.', type: 'error' })
      } finally {
        cleanAction('loading')
        return
      }
    }
    if (screen === 'WebView') {
      const { title, uri } = params
      setAction('modals', {
        webView: { title: decodeURIComponent(title), uri: decodeURIComponent(uri) },
      })
      return
    }
    const { user } = getState()
    try {
      const { auth } = params ?? {}
      if ((auth === 'true' && user.clientId != null) || auth == null) {
        const keys = Object.keys(params)
        if (keys.length > 0) {
          if (screen === Brand.UI_SCHEDULE_SCREEN) {
            let filters: Record<string, any> = {}
            for (const key of keys) {
              if (initialCurrentFilter[key as keyof typeof initialCurrentFilter] != null) {
                if (Array.isArray(initialCurrentFilter[key as keyof typeof initialCurrentFilter])) {
                  if (typeof params[key] === 'string' && params[key].includes(',')) {
                    filters = { ...filters, [key]: params[key].split(',') }
                  } else {
                    filters = { ...filters, [key]: [params[key]] }
                  }
                } else {
                  filters = {
                    ...filters,
                    [key]: key.toLowerCase().includes('date') ? params[key] : Number(params[key]),
                  }
                }
              }
            }
            cleanAction('currentFilter')
            setAction('currentFilter', filters)
            navigate(Brand.UI_SCHEDULE_SCREEN as ScheduleScreenNames)
          } else if (
            screen === 'ClassBooking' &&
            params.ClientID != null &&
            params.RegistrationID != null
          ) {
            getPrebookInfo({
              navigate,
              selectedClass: {
                ClientID: Number(params.ClientID),
                RegistrationID: Number(params.RegistrationID),
              },
            })
          } else {
            //@ts-ignore
            navigate(screen, params)
          }
        } else {
          //@ts-ignore
          navigate(screen, params)
        }
        cleanAction('appLink')
      } else {
        setAction('appLink', { url })
        navigate('Login')
      }
    } catch (e: any) {
      logError(e)
      user.clientId != null ? navigate('Home') : navigate('Auth')
    }
  } else if (!appLink) {
    openExternalLink(url)
  }
}

type MarketFilterSelectionData<V> = {
  allLocations: V[]
  section: MarketSection<V>
  selected: boolean
  selectedLocations: string[]
}

export function onHandleMarketFilterSelection<V extends Partial<Location>>(
  data: MarketFilterSelectionData<V>,
) {
  const { allLocations, section, selected, selectedLocations } = data
  const { id } = section
  let updatedLocations = [...selectedLocations]
  const sectionLocations = allLocations.filter(
    (loc) => loc[Brand.UI_CLASS_FILTERS_MARKET_KEY] === id,
  )
  if (selected) {
    updatedLocations = updatedLocations.filter(
      (loc) => !sectionLocations.some((l) => `${l.ClientID}-${l.LocationID}` === loc),
    )
  } else {
    const locationsToAdd = sectionLocations.filter(
      (loc) => !updatedLocations.some((l) => l === `${loc.ClientID}-${loc.LocationID}`),
    )
    updatedLocations = updatedLocations.concat(
      locationsToAdd.map((l) => `${l.ClientID}-${l.LocationID}`),
    )
  }
  return updatedLocations
}

export function onSearchMarketLocations<V extends Partial<Location>>(
  text: string,
  marketLocations: MarketSection<V>[],
) {
  const lowercaseText = text.toLowerCase()
  return marketLocations
    .filter((item) =>
      item.searchTerms.some((searchTerm) => searchTerm.toLowerCase().includes(lowercaseText)),
    )
    .map((s) => {
      const filteredLocations = s.data.filter(
        (c) =>
          (c.City ?? '').toLowerCase().includes(lowercaseText) ||
          (c.MarketName ?? '').toLowerCase().includes(lowercaseText) ||
          (c.Nickname ?? '').toLowerCase().includes(lowercaseText) ||
          (c.StateLong ?? '').toLowerCase().includes(lowercaseText),
      )
      if (filteredLocations.length > 0) {
        return { ...s, data: filteredLocations }
      }
      return null
    })
    .filter((fs) => fs != null)
}

export function onSearchProviders(text: string, providers: Coach[]) {
  const lowercaseText = text.toLowerCase()
  return providers.filter(
    (p) =>
      p.FirstName.toLowerCase().includes(lowercaseText) ||
      p.LastName.toLowerCase().includes(lowercaseText) ||
      p.Nickname.toLowerCase().includes(lowercaseText),
  )
}

export const padWithZero = (string: number): string => {
  return ('0' + string).slice(-2)
}

export function renderHTMLLinks({
  style,
  tnode,
  TDefaultRenderer,
  ...defaultRendererProps
}: any): JSX.Element | null {
  const { href } = tnode.attributes ?? tnode.attribs ?? {}
  const children = tnode.children
  // Ignore empty links.
  if (href == null && children.length === 0) {
    return null
  }
  const onPress = () => openExternalLink(href)
  if (children.length > 0) {
    return (
      <TDefaultRenderer {...defaultRendererProps} onPress={onPress} tnode={tnode}>
        <TChildrenRenderer tchildren={children} />
      </TDefaultRenderer>
    )
  } else {
    return (
      <Text onPress={onPress} style={style}>
        {href}
      </Text>
    )
  }
}

export async function saveToCalendar(classInfo: Partial<BookedClassInfo>, calendarId: string) {
  try {
    const formattedEvent = formatEventInfo(classInfo)
    await Calendar.saveEvent(
      formattedEvent.title,
      { ...formattedEvent, calendarId },
      { sync: true },
    )
    setAction('toast', {
      text: `This ${
        classInfo?.Type === 'appointment' ? 'appointment' : Brand.STRING_CLASS_TITLE_LC
      } has been added to your calendar.`,
      type: 'success',
    })
    return true
  } catch (e) {
    logError(e)
    return false
  }
}

export const searchContacts = async (text: string, callback: any) => {
  if (text.length > 1) {
    const contactsResponse = await API.searchContacts({ params: { q: text } })
    const { data } = contactsResponse
    if (data != null) {
      formatContacts(data, callback)
    }
  }
}

export const searchFriends = async (
  text: string,
  setLoading: (arg1: boolean) => void,
  callback: any,
) => {
  if (text.length > 1) {
    try {
      setLoading(true)
      const response = await API.searchFriends({ text })
      if (Array.isArray(response)) {
        callback(response)
      } else {
        callback([])
      }
      setLoading(false)
    } catch (e: any) {
      logError(e)
      callback([])
      setLoading(false)
    }
  }
}

export function sortAppointmentTimeSlots(a: AppointmentTimeSlot, b: AppointmentTimeSlot) {
  return moment(a.StartDateTime).isBefore(moment(b.StartDateTime), 'minutes')
    ? -1
    : moment(a.StartDateTime).isAfter(moment(b.StartDateTime), 'minutes')
      ? 1
      : a.Location.Nickname < b.Location.Nickname
        ? -1
        : a.Location.Nickname > b.Location.Nickname
          ? 1
          : a.Coach[Brand.UI_COACH_NICKNAME ? 'Nickname' : 'FirstName'] <
              b.Coach[Brand.UI_COACH_NICKNAME ? 'Nickname' : 'FirstName']
            ? -1
            : a.Coach[Brand.UI_COACH_NICKNAME ? 'Nickname' : 'FirstName'] >
                b.Coach[Brand.UI_COACH_NICKNAME ? 'Nickname' : 'FirstName']
              ? 1
              : 0
}

type StringSortParams = {
  a: { [key: string]: any }
  b: { [key: string]: any }
  key: string
  direction?: 'ascending' | 'descending'
}

export function sortByString({ a, b, key, direction = 'ascending' }: StringSortParams): number {
  return String(a[key]).localeCompare(String(b[key])) * (direction === 'descending' ? -1 : 1)
}

export function sortProviders(a: Coach, b: Coach) {
  if (Brand.UI_COACH_NICKNAME) {
    return a.Nickname < b.Nickname ? -1 : 1
  } else {
    return a.FirstName < b.FirstName
      ? -1
      : a.FirstName > b.FirstName
        ? 1
        : a.LastName < b.LastName
          ? -1
          : a.LastName < b.LastName
            ? 1
            : 0
  }
}

// Input Validation

export function validateConfirmPassword(
  text: string = '',
  password: string = '',
): { invalid: boolean; message: string } {
  if (text === '') {
    return { invalid: true, message: 'Required' }
  } else if (text == null || text.trim() === '' || !passwordRegex.test(text)) {
    return { invalid: true, message: 'Invalid' }
  } else if (password !== text) {
    return { invalid: true, message: 'Passwords do not match' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validateCreditCard(text: string = ''): { invalid: boolean; message: string } {
  if (text === '') {
    return { invalid: true, message: 'Required' }
  } else if (text == null || text.trim() === '') {
    return { invalid: true, message: 'Invalid' }
  } else {
    let valid = false
    const textNoSpaces = text.replace(/\s/g, '')
    const regExps = Object.keys(cardRegex)
    for (const exp of regExps) {
      if (cardRegex[exp as keyof typeof cardRegex].test(textNoSpaces)) {
        valid = true
        break
      }
    }
    if (valid) {
      return { invalid: false, message: '' }
    } else {
      return { invalid: true, message: 'Invalid' }
    }
  }
}

export function validateCreditCardExpMonth(text: string = '') {
  const monthNumber = Number(text)
  if (isNaN(monthNumber) || monthNumber <= 0 || monthNumber > 12) {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validateCreditCardExpYear(text: string = '') {
  const yearNumber = Number(text)
  if (isNaN(yearNumber) || yearNumber < new Date().getFullYear()) {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validateCVV(text: string = ''): { invalid: boolean; message: string } {
  if (text === '') {
    return { invalid: true, message: 'Required' }
  } else if (text == null || text.trim() === '' || !cvvRegex.test(text)) {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validateEmail(text: string = ''): { invalid: boolean; message: string } {
  if (text === '') {
    return { invalid: true, message: 'Required' }
  } else if (text == null || text.trim() === '' || !emailRegex.test(text)) {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validateExpiry(month: string, year: string): { invalid: boolean } {
  if (moment(year + '-' + month, 'YYYY-MM').isBefore(moment(), 'month')) {
    return { invalid: true }
  } else {
    return { invalid: false }
  }
}

export function validateMobile(
  text: string = '',
  country: string = Brand.DEFAULT_COUNTRY,
): { invalid: boolean; message: string } {
  const correctCountry = (country === 'UK' ? 'GB' : country) as CountryCode
  if (text === '' || text == null || text.trim() === '') {
    return { invalid: true, message: 'Required' }
  } else if (!isValidPhoneNumber(text, correctCountry)) {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validateMonth(text: string = ''): { invalid: boolean; message: string } {
  if (text == null || text.trim() == '') {
    return { invalid: true, message: 'Required' }
  } else if (
    text.length !== 2 ||
    !numberRegex.test(text) ||
    Number(text) < 1 ||
    Number(text) > 12
  ) {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validateDollarAmount(text: string = '', greaterThanZero: boolean = true) {
  const formattedText = text.replace(Brand.DEFAULT_CURRENCY, '')
  if (formattedText == null || formattedText.trim() == '') {
    return { invalid: true, message: 'Required' }
  } else if (
    !dollarAmountRegex.test(formattedText) ||
    (greaterThanZero && Number(formattedText) <= 0)
  ) {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validatePassword(text: string = ''): { invalid: boolean; message: string } {
  if (text === '') {
    return { invalid: true, message: 'Required' }
  } else if (text == null || text.trim().length < 6 || !passwordRegex.test(text)) {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validatePostalCode(
  text: string = '',
  country: string = Brand.DEFAULT_COUNTRY,
): { invalid: boolean; message: string } {
  if (text === '' || text == null || text.trim() === '') {
    return { invalid: true, message: 'Required' }
  } else {
    if (postalCodes.validate(country, text) === true) {
      return { invalid: false, message: '' }
    } else {
      return { invalid: true, message: 'Invalid' }
    }
  }
}

export function validateTextRequired(text: string = ''): { invalid: boolean; message: string } {
  if (text === '') {
    return { invalid: true, message: 'Required' }
  } else if (text == null || text.trim() === '') {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

export function validateYear(
  text: string = '',
  before?: boolean,
): { invalid: boolean; message: string } {
  if (text == null || text.trim() == '') {
    return { invalid: true, message: 'Required' }
  } else if (
    text.length !== 4 ||
    !numberRegex.test(text) ||
    (before
      ? !moment(text, 'YYYY').isSameOrBefore(moment(), 'year')
      : !moment(text, 'YYYY').isSameOrAfter(moment(), 'year'))
  ) {
    return { invalid: true, message: 'Invalid' }
  } else {
    return { invalid: false, message: '' }
  }
}

type InputValidationParams = {
  errorOnChange?: boolean
  fieldName?: string
  setError: (arg1: string) => void
  setInvalidFields: (arg1: Array<string> | ((arg1: Array<string>) => Array<string>)) => void
  setState: (arg1: string) => void
  text: string
  type:
    | 'address'
    | 'billingName'
    | 'birthdate'
    | 'cardCSC'
    | 'cardExpMonth'
    | 'cardExpYear'
    | 'cardNumber'
    | 'creditCard'
    | 'city'
    | 'email'
    | 'emergencyEmail'
    | 'emergencyName'
    | 'emergencyPhone'
    | 'emergencyRelationship'
    | 'firstName'
    | 'giftCardAmount'
    | 'lastName'
    | 'messageBody'
    | 'messageTitle'
    | 'mobile'
    | 'name'
    | 'password'
    | 'phone'
    | 'phoneNumber'
    | 'postalCode'
  validationParams?: string[]
}

export function validateTextOnChange(params: InputValidationParams) {
  const {
    errorOnChange = false,
    fieldName,
    setError,
    setInvalidFields,
    setState,
    text,
    type,
    validationParams = [],
  } = params
  let validateByType = validateTextRequired
  switch (type) {
    case 'cardCSC':
      validateByType = validateCVV
      break
    case 'cardExpMonth':
      validateByType = validateCreditCardExpMonth
      break
    case 'cardExpYear':
      validateByType = validateCreditCardExpYear
      break
    case 'cardNumber':
      validateByType = validateCreditCard
      break
    case 'email':
    case 'emergencyEmail': {
      validateByType = validateEmail
      break
    }
    case 'emergencyPhone':
    case 'mobile':
    case 'phoneNumber': {
      validateByType = validateMobile
      break
    }
    case 'giftCardAmount':
      validateByType = validateDollarAmount
      break
    case 'postalCode': {
      validateByType = validatePostalCode
      break
    }
    default:
      break
  }
  setState(text)
  const field = fieldName ?? type
  //@ts-ignore
  const { invalid, message } = validateByType(text, ...validationParams)
  if (invalid) {
    setInvalidFields((prev) => (!prev.includes(field) ? [...prev, field] : prev))
    if (errorOnChange) {
      setError(message)
    }
  } else {
    setInvalidFields((prev) => (prev.includes(field) ? prev.filter((p) => p !== field) : prev))
    setError('')
  }
}
