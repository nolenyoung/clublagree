import * as React from 'react'
import { Image, Text, View } from 'react-native'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

export default function Internet(): React.ReactElement {
  const { themeStyle } = useTheme()
  return (
    <View style={themeStyle.updateScreen.content}>
      <Image source={Brand.IMAGES_LOGO_LOGIN} style={[themeStyle.loginScreen.logo, styles.logo]} />
      <Text style={themeStyle.updateScreen.headerText}>No Internet Connection</Text>
      <Text style={themeStyle.updateScreen.bodyText}>
        Please check your cellular or WiFi connection.
      </Text>
    </View>
  )
}

const styles = { logo: { marginBottom: 0, marginTop: 0 } }
