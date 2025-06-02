import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useSelector } from 'react-redux'
import { Z_INDICES } from '../global/Constants'
import { useTheme } from '../global/Hooks'

export default function Loader(): React.ReactElement | null {
  const { loading } = useSelector((state: ReduxState) => state.loading)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  if (!loading) {
    return null
  }
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="gray" />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    loading: {
      ...themeStyle.viewCentered,
      backgroundColor: '#000000AF',
      bottom: 0,
      left: 0,
      position: 'absolute' as 'absolute',
      right: 0,
      top: 0,
      zIndex: Z_INDICES.loader,
    },
  }
}
