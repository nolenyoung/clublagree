import * as React from 'react'
import { FlatList, Keyboard, Modal, Pressable, View } from 'react-native'
import Button from './Button'
import ButtonText from './ButtonText'
import Checkbox from './Checkbox'
import ModalBanner from './ModalBanner'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'

type Props = {
  addOns: Array<AppointmentAddOn>
  onClose: () => void
  onContinue: () => Promise<void> | void
  onSelect: (addOn: AppointmentAddOn, action: 'add' | 'remove') => void
  onSkip: () => void
  selectedAddOns: Array<AppointmentAddOn>
  visible: boolean
}

export default function ModalChooseAppointmentAddOns(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { addOns, onClose, onContinue, onSelect, onSkip, selectedAddOns, visible } = props
  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss()
    }
  }, [visible])
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
        <View style={themeStyle.modalContentAlt}>
          <ModalBanner alternateStyling={true} onClose={onClose} title="Choose Add Ons" />
          <FlatList
            bounces={false}
            contentContainerStyle={styles.listContent}
            data={addOns}
            extraData={selectedAddOns}
            keyExtractor={(item) => `${item.AddonID}`}
            ItemSeparatorComponent={ItemSeparator}
            renderItem={({ item }) => {
              const selected = selectedAddOns.some((a) => a.AddonID === item.AddonID)
              return (
                <Checkbox
                  activeOpacity={1}
                  containerStyle={themeStyle.item}
                  onPress={() => onSelect(item, selected ? 'remove' : 'add')}
                  rowStyle={styles.itemContent}
                  selected={selected}
                  text={item.Name}
                  textStyle={themeStyle.textPrimaryBold18}
                />
              )
            }}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.buttonView}>
            <Button onPress={onContinue} style={styles.continueButton} text="Continue" />
            <ButtonText
              color={themeStyle.textBlack}
              onPress={onSkip}
              style={styles.noThanksButton}
              text="No Thanks"
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    listContent: { paddingVertical: themeStyle.scale(20) },
    itemContent: { ...themeStyle.rowAlignedBetween, width: '100%' as const },
    buttonView: { paddingHorizontal: themeStyle.scale(16) },
    continueButton: { marginBottom: themeStyle.scale(20), width: '100%' as const },
    noThanksButton: { alignSelf: 'center' as 'center', marginBottom: themeStyle.scale(40) },
  }
}
