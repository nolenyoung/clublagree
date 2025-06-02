import * as React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import ButtonText from './ButtonText'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'

type Props = {
  cancelText: string
  confirmationText: string
  continueText: string
  onClose: () => void
  onContinue: () => Promise<void> | void
  title: string
  visible: boolean
}

export default function ModalConfirmation(props: Props): React.ReactElement {
  const { cancelText, confirmationText, continueText, onClose, onContinue, title, visible } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <View style={themeStyle.flexViewCentered}>
        <Pressable onPress={onClose} style={themeStyle.modalDismissArea} />
        <View style={themeStyle.modalFadeContent}>
          <View style={styles.content}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.questionText}>{confirmationText}</Text>
          </View>
          <ItemSeparator />
          <ButtonText
            color={themeStyle.buttonTextOnMain}
            onPress={onContinue}
            text={continueText}
            textStyle={styles.continueText}
          />
          <ItemSeparator />
          <ButtonText
            color={themeStyle.textBlack}
            onPress={onClose}
            text={cancelText}
            textStyle={styles.cancelText}
          />
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { padding: themeStyle.scale(20) },
    titleText: {
      ...themeStyle.textPrimaryBold16,
      marginBottom: themeStyle.scale(16),
      marginTop: themeStyle.scale(8),
      textAlign: 'center' as 'center',
    },
    questionText: {
      ...themeStyle.textPrimaryRegular14,
      marginBottom: themeStyle.scale(8),
      opacity: 0.6,
    },
    continueText: {
      fontFamily: themeStyle.fontPrimaryBold,
      fontSize: themeStyle.scale(14),
      marginVertical: themeStyle.scale(16),
    },
    cancelText: { fontSize: themeStyle.scale(14), marginVertical: themeStyle.scale(16) },
  }
}
