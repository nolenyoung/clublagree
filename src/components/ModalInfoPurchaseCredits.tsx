import * as React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import ButtonText from './ButtonText'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'
import { cleanAction } from '../redux/actions'

type Props = { navigate: Navigate }

const onClose = () => {
  cleanAction('bookingDetails')
}

export default function ModalInfoPurchaseCredits(props: Props): React.ReactElement {
  const { navigate } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.flexViewCentered}>
        <Pressable onPress={onClose} style={themeStyle.modalDismissArea} />
        <View style={themeStyle.modalFadeContent}>
          <View style={styles.content}>
            <Text style={styles.titleText}>No Credits Available</Text>
            <Text style={styles.questionText}>
              {`I'm sorry! You do not have any available credits. Please click the button below to buy credits. Once complete, you may return to book your ${Brand.STRING_CLASS_TITLE_LC}.`}
            </Text>
          </View>
          <ItemSeparator />
          <ButtonText
            color={themeStyle.buttonTextOnMain}
            onPress={() => {
              navigate('StudioPricing')
              cleanAction('bookingDetails')
            }}
            text="Buy Credits"
            textStyle={styles.continueText}
          />
          <ItemSeparator />
          <ButtonText
            color={themeStyle.textBlack}
            onPress={onClose}
            text="Cancel"
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
