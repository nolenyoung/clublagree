import * as React from 'react'
import { View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../global/Hooks'

type Props = { size?: number }

const inputRange = [0, 33, 66, 100]

export default function AnimatedBallTriangleLoader(props: Props): React.ReactElement {
  const progress = useSharedValue(0)
  const { themeStyle } = useTheme()
  const { size = themeStyle.scale(60) } = props
  const styles = getStyles(themeStyle, size)
  const animatedBall1 = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(progress.value, inputRange, [size / 2, size, 0, size / 2]) },
        { translateY: interpolate(progress.value, inputRange, [0, size, size, 0]) },
      ],
    }
  })
  const animatedBall2 = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(progress.value, inputRange, [size, 0, size / 2, size]) },
        { translateY: interpolate(progress.value, inputRange, [size, size, 0, size]) },
      ],
    }
  })
  const animatedBall3 = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(progress.value, inputRange, [0, size / 2, size, 0]) },
        { translateY: interpolate(progress.value, inputRange, [size, 0, size, size]) },
      ],
    }
  })
  React.useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(33, { duration: 700 }),
        withTiming(66, { duration: 700 }),
        withTiming(100, { duration: 700 }),
      ),
      -1,
    )
  }, [])
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ball, animatedBall1]} />
      <Animated.View style={[styles.ball, animatedBall2]} />
      <Animated.View style={[styles.ball, animatedBall3]} />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle, size: number) {
  const ballSize = size / 3
  return {
    container: { height: size + ballSize, width: size + ballSize },
    ball: {
      backgroundColor: themeStyle.colorWhite,
      borderColor: themeStyle.buttonTextOnMain,
      borderWidth: ballSize / 5,
      borderRadius: ballSize / 2,
      height: ballSize,
      position: 'absolute' as const,
      width: ballSize,
    },
  }
}
