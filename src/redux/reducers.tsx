import moment from 'moment'
import Brand from '../global/Brand'
import { PROVIDER_TYPES } from '../global/Constants'

export const initialActiveButton: ActiveButtonState = { id: '' }
export const initialAppEnv: AppEnvState = { devMode: 'prod' }
export const initialAppLink: AppLinkState = { url: null }
export const initialAppointmentBooking: AppointmentBookingState = {
  addOns: [],
  allowAddons: false,
  allowFamilyBooking: false,
  allowNotes: false,
  allowUnpaid: false,
  bookingComplete: false,
  informationRequired: null,
  modalFamilySelector: false,
  multiple: false,
  notes: '',
  packageCount: 0,
  packageOptions: [],
  packages: [],
  selectedFamilyMember: undefined,
  tempScheduleItem: undefined, // Used to store the item that is being selected when family booking is enabled
  timeSlots: [],
}
export const initialAppointmentPreferences: AppointmentPreferencesState = {
  date: moment().format('YYYY-MM-DD'),
  endTime: Brand.DEFAULT_FILTER_END_TIME,
  gender: PROVIDER_TYPES.all,
  locations: {},
  providers: {},
  startTime: Brand.DEFAULT_FILTER_START_TIME,
  type: undefined,
}
export const initialAppStatus: AppStatusState = {
  loginNeeded: false,
  storePersisted: false,
  updateNeeded: false,
}
export const initialBookingDetails: BookingDetailsState = {
  Addons: [],
  Class: undefined,
  familyBooking: false,
  informationRequired: null,
  modalFamilySelector: false,
  modalInfoPurchaseCredits: false,
  PackageCount: 0,
  PackageOptions: [],
  Packages: [],
  selectedFamilyMember: null,
  SpotID: null,
  Status: {},
  workshops: false,
}
export const initialCachedData: CachedDataState = { calendarEvents: {} }
export const initialClassToCancel: ClassToCancelState = null
export const cleanFilters = {
  classTypes: [] as Array<number>,
  coaches: [] as Array<string>,
  endTime: Brand.DEFAULT_FILTER_END_TIME,
  locations: [] as Array<string>,
  startTime: Brand.DEFAULT_FILTER_START_TIME,
} as const
export const initialCurrentFilter: CurrentFilterState = {
  ...cleanFilters,
  classCount: 0,
  startDate: '',
}
export const initialDashboard: DashboardState = {
  buttonLink: '',
  buttonText: '',
  classHistory: false,
  doorCode: false,
  hasPackages: false,
  hasUpcomingClass: false,
  hasUpcomingWaitlist: false,
  homeBody: '',
  homeHeading1: '',
  homeHeading2: null,
  last30Visits: 0,
  location: {},
  nextClass: {},
  survey: null,
  totalVisits: 0,
  welcomeMessage1: '',
  welcomeMessage2: '',
}
export const initialDeviceCalendars: DeviceCalendarsState = {
  autoAdd: undefined,
  buttonPressed: false,
  calendarId: '',
  events: [],
  listVisible: false,
}
export const initialImages: ImagesState = {}
export const initialLoadingState: LoadingState = { loading: false, text: '' }
export const initialModals: ModalsState = {
  addFamilyMember: false,
  challengeSignup: { info: undefined, visible: false },
  contactUs: false,
  webView: { title: '', uri: '' },
}
export const initialOneTimeMoments: OneTimeMomentsState = {
  appReview: null,
  locationPermission: false,
}
export const initialRewards: RewardsState = { enrolled: false, pointBalance: 0 }
export const initialScreens: ScreensState = { currentScreen: 'Splash', previousScreen: '' }
export const initialToast: ToastState = { text: '', type: 'danger' }
export const initialUser: UserState = {
  ActivePackages: [],
  altPersonID: null,
  avatar: null, // friend section avatar
  clientId: null,
  email: '',
  firstName: '',
  hasFamilyOptions: false,
  hasFutureAutopay: false,
  hasPricingOptions: false,
  hasUpcomingFriendBookings: false,
  homeStudio: null,
  lastContactsUpload: null,
  lastName: '',
  liabilityReleased: true,
  locationId: null,
  marketName: '',
  membershipInfo: undefined,
  numAccounts: 1,
  personId: null,
  photoUrl: undefined, // profile photo
  profileKey: null,
  promptReview: false,
  pushToken: null,
  supportsAppointments: false,
}

export function activeButton(
  state: ActiveButtonState = initialActiveButton,
  action: { payload?: Partial<ActiveButtonState>; type: string },
): ActiveButtonState {
  const { payload, type } = action
  switch (type) {
    case 'clean_activeButton':
      return initialActiveButton
    case 'set_activeButton':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function appEnv(
  state: AppEnvState = initialAppEnv,
  action: { payload?: Partial<AppEnvState>; type: string },
): AppEnvState {
  const { payload, type } = action
  switch (type) {
    case 'clean_appEnv':
      return initialAppEnv
    case 'set_appEnv':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function appLink(
  state: AppLinkState = initialAppLink,
  action: { payload?: Partial<AppLinkState>; type: string },
): AppLinkState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_appLink':
      return { ...initialAppLink, ...payload }
    case 'set_appLink':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function appointmentBooking(
  state: AppointmentBookingState = initialAppointmentBooking,
  action: { payload?: Partial<AppointmentBookingState>; type: string },
): AppointmentBookingState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_appointmentBooking':
      return { ...initialAppointmentBooking, ...payload }
    case 'set_appointmentBooking':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function appointmentPreferences(
  state: AppointmentPreferencesState = initialAppointmentPreferences,
  action: { payload?: Partial<AppointmentPreferencesState>; type: string },
): AppointmentPreferencesState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_appointmentPreferences':
      return { ...initialAppointmentPreferences, ...payload }
    case 'set_appointmentPreferences':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function appStatus(
  state: AppStatusState = initialAppStatus,
  action: { payload?: Partial<AppStatusState>; type: string },
): AppStatusState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_appStatus':
      return initialAppStatus
    case 'set_appStatus':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function bookingDetails(
  state: BookingDetailsState = initialBookingDetails,
  action: { payload?: Partial<BookingDetailsState>; type: string },
): BookingDetailsState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_bookingDetails':
      return { ...initialBookingDetails, ...payload }
    case 'set_bookingDetails':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function cachedData(
  state: CachedDataState = initialCachedData,
  action: { payload?: Partial<CachedDataState>; type: string },
): CachedDataState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_cachedData':
      return initialCachedData
    case 'set_cachedData':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function classToCancel(
  state: ClassToCancelState = initialClassToCancel,
  action: { payload?: ClassToCancelState; type: string },
): ClassToCancelState {
  const { payload = null, type } = action
  switch (type) {
    case 'clean_classToCancel':
      return initialClassToCancel
    case 'set_classToCancel':
      return payload
    default:
      return state
  }
}

export function currentFilter(
  state: CurrentFilterState = initialCurrentFilter,
  action: { payload?: Partial<CurrentFilterState>; type: string },
): CurrentFilterState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_currentFilter':
      return initialCurrentFilter
    case 'set_currentFilter':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function dashboard(
  state: DashboardState = initialDashboard,
  action: { payload?: Partial<DashboardState>; type: string },
): DashboardState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_dashboard':
      return initialDashboard
    case 'set_dashboard':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function deviceCalendars(
  state: DeviceCalendarsState = initialDeviceCalendars,
  action: { payload?: Partial<DeviceCalendarsState>; type: string },
): DeviceCalendarsState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_deviceCalendars':
      return initialDeviceCalendars
    case 'set_deviceCalendars':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function images(
  state: ImagesState = {},
  action: { payload?: Partial<ImagesState>; type: string },
): ImagesState {
  const { type } = action
  switch (type) {
    case 'clean_images':
      return {}
    case 'remove_images': {
      const payload = action.payload || {}
      const source = Object.keys(payload)[0]
      if (source != null) {
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          [source]: omit,
          ...newState
        }: {
          [key: string]: string
        } = state
        return newState
      }
      return state
    }
    case 'set_images': {
      const source = Object.keys(action.payload || {})[0]
      if (action.payload != null && source != null) {
        return { ...state, [source]: action.payload[source] ?? '' }
      }
      return state
    }
    default:
      return state
  }
}

export function loading(
  state: LoadingState = initialLoadingState,
  action: { payload?: Partial<LoadingState>; type: string },
): LoadingState {
  const { payload, type } = action
  switch (type) {
    case 'clean_loading':
      return initialLoadingState
    case 'set_loading':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function modals(
  state: ModalsState = initialModals,
  action: { payload?: Partial<ModalsState>; type: string },
): ModalsState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_modals':
      return initialModals
    case 'set_modals':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function oneTimeMoments(
  state: OneTimeMomentsState = initialOneTimeMoments,
  action: {
    payload?: Partial<OneTimeMomentsState>
    type: string
  },
): OneTimeMomentsState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_oneTimeMoments':
      return initialOneTimeMoments
    case 'set_oneTimeMoments':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function rewards(
  state: RewardsState = initialRewards,
  action: { payload?: Partial<RewardsState>; type: string },
): RewardsState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_rewards':
      return initialRewards
    case 'set_rewards':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function screens(
  state: ScreensState = initialScreens,
  action: { payload?: Partial<ScreensState>; type: string },
): ScreensState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_screens':
      return initialScreens
    case 'set_screens':
      return { ...state, ...payload }
    default:
      return state
  }
}

export function toast(
  state: ToastState = initialToast,
  action: { payload?: Partial<ToastState>; type: string },
): ToastState {
  const { payload, type } = action
  switch (type) {
    case 'clean_toast':
      return initialToast
    case 'set_toast':
      return { text: payload?.text ?? '', type: payload?.type ?? 'danger' }
    default:
      return state
  }
}

export function user(
  state: User = initialUser,
  action: { payload?: Partial<UserState>; type: string },
): UserState {
  const { payload = {}, type } = action
  switch (type) {
    case 'clean_user':
      return initialUser
    case 'set_user':
      return { ...state, ...payload }
    default:
      return state
  }
}

export const reducers = {
  activeButton,
  appEnv,
  appLink,
  appointmentBooking,
  appointmentPreferences,
  appStatus,
  bookingDetails,
  cachedData,
  classToCancel,
  currentFilter,
  dashboard,
  deviceCalendars,
  images,
  loading,
  modals,
  oneTimeMoments,
  rewards,
  screens,
  toast,
  user,
} as const

export type ReducerKeys = keyof typeof reducers
