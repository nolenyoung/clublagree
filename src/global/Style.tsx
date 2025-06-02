import { ImageStyle, Platform, StyleProp, TextStyle, ViewStyle } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import Brand, { getBrandStylingOverrides } from './Brand'
import { getThemeColors } from './Colors'
import { Z_INDICES } from './Constants'
import { EdgeInsets } from 'react-native-safe-area-context'

const { brandFonts, fonts } = Brand

export const hasNotch: boolean = DeviceInfo.hasNotch()
export const iPhoneX: boolean = Platform.OS === 'ios' && hasNotch
export const systemFonts = Object.keys(Brand.fonts).map(
  (font) => Brand.fonts[font as keyof typeof Brand.fonts],
)

export const rowAligned = { alignItems: 'center' as 'center', flexDirection: 'row' } as const
export const rowAlignedBetween = { ...rowAligned, justifyContent: 'space-between' } as const
export const rowAlignedCenter = { ...rowAligned, justifyContent: 'center' } as const
export const viewCentered = { alignItems: 'center' as 'center', justifyContent: 'center' } as const
export const flexViewCentered = { ...viewCentered, flex: 1 } as const
export const flexViewEnd = {
  alignItems: 'center' as 'center',
  flex: 1,
  justifyContent: 'flex-end',
} as const

const textSizes = {
  [9]: { fontSize: 9, letterSpacing: 0.5, lineHeight: 13 },
  [10]: { fontSize: 10, letterSpacing: 0.5, lineHeight: 14 },
  [11]: { fontSize: 11, letterSpacing: 0.5, lineHeight: 17 },
  [12]: { fontSize: 12, letterSpacing: 0.5, lineHeight: 18 },
  [13]: { fontSize: 13, letterSpacing: 0.5, lineHeight: 19 },
  [14]: { fontSize: 14, letterSpacing: 0.5, lineHeight: 20 },
  [15]: { fontSize: 15, letterSpacing: 0.5, lineHeight: 20 },
  [16]: { fontSize: 16, letterSpacing: 0.5, lineHeight: 20 },
  [17]: { fontSize: 17, letterSpacing: 0, lineHeight: 22 },
  [18]: { fontSize: 18, letterSpacing: 0.5, lineHeight: 24 },
  [19]: { fontSize: 18, letterSpacing: 0.5, lineHeight: 25 },
  [20]: { fontSize: 20, letterSpacing: 0.5, lineHeight: 26 },
  [22]: { fontSize: 20, letterSpacing: 0.5, lineHeight: 28 },
  [24]: { fontSize: 24, letterSpacing: 0.5, lineHeight: 30 },
  [26]: { fontSize: 26, letterSpacing: 0.5, lineHeight: 32 },
  [28]: { fontSize: 28, letterSpacing: 0.5, lineHeight: 44 },
  [30]: { fontSize: 30, letterSpacing: 0, lineHeight: 36 },
  [32]: { fontSize: 32, letterSpacing: 0, lineHeight: 38 },
  [34]: { fontSize: 34, letterSpacing: 0, lineHeight: 42 },
  [35]: { fontSize: 35, letterSpacing: 0, lineHeight: 45 },
  [36]: { fontSize: 36, letterSpacing: 1, lineHeight: 48 },
  [40]: { fontSize: 40, letterSpacing: 0, lineHeight: 46 },
  [44]: { fontSize: 44, letterSpacing: 0, lineHeight: 56 },
  [46]: { fontSize: 46, letterSpacing: 0, lineHeight: 56 },
  [48]: { fontSize: 46, letterSpacing: 0, lineHeight: 56 },
  [52]: { fontSize: 52, letterSpacing: 0, lineHeight: 58 },
} as const

function getTemplateStyles({
  colors,
  edgeInsets,
  getTextStyle,
  height,
  scale,
  width,
}: StylingParams) {
  const checkbox = { height: scale(20), width: scale(20) } as const
  const homeWelcomeText = {
    color: colors[Brand.COLOR_HEADER_TEXT as ColorKeys],
    fontFamily: fonts[brandFonts.fontHomeWelcome as FontKeys],
    fontSize: scale(Brand.SIZE_HEADER_TEXT_HOME),
    letterSpacing: -scale(0.5),
    textTransform: Brand.TRANSFORM_HOME_WELCOME_TEXT as TextTransform,
  }
  const modalBannerRow = {
    ...viewCentered,
    paddingHorizontal: scale(48),
    paddingVertical: scale(16),
  }
  const modalContent = {
    backgroundColor: colors.white,
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    maxHeight: height - scale(200),
    overflow: 'hidden' as const,
  }
  const modalTitleText = {
    color: colors[Brand.COLOR_MODAL_BANNER_TEXT as ColorKeys],
    fontFamily: fonts[brandFonts.fontModalTitle as FontKeys],
    fontSize: scale(Brand.SIZE_MODAL_TITLE),
    letterSpacing: scale(0.5),
    textAlign: 'center' as const,
    textTransform: Brand.TRANSFORM_MODAL_TITLE_TEXT as TextTransform,
  }
  const overlayContainer = {
    backgroundColor: colors.transparentBlack,
    height,
    justifyContent: 'flex-end' as const,
    position: 'absolute' as const,
    width,
  }
  const overlayContent = {
    backgroundColor: colors.white,
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    overflow: 'hidden' as const,
    width: width,
    zIndex: Z_INDICES.overlayLevel1,
  }
  const screenSecondary = {
    backgroundColor: colors[Brand.COLOR_SECONDARY_SCREEN_BACKGROUND as ColorKeys],
    flex: 1,
    paddingHorizontal: scale(20),
  }
  const screenSecondaryTitleText = {
    color: colors[Brand.COLOR_SECONDARY_SCREEN_TITLE as ColorKeys],
    fontFamily: fonts[brandFonts.fontScreenTitle as FontKeys],
    fontSize: scale(Brand.SIZE_SECONDARY_SCREEN_TITLE),
    letterSpacing: scale(0.5),
    textTransform: Brand.TRANSFORM_SCREEN_TITLE_TEXT as TextTransform,
  }
  const sectionTitleText = {
    color: colors[Brand.COLOR_SECTION_TITLE as ColorKeys],
    fontFamily: fonts[brandFonts.fontSectionTitle as FontKeys],
    fontSize: scale(Brand.SIZE_SECTION_TITLE),
    letterSpacing: scale(0.5),
    textTransform: Brand.TRANSFORM_SECTION_TITLE_TEXT as TextTransform,
  }
  const textPrimaryBold12 = getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 12 })
  const textPrimaryBold16 = getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 16 })
  const textPrimaryBold18 = getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 18 })
  const textPrimaryBold20 = getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 20 })
  const textPrimaryMedium12 = getTextStyle({
    color: 'textBlack',
    font: 'fontPrimaryMedium',
    size: 12,
  })
  const textPrimaryMedium14 = getTextStyle({
    color: 'textBlack',
    font: 'fontPrimaryMedium',
    size: 14,
  })
  const textPrimaryMedium16 = getTextStyle({
    color: 'textBlack',
    font: 'fontPrimaryMedium',
    size: 16,
  })
  const textPrimaryRegular11 = getTextStyle({
    color: 'textBlack',
    font: 'fontPrimaryRegular',
    size: 11,
  })
  const textPrimaryRegular12 = getTextStyle({
    color: 'textBlack',
    font: 'fontPrimaryRegular',
    size: 12,
  })
  const textPrimaryRegular14 = getTextStyle({
    color: 'textBlack',
    font: 'fontPrimaryRegular',
    size: 14,
  })
  const textPrimaryRegular16 = getTextStyle({
    color: 'textBlack',
    font: 'fontPrimaryRegular',
    size: 16,
  })
  const apptScheduleSummarySubTitle = {
    ...getTextStyle({ color: 'textGray', font: 'fontPrimaryRegular', size: 13 }),
    marginTop: scale(7),
  } as const
  const checkboxStyles = {
    disabled: {
      ...viewCentered,
      ...checkbox,
      backgroundColor: colors.paleGray,
      opacity: 0.4,
    },
    empty: {
      ...viewCentered,
      ...checkbox,
      backgroundColor: colors.paleGray,
    },
    icon: {
      color: colors[Brand.COLOR_CHECKBOX_SELECTED_CHECK as ColorKeys],
      fontSize: scale(9),
    },
    selected: {
      ...checkbox,
      backgroundColor: colors[Brand.COLOR_CHECKBOX_SELECTED_BACKGROUND as ColorKeys],
    },
    text: { ...textPrimaryRegular16, flex: 1, marginLeft: scale(16) },
  }
  return {
    appointments: {
      content: {
        backgroundColor: colors.backgroundGray,
        flex: 1,
        paddingBottom: scale(32),
        paddingHorizontal: scale(20),
      },
      bannerView: {
        ...rowAlignedCenter,
        backgroundColor: colors.brandPrimary,
        height: scale(34),
        paddingHorizontal: scale(20),
      },
      bannerTitle: { ...textPrimaryBold12, color: colors.colorWhite },
      clearButton: { left: scale(20), position: 'absolute' as const },
      clearButtonText: { ...textPrimaryRegular12, color: colors.colorWhite },
      item: { marginVertical: scale(4), padding: scale(10) },
      listContent: { flexGrow: 1, paddingVertical: scale(20) },
      locations: {
        headerText: textPrimaryBold18,
        locationItem: {
          flex: 1,
          flexDirection: 'row' as const,
          marginLeft: scale(36),
          padding: scale(16),
        },
        locationName: {
          ...checkboxStyles.text,
          fontFamily: fonts.fontPrimaryBold,
          marginLeft: 0,
        },
        comingSoonView: {
          ...viewCentered,
          alignSelf: 'flex-start' as const,
          backgroundColor: colors.brandPrimary,
          borderRadius: scale(8),
          marginTop: scale(2),
          paddingHorizontal: scale(8),
          paddingVertical: scale(4),
        },
        comingSoonText: {
          ...textPrimaryRegular11,
          color: colors[Brand.BUTTON_TEXT_COLOR as ColorKeys],
        },
        locationDetailsView: { flex: 1, marginLeft: checkboxStyles.text.marginLeft },
        locationDetailsText: {
          ...textPrimaryRegular11,
          marginTop: scale(2),
          opacity: 0.65,
        },
      },
      scheduleSummary: {
        item: { ...rowAligned, paddingVertical: scale(12) },
        buttonRow: { ...rowAligned, alignSelf: 'flex-end' as 'flex-end' },
        avatar: { marginRight: scale(12) },
        infoView: { flex: 1, marginRight: scale(8) },
        itemTitleText: getTextStyle({
          color: 'textBlack',
          font: 'fontPrimaryBold',
          size: 16,
        }),
        itemTimeText: getTextStyle({
          color: 'textBlack',
          font: 'fontPrimaryMedium',
          size: 14,
        }),
        itemLocationText: apptScheduleSummarySubTitle,
        itemSubTitle: { ...apptScheduleSummarySubTitle, marginTop: scale(2) },
        rightIcon: { color: colors.buttonTextOnMain, fontSize: scale(16) },
      },
      searchInput: {
        backgroundColor: colors.colorWhite,
        marginBottom: scale(12),
        marginTop: scale(20),
      },
      searchInputRow: { ...rowAligned, paddingHorizontal: scale(8) },
      timeNameText: {
        ...textPrimaryBold20,
        marginBottom: scale(16),
        textAlign: 'center' as const,
      },
      titleView: {
        ...viewCentered,
        borderBottomWidth: scale(1),
        borderColor: colors.paleGray,
        paddingHorizontal: scale(20),
      },
    },
    backgroundImage: { height: '100%', width: '100%' } as const,
    baseWebViewStyle: { minHeight: 1, opacity: 0.99 } as ViewStyle,
    bottomButtonView: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' } as const,
    buttonClassItem: { minWidth: scale(77) as number } as ViewStyle,
    buttonClose: {
      alignSelf: 'flex-end' as const,
      marginBottom: scale(14) as number,
      marginTop: hasNotch ? scale(54) : (scale(44) as number),
    },
    calendarTheme: {
      textDisabledColor: colors.transparentBlack,
      arrowColor: colors.brandPrimary,
      calendarBackground: colors.colorWhite,
      disabledArrowColor: colors.transparentBlack,
      monthTextColor: colors.textBlack,
      textMonthFontFamily: fonts.fontPrimaryMedium,
      textDayHeaderFontFamily: fonts.fontPrimaryRegular,
      textMonthFontSize: scale(16),
      textDayHeaderFontSize: scale(12),
      textDayStyle: {
        color: colors.textBlack,
        fontFamily: fonts.fontPrimaryMedium,
        fontSize: scale(12),
        fontWeight: undefined,
        marginTop: 0,
        textAlign: 'center' as const,
      },
      textSectionTitleColor: colors.textBlack,
      weekVerticalMargin: scale(6),
      'stylesheet.calendar.header': {
        dayHeader: {
          color: colors.textBlack,
          flex: 1,
          fontFamily: fonts.fontPrimaryRegular,
          fontSize: scale(12),
          marginBottom: scale(7),
          marginTop: scale(2),
          textAlign: 'center' as const,
        },
      },
      'stylesheet.day.basic': {
        alignedText: { marginTop: 0 },
        base: {
          ...viewCentered,
          borderColor: colors.darkGray,
          borderRadius: scale(16),
          borderWidth: 1,
          height: scale(32),
          textAlign: 'center' as const,
          width: scale(32),
        },
        selected: {
          backgroundColor: colors.brandPrimary,
          borderColor: colors.brandPrimary,
        },
        selectedText: {
          color: colors[Brand.BUTTON_TEXT_COLOR as ColorKeys],
          fontFamily: fonts.fontPrimaryMedium,
          fontSize: scale(12),
        },
        todayText: {
          color: colors.brandPrimary,
          fontFamily: fonts.fontPrimaryMedium,
          fontSize: scale(12),
        },
      },
    },
    checkbox: checkboxStyles,
    closeIcon: {
      color: colors[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
      fontSize: scale(20),
    },
    content: { flex: 1, paddingHorizontal: scale(20) as number },
    contentTabScreen: { flex: 1, paddingTop: scale(40) as number },
    contentWhite: { backgroundColor: colors.white, flex: 1 },
    expirationModalList: { flex: 0, height: height / 2 },
    eyebrowText: {
      ...textPrimaryBold12,
      color: colors[Brand.COLOR_EYEBROW_TEXT as ColorKeys],
      marginBottom: scale(4),
    },
    filterButton: { alignSelf: 'flex-end' as const, marginRight: scale(20) as number },
    filterIcon: { color: colors.textBlack, fontSize: scale(16), marginRight: scale(8) },
    fixedBottomButtonView: {
      backgroundColor: colors.white,
      borderColor: colors.fadedGray,
      borderTopWidth: scale(1),
      paddingHorizontal: scale(20),
      paddingTop: scale(20),
      paddingBottom: iPhoneX ? scale(34) : scale(20),
      elevation: 2,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: 0.25,
      shadowRadius: scale(10),
    },
    fixedBottomButton: { backgroundColor: colors.brandPrimary },
    flexView: { flex: 1 } as const,
    flexViewCentered,
    flexViewEnd,
    fullGradientView: {
      bottom: 0,
      left: 0,
      overflow: 'hidden',
      position: 'absolute' as 'absolute',
      right: 0,
      top: 0,
    } as const,
    fullImageBackground: { height, width },
    getItemLayout: (
      data: ArrayLike<any> | null | undefined,
      index: number,
    ): { index: number; length: number; offset: number } => {
      const length = scale(52) as number
      return { length, index, offset: length * index }
    },
    getItemLayoutLocation: (
      data: ArrayLike<any> | null | undefined,
      index: number,
    ): { index: number; length: number; offset: number } => {
      const length = scale(44) as number
      return { length, index, offset: length * index }
    },
    getTextStyle,
    halfInput: { width: '48%' } as const,
    hasNotch,
    header: {
      alignItems: 'flex-end' as const,
      flexDirection: 'row' as const,
      height: hasNotch ? scale(108) : (scale(88) as number),
      paddingBottom: scale(14) as number,
      paddingHorizontal: scale(20) as number,
    },
    headerHeightTall: hasNotch ? scale(135) : (scale(115) as number),
    headerIcon: { color: colors.textWhite, fontSize: scale(18) },
    headerTitleText: {
      textAlign: 'center' as const,
      color: colors[Brand.COLOR_HEADER_TEXT as ColorKeys],
      fontFamily: fonts[brandFonts.fontHeader as FontKeys],
      fontSize: scale(Brand.SIZE_HEADER_TEXT),
      letterSpacing: scale(0.5),
      textTransform: Brand.TRANSFORM_HEADER_TEXT as TextTransform,
    },
    hitSlop: {
      bottom: scale(10) as number,
      left: scale(10) as number,
      right: scale(10) as number,
      top: scale(10) as number,
    },
    hitSlopLarge: {
      bottom: scale(20) as number,
      left: scale(20) as number,
      right: scale(20) as number,
      top: scale(20) as number,
    },
    homeScreen: {
      accountButton: { ...rowAlignedBetween, paddingVertical: scale(16) },
      accountIconArrow: { color: colors.brandPrimary, fontSize: scale(15) },
      accountIconProfile: { color: colors.brandPrimary, fontSize: scale(21) },
      accountText: { ...homeWelcomeText, marginHorizontal: scale(8) },
      headerView: {} as ViewStyle,
      headerViewBanners: {} as ViewStyle,
      logo: {
        alignSelf: 'center' as const,
        height: scale(49),
        resizeMode: 'contain' as const,
        width: scale(49),
      } as ImageStyle,
      welcomeText: {
        ...homeWelcomeText,
        marginTop: scale(16),
        paddingBottom: scale(52),
        textAlign: 'center' as const,
      } as TextStyle,
      floatingCardValue: {
        color: colors[Brand.COLOR_HOME_FLOATING_CARD_TEXT as ColorKeys],
        fontFamily: fonts.fontPrimaryBold as (typeof fonts)[FontKeys],
        fontSize: scale(36),
        letterSpacing: scale(1),
      },
    },
    htmlStyles: {
      div: {
        color: colors.textBlack,
        fontFamily: fonts.fontPrimaryRegular as (typeof fonts)[FontKeys],
        fontSize: scale(14),
      } as ViewStyle,
      em: {
        color: colors.textBlack,
        fontFamily: fonts.fontPrimaryItalic as (typeof fonts)[FontKeys],
        fontSize: scale(14),
      },
      h1: {
        color: colors.textBlack,
        fontFamily: fonts.fontPrimaryBold as (typeof fonts)[FontKeys],
        fontSize: scale(32),
        letterSpacing: scale(0.5),
        marginVertical: scale(16),
      },
      h2: {
        color: colors.textBlack,
        fontFamily: fonts.fontPrimaryBold as (typeof fonts)[FontKeys],
        fontSize: scale(22),
        letterSpacing: scale(0.5),
        marginVertical: scale(16),
      },
      h3: {
        color: colors.textBlack,
        fontFamily: fonts.fontPrimaryBold as (typeof fonts)[FontKeys],
        fontSize: scale(18),
        letterSpacing: scale(0.5),
        marginVertical: scale(16),
      },
      h4: {
        color: colors.textBlack,
        fontFamily: fonts.fontPrimaryBold as (typeof fonts)[FontKeys],
        fontSize: scale(16),
        letterSpacing: scale(0.5),
        marginVertical: scale(16),
      },
      li: {
        color: colors.textBlack,
        fontFamily: fonts.fontPrimaryRegular as (typeof fonts)[FontKeys],
        fontSize: scale(14),
        letterSpacing: scale(0.5),
      },
      p: {
        color: colors.textBlack,
        fontFamily: fonts.fontPrimaryRegular as (typeof fonts)[FontKeys],
        fontSize: scale(14),
        letterSpacing: scale(0.5),
        marginVertical: scale(8),
      },
    },
    inputButton: {
      justifyContent: 'center' as const,
      borderBottomColor: colors.textPlaceholder,
      borderBottomWidth: scale(1),
      marginBottom: scale(27),
      paddingVertical: scale(8),
      width: '100%' as const,
    },
    inputButtonText: getTextStyle({
      color: 'textPlaceholder',
      font: 'fontPrimaryRegular',
      size: 16,
    }),
    inputText: {
      color: colors.textPlaceholder,
      flex: 1,
      fontFamily: fonts.fontPrimaryRegular,
      fontSize: scale(16),
      includeFontPadding: false,
      letterSpacing: scale(0.5),
      margin: 0,
      padding: 0,
      textAlignVertical: 'center' as 'center',
    },
    inputView: { alignSelf: 'center' as const, marginBottom: scale(28) as number },
    iPhoneX,
    item: { flexDirection: 'row' as const, padding: scale(20) as number },
    itemInfoView: { flex: 1, marginLeft: scale(8) as number },
    itemDetailText: getTextStyle({ color: 'textGray', font: 'fontPrimaryRegular', size: 14 }),
    itemTitleText: {
      ...getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 18 }),
      marginBottom: scale(2),
    },
    largeTitleText: {
      color: colors[Brand.COLOR_SECTION_TITLE as ColorKeys],
      fontFamily: fonts[brandFonts.fontSectionTitle as FontKeys],
      fontSize: scale(32),
      textTransform: Brand.TRANSFORM_HEADER_TEXT as TextTransform,
    } as TextStyle,
    listContent: { backgroundColor: colors.white, flexGrow: 1, paddingBottom: scale(20) },
    listEmptyLoadingView: { alignSelf: 'center' as const, marginVertical: scale(40) as number },
    listItemDescription: getTextStyle({
      color: 'textGray',
      font: 'fontPrimaryRegular',
      size: 12,
    }) as TextStyle,
    listItemTitle: {
      ...getTextStyle({ color: 'textBlack', font: brandFonts.fontItemTitle, size: 16 }),
      textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
    } as TextStyle,
    loginScreen: {
      closeButton: { alignSelf: 'flex-end' as const, marginTop: hasNotch ? scale(54) : scale(44) },
      logo: {
        alignSelf: 'center' as const,
        height: scale(79),
        marginBottom: scale(78),
        marginTop: scale(64),
        resizeMode: 'contain' as const,
        width: scale(79),
      },
      inputView: { alignSelf: 'center' as const, marginBottom: scale(26) },
      button: { marginVertical: scale(32), width: '100%' as const },
      createAccountText: getTextStyle({
        color: Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys,
        font: 'fontPrimaryBold',
        size: 16,
      }),
    },
    modal: { backgroundColor: 'transparent', height, justifyContent: 'flex-end', width } as const,
    modalBannerRow: {
      ...modalBannerRow,
      backgroundColor: colors[Brand.COLOR_MODAL_BANNER_ROW as ColorKeys],
    },
    modalBannerRowAlt: {
      ...modalBannerRow,
      backgroundColor: colors[Brand.COLOR_MODAL_BANNER_ROW_ALT as ColorKeys],
    },
    modalCloseButton: { position: 'absolute' as const, right: scale(20) as number },
    modalCloseIcon: {
      color: colors[Brand.COLOR_MODAL_BANNER_TEXT as ColorKeys],
      fontSize: scale(12),
    },
    modalCloseIconAlt: {
      color: colors[Brand.COLOR_MODAL_BANNER_TEXT_ALT as ColorKeys],
      fontSize: scale(12),
    },
    modalContent,
    modalContentAlt: { ...modalContent, backgroundColor: colors.fadedGray } as ViewStyle,
    modalDismissArea: {
      backgroundColor: colors.backgroundModalFade,
      height,
      position: 'absolute' as 'absolute',
      width,
    },
    modalFadeContent: {
      backgroundColor: colors.white,
      borderRadius: scale(20),
      marginHorizontal: scale(20),
      maxHeight: height - scale(100),
      overflow: 'hidden' as const,
      width: width / 1.25,
    },
    modalSubTitleText: {} as TextStyle,
    modalSubTitleTextAlt: {} as TextStyle,
    modalTitleText,
    modalTitleTextAlt: {
      ...modalTitleText,
      color: colors[Brand.COLOR_MODAL_BANNER_TEXT_ALT as ColorKeys],
    },
    overlayContainerLevel2: {
      ...overlayContainer,
      zIndex: Z_INDICES.overlayLevel2,
    },
    overlayContent,
    overlayDismissArea: { height, position: 'absolute' as const, width },
    overlaySubTitleText: {
      ...textPrimaryBold16,
      marginTop: scale(20),
    },
    overlayTitleRow: { ...rowAlignedBetween, marginBottom: scale(20) },
    overlayTitleText: sectionTitleText,
    piqSectionTitle: {} as TextStyle,
    rewardsTotalPointLabel: {} as TextStyle,
    rewardsTotalPointText: {} as TextStyle,
    rowAligned,
    rowAlignedAround: { ...rowAligned, justifyContent: 'space-around' } as const,
    rowAlignedBetween,
    rowAlignedCenter,
    rowAlignedEnd: { ...rowAligned, justifyContent: 'flex-end' } as const,
    rowAlignedEvenly: { ...rowAligned, justifyContent: 'space-evenly' } as const,
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between' } as const,
    rowCentered: { flexDirection: 'row', justifyContent: 'center' } as const,
    rowEndBetween: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      justifyContent: 'space-between',
    } as const,
    screen: { backgroundColor: colors.white, flex: 1 },
    screenContentTabs: { flex: 1, paddingTop: scale(40) as number },
    screenSecondary,
    screenSecondaryTitleText,
    scrollContentTabScreen: { flexGrow: 1 },
    scrollViewContent: { backgroundColor: colors.white, flexGrow: 1, paddingBottom: scale(40) },
    sectionTitleText,
    sectionTitleTextFriend: {
      ...sectionTitleText,
      marginBottom: scale(16),
      paddingHorizontal: scale(20),
    },
    sectionViewFriend: { paddingVertical: scale(22) as number },
    separator: { backgroundColor: colors.paleGray, height: scale(1), width: '100%' as const },
    signUpScreen: {
      content: { ...screenSecondary, paddingHorizontal: 0 },
      titleText: screenSecondaryTitleText,
      billingSectionText: {
        ...screenSecondaryTitleText,
        fontSize: (screenSecondaryTitleText.fontSize * 26) / 44,
        marginBottom: scale(24),
        marginTop: scale(8),
      },
      continueButton: {
        alignSelf: 'center' as const,
        marginBottom: scale(48),
        marginTop: scale(40),
      },
    },
    textHistoryTime: {
      ...textPrimaryRegular14,
      color: colors.textDarkGray,
      textAlign: 'right' as const,
    },
    textItemPrimary: {
      ...getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 16 }),
      marginBottom: scale(4),
    },
    textItemSecondary: getTextStyle({ color: 'textGray', font: 'fontPrimaryRegular', size: 13 }),
    textPrimaryBold12,
    textPrimaryBold14: getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 14 }),
    textPrimaryBold16,
    textPrimaryBold18,
    textPrimaryBold20,
    textPrimaryBold24: getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 24 }),
    textPrimaryMedium12,
    textPrimaryMedium14,
    textPrimaryMedium16,
    textPrimaryRegular12,
    textPrimaryRegular14,
    textPrimaryRegular16,
    updateScreen: {
      content: { ...screenSecondary, ...viewCentered },
      headerText: {
        color: colors.textWhite,
        fontFamily: fonts.fontPrimaryBold,
        fontSize: scale(40),
        letterSpacing: scale(0.5),
        marginBottom: scale(24),
        textAlign: 'center' as 'center',
      },
      bodyText: {
        ...getTextStyle({ color: 'textWhite', font: 'fontPrimaryRegular', size: 16 }),
        textAlign: 'center' as 'center',
      },
    },
    viewCentered,
    window: { height, width },
  }
}

export default function getThemeStyle({ edgeInsets, height, theme, width }: GetThemeStyle) {
  function scale(value: number) {
    if (height / width >= 2) {
      return (value * width) / 375
    } else {
      return (value * height) / 812
    }
  }
  const colors = getThemeColors(theme)
  const getTextStyle = ({ color, font, size }: TextTypeInputs) => {
    return {
      color: colors[color],
      fontFamily: fonts[font],
      fontSize: scale(textSizes[size].fontSize),
      letterSpacing: scale(textSizes[size].letterSpacing),
      lineHeight: scale(textSizes[size].lineHeight),
    }
  }
  const stylingParams = { colors, edgeInsets, fonts, getTextStyle, height, scale, width }
  const templateStyles = getTemplateStyles(stylingParams)
  const finalStyles = getBrandStylingOverrides(templateStyles, stylingParams)
  return {
    ...colors,
    ...finalStyles,
    ...fonts,
    ...brandFonts,
    edgeInsets,
    scale,
    statusBarStyle: theme === 'dark' ? 'light-content' : 'dark-content',
    systemFonts,
    tabBarHeight: iPhoneX ? scale(85) : (scale(65) as number),
  }
}

type GetThemeStyle = { edgeInsets: EdgeInsets; height: number; theme: Theme; width: number }
export type TextTypeInputs = { color: ColorKeys; font: FontKeys; size: TextSizes }
declare global {
  type FontKeys = keyof typeof Brand.fonts
  type StylingParams = {
    colors: AppColors
    edgeInsets: EdgeInsets
    fonts: typeof fonts
    getTextStyle: (data: TextTypeInputs) => TextStyle
    height: number
    scale: (data: number) => number
    width: number
  }
  type TemplateStyles = Awaited<ReturnType<typeof getTemplateStyles>>
  type TextSizes = keyof typeof textSizes
  type TextStyleProp = StyleProp<TextStyle>
  type Theme = 'dark' | 'normal'
  type ThemeStyle = Awaited<ReturnType<typeof getThemeStyle>>
  type ViewStyleProp = StyleProp<ViewStyle>
}
