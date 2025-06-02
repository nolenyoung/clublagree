import * as React from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SvgCss } from 'react-native-svg/css'
import media from '../assets/media'
import Button from './Button'
import Brand from '../global/Brand'
import { logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = { onClose: () => void; showBanner?: boolean; visible: boolean }

export default function ModalPurchaseConfirmation(props: Props): React.ReactElement {
  const { onClose, showBanner, visible } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={themeStyle.modalContent}>
          {showBanner && (
            <View style={themeStyle.modalBannerRow}>
              <Text style={themeStyle.modalTitleText}>Purchase Complete</Text>
            </View>
          )}
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" scrollEnabled={false}>
            <View style={styles.content}>
              <SvgCss
                color={themeStyle.buttonTextOnMain}
                height={themeStyle.scale(62)}
                style={styles.image}
                width={themeStyle.scale(62)}
                xml={media.iconCheckCircle}
              />
              <Text style={styles.thankYouText}>Thank You!</Text>
              <Text style={styles.completeText}>Your transaction is complete.</Text>
              <Button
                gradient={Brand.BUTTON_GRADIENT}
                onPress={async () => {
                  await logEvent('purchase_confirmation_done')
                  onClose()
                }}
                style={styles.submitButton}
                text="Done"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { padding: themeStyle.scale(20) },
    image: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(20),
      marginTop: themeStyle.scale(16),
    },
    thankYouText: {
      ...themeStyle.largeTitleText,
      marginBottom: themeStyle.scale(4),
      textAlign: 'center' as 'center',
    },
    completeText: {
      ...themeStyle.textPrimaryRegular16,
      marginBottom: themeStyle.scale(42),
      textAlign: 'center' as 'center',
    },
    submitButton: { marginBottom: themeStyle.scale(10), width: '100%' as const },
  }
}
