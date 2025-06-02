import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import Icon from './Icon'
import { getFitMetrixChartType } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = {
  data: FitMetrixData
  hideMore?: boolean
  onMore?: () => void
}

export default function FitMetrixSummary(props: Props): React.ReactElement {
  const {
    data: { MaxSpeed, TotalCalories, TotalMinutes, TotalPoints },
    hideMore = false,
    onMore = () => {},
  } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const hours = Math.floor(Number(TotalMinutes) / 60)
  const minutes = Number(TotalMinutes) % 60
  const type = getFitMetrixChartType(props.data)
  return (
    <View style={styles.content}>
      <View style={styles.item}>
        <Icon name="stopwatch" style={styles.iconStopwatch} />
        <Text style={styles.text}>
          {`${String(hours).length === 1 ? '0' + hours : hours}:${
            String(minutes).length === 1 ? '0' + minutes : minutes
          } hrs`}
        </Text>
      </View>
      <View style={styles.item}>
        <Icon name="fire" style={styles.iconFire} />
        <Text style={styles.text}>{TotalCalories} Cal</Text>
      </View>
      {type !== '' && (
        <View style={styles.item}>
          <Icon name="speedometer" style={styles.iconSpeedometer} />
          <Text style={styles.text}>{MaxSpeed} mph</Text>
        </View>
      )}
      <View style={styles.item}>
        <Icon name="trophy" style={styles.iconTrophy} />
        <Text style={styles.text}>{TotalPoints} Points</Text>
      </View>
      {!hideMore && (
        <Pressable onPress={onMore} style={themeStyle.flexViewCentered}>
          <View style={themeStyle.viewCentered}>
            <Icon name="plus" style={styles.iconPlus} />
            <Text style={styles.text}>More</Text>
          </View>
        </Pressable>
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const fontSize = themeStyle.scale(22)
  return {
    content: { ...themeStyle.rowAlignedBetween, paddingBottom: themeStyle.scale(16) },
    item: {
      ...themeStyle.flexViewCentered,
      borderColor: themeStyle.paleGray,
      borderRightWidth: themeStyle.scale(1),
    },
    iconStopwatch: { color: '#285FE1', fontSize },
    iconFire: { color: '#FF5700', fontSize },
    iconSpeedometer: { color: '#9100FF', fontSize },
    iconTrophy: { color: '#FFBB00', fontSize },
    iconPlus: { color: '#4CB748', fontSize },
    text: {
      color: themeStyle.textGray,
      fontFamily: themeStyle.fontPrimaryMedium,
      fontSize: themeStyle.scale(10),
      marginTop: themeStyle.scale(6),
    },
  }
}
