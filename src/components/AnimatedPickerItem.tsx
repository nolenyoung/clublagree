import * as React from 'react'
import { Text, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated'
import { useTheme } from '../global/Hooks'

type Props = {
  height: number
  index: number
  item: string
  translateY: SharedValue<number>
  visibleCount: number
}

export default function AnimatedPickerItem(props: Props): React.ReactElement {
  const { height, index, item, translateY, visibleCount } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const y = useDerivedValue(() =>
    interpolate(
      translateY.value / -height,
      [index - visibleCount / 2, index, index + visibleCount / 2],
      [-1, 0, 1],
      Extrapolation.CLAMP,
    ),
  )

  const textAnimation = useAnimatedStyle(() => {
    return {
      opacity: 1 / (1 + Math.abs(y.value)),
      transform: [
        { scale: 1 - 0.2 * Math.abs(y.value) },
        { perspective: 500 },
        { rotateX: `${65 * y.value}deg` },
      ],
    }
  })
  return (
    <View style={[themeStyle.viewCentered, { height }]}>
      <Animated.Text style={[textAnimation, styles.text]}>{item}</Animated.Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    text: {
      color: themeStyle.textBlack,
      fontFamily: themeStyle.fontPrimaryBold,
      fontSize: themeStyle.scale(20),
    },
  }
}
