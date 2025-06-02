import * as React from 'react'
import { Modal, Pressable, View } from 'react-native'
import HTMLContent from './HTMLContent'
import ModalBanner from './ModalBanner'
import { useTheme } from '../global/Hooks'

type Props = {
  details: { Description: string; Name: string }
  onClose: () => void
  visible: boolean
}

export default function ModalClassDescription(props: Props): React.ReactElement {
  const { details = { Description: '', Name: '' }, onClose, visible } = props
  const { themeStyle } = useTheme()
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
          <ModalBanner alternateStyling={false} onClose={onClose} title={details.Name} />
          <HTMLContent html={details.Description} />
        </View>
      </View>
    </Modal>
  )
}
