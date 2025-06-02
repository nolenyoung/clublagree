import * as React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import ExpirationSelector from './ExpirationSelector'
import { MONTHS } from '../global/Constants'
import { useTheme } from '../global/Hooks'

type Props = {
  alternateStyling?: boolean
  onClose: () => void
  onSelect: (arg1: string) => void
  selectedMonth: string
  visible: boolean
}

export default function ModalMonthSelector(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const { alternateStyling, onClose, onSelect, selectedMonth, visible } = props
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={alternateStyling ? themeStyle.modalContentAlt : themeStyle.modalContent}>
          <View style={alternateStyling ? themeStyle.modalBannerRowAlt : themeStyle.modalBannerRow}>
            <Text
              style={alternateStyling ? themeStyle.modalTitleTextAlt : themeStyle.modalTitleText}>
              Select Month
            </Text>
          </View>
          <ExpirationSelector
            containerStyle={themeStyle.expirationModalList}
            data={MONTHS}
            onClose={onClose}
            onSelect={onSelect}
            selectedItem={selectedMonth}
            visible={visible}
          />
        </View>
      </View>
    </Modal>
  )
}
