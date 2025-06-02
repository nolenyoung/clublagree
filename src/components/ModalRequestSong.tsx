import * as React from 'react'
import {
  Animated,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import Button from './Button'
import ModalBanner from './ModalBanner'
import Toast from './Toast'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError } from '../global/Functions'
import { useKeyboardListener, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  onClose: () => void
}

export default function ModalRequestSong(props: Props): React.ReactElement {
  const { onClose } = props
  const { height: keyboardHeight, open: keyboardOpen } = useKeyboardListener()
  const inputRef = React.useRef<TextInput | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [message, setMessage] = React.useState('')
  const onSubmit = React.useCallback(async () => {
    try {
      let response = await API.createUserNote({ Label: 'request-song', Note: message })
      cleanAction('activeButton')
      if (response.code === 200) {
        onClose()
      } else {
        setAction('toast', { text: response.message })
      }
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
      setAction('toast', { text: 'Unable to send message.' })
    }
  }, [message, onClose])
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable
          onPress={keyboardOpen ? () => Keyboard.dismiss() : onClose}
          style={themeStyle.flexView}
        />
        <Animated.View style={[themeStyle.modalContent, { marginBottom: keyboardHeight }]}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" scrollEnabled={false}>
            <ModalBanner alternateStyling={false} onClose={onClose} title="Request a Song" />
            <View style={styles.inputView}>
              <View style={styles.messageInputView}>
                <TextInput
                  allowFontScaling={false}
                  multiline={true}
                  onChangeText={setMessage}
                  placeholder="What would you like to hear played during a session?"
                  placeholderTextColor={themeStyle.textGray}
                  ref={inputRef}
                  style={styles.messageInput}
                />
              </View>
              <Text style={styles.disclaimerText}>
                {`Your request will be stored in your member file. Listen for your song and a shoutout from the ${Brand.COACH_TITLE_LC} in one of your future sessions.`}
              </Text>
              <Button
                animated={true}
                disabled={message.trim() === ''}
                gradient={Brand.BUTTON_GRADIENT}
                onPress={onSubmit}
                style={styles.submitButton}
                text="Submit"
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
      <Toast />
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    inputView: { padding: themeStyle.scale(20), paddingTop: themeStyle.scale(4) },
    messageInputView: {
      backgroundColor: themeStyle.fadedGray,
      maxHeight: themeStyle.scale(236),
      minHeight: themeStyle.scale(120),
      marginVertical: themeStyle.scale(16),
      padding: themeStyle.scale(16),
    },
    messageInput: { ...themeStyle.textPrimaryRegular16, color: themeStyle.textGray },
    disclaimerText: {
      ...themeStyle.getTextStyle({ color: 'textGray', font: 'fontPrimaryRegular', size: 10 }),
      marginBottom: themeStyle.scale(14),
    },
    submitButton: { backgroundColor: themeStyle.brandPrimary, width: '100%' as const },
  }
}
