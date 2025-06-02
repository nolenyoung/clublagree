import * as React from 'react'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Routes from '../Routes'
import Loader from './Loader'
import ModalAddFamilyMember from './ModalAddFamilyMember'
import Toast from './Toast'
import { ThemeContext } from '../global/Context'
import getThemeStyle from '../global/Style'

export default function ThemeHandler(): React.ReactElement {
  const edgeInsets = useSafeAreaInsets()
  const { height, width } = useWindowDimensions()
  const [theme, setTheme] = React.useState<Theme>('normal')
  const currentTheme = {
    setTheme,
    theme,
    themeStyle: getThemeStyle({ edgeInsets, height, theme, width }),
  }
  return (
    <ThemeContext.Provider value={currentTheme}>
      <Routes />
      <Loader />
      <Toast />
      <ModalAddFamilyMember />
    </ThemeContext.Provider>
  )
}
