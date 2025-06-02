import * as React from 'react'
import { Animated, FlatList, Keyboard, Modal, Pressable, View } from 'react-native'
import Checkbox from './Checkbox'
import Input from './Input'
import ListEmptyComponent from './ListEmptyComponent'
import ModalBanner from './ModalBanner'
import { useKeyboardListener, useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'

interface Props<T> {
  getItem: (arg1: T) => { selected: boolean; text: string }
  hideSearch?: boolean
  items: T[]
  keyExtractor: (arg1: T) => string
  onClose: () => void
  onSearch: (arg1: string) => T[]
  onSelect: (arg1: T) => void
  selectedItems: Array<number> | Array<string>
  title: string
  visible: boolean
}

export default function ModalFilterSelector<T>(props: Props<T>): React.ReactElement {
  const inputRef = React.useRef<InputRef>(undefined)
  const {
    getItem,
    hideSearch,
    items,
    keyExtractor,
    onClose,
    onSearch,
    onSelect,
    selectedItems,
    title,
    visible,
  } = props
  const { height } = useKeyboardListener()
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [searchItems, setSearchItems] = React.useState<T[]>([])
  const [showSearchItems, setShowSearchItems] = React.useState(false)
  const onClearSearch = React.useCallback(() => {
    inputRef.current?.onResetInput()
    setSearchItems([])
    setShowSearchItems(false)
  }, [])
  const onChangeText = React.useCallback(
    ({ text }: { text: string }) => {
      if (text === '') {
        setSearchItems([])
        setShowSearchItems(false)
      } else {
        const filterArray = onSearch(text)
        setSearchItems(filterArray)
        setShowSearchItems(true)
      }
    },
    [onSearch],
  )
  const renderItem = React.useCallback(
    ({ item }: { item: T }) => {
      const { selected, text } = getItem(item)
      return (
        <Checkbox
          containerStyle={themeStyle.item}
          onPress={() => onSelect(item)}
          selected={selected}
          text={text}
        />
      )
    },
    [getItem, onSelect],
  )
  React.useEffect(() => {
    Keyboard.dismiss()
    return () => {
      if (visible) {
        inputRef.current?.onResetInput()
        setSearchItems([])
        setShowSearchItems(false)
      }
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
        <Animated.View
          style={[
            themeStyle.modalContent,
            { maxHeight: themeStyle.scale(640), paddingBottom: height },
          ]}>
          <ModalBanner alternateStyling={false} onClose={onClose} title={title} />
          {!hideSearch && (
            <Input
              containerStyle={styles.searchInput}
              getInputRef={(ref) => {
                inputRef.current = ref
              }}
              onChangeText={onChangeText}
              placeholder="Search"
              placeholderTextColor={themeStyle.textGray}
              rightIcon="clear"
              rightIconPress={onClearSearch}
              rowStyle={styles.searchInputRow}
              textColor={themeStyle.textGray}
            />
          )}
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={showSearchItems ? searchItems : items}
            extraData={selectedItems}
            getItemLayout={themeStyle.getItemLayout}
            ItemSeparatorComponent={ItemSeparator}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            ListEmptyComponent={
              <ListEmptyComponent
                containerStyle={styles.emptyList}
                description="Tweak your search criteria."
                title="No results found."
              />
            }
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    emptyList: { marginBottom: themeStyle.scale(40), marginTop: themeStyle.scale(20) },
    searchInput: { margin: themeStyle.scale(20) },
    searchInputRow: {
      backgroundColor: themeStyle.fadedGray,
      height: themeStyle.scale(51),
      paddingHorizontal: themeStyle.scale(16),
    },
  }
}
