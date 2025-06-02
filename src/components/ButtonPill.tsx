import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../global/Hooks'

type Props = {
  allowFontScaling?: boolean
  disabled?: boolean // whether or not the button is disabled
  disabledStyling?: boolean //whether to show disabled styling
  onPress: () => void // onPress handler
  selected?: boolean
  style?: ViewStyleProp // styling for the specific instance of the button
  text: string // text to render in the button
  textStyle?: TextStyleProp
}

export default function ButtonPill(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    allowFontScaling = false,
    disabled = false,
    disabledStyling = true,
    onPress,
    selected,
    style,
    text,
    textStyle,
  } = props
  const accessibilityState = React.useMemo(() => ({ disabled }), [disabled])
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel={text}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        style,
        selected && { backgroundColor: themeStyle.brandPrimary },
        disabled && disabledStyling && { backgroundColor: themeStyle.darkGray },
      ]}>
      <View style={themeStyle.rowAlignedBetween}>
        <Text
          allowFontScaling={allowFontScaling}
          style={[styles.text, textStyle, selected && { color: themeStyle.colorWhite }]}>
          {text}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    button: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.gray,
      borderRadius: themeStyle.scale(18),
      height: themeStyle.scale(36),
      paddingHorizontal: themeStyle.scale(8),
    },
    text: {
      ...themeStyle.textPrimaryMedium14,
      color: themeStyle.gray,
      textAlign: 'center' as const,
      bottom: 1,
    },
  }
}
