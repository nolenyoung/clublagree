import * as React from 'react'
import { View } from 'react-native'
import { Header, HTMLContent, TabBar } from '../components'
import { useTheme } from '../global/Hooks'

export default function PrivacyPolicy(): React.ReactElement {
  const { themeStyle } = useTheme()
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} title="Privacy" />
      <HTMLContent label="privacypolicy" />
      <TabBar />
    </View>
  )
}
