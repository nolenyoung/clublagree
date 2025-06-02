import * as React from 'react'
import { Keyboard, Platform, Pressable, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button from './Button'
import ButtonText from './ButtonText'
import Input from './Input'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError, logEvent, logUserContext, onHandleAppLink } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  email: string
  navigate: Navigate
  onSendVerification: () => Promise<void>
}

export default function LoginVerify(props: Props): React.ReactElement {
  const { email, navigate, onSendVerification } = props
  const activateLoginButton = React.useRef<(() => Promise<void> | void) | null>(null)
  const inputRef = React.useRef<InputRef>(undefined)
  const initialUrl = useSelector((state: ReduxState) => state.appLink.url)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [code, setCode] = React.useState('')
  const [isFocused, setIsFocused] = React.useState(false)
  const onLogin = React.useCallback(async () => {
    try {
      let res = await API.loginV2({ Email: email, VerifyCode: code })
      cleanAction('activeButton')
      if (res.message) {
        setAction('toast', { text: res.message })
        setCode('')
        inputRef.current?.onTextChanged('')
      } else {
        const userInfo = {
          ...res,
          avatar: res.Avatar,
          clientId: res.clientID,
          groupId: res.groupID,
          locationId: res.locationID,
          personId: res.personID,
        } as const
        logUserContext(userInfo)
        await logEvent('login_email_code_submit')
        setAction('user', userInfo)
        if (initialUrl != null) {
          onHandleAppLink({ navigate, url: initialUrl })
        } else {
          navigate('Home')
        }
      }
    } catch (e: any) {
      cleanAction('activeButton')
      logError(e)
      setAction('toast', { text: 'Unable to verify code and log you in.' })
    }
  }, [code, email])
  React.useEffect(() => {
    if (code.length === 6) {
      activateLoginButton.current && activateLoginButton.current()
    }
  }, [code])
  return (
    <View style={themeStyle.content}>
      <Text style={styles.titleText}>{`Verification`}</Text>
      <Text style={styles.descriptionText}>{`Please enter the sign in code below.`}</Text>
      <Pressable
        onPress={() => {
          if (isFocused) {
            if (Platform.OS === 'android') {
              Keyboard.dismiss()
            }
            return
          }
          setCode('')
          inputRef.current?.onTextChanged('')
          inputRef.current?.focus()
        }}
        pointerEvents="box-only">
        <View style={themeStyle.rowAlignedBetween}>
          <View
            style={[
              styles.numberView,
              code.length === 0 && isFocused && { borderWidth: themeStyle.scale(4) },
            ]}>
            <Text style={styles.inputText}>{code.substring(0, 1)}</Text>
          </View>
          <View
            style={[
              styles.numberView,
              code.length === 1 && isFocused && { borderWidth: themeStyle.scale(4) },
            ]}>
            <Text style={styles.inputText}>{code.substring(1, 2)}</Text>
          </View>
          <View
            style={[
              styles.numberView,
              code.length === 2 && isFocused && { borderWidth: themeStyle.scale(4) },
            ]}>
            <Text style={styles.inputText}>{code.substring(2, 3)}</Text>
          </View>
          <View
            style={[
              styles.numberView,
              code.length === 3 && isFocused && { borderWidth: themeStyle.scale(4) },
            ]}>
            <Text style={styles.inputText}>{code.substring(3, 4)}</Text>
          </View>
          <View
            style={[
              styles.numberView,
              code.length === 4 && isFocused && { borderWidth: themeStyle.scale(4) },
            ]}>
            <Text style={styles.inputText}>{code.substring(4, 5)}</Text>
          </View>
          <View
            style={[
              styles.numberView,
              code.length === 5 && isFocused && { borderWidth: themeStyle.scale(4) },
            ]}>
            <Text style={styles.inputText}>{code.substring(5, 6)}</Text>
          </View>
        </View>
      </Pressable>
      <Button
        activateButtonPress={(func) => {
          activateLoginButton.current = func
        }}
        animated={true}
        color={themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys]}
        disabled={code.length !== 6}
        onPress={onLogin}
        style={styles.continueButton}
        text="Log In"
        textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
      />
      <ButtonText
        color={themeStyle.white}
        onPress={async () => {
          await logEvent('login_email_code_resend')
          onSendVerification()
        }}
        showSpinner={true}
        text="Resend Code"
      />
      <Input
        autoComplete="sms-otp"
        autoFocus={Platform.OS === 'ios'}
        borderColor="transparent"
        clearTextOnFocus={true}
        containerStyle={styles.inputContainer}
        getInputRef={(ref) => {
          inputRef.current = ref
        }}
        importantForAutofill="yes"
        keyboardType="number-pad"
        maxLength={6}
        onChangeText={({ text }) => {
          if (text.length === 6) {
            Keyboard.dismiss()
            setCode(text)
          } else {
            setCode(text)
          }
        }}
        onEndEditing={() => {
          setIsFocused(false)
        }}
        onFocus={() => {
          setIsFocused(true)
        }}
        pointerEvents="none"
        style={styles.inputText}
        textColor={themeStyle.brandPrimary}
        textContentType="oneTimeCode"
      />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const inputWidth = themeStyle.window.width - themeStyle.scale(40)
  return {
    titleText: {
      ...themeStyle.sectionTitleText,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
      marginBottom: themeStyle.scale(16),
      marginTop: themeStyle.scale(48),
      textAlign: 'center' as 'center',
    },
    descriptionText: {
      ...themeStyle.textPrimaryRegular16,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
      marginBottom: themeStyle.scale(48),
      textAlign: 'center' as 'center',
    },
    inputContainer: { opacity: 0 },
    numberView: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.paleGray,
      borderColor: themeStyle[Brand.COLOR_LOGIN_VERIFY_BORDER as ColorKeys],
      height: themeStyle.scale(50),
      width: inputWidth / 6 - themeStyle.scale(16),
    },
    inputText: {
      color: themeStyle[(Brand.COLOR_LOGIN_VERIFY_CODE ?? 'textBlack') as ColorKeys],
      fontSize: themeStyle.scale(24),
      textAlign: 'center' as 'center',
    },
    continueButton: { marginVertical: themeStyle.scale(24), width: '100%' as const },
  }
}
