import * as React from 'react'
import { FlatList, Keyboard, Modal, Pressable, Text, View } from 'react-native'
import Checkbox from './Checkbox'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'

type Props<V> = {
  alternateStyling?: boolean
  data: { Label: string; Value: V }[]
  onClose: () => void
  onSelect: (arg1: V) => void | React.Dispatch<React.SetStateAction<V>>
  title: string
  value: V | null | undefined
  visible: boolean
}

export default function ModalSelector<V>(props: Props<V>): React.ReactElement {
  const { alternateStyling, data, onClose, onSelect, title, value, visible } = props
  const listRef = React.useRef<FlatList | null>(null)
  const { themeStyle } = useTheme()
  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss()
      setTimeout(() => {
        const index = data.findIndex((item) => item.Value == value)
        if (index !== -1) {
          listRef.current?.scrollToIndex({ index, viewPosition: 0.5 })
        }
      }, 500)
    }
  }, [data, value, visible])
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
              {title}
            </Text>
          </View>
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={data}
            extraData={[onClose, onSelect, value]}
            getItemLayout={themeStyle.getItemLayout}
            keyExtractor={(item) => item.Value}
            ItemSeparatorComponent={ItemSeparator}
            ref={listRef}
            renderItem={({ item }) => {
              const { Label, Value } = item
              const selected = Value === value
              return (
                <Checkbox
                  containerStyle={themeStyle.item}
                  onPress={() => {
                    onSelect(Value)
                    onClose()
                  }}
                  selected={selected}
                  text={Label}
                />
              )
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  )
}
