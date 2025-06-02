import * as React from 'react'
import { FlatList, Keyboard, Modal, Pressable, Text, View } from 'react-native'
import { IMAGE_OPTIONS } from '../global/Constants'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'

type Props = {
  hideRemove?: boolean
  onClose: () => void
  onSelect: (arg1: string) => Promise<void> | void
  visible: boolean
}

export default function ModalImageActions(props: Props): React.ReactElement {
  const { hideRemove = false, onClose, onSelect, visible } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const renderItem = React.useCallback(
    ({ item }: { item: { [key: string]: any } }) => {
      const { action, label } = item
      if (hideRemove && action === 'remove') return null
      return (
        <Pressable
          onPress={() => {
            onSelect(action)
          }}
          style={styles.item}>
          <Text
            style={[styles.text, action === 'remove' && { color: themeStyle.textBrandPrimary }]}>
            {label}
          </Text>
        </Pressable>
      )
    },
    [onSelect],
  )
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
        <Pressable onPress={onClose} style={themeStyle.flexView}>
          <View style={themeStyle.flexView} />
        </Pressable>
        <View style={themeStyle.modalContent}>
          <View style={themeStyle.modalBannerRow}>
            <Text style={themeStyle.modalTitleText}>Change Profile Picture</Text>
          </View>
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={IMAGE_OPTIONS}
            keyExtractor={(item) => item.label}
            ItemSeparatorComponent={ItemSeparator}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    item: {
      paddingLeft: themeStyle.scale(29),
      paddingRight: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(16),
    },
    text: themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 18 }),
  }
}
