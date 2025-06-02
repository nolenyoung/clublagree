import * as React from 'react'
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'

type ExtendedInputRef =
  | (TextInput & { onResetInput: () => void; onTextChanged: (text: string) => void })
  | undefined

interface Props extends Omit<TextInputProps, 'onChangeText' | 'onEndEditing' | 'onSubmitEditing'> {
  alwaysShowRightButton?: boolean
  borderColor?: string
  containerStyle?: ViewStyleProp
  defaultValue?: string
  format?: (arg1: string) => string
  getInputRef?: (arg1?: ExtendedInputRef) => void
  hideErrorLabel?: boolean
  info?: string
  infoPressed?: any
  infoTextColor?: string
  label?: string
  labelColor?: string
  leftIcon?: string
  multiline?: boolean
  numberOfLines?: number
  onChangeText?: (data: { setError: (arg1: string) => void; text: string }) => void
  onEndEditing?: (arg1: string, arg2: (arg1: string) => void) => Promise<void> | void
  onFocus?: (arg1?: any) => void
  onLayout?: (arg1?: any) => void
  onSubmitEditing?: (arg1: string) => void
  placeholderTextColor?: string
  pointerEvents?: 'auto' | 'none'
  rightButton?: React.ReactNode
  rightIcon?: string
  rightIconPress?: any
  rowStyle?: ViewStyleProp
  style?: TextStyleProp
  textColor?: string
}

declare global {
  type InputRef = ExtendedInputRef
  type InputProps = Props
}

export default function Input(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    alwaysShowRightButton = false,
    borderColor = themeStyle.textPlaceholder,
    containerStyle,
    defaultValue = '',
    format,
    hideErrorLabel = false,
    info,
    infoPressed,
    infoTextColor = themeStyle.textPlaceholder,
    getInputRef,
    label,
    labelColor = themeStyle.textPlaceholder,
    leftIcon,
    multiline,
    numberOfLines,
    onChangeText,
    onEndEditing,
    onFocus,
    onLayout,
    onSubmitEditing,
    placeholderTextColor = themeStyle.textPlaceholder,
    pointerEvents = 'auto',
    rightButton,
    rightIcon,
    rightIconPress,
    rowStyle,
    style,
    textColor = themeStyle.textPlaceholder,
    ...rest
  } = props
  const inputRef = React.useRef<
    (TextInput & { onResetInput?: () => void; onTextChanged?: (text: string) => void }) | null
  >(null)
  const [active, setActive] = React.useState(false)
  const [error, setError] = React.useState('')
  const [value, setValue] = React.useState(defaultValue)
  const onActive = React.useCallback(() => {
    setActive(true)
    onFocus && onFocus()
  }, [onFocus])
  const onResetInput = React.useCallback(() => {
    setActive(false)
    setValue('')
  }, [])
  const onTextChanged = React.useCallback(
    (text: string) => {
      let newText = format ? format(text) : text
      onChangeText && onChangeText({ text: newText, setError })
      setValue(newText)
    },
    [format, onChangeText],
  )
  React.useEffect(() => {
    if (inputRef.current != null) {
      inputRef.current.onResetInput = onResetInput
      inputRef.current.onTextChanged = onTextChanged
    }
    getInputRef && getInputRef(inputRef.current as InputRef)
  }, [getInputRef, onResetInput, onTextChanged])
  const itemColor = { color: error !== '' ? themeStyle.red : labelColor }
  return (
    <View onLayout={onLayout} pointerEvents={pointerEvents} style={containerStyle}>
      {label != null && <Text style={[styles.labelText, itemColor]}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          rowStyle,
          { borderColor: error !== '' ? themeStyle.red : borderColor },
        ]}>
        {leftIcon != null && <Icon name={leftIcon} style={[styles.leftIcon, itemColor]} />}
        <TextInput
          {...rest}
          accessible={true}
          accessibilityHint={'Text Input'}
          accessibilityLabel={label}
          accessibilityState={active ? { selected: true } : undefined}
          ref={inputRef}
          numberOfLines={numberOfLines != null ? numberOfLines : 1}
          onChangeText={onTextChanged}
          onEndEditing={() => {
            setActive(false)
            onEndEditing && onEndEditing(value, setError)
          }}
          onFocus={onActive}
          onSubmitEditing={() => onSubmitEditing && onSubmitEditing(value)}
          selectionColor={textColor}
          multiline={multiline}
          placeholderTextColor={placeholderTextColor}
          style={[
            styles.inputText,
            { color: textColor },
            multiline && { paddingTop: themeStyle.scale(2) }, //RN issue with multiline
            style,
          ]}
          underlineColorAndroid="transparent"
          value={value}
        />
        <View style={themeStyle.rowAligned}>
          {info != null && (
            <TouchableOpacity disabled={infoPressed == null} onPress={infoPressed}>
              <Text style={[styles.helperText, { color: infoTextColor }]}>{info}</Text>
            </TouchableOpacity>
          )}
          {rightIcon != null && (
            <TouchableOpacity
              disabled={rightIconPress == null}
              hitSlop={themeStyle.hitSlop}
              onPress={rightIconPress}>
              <Icon name={rightIcon} style={[styles.rightIcon, { color: textColor }]} />
            </TouchableOpacity>
          )}
          {rightButton != null && (value !== '' || alwaysShowRightButton) && rightButton}
        </View>
      </View>
      {!hideErrorLabel && error !== '' && label == null && (
        <Text style={[styles.labelText, itemColor]}>{error}</Text>
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    labelText: themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryMedium', size: 14 }),
    inputRow: {
      flexDirection: 'row' as 'row',
      width: '100%' as const,
      borderBottomWidth: themeStyle.scale(1),
      paddingVertical: themeStyle.scale(8),
    },
    leftIcon: {
      color: 'textPlaceholder',
      fontSize: themeStyle.scale(14),
      marginRight: themeStyle.scale(8),
    },
    inputText: {
      color: themeStyle.textPlaceholder,
      flex: 1,
      fontFamily: themeStyle.fontPrimaryRegular,
      fontSize: themeStyle.scale(16),
      includeFontPadding: false,
      letterSpacing: themeStyle.scale(0.5),
      margin: 0,
      padding: 0,
      textAlignVertical: 'center' as 'center',
    },
    rightIcon: {
      color: 'textPlaceholder',
      fontSize: themeStyle.scale(12),
      marginLeft: themeStyle.scale(8),
    },
    helperText: {
      ...themeStyle.getTextStyle({
        color: 'textPlaceholder',
        font: 'fontPrimaryRegular',
        size: 10,
      }),
      marginRight: themeStyle.scale(4),
      opacity: 0.5,
    },
  }
}
