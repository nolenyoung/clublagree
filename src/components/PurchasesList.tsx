import moment from 'moment'
import * as React from 'react'
import { FlatList, RefreshControl } from 'react-native'
import Button from './Button'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ListItem from './ListItem'
import Brand from '../global/Brand'
import { formatDate } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = {
  loading: boolean
  onFetch: () => Promise<void>
  onViewClasses: (arg: Sale) => void
  purchases: Array<Sale>
}

export default function PurchasesList(props: Props): React.ReactElement {
  const { loading, onFetch, onViewClasses, purchases } = props
  const { themeStyle } = useTheme()
  const buttonStyle = {
    marginBottom: themeStyle.scale(16),
    marginHorizontal: themeStyle.scale(20),
    width: themeStyle.window.width / 2.5,
  }
  return (
    <FlatList
      contentContainerStyle={themeStyle.listContent}
      data={purchases}
      extraData={loading}
      ItemSeparatorComponent={ItemSeparator}
      keyExtractor={(item) => `${item.clientID}${item.saleID}${item.salesDetailID}${item.dateTime}`}
      ListEmptyComponent={
        <ListEmptyComponent description="You have not made any purchases." title="No purchases." />
      }
      refreshControl={<RefreshControl onRefresh={onFetch} refreshing={loading} />}
      renderItem={({ item }: { item: Sale }) => {
        const { dateTime, description, total, units = 0 } = item
        const notUnlimited = units <= 200
        return (
          <>
            <ListItem
              description={moment(dateTime).format(formatDate('MMM DD, YYYY'))}
              title={description}
              value={
                total != null
                  ? Number(total) < 0
                    ? `-${Brand.DEFAULT_CURRENCY}${total.replace('-', '')}`
                    : `${Brand.DEFAULT_CURRENCY}${total}`
                  : null
              }
            />
            {Brand.UI_PACKAGE_CLASSES && units > 0 && notUnlimited ? (
              <Button
                onPress={() => onViewClasses(item)}
                small={true}
                style={buttonStyle}
                text={`View Bookings`}
              />
            ) : undefined}
          </>
        )
      }}
      showsVerticalScrollIndicator={false}
    />
  )
}
