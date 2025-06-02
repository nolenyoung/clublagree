import * as React from 'react'
import { Animated, PanResponder, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Brand from '../global/Brand'
import { fetchClasses, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = { containerStyle?: ViewStyleProp; disabled?: boolean; workshops: boolean }

const maximumValue = 23
const minimumValue = 0
const step = 1

export default function ClassTimeSlider(props: Props): React.ReactElement {
  const { containerStyle, disabled, workshops } = props
  const currentFilter = useSelector((state: ReduxState) => state.currentFilter)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { endTime, startTime } = currentFilter
  const [containerWidth, setContainerWidth] = React.useState(0)
  const currentStartValue = React.useRef(startTime)
  const currentEndValue = React.useRef(endTime)
  const previousStartValue = React.useRef(0)
  const previousEndValue = React.useRef(0)
  const stateStartValue = React.useRef(new Animated.Value(startTime))
  const stateEndValue = React.useRef(new Animated.Value(endTime))
  const getNewStartValue = (gestureState: any) => {
    const length = containerWidth - themeStyle.scale(16)
    const thumbLeft = previousStartValue.current + gestureState.dx
    const newValue =
      minimumValue +
      Math.round(((thumbLeft / length) * (maximumValue - minimumValue)) / step) * step
    return newValue < minimumValue ? minimumValue : newValue >= endTime ? endTime - 1 : newValue
  }
  const getNewEndValue = (gestureState: any) => {
    const length = containerWidth - themeStyle.scale(16)
    const thumbLeft = previousEndValue.current + gestureState.dx
    const newValue =
      minimumValue +
      Math.round(((thumbLeft / length) * (maximumValue - minimumValue)) / step) * step
    return newValue <= startTime ? startTime + 1 : newValue > maximumValue ? maximumValue : newValue
  }
  const onStartRelease = async (e: any, gs: any) => {
    const newValue = getNewStartValue(gs)
    fetchClasses({
      ...currentFilter,
      CountOnly: true,
      FutureOnly: true,
      startTime: newValue,
      workshops,
    })
    await logEvent('filters_time_selected')
  }
  const onEndRelease = async (e: any, gs: any) => {
    const newValue = getNewEndValue(gs)
    fetchClasses({
      ...currentFilter,
      CountOnly: true,
      FutureOnly: true,
      endTime: newValue,
      workshops,
    })
    await logEvent('filters_time_selected')
  }
  const onStartMove = (newValue: number) => {
    if (newValue >= minimumValue && newValue < currentEndValue.current) {
      stateStartValue.current.setValue(newValue)
      if (newValue !== currentStartValue.current) {
        currentStartValue.current = newValue
        setAction('currentFilter', { startTime: newValue })
      }
    }
  }
  const onEndMove = (newValue: number) => {
    if (newValue > currentStartValue.current && newValue <= maximumValue) {
      stateEndValue.current.setValue(newValue)
      if (newValue !== currentEndValue.current) {
        currentEndValue.current = newValue
        setAction('currentFilter', { endTime: newValue })
      }
    }
  }
  const [endPanResponder, setEndPanResponder] = React.useState<any>(null)
  const [startPanResponder, setStartPanResponder] = React.useState<any>(null)
  React.useEffect(() => {
    onEndMove(endTime)
  }, [endTime])
  React.useEffect(() => {
    onStartMove(startTime)
  }, [startTime])
  React.useEffect(() => {
    if (containerWidth !== 0) {
      setEndPanResponder(() =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => !disabled,
          onMoveShouldSetPanResponder: () => !disabled,
          onPanResponderGrant: () => {
            const ratio = (currentEndValue.current - minimumValue) / (maximumValue - minimumValue)
            previousEndValue.current = ratio * (containerWidth - themeStyle.scale(16))
          },
          onPanResponderMove: (e: any, gs: any) => {
            const newValue = getNewEndValue(gs)
            onEndMove(newValue)
          },
          onPanResponderRelease: onEndRelease,
          onPanResponderTerminationRequest: () => false,
          onPanResponderTerminate: onEndRelease,
        }),
      )
      setStartPanResponder(() =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => !disabled,
          onMoveShouldSetPanResponder: () => !disabled,
          onPanResponderGrant: () => {
            const ratio = (currentStartValue.current - minimumValue) / (maximumValue - minimumValue)
            previousStartValue.current = ratio * (containerWidth - themeStyle.scale(16))
          },
          onPanResponderMove: (e: any, gs: any) => {
            const newValue = getNewStartValue(gs)
            onStartMove(newValue)
          },
          onPanResponderRelease: onStartRelease,
          onPanResponderTerminationRequest: () => false,
          onPanResponderTerminate: onStartRelease,
        }),
      )
    }
  }, [containerWidth])
  const endThumbPosition = stateEndValue.current.interpolate({
    inputRange: [minimumValue, maximumValue],
    outputRange: [0, containerWidth - themeStyle.scale(16) / 2] as Array<number>,
  })
  const endLabelPosition = Animated.subtract(endThumbPosition, themeStyle.scale(10))
  const startThumbPosition = stateStartValue.current.interpolate({
    inputRange: [minimumValue, maximumValue],
    outputRange: [0, containerWidth - themeStyle.scale(16) / 2] as Array<number>,
  })
  const startLabelPosition = Animated.subtract(startThumbPosition, themeStyle.scale(10))
  const maximumTrackStyle = {
    width: Animated.subtract(
      new Animated.Value(containerWidth - themeStyle.scale(16) / 2),
      endThumbPosition,
    ),
    backgroundColor: themeStyle.black,
  } as const
  const minimumTrackStyle = {
    width: Animated.add(startThumbPosition, themeStyle.scale(16) / 2),
    backgroundColor: themeStyle.black,
  } as const
  return (
    <View
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout
        previousEndValue.current = width - themeStyle.scale(16) / 2
        setContainerWidth(width)
      }}
      style={[styles.container, containerStyle]}>
      <View style={styles.trackView}>
        <View style={styles.track} />
        <Animated.View style={[styles.track, { zIndex: 3 }, minimumTrackStyle]} />
        <Animated.View
          {...(startPanResponder ? startPanResponder.panHandlers : {})}
          style={{
            position: 'absolute' as 'absolute',
            transform: [{ translateX: startThumbPosition }, { perspective: 1000 }],
            zIndex: 99,
          }}>
          <View style={styles.thumb} />
        </Animated.View>
        <Animated.View
          {...(endPanResponder ? endPanResponder.panHandlers : {})}
          style={{
            position: 'absolute' as 'absolute',
            transform: [{ translateX: endThumbPosition }, { perspective: 1000 }],
            zIndex: 100,
          }}>
          <View style={styles.thumb} />
        </Animated.View>
        <Animated.View style={[styles.track, { right: 0, zIndex: 3 }, maximumTrackStyle]} />
      </View>
      <View style={styles.thumbLabelRow}>
        <Animated.View
          style={[
            styles.thumbLabelView,
            { transform: [{ translateX: startLabelPosition }, { perspective: 1000 }] },
          ]}>
          <Text style={styles.labelText}>
            {startTime > 11
              ? `${startTime === 12 ? '12' : startTime - 12}pm`
              : `${startTime === 0 ? '12' : startTime}am`}
          </Text>
        </Animated.View>
        <Animated.View
          style={[
            styles.thumbLabelView,
            { transform: [{ translateX: endLabelPosition }, { perspective: 1000 }] },
          ]}>
          <Text style={styles.labelText}>
            {endTime > 11 ? `${endTime === 12 ? '12' : endTime - 12}pm` : `${endTime}am`}
          </Text>
        </Animated.View>
      </View>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    container: { width: '100%' as const },
    trackView: { ...themeStyle.rowAligned, width: '100%' } as const,
    track: {
      position: 'absolute' as 'absolute',
      height: themeStyle.scale(4),
      borderRadius: themeStyle.scale(2),
      backgroundColor: Brand.COLOR_FILTER_SLIDER,
      width: '100%' as const,
      zIndex: 1,
    },
    thumb: {
      height: themeStyle.scale(16),
      width: themeStyle.scale(16),
      borderColor: Brand.COLOR_FILTER_SLIDER,
      borderRadius: themeStyle.scale(8),
      borderWidth: themeStyle.scale(3),
      backgroundColor: themeStyle.white,
      zIndex: 99,
    },
    thumbLabelRow: { ...themeStyle.rowAligned, marginTop: themeStyle.scale(20) },
    thumbLabelView: {
      alignItems: 'center' as 'center',
      position: 'absolute' as 'absolute',
      width: themeStyle.scale(40),
    },
    labelText: { ...themeStyle.textPrimaryRegular12, textAlign: 'center' as 'center' },
  }
}
