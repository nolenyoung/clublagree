import * as React from 'react'
import { Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useTheme } from '../global/Hooks'

type Props = {
  containerStyle?: ViewStyleProp
  maxLabel?: string
  maxValue: number
  minLabel?: string
  minValue: number
  onChange: (value: number) => void | React.Dispatch<React.SetStateAction<number>>
  thumbSize?: number
  trackHeight?: number
  value: number
}

export default function Slider(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const {
    containerStyle,
    maxLabel,
    maxValue,
    minLabel,
    minValue,
    onChange,
    thumbSize = themeStyle.scale(30),
    trackHeight = themeStyle.scale(5),
    value,
  } = props
  const styles = getStyles(themeStyle, thumbSize, trackHeight)
  const [containerWidth, setContainerWidth] = React.useState(0)
  const range = maxValue - minValue
  const translateX = useSharedValue(Math.min((value - minValue) / range, 0))
  const panGesture = Gesture.Pan().onChange((event) => {
    'worklet'
    let newPosition = event.changeX + translateX.value
    if (newPosition >= 0 && newPosition <= containerWidth) {
      translateX.value = newPosition
      runOnJS(onChange)(Math.round((newPosition / containerWidth) * range + minValue))
    }
  })
  const animatedThumbStyle = useAnimatedStyle(() => {
    return { transform: [{ translateX: translateX.value - thumbSize / 2 }] }
  })
  const animatedTrackStyle = useAnimatedStyle(() => {
    return { width: translateX.value }
  })
  React.useEffect(() => {
    translateX.value = ((value - minValue) * containerWidth) / range
  }, [containerWidth, minValue, range, value])
  return (
    <View style={containerStyle}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.gestureView}>
          <View
            onLayout={(event) => {
              setContainerWidth(event.nativeEvent.layout.width)
            }}
            style={styles.trackContainer}>
            <View style={styles.track} />
            <Animated.View style={[styles.trackFilled, animatedTrackStyle]} />
            <Animated.View style={[styles.thumb, animatedThumbStyle]} />
          </View>
        </View>
      </GestureDetector>
      {(maxLabel != null || minLabel != null) && (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>{minLabel}</Text>
          <Text style={styles.labelText}>{maxLabel}</Text>
        </View>
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle, thumbSize: number, trackHeight: number) {
  const commonTrackStyle = { ...themeStyle.rowAligned, height: trackHeight, width: '100%' as const }
  return {
    gestureView: { paddingHorizontal: thumbSize / 2 },
    trackContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      paddingVertical: themeStyle.scale(16),
      width: '100%' as const,
    },
    track: { ...commonTrackStyle, backgroundColor: themeStyle.lightGray },
    trackFilled: {
      ...commonTrackStyle,
      backgroundColor: themeStyle.brandPrimary,
      position: 'absolute' as const,
      zIndex: 2,
    },
    thumb: {
      backgroundColor: themeStyle.brandPrimary,
      borderRadius: thumbSize / 2,
      height: thumbSize,
      position: 'absolute' as const,
      width: thumbSize,
      zIndex: 3,
    },
    labelRow: { ...themeStyle.rowAlignedBetween, marginTop: themeStyle.scale(8) },
    labelText: { ...themeStyle.textPrimaryBold14, color: themeStyle.colorWhite },
  }
}
