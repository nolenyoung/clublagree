import { getBrandBase } from './BrandBase'
import media from '../assets/media'

const app = 'Club Lagree'
const appFormatted = 'Club Lagree'
const appNoSpaces: string = appFormatted.replace(/\s/g, '').toLowerCase()
const classTitle = 'Class'
const classTitlePlural = 'Classes'
const coachTitle = 'Coach'
const coachTitlePlural = 'Coaches'
const colorPrimary = '#662E91'
const colorSecondary = '#1E1926'
const colorTertiary = '#1E1926'
const rewardsLevelName = 'Level'

const fonts = {
  fontPrimaryBlack: 'Montserrat-Black',
  fontPrimaryBold: 'Montserrat-Bold',
  fontPrimaryItalic: 'Montserrat-Italic',
  fontPrimaryLight: 'Montserrat-Light',
  fontPrimaryMedium: 'Montserrat-Medium',
  fontPrimaryRegular: 'Montserrat-Regular',
} as const

const brandFonts = {
  fontHeader: 'fontPrimaryBold',
  fontHomeWelcome: 'fontPrimaryBold',
  fontItemTitle: 'fontPrimaryBold',
  fontModalTitle: 'fontPrimaryBold',
  fontScreenTitle: 'fontPrimaryLight',
  fontSectionTitle: 'fontPrimaryBold',
} as const

const appDetails = {
  app,
  appNoSpaces,
  brandFonts,
  classTitle,
  classTitlePlural,
  coachTitle,
  coachTitlePlural,
  colorPrimary,
  colorSecondary,
  colorTertiary,
  fonts,
  rewardsLevelName,
}

const templateDefaults = getBrandBase(appDetails)

type TemplateDefaults = typeof templateDefaults

declare global {
  type AppDetails = typeof appDetails
}

export function getBrandStylingOverrides(
  templateStyles: TemplateStyles,
  stylingParams: StylingParams,
) {
  const { scale } = stylingParams
  templateStyles.homeScreen.logo = {
    ...templateStyles.homeScreen.logo,
    height: scale(49),
    width: scale(49),
  }
  templateStyles.loginScreen.logo = {
    ...templateStyles.loginScreen.logo,
    height: scale(79),
    marginBottom: scale(78),
    marginTop: scale(64),
    width: scale(79),
  }
  return templateStyles
}

export default {
  ...templateDefaults,
  IMAGES_LOGO_HOME: media.logo,
  IMAGES_LOGO_LOGIN: media.logo,
  UI_CLIENT_ID_HOME: true,
  UI_PACKAGE_CLASSES: true,
  UI_PROFILE_PHOTO_UPLOAD: true,
} satisfies { [K in keyof TemplateDefaults]?: TemplateDefaults[K] }
