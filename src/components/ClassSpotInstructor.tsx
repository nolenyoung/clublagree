import * as React from 'react'
import { Pressable, View } from 'react-native'
import Icon from './Icon'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = {
  available: boolean
  onPress: () => void
  selected: boolean
  text: string
}

export default function ClassSpotInstructor(props: Props): React.ReactElement {
  const { available, onPress } = props
  const [size, setSize] = React.useState(0)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle, size)
  return (
    <View
      onLayout={(event) => {
        setSize(event.nativeEvent.layout.height)
      }}
      style={styles.content}>
      <Pressable disabled={!available} onPress={onPress} style={styles.spot}>
        <Icon name="instructor" style={styles.instructorIcon} />
      </Pressable>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle, spotSize: number) {
  return {
    content: { height: '100%', width: '100%' } as const,
    spot: {
      ...themeStyle.viewCentered,
      height: spotSize,
      overflow: 'hidden' as 'hidden',
      width: spotSize,
    },
    instructorIcon: {
      alignSelf: 'center' as 'center',
      color: themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys],
      fontSize: spotSize === 0 ? 1 : spotSize,
    },
  }
}
