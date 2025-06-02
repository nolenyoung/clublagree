import * as React from 'react'
import { ActivityIndicator, Keyboard, Pressable, Text } from 'react-native'
import { useSelector } from 'react-redux'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = {
  color?: string
  disabled?: boolean // whether or not the button is disabled,
  onPress: (arg1?: any) => any // onPress handler,
  showSpinner?: boolean
  style?: ViewStyleProp // styling for the specific instance of the button,
  text: string // text to render in the button,
  textStyle?: TextStyleProp
  toggleSelfDisabled?: (id: string) => void
}

export default function ButtonText(props: Props): React.ReactElement {
  const id = React.useId()
  const activeButton = useSelector((state: ReduxState) => state.activeButton.id)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    color = themeStyle.textWhite,
    disabled: parentDisabled = false,
    onPress,
    showSpinner,
    style,
    text,
    textStyle,
    toggleSelfDisabled,
  } = props
  const [selfDisabled, setSelfDisabled] = React.useState(false)
  const buttonPressed = React.useCallback(() => {
    Keyboard.dismiss()
    if (showSpinner) {
      setAction('activeButton', { id })
      setSelfDisabled(true)
      onPress()
    } else {
      onPress()
    }
  }, [id, onPress, showSpinner])
  const disabled = parentDisabled || selfDisabled
  const accessibilityState = React.useMemo(() => ({ disabled }), [disabled])
  if (toggleSelfDisabled) {
    toggleSelfDisabled(id)
  }
  React.useEffect(() => {
    return () => {
      if (activeButton !== id && selfDisabled) {
        setSelfDisabled(false)
      }
    }
  }, [activeButton, id, selfDisabled])
  return (
    <Pressable
      accessible={true}
      accessibilityLabel={text}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      disabled={disabled}
      hitSlop={themeStyle.hitSlop}
      onPress={buttonPressed}
      style={style}>
      {selfDisabled && showSpinner ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text
          allowFontScaling={false}
          style={[styles.text, { color }, textStyle, { opacity: disabled ? 0.5 : 1 }]}>
          {text}
        </Text>
      )}
    </Pressable>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    text: {
      ...themeStyle.textPrimaryRegular14,
      color: themeStyle.textWhite,
      textAlign: 'center' as 'center',
      textTransform: Brand.TRANSFORM_BUTTON_SMALL_TEXT as TextTransform,
    },
  }
}
