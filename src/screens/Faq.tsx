import * as React from 'react'
import { View } from 'react-native'
import { Header, HTMLContent, TabBar } from '../components'
import { useTheme } from '../global/Hooks'

export default function Faq(): React.ReactElement {
  const { themeStyle } = useTheme()
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} title="FAQ" />
      <HTMLContent label="faqs" />
      <TabBar />
    </View>
  )
}
