import * as React from 'react'
import { Animated, Modal, Pressable, View } from 'react-native'
import FilterMarketSelector from './FilterMarketSelector'
import ModalBanner from './ModalBanner'
import { useKeyboardListener, useTheme } from '../global/Hooks'

type Props<V> = {
  getItem: (arg1: V) => { selected: boolean; text: string }
  getSectionSelected: (arg1: MarketSection<V>) => boolean
  items: MarketSection<V>[]
  keyExtractor: (arg1: V) => string
  locationsWithSearchTerms: (V & { searchTerms: string[] })[]
  onClose: () => void
  onFetchLocations: (
    loc?: { Latitude: number; Longitude: number },
    setLoading?: (loading: boolean) => void,
  ) => void
  onSearch: (arg1: string) => MarketSection<V>[]
  onSelect: (arg1: V) => void
  onSelectSection: (arg1: MarketSection<V>, arg2: boolean) => void
  selectedItems: Array<number> | Array<string>
  showSortTabs?: boolean
  title: string
  visible: boolean
}

export default function ModalFilterMarketSelector<V extends Partial<Location>>(
  props: Props<V>,
): React.ReactElement {
  const { onClose, title, visible, ...rest } = props
  const { height } = useKeyboardListener()
  const { themeStyle } = useTheme()
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
            { height: themeStyle.scale(620), paddingBottom: height },
          ]}>
          <ModalBanner alternateStyling={false} onClose={onClose} title={title} />
          <FilterMarketSelector {...rest} />
        </Animated.View>
      </View>
    </Modal>
  )
}
