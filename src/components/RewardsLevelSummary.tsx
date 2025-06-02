import * as React from 'react'
import { Text, View } from 'react-native'
import { SvgCss } from 'react-native-svg/css'
import media from '../assets/media'
import AnimatedProgress from './AnimatedProgress'
import ButtonText from './ButtonText'
import Brand from '../global/Brand'
import { useTheme, useTimingAnimation } from '../global/Hooks'
import { openExternalLink } from '../global/Functions'

type Props = {
  summary: RewardsSummary | null | undefined
}

export default function RewardsLevelSummary(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { summary } = props
  const {
    GaugeColor = themeStyle.colorWhite,
    Level = '',
    MoreInfoURL = '',
    NextLevelClasses = 0,
    PointBalance = 0,
    PointBalanceColor = themeStyle.textBlack,
    RibbonColor = themeStyle.colorWhite,
    RibbonTextColor = themeStyle.textBlack,
    SubLevel = '',
    TotalClasses = 0,
  } = summary ?? {}
  const progress = useTimingAnimation(
    {
      duration: 500,
      toValue: NextLevelClasses != 0 ? Math.min(TotalClasses / NextLevelClasses, 1) : 1,
      useNativeDriver: true,
    },
    TotalClasses != 0 && NextLevelClasses != 0,
  )
  const classesToNextLevel = NextLevelClasses - TotalClasses
  return (
    <View style={styles.topSection}>
      <Text style={styles.totalPointsText}>Total Points</Text>
      <Text style={[styles.pointsText, { color: PointBalanceColor }]}>{PointBalance}</Text>
      <Text style={styles.currentLevelText}>{`CURRENT ${Brand.STRING_REWARDS_LEVEL_NAME}`}</Text>
      <View style={styles.bannerView}>
        <SvgCss
          color={RibbonColor}
          height={themeStyle.scale(62)}
          width={themeStyle.scale(294)}
          xml={media.iconBanner}
        />
        <Text style={[styles.bannerText, { color: RibbonTextColor }]}>{Level}</Text>
      </View>
      <View collapsable={false}>
        <AnimatedProgress color={GaugeColor} progress={progress} size={themeStyle.scale(240)} />
        <View style={styles.classesTakenView}>
          <Text style={[styles.classesTakenLabel, { color: PointBalanceColor }]}>
            {`${Brand.STRING_CLASS_TITLE_PLURAL} Taken`}
          </Text>
          <Text style={styles.classesTakenValue}>{TotalClasses.toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.levelRow}>
        {Brand.REWARDS_LEVEL_ICON != null && SubLevel != null && (
          <SvgCss
            color={GaugeColor}
            height={themeStyle.scale(24)}
            style={styles.levelIcon}
            xml={Brand.REWARDS_LEVEL_ICON}
          />
        )}
        <Text style={[styles.levelText, { color: GaugeColor }]}>{SubLevel}</Text>
      </View>
      {classesToNextLevel > 0 && (
        <Text style={styles.nextLevelText}>
          {`${classesToNextLevel} ${Brand.STRING_CLASS_TITLE_PLURAL} to go until the next ${Brand.STRING_REWARDS_LEVEL_NAME_LC}`}
        </Text>
      )}
      {MoreInfoURL !== '' && MoreInfoURL != null && (
        <ButtonText
          color={themeStyle.buttonTextOnMain}
          disabled={MoreInfoURL === ''}
          onPress={() => openExternalLink(MoreInfoURL)}
          text={Brand.STRING_REWARDS_MEMBERSHIP_LEVELS}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    topSection: {
      alignItems: 'center' as 'center',
      paddingBottom: themeStyle.scale(20),
      paddingTop: themeStyle.scale(44),
    },
    totalPointsText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: themeStyle.fontItemTitle, size: 18 }),
      textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
    },
    pointsText: {
      color: themeStyle.brandPrimary,
      fontFamily: themeStyle.fontPrimaryBold,
      fontSize: themeStyle.scale(50),
      marginBottom: themeStyle.scale(12),
    },
    currentLevelText: {
      ...themeStyle.getTextStyle({ color: 'textGray', font: themeStyle.fontItemTitle, size: 11 }),
      textTransform: 'uppercase' as TextTransform,
    },
    bannerView: { ...themeStyle.viewCentered, marginBottom: themeStyle.scale(16) },
    bannerText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: themeStyle.fontItemTitle, size: 18 }),
      position: 'absolute' as 'absolute',
    },
    classesTakenView: {
      ...themeStyle.viewCentered,
      alignSelf: 'center' as 'center',
      bottom: 0,
      position: 'absolute' as 'absolute',
      zIndex: 2,
    },
    classesTakenLabel: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: themeStyle.fontItemTitle, size: 13 }),
      color: themeStyle.textBrandPrimary,
      textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
    },
    classesTakenValue: {
      color: themeStyle.textBlack,
      fontFamily: themeStyle.fontPrimaryBold,
      fontSize: themeStyle.scale(40),
    },
    levelRow: {
      ...themeStyle.rowAligned,
      marginBottom: themeStyle.scale(18),
      marginTop: themeStyle.scale(10),
    },
    levelIcon: { marginRight: themeStyle.scale(8) },
    levelText: themeStyle.getTextStyle({
      color: 'textBrandPrimary',
      font: themeStyle.fontItemTitle,
      size: 20,
    }),
    nextLevelText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: themeStyle.fontItemTitle, size: 14 }),
      textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
    },
  }
}
