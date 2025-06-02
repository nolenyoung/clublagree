import * as React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../global/Hooks'

type Props = { spotsLeft: number }

export default function TagSpotsRemaining(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { spotsLeft } = props
  return (
    <View style={styles.tag}>
      <Text numberOfLines={1} style={styles.text}>
        {`${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left!`}
      </Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    tag: {
      alignSelf: 'flex-start' as 'flex-start', //Needed to control width
      backgroundColor: themeStyle.brandSecondary,
      borderRadius: themeStyle.scale(4),
      marginTop: themeStyle.scale(8),
      paddingHorizontal: themeStyle.scale(8),
      paddingVertical: themeStyle.scale(4),
      width: 'auto' as const,
    },
    text: { ...themeStyle.textPrimaryBold12, color: themeStyle.textWhite },
  }
}
