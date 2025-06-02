import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Icon, LoginLookup, LoginOptions, LoginVerify } from '../components'
import { API } from '../global/API'
import { logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

export default function Login(props: RootNavigatorScreenProps<'Login'>) {
  const { navigate } = props.navigation
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [options, setOptions] = React.useState<LoginOption[]>([])
  const [step, setStep] = React.useState(0)
  const [type, setType] = React.useState('')
  const [username, setUsername] = React.useState('')
  const onBackPress = React.useCallback(() => {
    setStep((prev) => prev - 1)
  }, [step])
  const onExit = React.useCallback(() => {
    navigate('Auth')
  }, [])
  async function onSendVerification() {
    try {
      let response = await API.setLoginOption({ Email: username, Type: type })
      cleanAction('activeButton')
      if (response.code === 200) {
        setStep(2)
      } else {
        setAction('toast', { text: response.message ?? 'Unable to send verification code.' })
      }
    } catch (e: any) {
      cleanAction('activeButton')
      logError(e)
      setAction('toast', { text: 'Unable to send verification code.' })
    }
  }
  return (
    <View style={themeStyle.screenSecondary}>
      <View style={[styles.headerRow, step === 0 && { justifyContent: 'flex-end' }]}>
        {step !== 0 && (
          <TouchableOpacity hitSlop={themeStyle.hitSlopLarge} onPress={onBackPress}>
            <Icon name="arrow-back" style={themeStyle.headerIcon} />
          </TouchableOpacity>
        )}
        <TouchableOpacity hitSlop={themeStyle.hitSlopLarge} onPress={onExit}>
          <Icon name="clear" style={themeStyle.closeIcon} />
        </TouchableOpacity>
      </View>
      <View style={{ display: step === 0 ? 'flex' : 'none', flex: 1 }}>
        <LoginLookup
          navigate={navigate}
          setOptions={setOptions}
          setStep={setStep}
          setUsername={setUsername}
        />
      </View>
      {step !== 0 && (
        <View style={{ display: step === 1 ? 'flex' : 'none', flex: 1 }}>
          <LoginOptions
            onSendVerification={onSendVerification}
            options={options}
            setStep={setStep}
            setType={setType}
            type={type}
          />
        </View>
      )}
      {step === 2 && (
        <View style={{ display: step === 2 ? 'flex' : 'none', flex: 1 }}>
          <LoginVerify
            email={username}
            navigate={navigate}
            onSendVerification={onSendVerification}
          />
        </View>
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    headerRow: {
      ...themeStyle.rowAlignedBetween,
      marginTop: themeStyle.hasNotch ? themeStyle.scale(64) : themeStyle.scale(54),
      paddingBottom: themeStyle.scale(20),
    },
  }
}
