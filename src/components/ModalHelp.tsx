import * as React from 'react'
import { Keyboard, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated'
import { SvgCss } from 'react-native-svg/css'
import { useSelector } from 'react-redux'
import media from '../assets/media'
import Button from './Button'
import Input from './Input'
import InputButton from './InputButton'
import ModalBanner from './ModalBanner'
import OverlayLocationSelector from './OverlayLocationSelector'
import Toast from './Toast'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

const onClose = () => setAction('modals', { contactUs: false })

export default function ModalHelp(): React.ReactElement {
  const { height } = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true })
  const inputRef = React.useRef<InputRef>(undefined)
  const loggedIn = useSelector((state: ReduxState) => state.user.clientId != null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [message, setMessage] = React.useState('')
  const [showStudioSelector, setShowStudioSelector] = React.useState(true)
  const [studio, setStudio] = React.useState<Partial<Location>>({})
  const [studios, setStudios] = React.useState<Location[]>([])
  const [success, setSuccess] = React.useState(false)
  const onSubmit = async () => {
    Keyboard.dismiss()
    try {
      let response = await API.createStudioMessage({
        Message: message,
        Studio: { ClientID: studio.ClientID ?? 0, LocationID: studio.LocationID ?? 0 },
      })
      cleanAction('activeButton')
      if (response.code === 200) {
        setSuccess(true)
      } else {
        setAction('toast', { text: response.message })
      }
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
      setAction('toast', { text: 'Unable to send message.' })
    }
  }
  const onCloseStudioModal = React.useCallback((loc?: Partial<Location>) => {
    if (loc != null) {
      setStudio(loc)
    }
    setShowStudioSelector(false)
  }, [])
  const animatedStyle = useAnimatedStyle(() => {
    return {
      maxHeight: themeStyle.modalContent.maxHeight + height.value,
      paddingBottom: height.value,
    }
  })
  React.useEffect(() => {
    logEvent('menu_help')
  }, [])
  React.useEffect(() => {
    if (loggedIn) {
      ;(async function getStudios() {
        try {
          let response = await API.getStudios()
          if (Array.isArray(response)) {
            setStudios(response)
          }
        } catch (e: any) {
          logError(e)
        }
      })()
    }
  }, [loggedIn])
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable
          onPress={() => {
            Keyboard.dismiss()
            onClose()
          }}
          style={themeStyle.flexView}
        />
        <Animated.View
          style={[
            themeStyle.modalContent,
            { display: showStudioSelector ? 'none' : 'flex' },
            animatedStyle,
          ]}>
          <ModalBanner
            alternateStyling={false}
            onClose={onClose}
            title={success ? 'Message Sent' : 'Need help?'}
          />
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            scrollToOverflowEnabled={true}>
            {success ? (
              <View style={styles.inputView}>
                <SvgCss
                  color={themeStyle.brandPrimary}
                  height={themeStyle.scale(62)}
                  style={styles.successImage}
                  width={themeStyle.scale(62)}
                  xml={media.iconCheckCircle}
                />
                <Text style={styles.completeText}>
                  Your message has been sent successfully. Our team will respond as soon as
                  possible.
                </Text>
                <Button
                  gradient={Brand.BUTTON_GRADIENT}
                  onPress={onClose}
                  style={styles.successButton}
                  text="Done"
                />
              </View>
            ) : (
              <View style={styles.inputView}>
                <InputButton
                  borderColor="transparent"
                  buttonStyle={styles.dropdown}
                  onPress={() => setShowStudioSelector(true)}
                  textColor={themeStyle.textGray}
                  value={studio.Nickname ?? 'Choose Your Studio'}
                />
                <Input
                  allowFontScaling={false}
                  getInputRef={(ref) => {
                    inputRef.current = ref
                  }}
                  maxLength={500}
                  multiline={true}
                  onChangeText={({ text }) => setMessage(text)}
                  placeholder="How can we help you?"
                  placeholderTextColor={themeStyle.textGray}
                  returnKeyType="done"
                  rowStyle={styles.messageInputRow}
                  style={styles.messageInput}
                  submitBehavior="blurAndSubmit"
                  textColor={themeStyle.textBlack}
                />
                <Text style={styles.charLimitText}>{`${message.length}/500 character limit`}</Text>
                <Button
                  animated={true}
                  disabled={message.trim() === ''}
                  gradient={Brand.BUTTON_GRADIENT}
                  onPress={onSubmit}
                  style={styles.submitButton}
                  text="Submit"
                />
              </View>
            )}
          </ScrollView>
        </Animated.View>
        <Toast />
        {showStudioSelector && (
          <OverlayLocationSelector
            locationId={`${studio.ClientID ?? ''}-${studio.LocationID ?? ''}`}
            locations={studios}
            maxHeight={themeStyle.window.height - themeStyle.scale(200)}
            onClose={() => setShowStudioSelector(false)}
            onSelect={onCloseStudioModal}
            preventCloseOnSelect={true}
          />
        )}
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    inputView: { padding: themeStyle.scale(20) },
    dropdown: {
      backgroundColor: themeStyle.fadedGray,
      marginBottom: themeStyle.scale(8),
      paddingHorizontal: themeStyle.scale(16),
      paddingVertical: themeStyle.scale(16),
    },
    messageInputRow: {
      backgroundColor: themeStyle.fadedGray,
      height: themeStyle.scale(120),
      padding: themeStyle.scale(16),
    },
    messageInput: { ...themeStyle.textPrimaryRegular16, color: themeStyle.textGray },
    charLimitText: {
      ...themeStyle.textPrimaryRegular12,
      color: themeStyle.textGray,
      marginBottom: themeStyle.scale(16),
      marginTop: themeStyle.scale(8),
    },
    submitButton: { backgroundColor: themeStyle.brandPrimary, width: '100%' as const },
    successImage: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(20),
      marginTop: themeStyle.scale(16),
    },
    completeText: {
      ...themeStyle.textPrimaryRegular16,
      marginBottom: themeStyle.scale(20),
      textAlign: 'center' as 'center',
    },
    successButton: {
      marginBottom: themeStyle.scale(10),
      marginTop: themeStyle.scale(24),
      width: '100%' as const,
    },
  }
}
