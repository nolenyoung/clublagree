import * as React from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import Barcode from './Barcode'
import { useTheme } from '../global/Hooks'

type Props = { number: number | null | undefined; onClose: () => void }

export default function ModalRewardsVoucher(props: Props): React.ReactElement | null {
  const { number, onClose } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  if (number == null) {
    return null
  }
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={themeStyle.modalContent}>
          <View style={themeStyle.modalBannerRow}>
            <Text style={themeStyle.modalTitleText}>Reward Voucher</Text>
          </View>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" scrollEnabled={false}>
            <View style={styles.content}>
              <Barcode number={number} />
              <Text style={styles.completeText}>
                {`This voucher will expire in 15 minutes.\nYou will not lose your points if it’s not redeemed during that time frame.`}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { padding: themeStyle.scale(20), paddingTop: themeStyle.scale(40) },
    completeText: {
      ...themeStyle.itemDetailText,
      marginVertical: themeStyle.scale(24),
      textAlign: 'center' as 'center',
    },
  }
}
