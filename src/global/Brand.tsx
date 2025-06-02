import { getBrandBase } from './BrandBase'
import media from '../assets/media'

const app = 'Club Lagree'
const appFormatted = 'Club Lagree'
const appNoSpaces: string = appFormatted.replace(/\s/g, '').toLowerCase()
const classTitle = 'Class'
const classTitlePlural = 'Classes'
const coachTitle = 'Coach'
const coachTitlePlural = 'Coaches'
const colorPrimary = '#000000'
const colorSecondary = '#000000'
const colorTertiary = '#000000'
const rewardsLevelName = 'Level'

const fonts = {
  fontPrimaryBlack: 'Roboto-Black',
  fontPrimaryBold: 'Montserrat-Bold',
  fontPrimaryItalic: 'Roboto-Italic',
  fontPrimaryLight: 'Roboto-Light',
  fontPrimaryMedium: 'Roboto-Medium',
  fontPrimaryRegular: 'Roboto-Regular',
  fontPrimaryBoldRoboto: 'Roboto-Bold',
} as const

const brandFonts = {
  fontHeader: 'fontPrimaryBold',
  fontHomeWelcome: 'fontPrimaryBold',
  fontItemTitle: 'fontPrimaryBold',
  fontModalTitle: 'fontPrimaryBold',
  fontScreenTitle: 'fontPrimaryBold',
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
    height: scale(41),
    width: scale(47),
  }
  templateStyles.loginScreen.logo = {
    ...templateStyles.loginScreen.logo,
    height: scale(100),
    marginBottom: scale(78),
    marginTop: scale(84),
    width: scale(114),
  }
  return templateStyles
}

export default {
  ...templateDefaults,
  IMAGES_LOGO_HOME: media.logo,
  IMAGES_LOGO_LOGIN: media.logo,
  IMAGES_HOME_HEADER_BACKGROUND: media.headerHomeBackground,
  UI_CLIENT_ID_HOME: false,
  UI_PACKAGE_CLASSES: true,
  UI_PROFILE_PHOTO_UPLOAD: true,
  COLOR_BUTTON_ALT: 'white',
  BUTTON_TEXT_COLOR_ALT: 'black',
  COLOR_OVERRIDES: {
    normal: {
      cancelButtonColor: '#777777',
    },
    dark: {
      cancelButtonColor: '#777777',
    },
  },
  COLOR_BUTTON_CANCEL: 'cancelButtonColor',
  COLOR_BUTTON_CALENDAR: 'lightGray',
  BUTTON_SMALL_RADIUS: 3,
  BUTTON_LARGE_RADIUS: 3,
  TRANSFORM_HEADER_TEXT: 'uppercase' as const,
  BUTTON_LARGE_FONT: 'fontPrimaryBoldRoboto',
  BUTTON_SMALL_FONT: 'fontPrimaryBoldRoboto',
} satisfies { [K in keyof TemplateDefaults]?: TemplateDefaults[K] }
