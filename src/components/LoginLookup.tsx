import * as React from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'
import { Button, ButtonText, Input, ModalConfirmation } from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'
import { logError, logEvent, validateTextOnChange } from '../global/Functions'
import { cleanAction, setAction } from '../redux/actions'
import { persistor } from '../redux/store'

type Props = {
  navigate: Navigate
  setOptions: (arg1: Array<LoginOption>) => void
  setStep: (arg1: number) => void
  setUsername: (arg1: string) => void
}

export default function LoginLookup(props: Props): React.ReactElement {
  const { navigate, setOptions, setStep, setUsername } = props
  const activeInput = React.useRef('')
  const fieldPosition = React.useRef({} as { [key: string]: any })
  const resetModeCount = React.useRef(0)
  const scrollRef = React.useRef<ScrollView | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [email, setEmail] = React.useState('')
  const [invalidFields, setInvalidFields] = React.useState(['email'])
  const [modalConfirmLocalPurge, setModalConfirmLocalPurge] = React.useState(false)
  const onLogin = React.useCallback(async () => {
    try {
      let res = await API.getLoginOptions({ Email: email.trim() })
      cleanAction('activeButton')
      if (Array.isArray(res.LoginOptions)) {
        setUsername(email)
        setOptions(res.LoginOptions)
        setStep(1)
        await logEvent('login_email_submit')
      } else {
        setAction('toast', { text: res.message ?? 'Unable to find your email.' })
      }
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
      setAction('toast', { text: 'Unable to log in.' })
    }
  }, [email])
  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      ref={scrollRef}
      scrollToOverflowEnabled={true}
      showsVerticalScrollIndicator={false}>
      <Pressable
        onPress={() => {
          if (resetModeCount.current + 1 >= 10) {
            setModalConfirmLocalPurge(true)
            resetModeCount.current = 0
          } else {
            resetModeCount.current += 1
          }
        }}>
        <Image source={Brand.IMAGES_LOGO_LOGIN} style={themeStyle.loginScreen.logo} />
      </Pressable>
      <Input
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        borderColor={themeStyle[Brand.COLOR_LOGIN_INPUT_BORDER as ColorKeys]}
        containerStyle={themeStyle.loginScreen.inputView}
        key="emailInput"
        keyboardType="email-address"
        onChangeText={({ text, setError }) =>
          validateTextOnChange({
            errorOnChange: false,
            setError,
            setInvalidFields,
            setState: setEmail,
            text,
            type: 'email',
          })
        }
        onEndEditing={(text, setError) =>
          validateTextOnChange({
            errorOnChange: true,
            setError,
            setInvalidFields,
            setState: setEmail,
            text,
            type: 'email',
          })
        }
        onFocus={() => {
          activeInput.current = 'email'
          scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.email })
        }}
        onLayout={(event) => {
          fieldPosition.current.email = event.nativeEvent.layout.y - themeStyle.scale(200)
        }}
        placeholder="Email Address"
        placeholderTextColor={themeStyle[Brand.COLOR_LOGIN_INPUT_PLACEHOLDER as ColorKeys]}
        returnKeyType="done"
        textColor={themeStyle[Brand.COLOR_LOGIN_INPUT_PLACEHOLDER as ColorKeys]}
        textContentType="emailAddress"
      />
      <Button
        animated={true}
        color={themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys]}
        disabled={invalidFields.length > 0}
        gradient={Brand.BUTTON_GRADIENT}
        onPress={onLogin}
        style={themeStyle.loginScreen.button}
        text="Log In"
        textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
      />
      <View style={themeStyle.bottomButtonView}>
        <ButtonText
          onPress={async () => {
            await logEvent('login_create_account')
            navigate('Signup')
          }}
          style={styles.newText}
          text="Create an Account"
          textStyle={themeStyle.loginScreen.createAccountText}
        />
      </View>
      {modalConfirmLocalPurge && (
        <ModalConfirmation
          cancelText="No"
          confirmationText="Are you sure you want to reset your local app state?"
          continueText="Yes"
          onClose={() => setModalConfirmLocalPurge(false)}
          onContinue={async () => {
            if (persistor != null) {
              await persistor.flush()
              await persistor.purge()
            }
            setAction('toast', {
              text: 'Your local state has been reset successfully. Please restart the app.',
              type: 'success',
            })
            setModalConfirmLocalPurge(false)
          }}
          title="Reset Local State"
          visible={true}
        />
      )}
    </ScrollView>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const { height, resizeMode = 'contain', width, ...rest } = themeStyle.loginScreen.logo
  return {
    imageButton: rest,
    image: { height, resizeMode, width },
    newText: { alignSelf: 'center' as 'center', marginBottom: themeStyle.scale(40) },
  }
}
