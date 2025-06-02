import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import ModalDateTimePicker from './ModalDateTimePicker'
import { formatDateBirthday } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = {
  borderColor?: string
  buttonStyle?: ViewStyleProp
  containerStyle?: ViewStyleProp
  country: string
  error?: boolean
  futureOnly?: boolean
  info?: string
  infoPressed?: any
  infoTextColor?: string
  label?: string
  labelColor?: string
  onChange: (arg1: Date) => void
  pastOnly?: boolean
  rightIcon?: string
  textColor?: string
  textStyle?: TextStyleProp
}

export default function InputDatePicker(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    borderColor = themeStyle.textWhite,
    buttonStyle,
    containerStyle,
    country,
    error,
    futureOnly = false,
    info,
    infoPressed,
    infoTextColor = themeStyle.textPlaceholder,
    label,
    labelColor = themeStyle.textWhite,
    onChange,
    pastOnly = false,
    rightIcon,
    textColor = themeStyle.textWhite,
    textStyle,
  } = props
  const [showDatePicker, setShowDatePicker] = React.useState(false)
  const [value, setValue] = React.useState<Date | null>(null)
  return (
    <View style={containerStyle}>
      {label != null && (
        <Text style={[styles.labelText, { color: error ? themeStyle.red : labelColor }]}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={[styles.button, buttonStyle, { borderColor: error ? themeStyle.red : borderColor }]}>
        <Text style={[themeStyle.inputText, textStyle, { color: textColor }]}>
          {value != null ? formatDateBirthday(value, country) : ''}
        </Text>
        {rightIcon != null && <Icon name={rightIcon} style={styles.rightIcon} />}
      </TouchableOpacity>
      {info != null && (
        <TouchableOpacity disabled={infoPressed == null} onPress={infoPressed}>
          <Text style={[styles.helperText, { color: infoTextColor }]}>{info}</Text>
        </TouchableOpacity>
      )}
      {showDatePicker && (
        <ModalDateTimePicker
          {...(futureOnly
            ? { minimumDate: new Date() }
            : pastOnly
              ? { maximumDate: new Date() }
              : {})}
          display="default"
          mode="date"
          onClose={() => setShowDatePicker(false)}
          onSelect={(d) => {
            setValue(d)
            onChange(d)
          }}
          value={value != null ? value : new Date()}
          visible={true}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
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
    rightIcon: { color: themeStyle.colorWhite, fontSize: themeStyle.scale(16) },
    helperText: {
      ...themeStyle.getTextStyle({
        color: 'textPlaceholder',
        font: 'fontPrimaryRegular',
        size: 10,
      }),
      marginTop: themeStyle.scale(6),
    },
  }
}
