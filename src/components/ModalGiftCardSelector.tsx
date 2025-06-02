import * as React from 'react'
import { FlatList, Keyboard, Modal, Pressable, Text, View } from 'react-native'
import GiftCardOption from './GiftCardOption'
import ItemSeparator from './ItemSeparator'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'
import Checkbox from './Checkbox'

type Props = {
  data: GiftCardFormatted[]
  onClose: () => void
  onSelect: (arg1: GiftCardFormatted) => void
  value: GiftCardFormatted | undefined
}

export default function ModalGiftCardSelector(props: Props): React.ReactElement {
  const { data, onClose, onSelect, value } = props
  const listRef = React.useRef<FlatList | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  React.useEffect(() => {
    Keyboard.dismiss()
    setTimeout(() => {
      const index = data.findIndex(
        (item) => item.ProductID == value?.ProductID && item.LayoutID == value?.LayoutID,
      )
      if (index !== -1) {
        listRef.current?.scrollToIndex({ index, viewPosition: 0.5 })
      }
    }, 500)
  }, [data, value])
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={themeStyle.modalContentAlt}>
          <View style={themeStyle.modalBannerRowAlt}>
            <Text style={themeStyle.modalTitleTextAlt}>Select Gift Card</Text>
          </View>
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={data}
            extraData={[onClose, onSelect, value]}
            getItemLayout={themeStyle.getItemLayout}
            keyExtractor={(item) => `${item.ProductID}${item.LayoutID}`}
            ItemSeparatorComponent={ItemSeparator}
            ref={listRef}
            renderItem={({ item }: { item: GiftCardFormatted }) => {
              const { LayoutID, ProductID } = item
              const selected = value?.LayoutID === LayoutID && value?.ProductID === ProductID
              return (
                <Pressable
                  key={`${ProductID}${LayoutID}`}
                  onPress={() => onSelect(item)}
                  style={styles.cardRow}>
                  <Checkbox containerStyle={styles.checkbox} disabled={true} selected={selected} />
                  <View style={themeStyle.flexView}>
                    <GiftCardOption details={item} />
                  </View>
                </Pressable>
              )
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    cardRow: {
      ...themeStyle.rowAligned,
      paddingHorizontal: themeStyle.scale(20),
      marginVertical: themeStyle.scale(20),
    },
    checkbox: { marginRight: themeStyle.scale(16) },
  }
}
