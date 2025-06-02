import * as React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import ModalBanner from './ModalBanner'
import PackageOptionsList from './PackageOptionsList'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = {
  onClose: () => void
  onSelect: (arg1: Pricing | Package) => Promise<void> | void
  packageOptions: Array<Pricing>
  packages: Array<Package>
  selectionMode: 'buy' | 'select'
}

export default function ModalChoosePackage(props: Props): React.ReactElement {
  const { onClose, onSelect, packageOptions, packages, selectionMode } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={themeStyle.modalContentAlt}>
          <ModalBanner
            alternateStyling={true}
            onClose={onClose}
            title={selectionMode === 'buy' ? 'Buy a Pass' : 'Choose a Pass'}
          />
          {packages.length === 0 && packageOptions.length === 0 ? (
            <Text style={styles.emptyListText}>
              {`Booking is unavailable through the app for this ${Brand.STRING_CLASS_TITLE_LC} at this time. Please contact the studio.`}
            </Text>
          ) : (
            <PackageOptionsList
              onSelect={onSelect}
              packageOptions={packageOptions}
              packages={packages}
              selectionMode={selectionMode}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    emptyListText: {
      ...themeStyle.textPrimaryRegular14,
      marginVertical: themeStyle.scale(20),
      textAlign: 'center' as 'center',
    },
  }
}
