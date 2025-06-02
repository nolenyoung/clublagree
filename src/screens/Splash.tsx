import * as React from 'react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Image, ImageBackground, Platform, View } from 'react-native'
import media from '../assets/media'
import { useTheme } from '../global/Hooks'

export default function Splash() {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={styles.content}>
      <Image source={media.logoText} style={styles.logo} />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { ...themeStyle.flexViewCentered, backgroundColor: themeStyle.brandPrimary },
    logo: {
      height: themeStyle.scale(192),
      resizeMode: 'contain' as const,
      width: themeStyle.scale(229),
    },
  }
}
