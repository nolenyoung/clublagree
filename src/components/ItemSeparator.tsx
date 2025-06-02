import * as React from 'react'
import { View } from 'react-native'
import { useTheme } from '../global/Hooks'

export default function ItemSeparator(): JSX.Element {
  const { themeStyle } = useTheme()
  return <View style={themeStyle.separator} />
}
