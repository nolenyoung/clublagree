import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = {
  available: boolean
  onPress: () => void
  selected: boolean
  text: string
}

export default function ClassSpot(props: Props): React.ReactElement {
  const { available, onPress, selected, text } = props
  const [size, setSize] = React.useState(0)
  const { themeStyle } = useTheme()
  const styles = React.useMemo(() => getStyles(themeStyle, size), [size, themeStyle])
  return (
    <View
      onLayout={(event) => {
        setSize(event.nativeEvent.layout.height)
      }}
      style={styles.content}>
      <Pressable
        disabled={!available}
        onPress={onPress}
        style={[styles.spot, available && styles.availableSpot, selected && styles.selectedSpot]}>
        <Text style={[styles.text, selected && styles.selectedText]}>{text}</Text>
      </Pressable>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle, spotSize: number) {
  return {
    content: { height: '100%', width: '100%' } as const,
    spot: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.gray,
      borderRadius: spotSize / 2,
      height: spotSize,
      overflow: 'hidden',
      width: spotSize,
    },
    availableSpot: { backgroundColor: themeStyle.white },
    selectedSpot: { backgroundColor: themeStyle.brandPrimary },
    text: {
      color: themeStyle.textBlack,
      fontFamily: themeStyle.fontPrimaryRegular,
      fontSize: spotSize === 0 ? 1 : spotSize / 2.5,
      textAlign: 'center' as 'center',
    },
    selectedText: {
      color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys],
      fontFamily: themeStyle.fontPrimaryBold,
    },
  }
}
