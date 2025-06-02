import * as React from 'react'
import { Modal, Pressable, View } from 'react-native'
import ModalBanner from './ModalBanner'
import AppointmentPackageOptionsList from './AppointmentPackageOptionsList'
import { useTheme } from '../global/Hooks'

type Props = {
  onClose: () => void
  onSelect: (arg1: AppointmentPackage | AppointmentPackageOptions | Pricing) => Promise<void> | void
  packageOptions: (AppointmentPackageOptions | Pricing)[]
  packages: AppointmentPackage[]
  selectionMode: 'buy' | 'select'
  visible: boolean
}

export default function ModalChooseAppointmentPackage(props: Props): React.ReactElement {
  const { onClose, onSelect, packageOptions, packages, selectionMode, visible } = props
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
        <View style={themeStyle.modalContentAlt}>
          <ModalBanner
            alternateStyling={true}
            onClose={onClose}
            title={selectionMode === 'buy' ? 'Buy a Pass' : 'Choose a Pass'}
          />
          <AppointmentPackageOptionsList
            onSelect={onSelect}
            packageOptions={packageOptions}
            packages={packages}
            selectionMode={selectionMode}
          />
        </View>
      </View>
    </Modal>
  )
}
