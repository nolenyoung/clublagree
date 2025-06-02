import MaskedView from '@react-native-masked-view/masked-view'
import * as React from 'react'
import { View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import AnimatedPickerItem from './AnimatedPickerItem'
import { useTheme } from '../global/Hooks'

type Props<V> = {
  data: V[]
  indexingFunction: (arg: V) => boolean
  itemHeight?: number
  onSelect: (arg: V) => void
  value: V
  visibleItems?: number
}

const snapPoint = (value: number, velocity: number, points: ReadonlyArray<number>): number => {
  'worklet'
  const point = value + 0.2 * velocity
  const deltas = points.map((p) => Math.abs(point - p))
  const minDelta = Math.min.apply(null, deltas)
  return points.filter((p) => Math.abs(point - p) === minDelta)[0]
}

const timingOptions = {
  duration: 1000,
  easing: Easing.bezier(0.35, 1, 0.35, 1),
}

export default function AnimatedPicker<V>(props: Props<V>): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    data,
    indexingFunction,
    itemHeight = themeStyle.scale(30),
    onSelect,
    value,
    visibleItems = 5,
  } = props
  const snapPoints = new Array(data.length).fill(0).map((_, i) => i * -itemHeight)
  const initialIndex = data.findIndex(indexingFunction)
  const translateY = useSharedValue(initialIndex * -itemHeight)
  const panGesture = Gesture.Pan()
    .onChange((event) => {
      const newPosition = event.changeY + translateY.value
      if (newPosition > -itemHeight * data.length && newPosition < itemHeight * data.length) {
        translateY.value = newPosition
      }
    })
    .onEnd((event) => {
      const snapPointY = snapPoint(translateY.value, event.velocityY, snapPoints)
      const index = Math.abs(snapPointY / itemHeight)
      translateY.value = withTiming(snapPointY, timingOptions)
      runOnJS(onSelect)(data[Math.round(index)])
    })
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))
  React.useEffect(() => {
    if (value === 0) {
      translateY.value = withTiming(0, timingOptions)
    }
  }, [value])
  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <MaskedView
          androidRenderingMode="software"
          maskElement={
            <Animated.View
              style={[
                animatedStyle,
                {
                  height: itemHeight * visibleItems,
                  paddingTop: (itemHeight * visibleItems) / 2 - itemHeight / 2,
                },
              ]}>
              {data.map((item, index) => (
                <AnimatedPickerItem
                  key={index}
                  height={itemHeight}
                  index={index}
                  item={String(item)}
                  translateY={translateY}
                  visibleCount={visibleItems}
                />
              ))}
            </Animated.View>
          }>
          <View collapsable={false}>
            <View
              style={{
                height: itemHeight * Math.trunc(visibleItems / 2),
                backgroundColor: themeStyle.lightGray,
              }}
            />
            <View style={{ height: itemHeight, backgroundColor: themeStyle.black }} />
            <View
              style={{
                height: itemHeight * Math.trunc(visibleItems / 2),
                backgroundColor: themeStyle.lightGray,
              }}
            />
          </View>
        </MaskedView>
      </GestureDetector>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    container: {
      height: '100%' as const,
      justifyContent: 'center' as const,
      overflow: 'hidden' as const,
      width: themeStyle.scale(60),
    },
  }
}
