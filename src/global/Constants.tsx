import moment from 'moment'
import { Platform } from 'react-native'
import { Dirs } from 'react-native-file-access'
import Brand from './Brand'

export const ANIMATION_DURATIONS = {
  overlayBackdropFade: 350,
  overlayContentTranslation: 350,
}
export const BILLING_INFO_FIELDS: ClientMissingInfo[] = [
  { apiParam: 'CardNumber', fieldType: 'creditCard', label: 'Card Number' },
]
// Regex Expressions
export const cardRegex = {
  electron: /^(4026|417500|4405|4508|4844|4913|4917)\d+$/ as RegExp,
  maestro: /^(5018|5020|5038|5612|5893|6304|6759|6761|6762|6763|0604|6390)\d+$/ as RegExp,
  dankort: /^(5019)\d+$/ as RegExp,
  interpayment: /^(636)\d+$/ as RegExp,
  unionpay: /^(62|88)\d+$/ as RegExp,
  visa: /^4[0-9]{6,}$/ as RegExp,
  mastercard: /^5[1-5][0-9]{14}$/ as RegExp,
  amex: /^3[47][0-9]{5,}$/ as RegExp,
  diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/ as RegExp,
  discover: /^6(?:011|5[0-9]{2})[0-9]{3,}$/ as RegExp,
  jcb: /^(?:2131|1800|35\d{3})\d{11}$/ as RegExp,
} as const
export const cvvRegex: RegExp = /^[0-9]{3,4}$/
export const dollarAmountRegex: RegExp = /^\d+(\.\d{0,2})?$/
export const emailRegex: RegExp =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/
export const numberRegex: RegExp = /^\d+$/
export const passwordRegex: RegExp =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
const cachedImagesFolder = `/${Brand.IMAGE_CACHE_DIRECTORY}/`
const pickedImagesFolderiOS = `/react-native-image-picker/`
export const pickedImagesFolderAndroid = `${Brand.ANDROID_APPLICATION_ID}/cache/temp`
export const EMERGENCY_CONTACT_FIELDS: ClientMissingInfo[] = [
  { apiParam: 'EmergencyContactInfoName', fieldType: 'name', label: 'Emergency Contact Name' },
  { apiParam: 'EmergencyContactInfoPhone', fieldType: 'phone', label: 'Emergency Contact Phone' },
  { apiParam: 'EmergencyContactInfoEmail', fieldType: 'email', label: 'Emergency Contact Email' },
  {
    apiParam: 'EmergencyContactInfoRelationship',
    fieldType: 'emergencyRelationship',
    label: 'Emergency Contact Relationship',
  },
]
export const FILE_LOCATIONS = {
  cachedImages: { folder: cachedImagesFolder, path: `${Dirs.CacheDir}${cachedImagesFolder}` },
  pickedImages: {
    folder: pickedImagesFolderiOS,
    path: `${
      Platform.OS === 'android' ? Dirs.CacheDir : Dirs.CacheDir.replace('Library/Caches', 'tmp')
    }${pickedImagesFolderiOS}`,
  },
} as const
export const FILE_PREFIX: string = Platform.OS === 'android' ? 'file://' : ''
export const CONVERSION_KG_TO_LB = 2.20462
export const HEADER_TABS_REWARDS = ['OVERVIEW', 'EARN', 'REDEEM'] as const
export const IMAGE_OPTIONS = [
  { action: 'remove', label: 'Remove Current Photo' },
  { action: 'take', label: 'Take Photo' },
  { action: 'choose', label: 'Choose From Library' },
]
export const MONTHS = [
  { key: 'January', value: '01' },
  { key: 'February', value: '02' },
  { key: 'March', value: '03' },
  { key: 'April', value: '04' },
  { key: 'May', value: '05' },
  { key: 'June', value: '06' },
  { key: 'July', value: '07' },
  { key: 'August', value: '08' },
  { key: 'September', value: '09' },
  { key: 'October', value: '10' },
  { key: 'November', value: '11' },
  { key: 'December', value: '12' },
]
export const PROVIDER_TYPES = {
  all: 'All',
  female: 'Female',
  male: 'Male',
}
export const REQUIRED_CLIENT_ADDRESS_TEXT_INPUTS = ['Address1', 'City', 'Zip']
function years() {
  const currentYear = moment().year()
  let array: Array<{
    key: string
    value: string
  }> = []
  for (let i = 0; i < 16; i++) {
    const value = String(currentYear + i)
    array.push({ key: value, value })
  }
  return array
}
export const STORAGE_KEYS = {
  apptLocationsAll: 'apptLocationsAll',
  apptProvidersAll: 'apptProvidersAll',
  apptShowGenderFilter: 'apptShowGenderFilter',
  classFilters: 'classFilters',
}
export const YEARS: Array<{
  key: string
  value: string
}> = years()

export const Z_INDICES = {
  loader: 9,
  overlayLevel1: 3,
  overlayLevel2: 5,
  overlayLevel3: 6,
  toast: 10,
}
