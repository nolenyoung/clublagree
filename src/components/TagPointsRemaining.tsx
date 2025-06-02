import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = {
  backgroundColor?: string
  containerStyle?: ViewStyleProp
  onPress?: () => void
  points: number
  textColor?: string
}

export default function TagPointsRemaining(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    backgroundColor = themeStyle.fadedGray,
    containerStyle,
    onPress,
    points,
    textColor = themeStyle.textBlack,
  } = props
  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      style={[styles.tag, { backgroundColor }, containerStyle]}>
      <Text numberOfLines={1} style={[styles.text, { color: textColor }]}>
        {points} Points
      </Text>
    </TouchableOpacity>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    tag: {
      borderRadius: Brand.BUTTON_SMALL_RADIUS,
      paddingHorizontal: themeStyle.scale(8),
      paddingVertical: themeStyle.scale(4),
      width: 'auto' as const,
    },
    text: {
      ...themeStyle.textPrimaryBold12,
      textTransform: Brand.TRANSFORM_BUTTON_SMALL_TEXT as TextTransform,
    },
  }
}
