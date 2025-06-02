import * as React from 'react'
import { Pressable } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../global/Hooks'

type Props = {
  containerStyle?: ViewStyleProp
  onPress: (arg1?: any) => Promise<void> | void
  selected: boolean
}

const AnimatedTouchable = Animated.createAnimatedComponent(Pressable)

export default function Switch(props: Props): React.ReactElement {
  const { containerStyle, onPress, selected } = props
  const color = useSharedValue(selected ? 1 : 0)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const leftMargin = themeStyle.scale(16)
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        color.value,
        [0, 1],
        [themeStyle.white, themeStyle.brandSecondary],
      ),
      borderColor: interpolateColor(
        color.value,
        [0, 1],
        [themeStyle.gray, themeStyle.brandSecondary],
      ),
    }
  }, [])
  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(color.value, [0, 1], [themeStyle.gray, themeStyle.white]),
      marginLeft: interpolate(color.value, [0, 1], [0, leftMargin]),
    }
  }, [leftMargin])
  React.useEffect(() => {
    color.value = withTiming(selected ? 1 : 0, { duration: 500 })
  }, [selected])
  return (
    <AnimatedTouchable
      accessible={true}
      accessibilityLabel={'toggleSwitch'}
      accessibilityRole="switch"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.container, containerStyle, animatedContainerStyle]}>
      <Animated.View style={[styles.circle, animatedCircleStyle]} />
    </AnimatedTouchable>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    container: {
      ...themeStyle.rowAligned,
      borderRadius: themeStyle.scale(13),
      borderWidth: themeStyle.scale(1),
      height: themeStyle.scale(26),
      paddingHorizontal: themeStyle.scale(2),
      width: themeStyle.scale(42),
    },
    circle: {
      borderRadius: themeStyle.scale(10),
      height: themeStyle.scale(20),
      width: themeStyle.scale(20),
    },
  }
}
