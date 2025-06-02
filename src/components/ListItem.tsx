import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import Icon from './Icon'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = {
  bonusTitleText?: string
  bonusTitleTextColor?: string
  description: string
  leftComponent?: React.ReactNode
  onPress?: () => Promise<void> | void
  rightArrow?: boolean
  rightArrowColor?: string
  rightButton?: React.ReactNode
  rightComponent?: React.ReactNode
  rightText?: string
  subTitleText?: string
  tag?: React.ReactNode
  title: string
  titleColorAlt?: string
  value?: string | null | undefined
}

export default function ListItem(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    bonusTitleText,
    bonusTitleTextColor = themeStyle.brandPrimary,
    description,
    leftComponent,
    onPress,
    rightArrow,
    rightArrowColor = 'gray',
    rightButton,
    rightComponent,
    rightText = '',
    subTitleText = '',
    tag,
    title,
    titleColorAlt,
    value,
  } = props
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.item}>
      {leftComponent}
      <View style={themeStyle.flexView}>
        {tag}
        <View
          style={[styles.titleRow, subTitleText !== '' && { marginBottom: themeStyle.scale(4) }]}>
          <View style={styles.titleTextRow}>
            <Text style={[styles.title, titleColorAlt != null && { color: titleColorAlt }]}>
              {title}
            </Text>
            <Text style={[styles.title, { color: bonusTitleTextColor }]}>{bonusTitleText}</Text>
          </View>
          <View style={styles.pointsRow}>
            {value != null && <Text style={styles.title}>{value}</Text>}
            {rightButton}
          </View>
        </View>
        {subTitleText !== '' && (
          <Text style={[styles.subTitle, titleColorAlt != null && { color: titleColorAlt }]}>
            {subTitleText}
          </Text>
        )}
        <View style={themeStyle.rowAlignedBetween}>
          <Text style={styles.description}>{description}</Text>
          {rightText !== '' && <Text style={themeStyle.textHistoryTime}>{rightText}</Text>}
        </View>
      </View>
      {rightArrow && (
        <Icon
          name="chevron-right"
          style={[styles.icon, { color: themeStyle[rightArrowColor as ColorKeys] }]}
        />
      )}
      {rightComponent}
    </Pressable>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    item: {
      ...themeStyle.rowAlignedBetween,
      paddingHorizontal: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(16),
    },
    titleRow: { ...themeStyle.rowAlignedBetween, marginBottom: themeStyle.scale(8) },
    titleTextRow: { ...themeStyle.rowAligned, flex: 1 },
    title: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: themeStyle.fontItemTitle, size: 16 }),
      textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
    },
    pointsRow: { ...themeStyle.rowAlignedEnd, marginLeft: themeStyle.scale(12) },
    subTitle: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryRegular', size: 16 }),
      marginBottom: themeStyle.scale(4),
      textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
    },
    description: {
      ...themeStyle.getTextStyle({ color: 'textGray', font: 'fontPrimaryRegular', size: 12 }),
      flex: 1,
    },
    icon: {
      color: themeStyle.gray,
      fontSize: themeStyle.scale(20),
      marginLeft: themeStyle.scale(8),
    },
  }
}
