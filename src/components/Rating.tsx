import * as React from 'react'
import { Pressable, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'

type Props = {
  colorFilled?: string
  colorUnfilled?: string
  containerStyle?: any
  disabled?: boolean
  onPress?: (arg1: number) => void
  rating: number
  size?: number
  spacing?: number
}

export default function Rating(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const {
    colorFilled = themeStyle.brandPrimary,
    colorUnfilled = themeStyle.gray,
    containerStyle,
    disabled = true,
    onPress,
    rating,
    size = themeStyle.scale(16),
    spacing = themeStyle.scale(8),
  } = props
  const width = 5 * size + 4 * spacing
  return (
    <View style={[themeStyle.rowAlignedEvenly, { width }, containerStyle]}>
      <Pressable
        accessible={true}
        accessibilityLabel={'one_star_rating'}
        accessibilityRole={disabled ? 'image' : 'button'}
        accessibilityState={{ disabled, selected: rating >= 1 }}
        disabled={disabled}
        onPress={() => onPress && onPress(1)}>
        <Icon
          name="star"
          style={{
            color: rating >= 1 ? colorFilled : colorUnfilled,
            fontSize: size,
          }}
        />
      </Pressable>
      <Pressable
        accessible={true}
        accessibilityLabel={'two_star_rating'}
        accessibilityRole={disabled ? 'image' : 'button'}
        accessibilityState={{ disabled, selected: rating >= 2 }}
        disabled={disabled}
        onPress={() => onPress && onPress(2)}>
        <Icon
          name="star"
          style={{
            color: rating >= 2 ? colorFilled : colorUnfilled,
            fontSize: size,
          }}
        />
      </Pressable>
      <Pressable
        accessible={true}
        accessibilityLabel={'three_star_rating'}
        accessibilityRole={disabled ? 'image' : 'button'}
        accessibilityState={{ disabled, selected: rating >= 3 }}
        disabled={disabled}
        onPress={() => onPress && onPress(3)}>
        <Icon
          name="star"
          style={{
            color: rating >= 3 ? colorFilled : colorUnfilled,
            fontSize: size,
          }}
        />
      </Pressable>
      <Pressable
        accessible={true}
        accessibilityLabel={'four_star_rating'}
        accessibilityRole={disabled ? 'image' : 'button'}
        accessibilityState={{ disabled, selected: rating >= 4 }}
        disabled={disabled}
        onPress={() => onPress && onPress(4)}>
        <Icon
          name="star"
          style={{
            color: rating >= 4 ? colorFilled : colorUnfilled,
            fontSize: size,
          }}
        />
      </Pressable>
      <Pressable
        accessible={true}
        accessibilityLabel={'five_star_rating'}
        accessibilityRole={disabled ? 'image' : 'button'}
        accessibilityState={{ disabled, selected: rating >= 5 }}
        disabled={disabled}
        onPress={() => onPress && onPress(5)}>
        <Icon
          name="star"
          style={{
            color: rating >= 5 ? colorFilled : colorUnfilled,
            fontSize: size,
          }}
        />
      </Pressable>
    </View>
  )
}
