import * as React from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button from './Button'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ListHeader from './ListHeader'
import ListItem from './ListItem'
import ModalConfirmReward from './ModalConfirmReward'
import ModalRewardsVoucher from './ModalRewardsVoucher'
import TagPointsRemaining from './TagPointsRemaining'
import { useTheme } from '../global/Hooks'

type Props = {
  data: Array<RewardsItemRedeem>
  loading: boolean
  locations: Array<RewardsItemLocation>
  onRefresh: () => Promise<void> | void
}

export default function RewardsRedeem(props: Props): React.ReactElement {
  const { data = [], loading, locations = [], onRefresh } = props
  const pointBalance = useSelector((state: ReduxState) => state.rewards.pointBalance)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [selectedReward, setSelectedReward] = React.useState<RewardsItemRedeem | null | undefined>(
    null,
  )
  const [voucher, setVoucher] = React.useState<number | null | undefined>(null)
  const locationsLength = locations.length
  return (
    <View style={themeStyle.screenContentTabs}>
      <FlatList
        contentContainerStyle={themeStyle.listContent}
        data={data}
        extraData={[loading, locationsLength, pointBalance]}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={(item) => `${item.Description}${item.Points}${item.Title}`}
        ListEmptyComponent={
          <ListEmptyComponent
            description="There are no options\nto redeem points at this time."
            title="No redemption options."
          />
        }
        ListHeaderComponent={
          !loading && data.length > 0 ? (
            <ListHeader
              title="Redeem Rewards"
              titleComponent={<TagPointsRemaining points={pointBalance} />}
            />
          ) : null
        }
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={loading} />}
        renderItem={({ item }) => {
          const { Description, Points, Title } = item
          const canRedeem = Number(Points) <= pointBalance
          return (
            <ListItem
              description={Description}
              rightButton={
                locationsLength > 0 && (
                  <Button
                    disabled={!canRedeem}
                    onPress={() => setSelectedReward(item)}
                    small={true}
                    style={styles.button}
                    text="Redeem"
                  />
                )
              }
              title={Title}
              value={`${Points} pts`}
            />
          )
        }}
        showsVerticalScrollIndicator={false}
      />
      {selectedReward != null && (
        <ModalConfirmReward
          locations={locations}
          onClose={(success) => {
            setSelectedReward(null)
            if (success) {
              onRefresh()
            }
          }}
          reward={selectedReward}
        />
      )}
      <ModalRewardsVoucher number={voucher} onClose={() => setVoucher(null)} />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return { button: { marginLeft: themeStyle.scale(12) } }
}
