import Brand from './Brand'

export const defaultColors = {
  backgroundGray: '#F8F8F8',
  backgroundHeaderTab: Brand.COLOR_HEADER_TAB,
  backgroundModalFade: 'rgba(0, 0, 0, 0.6)',
  //@ts-ignore
  black: '#000000',
  brandPrimary: Brand.COLOR_PRIMARY,
  brandSecondary: Brand.COLOR_SECONDARY,
  brandTertiary: Brand.COLOR_TERTIARY,
  //@ts-ignore
  buttonTextOnMain: Brand.COLOR_PRIMARY,
  colorButtonCalendar: '#999999',
  colorHeader: Brand.COLOR_HEADER,
  colorHeaderTabText: Brand.COLOR_HEADER_TAB_TEXT,
  colorHeaderTabTextSelected: Brand.COLOR_HEADER_TAB_TEXT_SELECTED,
  colorInfoText: '#111111',
  //@ts-ignore
  colorWhite: '#FFFFFF',
  darkGray: '#555555',
  fadedGray: '#F0F0F0',
  gray: '#888888',
  lightGray: '#AAAAAA',
  paleGray: '#DDDDDD',
  red: '#C90000',
  //@ts-ignore
  textBlack: '#000000',
  textBlack50: 'rgba(0,0,0,0.5)',
  textBrandPrimary: Brand.COLOR_PRIMARY,
  textBrandSecondary: Brand.COLOR_SECONDARY,
  textBrandTertiary: Brand.COLOR_TERTIARY,
  textDarkGray: '#555555',
  textGray: '#888888',
  textGreen: '#2A7E11',
  textIconX: '#7A8691',
  textPlaceholder: 'rgba(255, 255, 255, 0.79)',
  textPlaceholderAlt: 'rgba(255, 255, 255, 0.5)',
  textWhite: '#FFFFFF',
  transparent: 'rgba(0, 0, 0, 0)',
  transparentBlack: 'rgba(0, 0, 0, 0.3)',
  //@ts-ignore
  white: '#FFFFFF',
  ...Brand.COLOR_OVERRIDES.normal,
} as const

export function getThemeColors(theme: Theme) {
  switch (theme) {
    case 'dark':
      return {
        backgroundGray: '#F8F8F8',
        backgroundHeaderTab: Brand.COLOR_HEADER_TAB,
        backgroundModalFade: 'rgba(0, 0, 0, 0.6)',
        //@ts-ignore
        black: '#000000',
        brandPrimary: Brand.COLOR_PRIMARY,
        brandSecondary: Brand.COLOR_SECONDARY,
        brandTertiary: Brand.COLOR_TERTIARY,
        //@ts-ignore
        buttonTextOnMain: Brand.COLOR_PRIMARY,
        colorButtonCalendar: '#999999',
        colorHeader: Brand.COLOR_PRIMARY,
        colorHeaderTabText: Brand.COLOR_HEADER_TAB_TEXT,
        colorHeaderTabTextSelected: Brand.COLOR_HEADER_TAB_TEXT_SELECTED,
        colorInfoText: '#111111',
        //@ts-ignore
        colorWhite: '#FFFFFF',
        darkGray: '#555555',
        fadedGray: '#F0F0F0',
        gray: '#888888',
        lightGray: '#AAAAAA',
        paleGray: '#DDDDDD',
        red: '#C90000',
        //@ts-ignore
        textBlack: '#000000',
        textBlack50: 'rgba(0,0,0,0.5)',
        textBrandPrimary: Brand.COLOR_PRIMARY,
        textBrandSecondary: Brand.COLOR_SECONDARY,
        textBrandTertiary: Brand.COLOR_TERTIARY,
        textDarkGray: '#555555',
        textGray: '#888888',
        textGreen: '#2A7E11',
        textIconX: '#7A8691',
        textPlaceholder: 'rgba(255, 255, 255, 0.79)',
        textPlaceholderAlt: 'rgba(255, 255, 255, 0.5)',
        textWhite: '#FFFFFF',
        transparent: 'rgba(0, 0, 0, 0)',
        transparentBlack: 'rgba(0, 0, 0, 0.3)',
        //@ts-ignore
        white: '#FFFFFF',
        ...Brand.COLOR_OVERRIDES.dark,
      } as const
    case 'normal':
    default:
      return defaultColors
  }
}

declare global {
  type AppColors = typeof defaultColors
  type ColorKeys = keyof typeof defaultColors
}
