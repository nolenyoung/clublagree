import * as React from 'react'
import { AppState, AppStateStatus, Image, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { API, versionCheck } from '../global/API'
import Brand from '../global/Brand'
import { checkInitialLink, logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

export async function checkAppVersion() {
  try {
    let res = await API.getAppVersion()
    if ('EarliestVersion' in res) {
      const upToDate = versionCheck(res.EarliestVersion)
      if (upToDate === true) {
        setAction('appStatus', { updateNeeded: false })
      }
    }
  } catch (e: any) {
    logError(e)
  }
}

export default function UpdateApp(props: RootNavigatorScreenProps<'UpdateApp'>) {
  const { navigate } = props.navigation
  const { themeStyle } = useTheme()
  const updateNeeded = useSelector((state: ReduxState) => state.appStatus.updateNeeded)
  const loggedIn = useSelector(
    (state: ReduxState) => state.user.clientId != null && state.user.personId != null,
  )
  React.useEffect(() => {
    const listener = AppState.addEventListener('change', async (newState: AppStateStatus) => {
      if (newState === 'active') {
        checkAppVersion()
      }
    })
    return () => {
      listener.remove()
    }
  }, [])
  React.useEffect(() => {
    if (!updateNeeded) {
      checkInitialLink(navigate, loggedIn)
    }
  }, [loggedIn, updateNeeded])
  return (
    <View style={themeStyle.updateScreen.content}>
      <Image source={Brand.IMAGES_LOGO_LOGIN} style={[themeStyle.loginScreen.logo, styles.logo]} />
      <Text style={themeStyle.updateScreen.headerText}>{`Update Needed`}</Text>
      <Text style={themeStyle.updateScreen.bodyText}>
        {`The version of our app\nyou're using is out of date.\nPlease update in the App Store.`}
      </Text>
    </View>
  )
}

const styles = { logo: { marginBottom: 24, marginTop: 0 } }
