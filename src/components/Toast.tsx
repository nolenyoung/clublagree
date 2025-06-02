import * as React from 'react'
import { useSelector } from 'react-redux'
import { Text, View } from 'react-native'
import Brand from '../global/Brand'
import { Z_INDICES } from '../global/Constants'
import { useTheme } from '../global/Hooks'
import { cleanAction } from '../redux/actions'

export default function Toast(): React.ReactElement | null {
  const toast = useSelector((state: ReduxState) => state.toast)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { text, type } = toast
  React.useEffect(() => {
    if (text !== '') {
      setTimeout(() => cleanAction('toast'), 4000)
    }
  }, [text])
  if (text === '') {
    return null
  }
  return (
    <View
      style={[
        styles.toastView,
        type === 'success' && { backgroundColor: themeStyle.brandPrimary },
      ]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    toastView: {
      ...themeStyle.viewCentered,
      alignSelf: 'center' as 'center',
      backgroundColor: themeStyle.brandPrimary,
      borderColor: themeStyle.white,
      borderRadius: themeStyle.scale(5),
      borderWidth: themeStyle.scale(1),
      bottom: themeStyle.scale(60),
      maxWidth: themeStyle.window.width - themeStyle.scale(40),
      minHeight: themeStyle.scale(40),
      paddingHorizontal: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(10),
      position: 'absolute' as 'absolute',
      zIndex: Z_INDICES.toast,
    },
    text: {
      ...themeStyle.getTextStyle({
        color: Brand.COLOR_TOAST_TEXT as ColorKeys,
        font: 'fontPrimaryMedium',
        size: 14,
      }),
      textAlign: 'center' as 'center',
    },
  }
}
