import * as React from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ListHeader from './ListHeader'
import ListItem from './ListItem'
import { useTheme } from '../global/Hooks'

type Props = {
  data: Array<RewardsItemEarn>
  loading: boolean
  onRefresh: () => Promise<void>
}

const renderItem = ({ item }: { item: RewardsItemEarn }) => {
  const { Description, Points, Title } = item
  return <ListItem description={Description} title={Title} value={`${Points} pts`} />
}

export default function RewardsEarn(props: Props): React.ReactElement {
  const { data = [], loading, onRefresh } = props
  const { themeStyle } = useTheme()
  return (
    <View style={themeStyle.screenContentTabs}>
      <FlatList
        contentContainerStyle={themeStyle.listContent}
        data={data}
        extraData={loading}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={(item) => `${item.Description}${item.Points}${item.Title}`}
        ListEmptyComponent={
          <ListEmptyComponent
            description={`There are no options\nto earn points at this time.`}
            title="No rewards."
          />
        }
        ListHeaderComponent={
          !loading && data.length > 0 ? <ListHeader title="Earn Rewards" /> : null
        }
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={loading} />}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
