import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'

type Props = {
  borderColor?: string
  buttonStyle?: ViewStyleProp
  containerStyle?: ViewStyleProp
  error?: boolean
  info?: string
  infoPressed?: any
  infoTextColor?: string
  label?: string
  labelColor?: string
  onPress: () => void
  selected?: boolean
  textColor?: string
  textStyle?: TextStyleProp
  value: string
}

export default function InputButton(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    borderColor = themeStyle.textWhite,
    buttonStyle,
    containerStyle,
    error,
    info,
    infoPressed,
    infoTextColor = themeStyle.textPlaceholder,
    label,
    labelColor = themeStyle.textWhite,
    onPress,
    selected = false,
    textColor = themeStyle.textWhite,
    textStyle,
    value,
  } = props
  return (
    <View style={containerStyle}>
      {label != null && (
        <Text style={[styles.labelText, { color: error ? themeStyle.red : labelColor }]}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.button,
          buttonStyle,
          { borderBottomColor: error ? themeStyle.red : borderColor },
          selected && {
            borderBottomColor: themeStyle.brandPrimary,
            borderColor: themeStyle.brandPrimary,
            borderBottomWidth: themeStyle.scale(2),
            borderWidth: themeStyle.scale(2),
          },
        ]}>
        <View style={themeStyle.rowAlignedBetween}>
          <Text
            numberOfLines={1}
            style={[styles.valueText, textStyle, { color: error ? themeStyle.red : textColor }]}>
            {value}
          </Text>
          <View style={themeStyle.rowAligned}>
            {info != null && (
              <TouchableOpacity
                disabled={infoPressed == null}
                onPress={infoPressed}
                style={styles.helperTextButton}>
                <Text style={[styles.helperText, { color: infoTextColor }]}>{info}</Text>
              </TouchableOpacity>
            )}
            {selected && (
              <View style={styles.iconView}>
                <Icon name="check" style={styles.icon} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const iconView = {
    ...themeStyle.viewCentered,
    borderRadius: themeStyle.scale(10),
    height: themeStyle.scale(20),
    marginLeft: themeStyle.scale(8),
    width: themeStyle.scale(20),
  }
  return {
    labelText: {
      ...themeStyle.getTextStyle({
        color: 'textPlaceholderAlt',
        font: 'fontPrimaryMedium',
        size: 14,
      }),
      marginBottom: themeStyle.scale(4),
    },
    button: {
      justifyContent: 'center' as 'center',
      borderBottomWidth: themeStyle.scale(1),
      marginBottom: themeStyle.scale(24),
      paddingVertical: themeStyle.scale(8),
      width: '100%' as const,
    },
    valueText: {
      color: themeStyle.textWhite,
      flexGrow: 1,
      fontFamily: themeStyle.fontPrimaryRegular,
      fontSize: themeStyle.scale(16),
      letterSpacing: themeStyle.scale(0.5),
    },
    helperTextButton: { marginLeft: themeStyle.scale(8) },
    helperText: {
      ...themeStyle.getTextStyle({
        color: 'textPlaceholder',
        font: 'fontPrimaryRegular',
        size: 10,
      }),
      opacity: 0.5,
    },
    iconView: { ...iconView, backgroundColor: themeStyle.brandPrimary },
    icon: { color: themeStyle.colorWhite, fontSize: themeStyle.scale(8) },
  }
}
