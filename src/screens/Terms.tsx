import * as React from 'react'
import { View } from 'react-native'
import { Header, HTMLContent, TabBar } from '../components'
import { useTheme } from '../global/Hooks'

export default function Terms(): React.ReactElement {
  const { themeStyle } = useTheme()
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} title="Terms and Conditions" />
      <HTMLContent label="termsconditions" />
      <TabBar />
    </View>
  )
}
