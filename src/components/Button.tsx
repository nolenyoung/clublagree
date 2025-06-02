import * as React from 'react'
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSelector } from 'react-redux'
import Icon from './Icon'
import { useLoadingDots, useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'
import { getButtonStyle } from '../global/Functions'

type Props = {
  activateButtonPress?: (arg1: (arg1?: any) => Promise<void> | void) => void
  allowFontScaling?: boolean
  animated?: boolean // set to true for async or long running onPress actions,
  color?: string // button background color. Default is brandPrimary,
  colors?: Array<string> //Can be passed along when gradient prop is true,
  disabled?: boolean // whether or not the button is disabled,
  disabledStyling?: boolean //whether to show disabled styling,
  gradient?: boolean
  leftIcon?: string // icon to the left of the text in the button,
  onPress: (arg1?: any) => any // onPress handler,
  rightIcon?: string // icon to the left of the text in the button,
  showSpinner?: boolean
  small?: boolean // is the button small or large. Default: false,
  style?: ViewStyleProp // styling for the specific instance of the button,
  text: string // text to render in the button,
  textColor?: ColorKeys
  textStyle?: TextStyleProp
  toggleSelfDisabled?: (id: string) => void
  width?: number // fixed width of the button. Default button width is based on text length
}

export default function Button(props: Props): React.ReactElement {
  const activeButton = useSelector((state: ReduxState) => state.activeButton.id)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    activateButtonPress,
    allowFontScaling = false,
    animated = false,
    color = themeStyle.brandPrimary,
    colors = [themeStyle.brandPrimary, themeStyle.brandTertiary],
    disabled: parentDisabled = false,
    disabledStyling = true,
    gradient = false,
    leftIcon = '',
    onPress,
    rightIcon = '',
    showSpinner,
    small = false,
    style,
    text,
    textColor,
    textStyle,
    toggleSelfDisabled,
    width = 'auto',
  } = props
  const [selfDisabled, setSelfDisabled] = React.useState(false)
  const id = React.useId()
  const buttonPressed = React.useCallback(() => {
    Keyboard.dismiss()
    if (animated) {
      setSelfDisabled(true)
      setAction('activeButton', { id })
      onPress()
    } else {
      onPress()
    }
  }, [animated, id, onPress])
  const { circle1, circle2, circle3 } = useLoadingDots(selfDisabled)
  const disabled = parentDisabled || selfDisabled
  const accessibilityState = React.useMemo(() => ({ disabled }), [disabled])
  const typeStyle = React.useMemo(
    () => getButtonStyle({ color, disabled, disabledStyling, small, textColor, themeStyle, width }),
    [color, disabled, disabledStyling, small, textColor, themeStyle, width],
  )
  if (toggleSelfDisabled) {
    toggleSelfDisabled(id)
  }
  if (activateButtonPress) {
    activateButtonPress(buttonPressed)
  }
  React.useEffect(() => {
    if (activeButton !== id && selfDisabled) {
      setSelfDisabled(false)
    }
  }, [activeButton, id, selfDisabled])
  return (
    <React.Fragment>
      <TouchableOpacity
        accessible={true}
        accessibilityLabel={text}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        disabled={disabled}
        onPress={buttonPressed}
        style={[
          typeStyle.button,
          style,
          disabled && disabledStyling && { backgroundColor: themeStyle.darkGray },
        ]}>
        <React.Fragment>
          <LinearGradient
            colors={
              gradient
                ? disabled && disabledStyling
                  ? [themeStyle.darkGray, themeStyle.darkGray]
                  : colors
                : ['transparent', 'transparent']
            }
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 1 }}
            style={themeStyle.fullGradientView}
          />
          <View
            style={
              rightIcon !== '' && !selfDisabled
                ? { ...themeStyle.rowAlignedAround, width }
                : themeStyle.rowAligned
            }>
            {leftIcon !== '' && !selfDisabled && (
              <Icon name={leftIcon} style={typeStyle.leftIcon} />
            )}
            {selfDisabled && (
              <View style={styles.disabledAnimationView}>
                {showSpinner ? (
                  <ActivityIndicator color={typeStyle.text.color} />
                ) : (
                  <View style={themeStyle.rowAligned}>
                    <Animated.View style={[typeStyle.loadingCircle, { opacity: circle1 }]} />
                    <Animated.View style={[typeStyle.loadingCircle, { opacity: circle2 }]} />
                    <Animated.View style={[typeStyle.loadingCircle, { opacity: circle3 }]} />
                  </View>
                )}
              </View>
            )}
            <Text
              allowFontScaling={allowFontScaling}
              style={[typeStyle.text, textStyle, selfDisabled && { opacity: 0 }]}>
              {text}
            </Text>
            {rightIcon !== '' && !selfDisabled && (
              <Icon name={rightIcon} style={typeStyle.rightIcon} />
            )}
          </View>
        </React.Fragment>
      </TouchableOpacity>
      {selfDisabled && (
        <Modal
          animationType="none"
          onRequestClose={() => setSelfDisabled(false)}
          statusBarTranslucent={true}
          transparent={true}
          visible={true}>
          <View style={styles.disabledOverlay} />
        </Modal>
      )}
    </React.Fragment>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    disabledAnimationView: {
      ...themeStyle.viewCentered,
      bottom: 0,
      left: 0,
      position: 'absolute' as 'absolute',
      right: 0,
      top: 0,
      zIndex: 2,
    },
    disabledOverlay: { ...themeStyle.fullImageBackground, backgroundColor: 'transparent' },
  }
}
