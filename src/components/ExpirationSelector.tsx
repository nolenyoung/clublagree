import * as React from 'react'
import { FlatList, Keyboard, View } from 'react-native'
import Checkbox from './Checkbox'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'

type Props = {
  containerStyle?: ViewStyleProp
  data: Array<{ key: string; value: string }>
  onClose: () => void
  onSelect: (arg1: string) => void
  selectedItem: string
  visible: boolean
}

export default function ExpirationSelector(props: Props): React.ReactElement {
  const { containerStyle, data, onClose, onSelect, selectedItem, visible } = props
  const listRef = React.useRef<FlatList | null>(null)
  const { themeStyle } = useTheme()
  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss()
      setTimeout(() => {
        const index = data.findIndex((m) => m.value === selectedItem)
        if (index !== -1) {
          listRef.current?.scrollToIndex({ index, viewPosition: 0.5 })
        }
      }, 500)
    }
  }, [selectedItem, visible])
  return (
    <View style={[themeStyle.flexView, containerStyle]}>
      <FlatList
        bounces={false}
        contentContainerStyle={themeStyle.listContent}
        data={data}
        extraData={[onClose, onSelect, selectedItem]}
        getItemLayout={themeStyle.getItemLayout}
        keyExtractor={(item) => item.key}
        ItemSeparatorComponent={ItemSeparator}
        ref={listRef}
        renderItem={({ item }) => {
          const selected = item.value == selectedItem
          return (
            <Checkbox
              containerStyle={themeStyle.item}
              onPress={() => {
                onSelect(item.value)
                onClose()
              }}
              selected={selected}
              text={item.key}
            />
          )
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
