declare var __DEV__: boolean
declare type TextTransform = 'none' | 'capitalize' | 'uppercase' | 'lowercase' | undefined

declare type ActivePackage = {
  activeDate: string
  expDate: string
  pricingOptionName: string
  purchased: string
  totalRemaining: string
  type: string
  unbooked: string
}
declare type AddOn = {
  AdditionalFinePrint: string
  AddOnID?: number
  Count?: number
  Description: string
  Discount: string
  EyebrowText: string
  FinePrint: string
  Heading: string
  Includes: string
  Order: number
  PackageType: string
  Price: string
  PriceOverride: string
  ProductID: number
  ProductIDPrereq: number
  ProgramID: string
  PurchaseKeywordPrereq: string
  TaxIncluded: string
  TaxRate: string
  Type: string
  UrlCode: string
}
declare type APIAppointmentTimesArgs = {
  Date: string
  EndTime: string
  Locations: string
  NumPeople?: number
  SessionName: string
  ShowUTCTime?: boolean
  StartTime: string
}
declare type APIChallengeInfo = {
  Challenge: { Description: string; Id: number; Name: string }
  Locations: { ClientID: number; LocationID: number; Name: string; PersonID: string }[]
  User: {
    Avatar: string
    cellPhone: string
    clientID: string
    customerID: string
    dob: string
    email: string
    firstName: string
    groupID: string
    lastName: string
    locationID: string
    locationName: string
    middleName: string
    personID: string
  }
}
declare type APIGetUserClassesParams = {
  EndDate?: string
  FutureOnly?: boolean
  PastOnly?: boolean
  StartDate?: string
  Type?: string
}
declare type APIGiftCardPurchaseParams = {
  GiftCard: {
    CardValue: number
    ClientID: number
    DeliveryDate: string
    GiftCardID: number
    LayoutID: number
    LocationID: number
    Message: string
    RecipientEmail: string
    RecipientName: string
    RecipientPhone: string
  }
  UseCardOnFile: boolean
  User: {
    BillingAddress: string
    BillingCity: string
    BillingName: string
    BillingPostalCode: string
    BillingState: string
    ClientID: number
    CreditCardNumber: string
    CVV: string
    ExpMonth: string
    ExpYear: string
    PersonID: string
  }
}
declare type APIUserUpdateRequired = {
  AddressLine1?: string
  AddressLine2?: string
  Avatar?: { filename: string; name: string; type: string; uri: string }
  BirthDate?: string // YYYY-MM-DD,
  CardNumber?: string
  City?: string
  Country?: string
  Email?: string
  EmergencyContactInfoName?: string
  EmergencyContactInfoEmail?: string
  EmergencyContactInfoPhone?: string
  EmergencyContactInfoRelationship?: string
  ExpMonth?: string
  ExpYear?: string
  MobilePhone?: string
  PostalCode?: string
  State?: string
}
declare type APIYearInReview = {
  classMinutes?: number
  code?: number
  frequencyCopy?: string
  message?: string
  milestoneAchieved?: boolean | string
  mostFrequentedStudio?: ?string
  mostFrequentTimeOfDay?: string
  mostFrequentTimeofDayCopy?: string
  mostFrequentTimeofDayTimespan?: string
  mostFrequentTimeofDayTitle?: string
  numClassesHeader?: string
  numClassesLastYear?: number
  numClassesThisYear?: number
  numClassesVerbiage?: string | null
  numFriendsInvited?: number
  numStudiosVisited?: number
  topClassTime?: string
  topCoach?: string
  topCoachHeadshot?: string
  topLowerBodyFocus?: string
  topLowerBodyFocusCopy?: string
  topLowerBodyVisits?: number
  topSpot?: string
  topStudio?: string
  topStudioVisits?: number
  topUpperBodyFocus?: string
  topUpperBodyFocusCopy?: string
  topUpperBodyVisits?: number
  yearsMember?: number
  zodiacCopy?: string
  zodiacSign?: string
  zodiacSignImg?: string
}
declare type AppointmentAddOn = {
  AddonID: number
  CategoryID: number
  CategoryName: string
  Name: string
  NumDeducted: number
}
declare type AppointmentAvailableTime = {
  AppointmentID: number
  ClientID: number
  CoachID: number
  LocationID: number
  SessionTimes: { End: string; EndUTC?: string; Start: string; StartUTC: string }[]
  SessionTypeID: string
}
declare type AppointmentCoach = {
  Biography?: string | null
  ClientID: number
  CoachID: number
  FirstName: string
  Headshot: string | undefined
  LastName: string
  Nickname: string
  Type: 'Male' | 'Female' | 'Suite' | false
}
declare type AppointmentFiltersCategory = {
  Description: string
  id: string
  Name: string
  SessionTypes: AppointmentFiltersType[]
  SortOrder: string
}
declare type AppointmentFiltersType = {
  CategoryID: string
  SessionName: string
  SessionTypeID: string
  SortOrder: string
}
declare type AppointmentFiltersTypeSection = {
  category: AppointmentFiltersCategory
  data: AppointmentFiltersType[]
  title: string
}
declare type AppointmentLocation = { ClientID: number; LocationID: number; Nickname: string }
declare type AppointmentPackage = {
  Expires: string
  FinePrint: string
  ID: number
  Name: string
  Remaining: number
}
declare type AppointmentPackageOptions = Partial<Pricing> & {
  Name: string
  Price: string
  ProductID: string
  ProgramID: number
  TaxIncluded: string
  TaxRate: string
  TotalCharge: string
}
declare type AppointmentTimeSlot = Omit<AppointmentAvailableTime, 'SessionTimes'> & {
  Coach: Coach
  EndDateTime: string
  Location: Location
  SessionName: string
  StartDateTime: string
}
declare type Badge = {
  badgeDescription: string
  badgeID: number
  badgeName: string
  badgeStatus: number
  categoryID: number
  imgLargeURL: string
  imgOffURL: string
  imgOnURL: string
  shareText: string
  sortOrder: number
}
declare type BadgeGroup = {
  categoryDescription: string
  categoryName: string
  categoryID: number
  sortOrder: number
}
declare type BookedClassInfo = {
  bringFriendAvailable: boolean
  brivoAccess: boolean
  ClientID: number
  Coach: Coach
  EndDateTime: string
  FirstName: string
  FitMetrixData?: FitMetrixData
  GroupID: string
  hideFamilyTag?: boolean
  isCancellable: boolean
  IsLateCancel: boolean
  IsSpotAvailable: boolean
  IsWaitlist: boolean
  LastName: string
  Location: Location
  LocationID: number
  mboSiteID: number
  Name: string
  onlineBookingAvailable: boolean
  PackageID?: number
  PersonClientID?: ?number
  PersonID: string
  RegistrationID: number
  RoomName?: string
  showSelfieTool?: boolean
  Spot?: {
    SpotID: number
    Label: string
  }
  StartDateTime: string
  Status: string
  TimeZone: { timezone: string; timezone_type: number }
  Type: string
  VirtualStreamLink: string
  VisitRefNo: number
  WaitlistEntryID: number
  WaitlistSpot: number
}
declare type BusinessInformation = {
  AdditionalInfo: string
  Address: string
  City: string
  ClientID: number
  Country: string
  Email: string
  GroupID: number
  Hours: Array<{ close: string; day: string; open: string }>
  LocationID: number
  Phone: string
  State: string
  Website: string
  Zip: string
}
declare type CancelReservationParams = {
  item: BookedClassInfo | ClassInfo
  onRefresh: (info: BookedClassInfo | ClassInfo) => void
  type: 'appointment' | 'class' | 'waitlist'
}
declare type ClassFilters = {
  classTypes: ClassType[]
  coaches: Coach[]
  friends: Array<{ [string]: any }>
  lastUpdated: ?string
  loading: boolean
}
declare type ClassInfo = {
  allowFamilyBooking: boolean
  Available: number
  Booked: number
  Capacity: number
  ClassType: number | string
  ClientID: number
  Coach: Coach
  Description: string
  displayFullMessage?: boolean
  EndDateTime: string
  InformationRequired: InformationRequired
  Location: Location
  LocationID: number
  mboSiteID: number
  Name: string
  onlineBookingAvailable: boolean
  PersonClientID?: ?number
  PersonID: string
  ProgramID: number
  RegistrationID: number
  ResourceName: ?string
  ShowSpotsAvailable?: boolean
  StartDateTime: string
  Status: string
  Substitute?: boolean
  UserStatus?: {
    isUserAvailable?: boolean
    isUserInClass: boolean
    isUserOnWaitlist: boolean
    VisitRefNo?: number
    WaitlistEntryID?: number
  }
  VisitRefNo: number
  WaitlistEntryID: number
}
declare type ClassLayoutLegend = Array<{ Type: string; Value: string }>
declare type ClassSpot = {
  Col: string
  Label: string
  Row: string
  SpotID: number
  Status: 'available' | 'empty' | 'unavailable'
  Type: ?string
}
declare type ClassType = {
  ClientID: ?number
  Description: string
  GroupID: ?string
  LocationID: ?number
  Name: string
  SortOrder: ?number
  TypeID: number
}
declare type ClientMissingInfo = {
  apiParam: string
  fieldType: 'birthdate' | 'creditCard' | 'email' | 'emergencyRelationship' | 'name' | 'phone'
  futureOnly?: boolean
  label: string
  pastOnly?: boolean
}
declare type Coach = {
  Biography?: ?string
  CellPhone: string
  ClientID: number
  CoachID: number
  Email: string
  FirstName: string
  GroupID: string
  Headshot?: string
  LastName: string
  LocationIDs?: number[]
  Nickname: string
  Title?: ?string
  Type: 'Male' | 'Female' | 'Suite' | false
}
declare type ContentLabel =
  | 'banners'
  | 'faqs'
  | 'privacypolicy'
  | 'refundpolicy'
  | 'termsconditions'
declare type CreatePurchaseParams = {
  RegistrationID?: number | undefined
  ClientID: number
  GiftCard?: string | undefined
  LocationID: number
  PersonClientID?: number | null | undefined
  PersonID?: string
  PromoCode?: string | undefined
  StartDate?: string
}
declare type FamilyMember = {
  ClientID: number
  DOB?: string
  Email?: string
  FirstName: string
  LastName: string
  PersonID: string
  profileKey?: string
}
declare type FitMetrixData = {
  AppointmentName: string
  AverageHeartRate: string
  AveragePower: string
  AverageSpeed: string
  AverageWatts: string
  BookingPriority: string
  CheckedIn: string
  ClassDuration: string
  ClientID: number
  Description: string
  DeviceID: string
  Distance: string
  Dob: null
  Email: string
  FirstName: string
  Gender: string
  GroupID: string
  HeartRateBreakdown: string
  InstructorFirstName: string
  InstructorLastName: string
  LastName: string
  LoanerDeviceID: string
  LocationID: number
  MaxHeartRate: string
  MinHeartRate: string
  MaxPower: string
  MaxSpeed: string
  MaxWatts: string
  Name: string
  PersonID: string
  ProfileAppointmentID: string
  ProfileID: string
  Ptp: string
  PtpStored: string
  Rank: string
  RegistrationID: number
  RpmBreakdown: string
  SpeedBreakdown: string
  SpotDeviceID: string
  SpotNumber: string
  StartDateTime: string
  TotalCalories: string
  TotalMinutes: string
  TotalPoints: string
  TotalRank: string
  VisitRefNo: number
  Waitlist: string
  WaitlistDateTime: string
  WaitlistPosition: string
  WattsBreakdown: string
  Weight: string
  Zone0Calories: string
  Zone0ptpTime: string
  Zone0rpmCalories: string
  Zone0rpmTime: string
  Zone0Time: string
  Zone1Calories: string
  Zone1ptpTime: string
  Zone1rpmCalories: string
  Zone1rpmTime: string
  Zone1Time: string
  Zone2Calories: string
  Zone2ptpTime: string
  Zone2rpmCalories: string
  Zone2rpmTime: string
  Zone2Time: string
  Zone3Calories: string
  Zone3ptpTime: string
  Zone3rpmCalories: string
  Zone3rpmTime: string
  Zone3Time: string
  Zone4Calories: string
  Zone4ptpTime: string
  Zone4rpmCalories: string
  Zone4rpmTime: string
  Zone4Time: string
}
declare type FormatCoachName = {
  addWith?: boolean
  coach: AppointmentCoach | Coach | undefined | null
  lastInitialOnly?: boolean
}
declare type Friend = {
  altPersonID: ?string
  avatar: ?string
  clientID: number
  displayName: string
  dob?: string
  email?: string
  existingRequestStatus: string
  firstName: string
  groupID: string
  hasClasses?: boolean
  lastName: string
  locationID: number
  locationName: string
  middleName: string
  personID: string
}
declare type FriendInfo = {
  BirthDate?: string
  CellPhone: string
  ClientID?: number
  DeliveryDate?: string
  Email: string
  FirstName: string
  LastName: string
  MessageBody?: string
  MessageTitle?: string
  PersonID?: string
}
declare type GiftCard = {
  ProductID: number
  Description: string
  CardValue: number
  SalePrice: number
  GiftCardTerms: string
  EditableByConsumer: boolean
  Layouts: {
    LayoutID: number
    LayoutName: string
    LayoutUrl: string
  }[]
}
declare type GiftCardFormatted = Omit<GiftCard, 'Layouts'> & GiftCard['Layouts'][number]
declare type InformationRequired = {
  AddressRequired: boolean
  BillingInfo: boolean
  CountryCode: string
  EmergencyContact: boolean
  MissingFields: ClientMissingInfo[]
  User: { ClientID: number; PersonID: string }
}
declare type Location = {
  Address: string
  AltName: string
  City: string
  ClientID: number
  Country: string
  Description: string
  Distance_Km?: string
  Distance_Mi?: string
  DoorCode?: string
  Email: string
  hasAppointments?: boolean
  hasFutureClasses?: boolean
  hideIfNoAppointments?: boolean
  hideIfNoClasses?: boolean
  Latitude: string
  LocationID: number
  Longitude: string
  MarketName: string
  mboSiteID: number
  Nickname: string
  Phone: string
  Slug: string
  SMSNumber?: string
  State: string
  StateLong: string
  Status: string
  TimeZone: string
  Virtual?: string
  Zip: string
}
declare type LoginOption = {
  CellPhone: string
  ClientID: number
  Email: string
  PersonID: string
  Type: string
}
declare type MarketSection<V> = {
  data: V[]
  id: number | string
  key: string
  searchTerms: string[]
  title: string
}
declare type MembershipContract = {
  AgreementDate: string
  AgreementTerms: string
  AutoRenewing: boolean
  BillingFrequency: string
  ClientContractID: number
  ClientID: number
  ContractEndDate: string
  ContractName: string
  ContractStartDate: string
  PersonID: string
}
declare type MembershipInfo = {
  AgreementDate: string
  ClientContractID: number
  ClientID: number
  ContractName: string
  ContractStartDate: string
  PersonID: string
}
declare type MuscleFocus = { Date: string; LowerBody: string; UpperBody: string }
declare type Package = {
  Expires: string
  FinePrint: string
  PackageID: number
  PackageName: string
  Remaining: number
}
declare type PerformanceActivity = {
  best: string
  label: string
  LastTested: string
  PersonalBest: string
  Results: Array<{ Result: string; TestingDate: string }>
}
declare type PerformanceLeaderboardResult = {
  ClientID: number
  FirstName: string
  isLoggedInUser: boolean
  LastInitial: string
  Location: string
  PersonID: string
  Rank: number
  Value: number | string
}
declare type PerformanceOverview = {
  best: string
  icon: string
  info: string
  label: string
  name: string
  sortOrder: string
}
declare type PIQStats = {
  AverageFTP: string
  AvgPower: string
  AvgRPM: number
  Calories: number
  ClassDate: string
  ClassName: string
  ClassTime: string
  ClientID: string
  Coach: Coach
  Distance: number
  DistanceUnit: string
  FTP: string
  GroupID: string
  HighPower: string
  HighRPM: number
  HRCalories: number | null | undefined
  Instructor: string
  LifetimeMaxPower: string
  LifetimeTotalDistance: string
  Location: string
  Percentile: string
  PersonID: string
  PowerIQ: number
  Rank: number
  Series: Array<{ class_time: number; power: number; rpm: number }>
  StatSource: 'piq' | 'gymlete'
  StartingSweetSpot: string
  SweetSpotZone1Range: string
  SweetSpotZone2Range: string
  SweetSpotZone3Range: string
  SweetSpotZone4Range: string
  TotalEnergy: number
  ZoneTimes?: { [zone: string]: { instructor: number; user: { [zone: string]: number } } }[]
}
declare type Pricing = {
  AdditionalFinePrint: string
  AllowChooseStartDateContract?: boolean
  Code: string
  Description: string
  Discount: string
  EyebrowText: string
  FinePrint: string
  Heading: string
  Highlight: number
  Includes: string
  isMembership?: boolean // Added client side to properly style list item
  Order: number
  PackageType: string
  Price: string
  PriceOverride: string
  ProductID: number
  ProductIDPrereq: ?number
  ProgramID: string
  StartDateOptions?: {
    AvailableDates?: string[]
    EndDate: string
    StartDate: string
    UnavailableDates?: string[]
  }
  TaxIncluded: string
  TaxRate: string
  TotalCharge: string
  Type: string
  UrlCode: string
}
declare type PricingGroup = {
  Description: string
  SortOrder: ?number
  Title: string
  Type: string
  TypeID: string
}
declare type Purchase = {
  ActiveDate: string
  ExpDate: string
  MarketName: string
  Name: string
  PackageID: string
  Purchased: string
  SaleID: number
  TotalRemaining: string
  Unbooked: string
}
declare type PurchaseDetails = {
  AgreementTerms?: string
  DiscountTotal: string
  GrandTotal: string
  IsMembership: boolean
  ProductDescription: string
  ProductID: number
  SubTotal: string
  SubTotalwithDiscount: string
  TaxTotal: string
}
declare type PurchaseTotalDetails = PurchaseDetails & {
  CardAmount: string
  Contract?: {
    FirstPaymentDiscount: string
    FirstPaymentSubtotal: string
    FirstPaymentTax: string
    FirstPaymentTotal: string
    RecurPaymentSubtotal: string
    RecurPaymentTax: string
    RecurPaymentTotal: string
    ContractAmountSubtotal: string
    ContractAmountTax: string
    ContractAmountTotal: string
  }
  GiftCardAmount?: string
  GiftCardBalance?: string
}
declare type Referral = {
  CampaignCode: string
  CampaignIntroText: string
  CampaignName: string
  GroupID: string
  LocationName: string
  OfferName: string
  Price: string
  ProductID: number
  ShowSchedule: boolean
  SMSLanguage: string
  TagDescription: string
  TagID: number
}
declare type ReferralLocation = {
  ClientID: number
  LocationID: number
  Name: string
  PersonID: string
}
declare type RewardsActivity = {
  ActivityTimestamp: string
  BonusPoints: number
  Description: string
  Points: number
  Timestamp: string
  TimestampUTC: string
  TotalPoints: number
  Type: string
}
declare type RewardsItemEarn = {
  Description: string
  Points: number
  Title: string
  Type: string
}
declare type RewardsItemLocation = {
  ClientID: number
  LocationID: number
  Name: string
  PersonID: string
}
declare type RewardsItemRedeem = {
  Description: string
  OptionID: number
  Points: number
  Title: string
  Type: string
  Who: 'friend' | 'self'
}
declare type RewardsSummary = {
  GaugeColor?: string
  Level?: string
  MoreInfoURL?: string
  NextLevelClasses?: number
  PointBalance?: number
  PointBalanceColor?: string
  RibbonColor?: string
  RibbonTextColor?: string
  SubLevel?: string
  SummaryImage?: string
  TotalClasses?: number
  TotalPointsEarned?: number
}
declare type Sale = {
  category: string
  clientContractID: ?number
  clientID: number
  dateTime: string
  description: string
  discount: number
  groupID: string
  locationID: number
  locationName: string
  patientID: string
  pmtMethod: string
  productID: number
  quantity: number
  saleID: number
  salesDetailID: number
  tax: number
  total: string
  units: number
}
declare type ScheduleScreenNames = 'ClassSchedule' | 'Workshops'
declare type Studio = {
  city?: string
  email?: string
  locationID?: string
  marketID?: string
  marketName?: string
  nickname?: string
  parking?: string
  phone?: string
  photo?: string
  state?: string
  street_address?: string
  zip?: string
}
declare type Survey = {
  className: string
  coachHeadshotSquare: ?string
  coachName: string
  date: string
  locationName: string
  time: string
}
declare type User = {
  ActivePackages: ActivePackage[]
  altPersonID: ?string
  avatar: ?string
  clientId: ?number
  Country?: string
  dob?: string
  email: string
  firstName: string
  hasFamilyOptions: boolean
  hasFutureAutopay: boolean
  hasPricingOptions: boolean
  hasUpcomingFriendBookings: boolean
  homeStudio: ?Location
  lastContactsUpload: ?string
  lastName: string
  liabilityReleased: boolean
  locationId: ?number
  marketName: string
  membershipInfo: MembershipInfo | undefined
  middleName?: string
  numAccounts: number
  personId: ?string
  photoUrl: string | undefined
  profileKey: ?string
  promptReview: boolean
  pushToken: ?string
  supportsAppointments: boolean
}
declare type UserBilling = {
  CardOnFile: { CardExp: string; CardImageUrl: string; CardLast4: string; CardType: string }
  CurrentBalance: string
}
declare type UserPackageDetails = {
  ClientID: number
  PersonID: string
  LocationName: string
  StartDateTime: string
  AppointmentStatus: string
  AppointmentDescription: string
}
declare type UserProfile = {
  altPersonID: string
  Avatar: string
  clientID: number
  dob: string
  email: string
  firstName: string
  groupID: string
  lastName: string
  locationID: number
  locationName: string
  middleName: string
  personID: string
}
declare type UsersProfile = {
  AddressLine1?: string
  AddressLine2?: string
  altPersonID?: ?string
  Avatar?: string
  BillingAddress?: string
  BillingCity?: string
  BillingState?: string
  BillingZip?: string
  BillingName?: string
  BirthDate?: string // YYYY-MM-DD
  clientID?: number
  City?: string
  dob?: string // YYYY-MM-DD
  email?: string
  EmergencyContactInfoName?: string
  EmergencyContactInfoEmail?: string
  EmergencyContactInfoPhone?: string
  EmergencyContactInfoRelationship?: string
  ExpMonth?: string // MM
  ExpYear?: string // YYYY
  firstName?: string
  Gender?: string // Male or Female
  groupID?: string
  LastFour?: string // XXXX
  lastName?: string
  locationID?: number
  middleName?: string
  MobilePhone?: string
  personID?: string
  PhotoUrl?: string
  State?: string
  Zip?: string
}

declare type VisitRatingInfo = {
  ClientID: number
  GroupID: string
  InstructorHeadshot: string
  InstructorID: number
  InstructorName: string
  LocationID: number
  LocationName: string
  Name: string
  PersonID: string
  StartDateTime: string
  VisitRefNo: number
}
declare type WorkoutCalendar = {
  Calendar: { Day: string; NumVisits: number }[]
  FirstLast: { FirstClass: string; LastClass: string }
}

// Reducers
declare type ActiveButtonState = { id: string }
declare type AppEnvState = { devMode: 'dev' | 'prod' }
declare type AppLinkState = { url: string | null }
declare type AppointmentBookingState = {
  addOns: Array<AppointmentAddOn>
  allowAddons: boolean
  allowFamilyBooking: boolean
  allowNotes: boolean
  allowUnpaid: boolean
  bookingComplete: boolean
  informationRequired: ?InformationRequired
  modalFamilySelector: boolean
  multiple: boolean
  notes: string
  packageCount: number
  packageOptions: (AppointmentPackageOptions | Pricing)[]
  packages: AppointmentPackage[]
  selectedFamilyMember: FamilyMember | undefined
  tempScheduleItem: AppointmentTimeSlot | undefined // Used to store the item that is being selected when family booking is enabled
  timeSlots: AppointmentTimeSlot[]
}
declare type AppointmentPreferencesState = {
  date: string
  endTime: number
  gender: string
  locations: { [key: string]: Location }
  providers: { [key: string]: Coach }
  startTime: number
  type: AppointmentFiltersType | undefined
}
declare type AppStatusState = {
  loginNeeded: boolean
  storePersisted: boolean
  updateNeeded: boolean
}
declare type BookingDetailsState = {
  Addons: Array<AddOn>
  Class: BookedClassInfo | ClassInfo | undefined
  ClientID?: ?number
  familyBooking: boolean
  informationRequired: ?InformationRequired
  Layout?: {
    ClientID: number
    Cols: string
    HasSpotsAvailable?: boolean
    Layout: Array<ClassSpot>
    Legend: ClassLayoutLegend
    LocationID: string
    NoSpotsAvailable?: boolean
    Rows: string
    Spots: string
  }
  modalFamilySelector: boolean
  modalInfoPurchaseCredits: boolean
  PackageCount: number
  PackageOptions: Pricing[]
  Packages: Package[]
  PersonID?: ?string
  selectedFamilyMember: ?FamilyMember
  SpotID?: ?number
  Status: Partial<{
    allowFamilyBooking: boolean
    isClassFull: boolean
    isUserAvailable: boolean
    isUserInClass: boolean
    isUserOnWaitlist: boolean
  }>
  workshops: boolean
}
declare type CachedDataState = { calendarEvents: {} }
declare type ClassToCancelState = CancelReservationParams | null
declare type CurrentFilterState = {
  classCount: number
  classTypes: Array<number>
  coaches: Array<string>
  endTime: number
  locations: Array<string>
  startDate: string
  startTime: number
}
declare type DashboardState = {
  buttonLink: string
  buttonText: string
  classHistory: boolean
  doorCode: boolean
  hasPackages: boolean
  hasUpcomingClass: boolean
  hasUpcomingWaitlist: boolean
  homeBody: string
  homeHeading1: string
  homeHeading2: ?string
  last30Visits: number
  location: { [string]: any }
  nextClass: { [string]: any }
  survey: ?string
  totalVisits: number
  welcomeMessage1: string
  welcomeMessage2: string
}
declare type DeviceCalendarsState = {
  autoAdd: boolean | undefined
  buttonPressed: boolean
  calendarId: string
  events: Partial<BookedClassInfo>[]
  listVisible: boolean
}
declare type DevModeState = {}
declare type ImagesState = { [remoteURL: string]: string }
declare type LoadingState = { loading: boolean; text: string }
declare type ModalsState = {
  addFamilyMember: boolean
  challengeSignup: { info: APIChallengeInfo | undefined; visible: boolean }
  contactUs: boolean
  webView: { title: string; uri: string }
}
declare type OneTimeMomentsState = { appReview: ?string; locationPermission: boolean }
declare type RewardsState = { enrolled: boolean; pointBalance: number }
declare type ScreensState = { currentScreen: string; previousScreen: string }
declare type ToastState = { text: string; type?: string }
declare type UserState = User

// Store State
declare type ReduxState = {
  activeButton: ActiveButtonState
  appEnv: AppEnvState
  appLink: AppLinkState
  appointmentBooking: AppointmentBookingState
  appointmentPreferences: AppointmentPreferencesState
  appStatus: AppStatusState
  bookingDetails: BookingDetailsState
  cachedData: CachedDataState
  classToCancel: ClassToCancelState
  currentFilter: CurrentFilterState
  dashboard: DashboardState
  deviceCalendars: DeviceCalendarsState
  images: ImagesState
  loading: LoadingState
  modals: ModalsState
  oneTimeMoments: OneTimeMomentsState
  rewards: RewardsState
  screens: ScreensState
  toast: ToastState
  user: User
}
