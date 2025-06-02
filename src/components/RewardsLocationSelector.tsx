import * as React from 'react'
import { FlatList } from 'react-native'
import Checkbox from './Checkbox'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'

type Props = {
  locations: Array<RewardsItemLocation>
  onSelect: (arg1: RewardsItemLocation) => Promise<void> | void
}

export default function RewardsLocationSelector(props: Props): React.ReactElement {
  const { locations, onSelect } = props
  const { themeStyle } = useTheme()
  return (
    <FlatList
      bounces={false}
      contentContainerStyle={themeStyle.scrollViewContent}
      data={locations}
      getItemLayout={themeStyle.getItemLayout}
      keyExtractor={(item) => `${item.Name}`}
      ItemSeparatorComponent={ItemSeparator}
      renderItem={({ item }) => (
        <Checkbox
          containerStyle={themeStyle.item}
          onPress={() => onSelect(item)}
          selected={false}
          text={item.Name}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  )
}
