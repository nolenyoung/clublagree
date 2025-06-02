import * as React from 'react'
import { Defs, Line, LinearGradient, Rect, Stop, Svg, Text as SVGText } from 'react-native-svg'
import { useTheme } from '../global/Hooks'

type Props = { data: BookedClassInfo; type: '' | 'rpm' }

const colors = ['#73777E', '#0E00FC', '#FCEE58', '#3BD323', '#F66767', '#FC0006']

export default function FitMetrixChart(props: Props): React.ReactElement {
  const { data, type } = props
  const { FitMetrixData } = data
  const { themeStyle } = useTheme()
  const height = themeStyle.scale(307)
  const width = themeStyle.window.width - themeStyle.scale(40)
  const xAxisLabelPadding = themeStyle.scale(20)
  const yAxisLabelPaddingBottom = themeStyle.scale(44)
  const yAxisLabelPaddingTop = themeStyle.scale(40)
  const chartHeight = height - yAxisLabelPaddingBottom - yAxisLabelPaddingTop
  const chartWidth = width - xAxisLabelPadding
  const timeValues = `${FitMetrixData?.[`Zone0${type}Time`]},${
    FitMetrixData?.[`Zone1${type}Time`]
  },${FitMetrixData?.[`Zone2${type}Time`]},${FitMetrixData?.[`Zone3${type}Time`]},${
    FitMetrixData?.[`Zone4${type}Time`]
  }`
  const dots = React.useMemo(() => {
    const durations = timeValues.split(',').map((i) => Number(i))
    const maxDuration = Math.max(...durations) * 1.2
    return durations.map((duration, index) => {
      const x1Position = xAxisLabelPadding + chartWidth * index * 0.2
      const x2Position = xAxisLabelPadding + chartWidth * (index + 1) * 0.2
      const yPosition = yAxisLabelPaddingTop + chartHeight * (1 - duration / maxDuration)
      const yNextPosition =
        index === durations.length - 1
          ? 0
          : yAxisLabelPaddingTop + chartHeight * (1 - durations[index + 1] / maxDuration)
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      return (
        <React.Fragment key={`Zone${index}`}>
          <Defs>
            <LinearGradient id={`zone${index}Gradient`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors[index]} stopOpacity="1" />
              <Stop offset="1" stopColor={colors[index + 1]} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          {index !== durations.length - 1 && (
            <Line
              strokeLinecap="round"
              strokeLinejoin="round"
              x1={x2Position}
              x2={x2Position}
              y1={yPosition}
              y2={yNextPosition}
              strokeWidth={themeStyle.scale(4)}
              stroke={colors[index + 1]}
            />
          )}
          <Line
            x1={x1Position}
            x2={x2Position}
            y1={yPosition}
            y2={yPosition}
            strokeWidth={themeStyle.scale(4)}
            stroke={`url(#zone${index}Gradient)`}
          />
          <SVGText
            fill={themeStyle.textDarkGray}
            fontSize="10"
            fontWeight="bold"
            x={(x1Position + x2Position) / 2}
            y={yPosition - themeStyle.scale(8)}
            textAnchor="middle">
            {`${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`}
          </SVGText>
        </React.Fragment>
      )
    })
  }, [chartHeight, chartWidth, timeValues, xAxisLabelPadding, yAxisLabelPaddingTop])
  return (
    <Svg
      height={height}
      //@ts-ignore
      rx={themeStyle.scale(5)}
      ry={themeStyle.scale(5)}
      style={{ alignSelf: 'center' }}
      width={width}>
      <Defs>
        <LinearGradient id="backgroundGradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={colors[0]} stopOpacity="0.075" />
          <Stop offset="0.3" stopColor={colors[1]} stopOpacity="0.075" />
          <Stop offset="0.5" stopColor={colors[2]} stopOpacity="0.075" />
          <Stop offset="0.7" stopColor={colors[3]} stopOpacity="0.075" />
          <Stop offset="0.9" stopColor={colors[4]} stopOpacity="0.075" />
          <Stop offset="1" stopColor={colors[5]} stopOpacity="0.075" />
        </LinearGradient>
      </Defs>
      <Rect
        x={xAxisLabelPadding}
        y={yAxisLabelPaddingTop}
        fill="url(#backgroundGradient)"
        width={chartWidth}
        height={chartHeight}
        rx={themeStyle.scale(5)}
        ry={themeStyle.scale(5)}
      />
      <SVGText
        fill={themeStyle.textDarkGray}
        fontSize="20"
        fontWeight="bold"
        x={width / 2 + xAxisLabelPadding / 2}
        y={20}
        textAnchor="middle">
        TIME IN ZONES
      </SVGText>
      <SVGText
        fill={themeStyle.textDarkGray}
        fontSize="14"
        fontWeight="bold"
        rotation={-90}
        x={-(height / 2 - yAxisLabelPaddingBottom / 2)}
        y={xAxisLabelPadding / 2}
        textAnchor="middle">
        DURATION
      </SVGText>
      <SVGText
        fill={themeStyle.textDarkGray}
        fontSize="10"
        fontWeight="bold"
        x={xAxisLabelPadding + chartWidth * 0.1}
        y={height - yAxisLabelPaddingBottom * 0.6}
        textAnchor="middle">
        91-117
      </SVGText>
      <SVGText
        fill={themeStyle.textDarkGray}
        fontSize="10"
        fontWeight="bold"
        x={xAxisLabelPadding + chartWidth * 0.3}
        y={height - yAxisLabelPaddingBottom * 0.6}
        textAnchor="middle">
        118-136
      </SVGText>
      <SVGText
        fill={themeStyle.textDarkGray}
        fontSize="10"
        fontWeight="bold"
        x={xAxisLabelPadding + chartWidth * 0.5}
        y={height - yAxisLabelPaddingBottom * 0.6}
        textAnchor="middle">
        138-161
      </SVGText>
      <SVGText
        fill={themeStyle.textDarkGray}
        fontSize="10"
        fontWeight="bold"
        x={xAxisLabelPadding + chartWidth * 0.7}
        y={height - yAxisLabelPaddingBottom * 0.6}
        textAnchor="middle">
        163-177
      </SVGText>
      <SVGText
        fill={themeStyle.textDarkGray}
        fontSize="10"
        fontWeight="bold"
        x={xAxisLabelPadding + chartWidth * 0.9}
        y={height - yAxisLabelPaddingBottom * 0.6}
        textAnchor="middle">
        179-195
      </SVGText>
      <SVGText
        fill={themeStyle.textDarkGray}
        fontSize="14"
        fontWeight="bold"
        x={width / 2 + xAxisLabelPadding / 2}
        y={height}
        textAnchor="middle">
        {type === 'rpm' ? 'RPM' : 'BPM'}
      </SVGText>
      <Line
        x1={chartWidth / 5 + xAxisLabelPadding}
        y1={yAxisLabelPaddingTop}
        x2={chartWidth / 5 + xAxisLabelPadding}
        y2={yAxisLabelPaddingTop + chartHeight}
        stroke={themeStyle.paleGray}
        strokeWidth="1"
      />
      <Line
        x1={(chartWidth * 2) / 5 + xAxisLabelPadding}
        y1={yAxisLabelPaddingTop}
        x2={(chartWidth * 2) / 5 + xAxisLabelPadding}
        y2={yAxisLabelPaddingTop + chartHeight}
        stroke={themeStyle.paleGray}
        strokeWidth="1"
      />
      <Line
        x1={(chartWidth * 3) / 5 + xAxisLabelPadding}
        y1={yAxisLabelPaddingTop}
        x2={(chartWidth * 3) / 5 + xAxisLabelPadding}
        y2={yAxisLabelPaddingTop + chartHeight}
        stroke={themeStyle.paleGray}
        strokeWidth="1"
      />
      <Line
        x1={(chartWidth * 4) / 5 + xAxisLabelPadding}
        y1={yAxisLabelPaddingTop}
        x2={(chartWidth * 4) / 5 + xAxisLabelPadding}
        y2={yAxisLabelPaddingTop + chartHeight}
        stroke={themeStyle.paleGray}
        strokeWidth="1"
      />
      {dots}
    </Svg>
  )
}
