import NetInfo, { NetInfoState } from '@react-native-community/netinfo'
import moment from 'moment'
import * as React from 'react'
import { Animated, AppState, BackHandler, Keyboard, Platform } from 'react-native'
import { Calendar } from 'react-native-calendar-events'
import { FileSystem } from 'react-native-file-access'
import { request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions'
import { useSelector } from 'react-redux'
import { API } from './API'
import Brand from './Brand'
import { ThemeContextType, ThemeContext } from './Context'
import debounce from './Debounce'
import {
  fetchBookings,
  fetchClassFilters,
  fetchImage,
  getFamilyMemberKey,
  getLocalImagePath,
  getPermissionCalendar,
  getPhoneCalendars,
  getPushNotificationStatus,
  logError,
  logout,
  searchContacts,
  searchFriends,
} from './Functions'
import { cleanAction, getState, setAction } from '../redux/actions'

const debouncedContactsSearch = debounce(searchContacts, 400)
const debouncedFriendsSearch = debounce(searchFriends, 400)

export const useBackHandler = () => {
  React.useEffect(() => {
    const backListener = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => {
      backListener.remove()
    }
  }, [])
}

export function useCachedImage(
  source: unknown,
  setLoading?: (arg1: boolean) => void,
): string | undefined {
  const images = useSelector((state: ReduxState) => state.images)
  const isFetching = React.useRef(false)
  const retryCount = React.useRef(0)
  const [path, setPath] = React.useState<string | undefined>(undefined)
  const localPath = source != null && typeof source === 'string' ? images[source] : null
  React.useEffect(() => {
    if (source != null && typeof source === 'string') {
      const { path: newLocalPath, rebuilt } = getLocalImagePath(localPath ?? source)
      if (rebuilt) {
        setPath(newLocalPath)
        setLoading && setLoading(false)
        isFetching.current = false
        retryCount.current = 0
      } else {
        if (retryCount.current < 2 && !isFetching.current) {
          isFetching.current = true
          setLoading && setLoading(true)
          ;(async function getImage() {
            await fetchImage({ source })
            isFetching.current = false
            retryCount.current += 1
          })()
        }
      }
    }
  }, [localPath, source])
  return path
}

export function useCachedSVG(
  source: unknown,
  setLoading?: (arg1: boolean) => void,
): string | undefined {
  const images = useSelector((state: ReduxState) => state.images)
  const isFetching = React.useRef(false)
  const retryCount = React.useRef(0)
  const [xml, setXml] = React.useState<string | undefined>(undefined)
  const localPath = source != null && typeof source === 'string' ? images[source] : null
  React.useEffect(() => {
    if (source != null && typeof source === 'string') {
      const { path: newLocalPath, rebuilt } = getLocalImagePath(localPath ?? source)
      if (rebuilt) {
        ;(async function getFileContents() {
          const text = await FileSystem.readFile(newLocalPath)
          setXml(text)
          setLoading && setLoading(false)
          isFetching.current = false
          retryCount.current = 0
        })()
      } else {
        if (retryCount.current < 2 && !isFetching.current) {
          isFetching.current = true
          setLoading && setLoading(true)
          ;(async function getImage() {
            await fetchImage({ source })
            isFetching.current = false
            retryCount.current += 1
          })()
        }
      }
    }
  }, [localPath, source])
  return xml
}

export function useClientIdentifcation(): {
  altPersonID: string | null | undefined
  modalID: boolean
  onToggleModalID: () => void
} {
  const altPersonID = useSelector((state: ReduxState) => state.user.altPersonID)
  const [modalID, setModalID] = React.useState(false)
  const onToggleModalID = React.useCallback(() => {
    setModalID((prev) => !prev)
  }, [])
  return { altPersonID, modalID, onToggleModalID }
}

export function useFamilyClassFiltering(
  classes: Array<BookedClassInfo>,
  family: Array<Partial<FamilyMember>>,
): {
  filterApplied: boolean
  filteredClasses: Array<BookedClassInfo>
  modalFilterFamily: boolean
  onSelectFamilyMember: (item: Partial<FamilyMember>) => void
  onToggleFilterModal: () => void
  selectedFamily: Array<string>
  showFamilyTag: boolean
} {
  const currentUserName = useSelector((state: ReduxState) => {
    const { firstName, lastName } = state.user
    return `${firstName}${lastName}`
  })
  const [modalFilterFamily, setModalFilterFamily] = React.useState(false)
  const [selectedFamily, setSelectedFamily] = React.useState<Array<string>>(
    family.length > 0 ? family.map(getFamilyMemberKey) : [],
  )
  const onSelectFamilyMember = React.useCallback((item: Partial<FamilyMember>) => {
    const { FirstName, LastName, PersonID } = item
    setSelectedFamily((prev) => {
      let updatedMembers = [...prev]
      let familyIndex = updatedMembers.findIndex(
        (id) => id === `${FirstName}${LastName}${PersonID}`,
      )
      if (familyIndex !== -1) {
        updatedMembers.splice(familyIndex, 1)
      } else {
        updatedMembers.push(`${FirstName}${LastName}${PersonID}`)
      }
      return updatedMembers
    })
  }, [])
  const onToggleFilterModal = React.useCallback(() => {
    setModalFilterFamily((prev) => !prev)
  }, [])
  const filterApplied = Brand.UI_FAMILY_BOOKING && selectedFamily.length !== family.length
  const filteredClasses = React.useMemo(
    () => classes.filter((c) => selectedFamily.some((member) => member === getFamilyMemberKey(c))),
    [classes, selectedFamily],
  )
  React.useEffect(() => {
    setSelectedFamily(family.length > 0 ? family.map(getFamilyMemberKey) : [])
  }, [family])
  return {
    filterApplied,
    filteredClasses,
    modalFilterFamily,
    onSelectFamilyMember,
    onToggleFilterModal,
    selectedFamily,
    showFamilyTag:
      family.length > 1 ||
      (family.length === 1 && !getFamilyMemberKey(family[0]).includes(currentUserName)),
  }
}

export function useGetBookings(apiParams: APIGetUserClassesParams) {
  const hasUpcomingFriendBookings = useSelector(
    (state: ReduxState) => state.user.hasUpcomingFriendBookings,
  )
  const [classes, setClasses] = React.useState<BookedClassInfo[]>([])
  const [family, setFamily] = React.useState<Partial<FamilyMember>[]>([])
  const onFetchClasses = React.useCallback(async () => {
    const results = await fetchBookings({ apiParams, hasUpcomingFriendBookings })
    setClasses(results.classes)
    setFamily(results.family)
    cleanAction('loading')
  }, [apiParams, hasUpcomingFriendBookings])
  return { classes, family, onFetchClasses, setClasses }
}

// Used to preload class filters
export function useGetFilters(storePersisted: boolean) {
  const clientId = useSelector((state: ReduxState) => state.user.clientId)
  React.useEffect(() => {
    if (storePersisted) {
      fetchClassFilters()
    }
  }, [clientId, storePersisted])
}

export const useGetHomeData = (
  navigate: Navigate,
): {
  banners: any | Array<any>
  classes: Array<BookedClassInfo> | Array<any>
  clientId: number | null | undefined
  countData: {
    totalClasses: number | null | undefined
    totalLast30Days: number | null | undefined
    weekStreak: number
  }
  family: Array<Partial<FamilyMember>>
  firstName: string
  hasFamilyOptions: boolean
  homeLocation: Location | null | undefined
  lastName: string
  liabilityReleased: boolean
  loadingCounts: boolean
  membershipInfo: MembershipInfo | undefined
  onRefresh: () => Promise<void>
  personId: string | null | undefined
  ratingInfo: VisitRatingInfo | null | undefined
  setClasses:
    | ((
        arg1: ((arg1: Array<BookedClassInfo>) => Array<BookedClassInfo>) | Array<BookedClassInfo>,
      ) => void)
    | ((arg1: ((arg1: Array<any>) => Array<any>) | Array<any>) => void)
  setRatingInfo: (arg1?: VisitRatingInfo | null | undefined) => void
} => {
  const challengeModalVisible = useSelector(
    (state: ReduxState) => state.modals.challengeSignup.visible,
  )
  const user = useSelector((state: ReduxState) => state.user)
  const {
    clientId,
    firstName,
    hasFamilyOptions,
    homeStudio: homeLocation,
    lastName,
    liabilityReleased,
    membershipInfo,
    personId,
  } = user
  const [banners, setBanners] = React.useState<any[]>([])
  const [classes, setClasses] = React.useState<BookedClassInfo[]>([])
  const [countData, setCountData] = React.useState({
    totalClasses: 0,
    totalLast30Days: 0,
    weekStreak: 0,
  })
  const [family, setFamily] = React.useState<Partial<FamilyMember>[]>([])
  const [loadingCounts, setLoadingCounts] = React.useState(false)
  const [ratingInfo, setRatingInfo] = React.useState<any>(null)
  const onFetchClassCounts = React.useCallback(async () => {
    try {
      setAction('loading', { loading: true })
      setLoadingCounts(true)
      let response = await API.getHomeInfo()
      const {
        ActivePackages,
        hasFamilyOptions: familyOptions,
        hasFutureAutopay = false,
        hasPricingOptions,
        hasUpcomingFriendBookings = false,
        homeStudio,
        inRewardsProgram,
        liabilityReleased: releaseWaived = true,
        MembershipContract,
        numAccounts = 1,
        promptReview = false,
        ratingPending,
        rewardsBalance = 0,
        supportsAppointments,
        totalClasses = 0,
        totalClassesLast30 = 0,
        weekStreak = 0,
      } = response
      setAction('rewards', { enrolled: inRewardsProgram, pointBalance: rewardsBalance })
      setAction('user', {
        ActivePackages,
        Country: homeStudio?.Country ?? Brand.DEFAULT_COUNTRY,
        hasFamilyOptions: familyOptions,
        hasFutureAutopay,
        hasPricingOptions,
        hasUpcomingFriendBookings,
        homeStudio,
        liabilityReleased: releaseWaived,
        membershipInfo: MembershipContract,
        numAccounts,
        promptReview,
        supportsAppointments,
      })
      setCountData({ totalClasses, totalLast30Days: totalClassesLast30, weekStreak })
      setLoadingCounts(false)
      setRatingInfo(ratingPending)
      let contentResponse = await API.getContent({ Label: 'banners' }, true)
      if (Array.isArray(contentResponse)) {
        setBanners(contentResponse)
      }
      const { classes: classList, family: familyList } = await fetchBookings({
        apiParams: { FutureOnly: true, Type: 'Both' },
        hasUpcomingFriendBookings,
      })
      setClasses(classList)
      setFamily(familyList)
    } catch (e: any) {
      setAction('toast', { text: 'Unable to fetch class counts.' })
      logError(e)
      setLoadingCounts(false)
    } finally {
      cleanAction('loading')
    }
  }, [])
  const onRefresh = React.useCallback(async () => {
    onFetchClassCounts()
  }, [onFetchClassCounts])
  React.useEffect(() => {
    if (clientId != null && personId != null) {
      onFetchClassCounts()
    } else {
      logout(navigate)
    }
  }, [clientId, personId])
  React.useEffect(() => {
    return () => {
      if (challengeModalVisible) {
        onRefresh()
      }
    }
  }, [challengeModalVisible, onRefresh])
  return {
    banners,
    classes,
    clientId,
    countData,
    family,
    firstName,
    hasFamilyOptions,
    homeLocation,
    lastName,
    liabilityReleased,
    loadingCounts,
    membershipInfo,
    onRefresh,
    personId,
    ratingInfo,
    setClasses,
    setRatingInfo,
  }
}

export const useInternetListener = (storePersisted: boolean, navigation: RootNavigation) => {
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (storePersisted) {
        const currentScreen = getState().screens.currentScreen
        if (!state.isConnected) {
          navigation.navigate('Internet')
        } else if (currentScreen === 'Internet') {
          navigation.goBack()
        }
      }
    })
    return () => {
      unsubscribe && unsubscribe()
    }
  }, [storePersisted])
}

export const useKeyboardListener = (
  inverted?: boolean,
  offset?: number,
): { height: any; open: boolean } => {
  const height = React.useRef(new Animated.Value(0)).current
  const [open, setOpen] = React.useState(false)
  function onHideHandler(event: { duration: number }) {
    const { duration }: { duration: number } = event
    Animated.timing(height, {
      duration,
      toValue: 0,
      useNativeDriver: false,
    }).start(() => {
      setOpen(false)
    })
  }
  function onShowHandler(event: { duration: number; endCoordinates: { height: number } }) {
    const {
      duration = 0,
      endCoordinates,
    }: {
      duration: number
      endCoordinates: { height: number }
    } = event
    Animated.timing(height, {
      duration,
      toValue: endCoordinates.height * (inverted ? -1 : 1) + (offset ?? 0),
      useNativeDriver: false,
    }).start(() => {
      setOpen(true)
    })
  }
  React.useEffect(() => {
    const willShowListener = Keyboard.addListener('keyboardWillShow', onShowHandler)
    const willHideListener = Keyboard.addListener('keyboardWillHide', onHideHandler)
    const didShowListener = Keyboard.addListener('keyboardDidShow', onShowHandler)
    const didHideListener = Keyboard.addListener('keyboardDidHide', onHideHandler)
    return () => {
      willShowListener.remove()
      willHideListener.remove()
      didShowListener.remove()
      didHideListener.remove()
    }
  }, [])
  return { height, open }
}

export function useListCountries(): {
  countries: Array<{ Label: string; Value: string }>
  country: string
  selectedCountry: { Label: string; Value: string }
  setCountry: (arg1: ((arg1: string) => string) | string) => void
} {
  const [country, setCountry] = React.useState<string>(
    getState().user.Country ?? Brand.DEFAULT_COUNTRY,
  )
  const [countries, setCountries] = React.useState<{ Label: string; Value: string }[]>([])
  const selectedCountry = React.useMemo(() => {
    const index = countries.findIndex((c) => c.Value === country)
    if (index !== -1) {
      return countries[index]
    }
    return { Label: '', Value: '' }
  }, [countries, country])
  React.useEffect(() => {
    ;(async function getCountries() {
      try {
        let response = await API.getCountries()
        if (Array.isArray(response?.Countries)) {
          setCountries(response.Countries)
        } else {
          setAction('toast', { text: response.message })
        }
      } catch (e: any) {
        logError(e)
        setAction('toast', { text: 'Unable to fetch country list.' })
      }
    })()
  }, [])
  return { country, countries, selectedCountry, setCountry }
}

export function useListStates(country?: string | null): {
  selectedState: { Label: string; Value: string }
  setState: (arg1: ((arg1: string) => string) | string) => void
  state: string
  states: Array<{ Label: string; Value: string }>
} {
  const [state, setState] = React.useState<string>('')
  const [states, setStates] = React.useState<{ Label: string; Value: string }[]>([])
  const selectedState = React.useMemo(() => {
    const index = states.findIndex((c) => c.Value === state)
    if (index !== -1) {
      return states[index]
    }
    return { Label: '', Value: '' }
  }, [state, states])
  React.useEffect(() => {
    setState('')
    if (country != null) {
      ;(async function getStates() {
        try {
          let response = await API.getStates({ Country: country === 'UK' ? 'GB' : country })
          if (Array.isArray(response?.States)) {
            setStates(response.States)
          } else {
            setAction('toast', { text: response.message })
          }
        } catch (e: any) {
          logError(e)
          setAction('toast', { text: 'Unable to fetch states list.' })
        }
      })()
    }
  }, [country])
  return { selectedState, setState, state, states }
}

export function useLoadingDots(selfDisabled: boolean) {
  const circle1 = React.useRef(new Animated.Value(0)).current
  const circle2 = React.useRef(new Animated.Value(0)).current
  const circle3 = React.useRef(new Animated.Value(0)).current
  const animationLoop = Animated.loop(
    Animated.stagger(250, [
      Animated.sequence([
        Animated.timing(circle1, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(circle1, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(circle2, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(circle2, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(circle3, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(circle3, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]),
  )
  React.useEffect(() => {
    selfDisabled ? animationLoop.start() : animationLoop.stop()
    return function cleanup() {
      !selfDisabled && animationLoop.stop()
    }
  }, [selfDisabled])
  return { circle1, circle2, circle3 }
}

export const useLocationPermission = (
  locationMoment: boolean,
): {
  onCheckPermission: () => Promise<boolean>
  permission: boolean
} => {
  const [check, setCheck] = React.useState(false)
  const [permissions, setPermissions] = React.useState({
    coarse: false,
    fine: false,
    inUse: false,
  })
  const onRequestPermission = React.useCallback(async (permission: Permission) => {
    try {
      let results = await request(permission)
      if (results === RESULTS.GRANTED || results === RESULTS.LIMITED) {
        return true
      } else {
        return false
      }
    } catch (e: any) {
      return false
    }
  }, [])
  const onCheckPermission = React.useCallback(async () => {
    let coarse = false
    let fine = false
    let inUse = false
    if (Platform.OS === 'android') {
      fine = await onRequestPermission(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
      if (!fine) {
        coarse = await onRequestPermission(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION)
      }
      setPermissions((prev) => ({ ...prev, coarse, fine }))
    } else {
      inUse = await onRequestPermission(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
      setPermissions((prev) => ({ ...prev, inUse }))
    }
    setCheck(true)
    return coarse || fine || inUse
  }, [permissions])
  React.useEffect(() => {
    if (!check && locationMoment) {
      onCheckPermission()
    }
  }, [check, locationMoment, onCheckPermission])
  return {
    onCheckPermission,
    permission:
      Platform.OS === 'android' ? permissions.coarse || permissions.fine : permissions.inUse,
  }
}

export function useRefreshOnForeground(onRefresh: (arg1?: any) => Promise<any>) {
  React.useEffect(() => {
    const listener = AppState.addEventListener('change', (newState: string) => {
      if (newState === 'active') {
        onRefresh()
      }
    })
    return () => {
      listener.remove()
    }
  }, [onRefresh])
}

export function useSearchContacts(): {
  filteredContacts: any | Array<any>
  onSearchContacts: (text: string) => void
  searchText: string
} {
  const [filteredContacts, setFilteredContacts] = React.useState([])
  const [searchText, setSearchText] = React.useState('')
  const onSearchContacts = React.useCallback((text: string) => {
    setSearchText(text)
    if (text.trim() !== '') {
      debouncedContactsSearch(text, setFilteredContacts)
    } else {
      setFilteredContacts([])
    }
  }, [])
  return { filteredContacts, onSearchContacts, searchText }
}

export function useSearchFriends(): {
  filteredFriends: Array<any>
  loading: any | boolean
  onSearchFriends: (data: { setError: (arg1: string) => void; text: string }) => void
  searchText: string
  setFilteredFriends: (arg1: ((arg1: Array<any>) => Array<any>) | Array<any>) => void
  setSearchText: (arg1: ((arg1: string) => string) | string) => void
} {
  const [filteredFriends, setFilteredFriends] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')
  const onSearchFriends = React.useCallback(({ text }: { text: string }) => {
    setSearchText(text)
    if (text.trim() !== '') {
      debouncedFriendsSearch(text, setLoading, setFilteredFriends)
    } else {
      setFilteredFriends([])
    }
  }, [])
  return {
    filteredFriends,
    loading,
    onSearchFriends,
    searchText,
    setFilteredFriends,
    setSearchText,
  }
}

export function useSettings() {
  const [calendarList, setCalendarList] = React.useState<Calendar[]>([])
  const [loadingCalendars, setLoadingCalendars] = React.useState(true)
  const [permissionCalendars, setPermissionCalendars] = React.useState<boolean | undefined>()
  const [permissionNotifications, setPermissionNotifications] = React.useState<
    boolean | undefined
  >()
  async function checkAllPermissions() {
    const granted = await getPermissionCalendar()
    const { permission: pushNotesGranted } = await getPushNotificationStatus()
    setPermissionCalendars(granted)
    setPermissionNotifications(pushNotesGranted)
  }
  async function requestCalendarPermission() {
    const granted = await getPermissionCalendar(true)
    setPermissionCalendars(granted)
  }
  async function requestPushNotificationPermission() {
    const { permission: pushNotesGranted } = await getPushNotificationStatus({
      getToken: true,
      requestPermission: true,
    })
    setPermissionNotifications(pushNotesGranted)
  }
  React.useEffect(() => {
    const listener = AppState.addEventListener('change', async (newState) => {
      if (newState === 'active') {
        await checkAllPermissions()
      }
    })
    ;(async function checkPermission() {
      await checkAllPermissions()
    })()
    return () => {
      listener.remove()
    }
  }, [])
  React.useEffect(() => {
    if (permissionCalendars) {
      ;(async function getCalendars() {
        const list = await getPhoneCalendars()
        setCalendarList(list)
        setLoadingCalendars(false)
      })()
    } else {
      setLoadingCalendars(false)
    }
  }, [permissionCalendars])
  return {
    calendarList,
    loadingCalendars,
    permissionCalendars,
    permissionNotifications,
    requestCalendarPermission,
    requestPushNotificationPermission,
  }
}

export function useTheme(): ThemeContextType {
  return React.useContext(ThemeContext)
}

export const useTimingAnimation = (
  animationParams: {
    duration?: number
    toValue?: number
    useNativeDriver: boolean
  },
  toggle: boolean,
): Animated.Value => {
  const value = React.useRef(new Animated.Value(0)).current
  React.useEffect(() => {
    Animated.timing(value, {
      ...animationParams,
      toValue: toggle ? (animationParams.toValue ?? 1) : 0,
    }).start()
  }, [animationParams, toggle])
  return value
}

export function useUploadContacts(storePersisted: boolean) {
  const { lastContactsUpload, personId } = useSelector((state: ReduxState) => state.user)
  React.useEffect(() => {
    if (
      storePersisted &&
      Brand.UI_FRIENDS &&
      personId != null &&
      (lastContactsUpload == null || moment().isAfter(moment(lastContactsUpload).add(5, 'days')))
    ) {
      ;(async function contactsUpload() {
        try {
          let contactsPermission = await request(
            Platform.OS === 'android'
              ? PERMISSIONS.ANDROID.READ_CONTACTS
              : PERMISSIONS.IOS.CONTACTS,
            {
              buttonPositive: 'Continue',
              buttonNegative: `Don't Allow`,
              message: `${Brand.APP_NAME} would like to upload your contacts to its server to help build your friends list in app. Your data will not be shared with third party services. For more information, please review ${Brand.APP_NAME}'s Privacy Policy.`,
              title: 'Contacts Permission',
            },
          )
          if (contactsPermission === RESULTS.GRANTED || contactsPermission === RESULTS.LIMITED) {
            let res = await API.uploadContacts()
            if (res?.response != null) {
              let response = res.response
              if (typeof response === 'string') {
                response = JSON.parse(response)
              }
              if (response.code == 200) {
                setAction('user', { lastContactsUpload: moment().toISOString() })
              } else {
                setAction('toast', { text: res.response.message ?? 'Unable to upload contacts.' })
              }
            }
          }
        } catch (e: any) {
          logError(e)
          setAction('toast', { text: 'Unable to upload contacts.' })
        }
      })()
    }
  }, [lastContactsUpload, personId, storePersisted])
}
