import * as React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../global/Hooks'

type Props = { text: string }

export default function TagNoShow(props: Props): React.ReactElement {
  const { text } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={styles.tag}>
      <Text numberOfLines={1} style={styles.text}>
        {text}
      </Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    tag: {
      alignSelf: 'flex-start' as const, //Needed to control width
      backgroundColor: themeStyle.red,
      borderRadius: themeStyle.scale(4),
      marginBottom: themeStyle.scale(8),
      paddingHorizontal: themeStyle.scale(8),
      paddingVertical: themeStyle.scale(4),
      width: 'auto' as const,
    },
    text: { ...themeStyle.textPrimaryBold12, color: themeStyle.colorWhite },
  }
}
