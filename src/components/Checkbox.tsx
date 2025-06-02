import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'

type Props = {
  activeOpacity?: number
  containerStyle?: ViewStyleProp
  disabled?: boolean
  fullWidth?: boolean
  onPress?: () => Promise<void> | void
  rowStyle?: ViewStyleProp
  selected: boolean
  text?: string
  textStyle?: TextStyleProp
}

export default function Checkbox(props: Props): React.ReactElement {
  const {
    activeOpacity = 0.2,
    containerStyle,
    disabled = false,
    fullWidth = true,
    onPress = () => {},
    rowStyle,
    selected,
    text,
    textStyle,
  } = props
  const { themeStyle } = useTheme()
  const accessibilityState = React.useMemo(() => ({ disabled, selected }), [disabled, selected])
  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel="Checkbox"
      accessibilityRole="checkbox"
      accessibilityState={accessibilityState}
      activeOpacity={activeOpacity}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, containerStyle]}>
      <View style={[styles.row, text != null && fullWidth && { width: '100%' as const }, rowStyle]}>
        <View style={[themeStyle.checkbox.empty, selected && themeStyle.checkbox.selected]}>
          {selected && <Icon name="check" style={themeStyle.checkbox.icon} />}
        </View>
        {text != null && <Text style={[themeStyle.checkbox.text, textStyle]}>{text}</Text>}
      </View>
    </TouchableOpacity>
  )
}

const styles = { row: { flexDirection: 'row' as 'row' } }
