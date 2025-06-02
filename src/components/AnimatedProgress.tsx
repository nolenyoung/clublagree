import * as React from 'react'
import { Animated } from 'react-native'
import Svg, { Circle, Line } from 'react-native-svg'
import { useTheme } from '../global/Hooks'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

type Props = {
  color?: string
  containerStyle?: ViewStyleProp
  progress: Animated.Value
  size: number
  strokeWidth?: number
}

const lineAngles = [22.5, 45, 67.5, 90, 112.5, 135, 157.5]
const lineStyleGray = { position: 'absolute' as 'absolute', top: 0, zIndex: 2 } as const
const lineStyleWhite = { position: 'absolute' as 'absolute', top: 0, zIndex: 4 } as const

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

export default function AnimatedProgress(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const {
    color = themeStyle.brandPrimary,
    containerStyle,
    progress,
    size,
    strokeWidth = themeStyle.scale(32),
  } = props
  const halfSize = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const lines = React.useMemo(
    () =>
      lineAngles.map((angle) => ({
        key: `line${angle}`,
        x1: halfSize - Math.cos(toRad(angle)) * halfSize,
        y1: halfSize - Math.sin(toRad(angle)) * halfSize,
        x2: halfSize - Math.cos(toRad(angle)) * (halfSize - strokeWidth),
        y2: halfSize - Math.sin(toRad(angle)) * (halfSize - strokeWidth),
      })),
    [halfSize, strokeWidth],
  )
  return (
    <Svg height={halfSize} origin={`${halfSize} ${halfSize}`} style={containerStyle} width={size}>
      <Circle
        cx={halfSize}
        cy={halfSize}
        fill="transparent"
        r={radius}
        stroke={themeStyle.white}
        strokeDasharray={`${circumference} ${circumference / 2}`}
        strokeWidth={strokeWidth}
      />
      <AnimatedCircle
        cx={halfSize}
        cy={halfSize}
        fill="transparent"
        r={radius}
        stroke={color}
        strokeDasharray={`${circumference / 2} ${circumference / 2}`}
        strokeDashoffset={Animated.multiply(
          progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -Math.PI] as Array<number>,
          }),
          radius,
        )}
        strokeWidth={strokeWidth}
      />
      {lines.map((line) => (
        <Line
          key={`${line.key}gray`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={themeStyle.fadedGray}
          strokeWidth={themeStyle.scale(2)}
          //@ts-ignore
          style={lineStyleGray}
        />
      ))}
      {lines.map((line) => (
        <Line
          key={`${line.key}white`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={themeStyle.fadedGray}
          strokeWidth={themeStyle.scale(2)}
          //@ts-ignore
          style={lineStyleWhite}
        />
      ))}
    </Svg>
  )
}
