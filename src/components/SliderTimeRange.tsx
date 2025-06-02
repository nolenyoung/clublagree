import * as React from 'react'
import {
  Animated,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  Text,
  View,
} from 'react-native'
import { useTheme } from '../global/Hooks'

type Props = {
  containerStyle?: ViewStyleProp
  disabled?: boolean
  endValue: number
  maximumValue?: number
  minimumValue?: number
  onSetEnd: (arg: number) => void
  onSetStart: (arg: number) => void
  startValue: number
  step?: number
}

export default function SliderTimeRange(props: Props) {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    containerStyle,
    disabled,
    endValue,
    maximumValue = 23,
    minimumValue = 0,
    onSetEnd,
    onSetStart,
    startValue,
    step = 1,
  } = props
  const [containerWidth, setContainerWidth] = React.useState(0)
  const currentStartValue = React.useRef(startValue)
  const currentEndValue = React.useRef(endValue)
  const previousStartValue = React.useRef(0)
  const previousEndValue = React.useRef(0)
  const stateStartValue = React.useRef(new Animated.Value(startValue))
  const stateEndValue = React.useRef(new Animated.Value(endValue))
  const getNewStartValue = (gestureState: PanResponderGestureState) => {
    const length = containerWidth - themeStyle.scale(24)
    const thumbLeft = previousStartValue.current + gestureState.dx
    const newValue =
      minimumValue +
      Math.round(((thumbLeft / length) * (maximumValue - minimumValue)) / step) * step
    return newValue < minimumValue ? minimumValue : newValue >= endValue ? endValue - 1 : newValue
  }
  const getNewEndValue = (gestureState: PanResponderGestureState) => {
    const length = containerWidth - themeStyle.scale(24)
    const thumbLeft = previousEndValue.current + gestureState.dx
    const newValue =
      minimumValue +
      Math.round(((thumbLeft / length) * (maximumValue - minimumValue)) / step) * step
    return newValue <= startValue
      ? startValue + 1
      : newValue > maximumValue
        ? maximumValue
        : newValue
  }
  const onStartMove = (newValue: number) => {
    if (newValue >= minimumValue && newValue < currentEndValue.current) {
      stateStartValue.current.setValue(newValue)
      if (newValue !== currentStartValue.current) {
        currentStartValue.current = newValue
        onSetStart(newValue)
      }
    }
  }
  const onEndMove = (newValue: number) => {
    if (newValue > currentStartValue.current && newValue <= maximumValue) {
      stateEndValue.current.setValue(newValue)
      if (newValue !== currentEndValue.current) {
        currentEndValue.current = newValue
        onSetEnd(newValue)
      }
    }
  }
  const [endPanResponder, setEndPanResponder] = React.useState<PanResponderInstance | null>(null)
  const [startPanResponder, setStartPanResponder] = React.useState<PanResponderInstance | null>(
    null,
  )
  React.useEffect(() => {
    onEndMove(endValue)
  }, [endValue])
  React.useEffect(() => {
    onStartMove(startValue)
  }, [startValue])
  React.useEffect(() => {
    if (containerWidth !== 0) {
      setEndPanResponder(() =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => !disabled,
          onMoveShouldSetPanResponder: () => !disabled,
          onPanResponderGrant: () => {
            const ratio = (currentEndValue.current - minimumValue) / (maximumValue - minimumValue)
            previousEndValue.current = ratio * (containerWidth - themeStyle.scale(24))
          },
          onPanResponderMove: (e, gs: PanResponderGestureState) => {
            const newValue = getNewEndValue(gs)
            onEndMove(newValue)
          },
          // onPanResponderRelease: onEndRelease,
          onPanResponderTerminationRequest: () => false,
          // onPanResponderTerminate: onEndRelease
        }),
      )
      setStartPanResponder(() =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => !disabled,
          onMoveShouldSetPanResponder: () => !disabled,
          onPanResponderGrant: () => {
            const ratio = (currentStartValue.current - minimumValue) / (maximumValue - minimumValue)
            previousStartValue.current = ratio * (containerWidth - themeStyle.scale(24))
          },
          onPanResponderMove: (e, gs: PanResponderGestureState) => {
            const newValue = getNewStartValue(gs)
            onStartMove(newValue)
          },
          // onPanResponderRelease: onStartRelease,
          onPanResponderTerminationRequest: () => false,
          // onPanResponderTerminate: onStartRelease
        }),
      )
    }
  }, [containerWidth])
  const endThumbPosition = stateEndValue.current.interpolate({
    inputRange: [minimumValue, maximumValue],
    outputRange: [0, containerWidth - themeStyle.scale(24) / 2],
  })
  const startThumbPosition = stateStartValue.current.interpolate({
    inputRange: [minimumValue, maximumValue],
    outputRange: [0, containerWidth - themeStyle.scale(24) / 2],
  })
  const maximumTrackStyle = {
    width: Animated.subtract(
      new Animated.Value(containerWidth - themeStyle.scale(24) / 2),
      endThumbPosition,
    ),
    backgroundColor: themeStyle.darkGray,
  }
  const minimumTrackStyle = {
    width: Animated.add(startThumbPosition, themeStyle.scale(24) / 2),
    backgroundColor: themeStyle.darkGray,
  }
  return (
    <View
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout
        previousEndValue.current = width - themeStyle.scale(24) / 2
        setContainerWidth(width)
      }}
      style={[styles.container, containerStyle]}>
      <View style={styles.thumbLabelRow}>
        <Text style={styles.labelText}>
          {startValue > 11
            ? `${startValue === 12 ? '12' : startValue - 12}pm`
            : `${startValue === 0 ? '12' : startValue}am`}
        </Text>
        <Text style={styles.labelText}>
          {endValue > 11 ? `${endValue === 12 ? '12' : endValue - 12}pm` : `${endValue}am`}
        </Text>
      </View>
      <View style={styles.trackView}>
        <View style={styles.track} />
        <Animated.View style={[styles.track, { zIndex: 3 }, minimumTrackStyle]} />
        <Animated.View
          {...(startPanResponder ? startPanResponder.panHandlers : {})}
          style={{
            position: 'absolute',
            transform: [{ translateX: startThumbPosition }, { perspective: 1000 }],
            zIndex: 99,
          }}>
          <View style={styles.thumb} />
        </Animated.View>
        <Animated.View
          {...(endPanResponder ? endPanResponder.panHandlers : {})}
          style={{
            position: 'absolute',
            transform: [{ translateX: endThumbPosition }, { perspective: 1000 }],
            zIndex: 100,
          }}>
          <View style={styles.thumb} />
        </Animated.View>
        <Animated.View style={[styles.track, { right: 0, zIndex: 3 }, maximumTrackStyle]} />
      </View>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    container: { width: '100%' as const },
    trackView: { ...themeStyle.rowAligned, width: '100%' as const },
    track: {
      position: 'absolute' as const,
      height: themeStyle.scale(4),
      borderRadius: themeStyle.scale(2),
      backgroundColor: themeStyle.brandPrimary,
      width: '100%' as const,
      zIndex: 1,
    },
    thumb: {
      height: themeStyle.scale(24),
      width: themeStyle.scale(24),
      borderColor: themeStyle.brandPrimary,
      borderRadius: themeStyle.scale(12),
      borderWidth: themeStyle.scale(2),
      backgroundColor: themeStyle.colorWhite,
      zIndex: 99,
    },
    thumbLabelRow: { ...themeStyle.rowAlignedBetween, marginBottom: themeStyle.scale(20) },
    labelText: { ...themeStyle.textPrimaryMedium12, textAlign: 'center' as const },
  }
}
