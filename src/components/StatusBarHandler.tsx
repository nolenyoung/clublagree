import * as React from 'react'
import { StatusBar, StatusBarStyle } from 'react-native'
import { useSelector } from 'react-redux'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

export default function StatusBarHandler(): React.ReactElement {
  const currentScreen = useSelector((state: ReduxState) => state.screens.currentScreen)
  const { theme } = useTheme()
  const [barStyle, setBarStyle] = React.useState<StatusBarStyle>(
    Brand.STATUS_BAR_CONTENT as StatusBarStyle,
  )
  React.useEffect(() => {
    const darkContent = Brand.STATUS_BAR_CONTENT === 'dark-content'
    const omitted = Brand.STATUS_BAR_SCREENS_OMIT.includes(currentScreen)
    if (theme === 'dark' || (darkContent && omitted) || (!darkContent && !omitted)) {
      setBarStyle('light-content')
    } else {
      setBarStyle('dark-content')
    }
  }, [currentScreen, theme])
  return <StatusBar backgroundColor="transparent" barStyle={barStyle} translucent={true} />
}
