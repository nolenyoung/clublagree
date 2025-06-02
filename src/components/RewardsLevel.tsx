import moment from 'moment'
import momentTimezone from 'moment-timezone'
import * as React from 'react'
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native'
import ItemSeparator from './ItemSeparator'
import ListItem from './ListItem'
import RewardsLevelSummary from './RewardsLevelSummary'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'
import { formatDateHistory } from '../global/Functions'

const userTimezone = momentTimezone.tz.guess()

type Props = {
  activity: Array<RewardsActivity>
  loading: boolean
  onRefresh: () => Promise<void>
  summary: RewardsSummary | null | undefined
}

const renderActivityItem = ({ item }: { item: RewardsActivity }) => {
  const { ActivityTimestamp, BonusPoints, Description, Points, TimestampUTC } = item
  const isActivity = ActivityTimestamp !== '' && ActivityTimestamp != null
  const timestamp = isActivity
    ? moment(ActivityTimestamp, 'YYYY-MM-DD HH:mm:ss')
    : momentTimezone.utc(TimestampUTC, 'YYYY-MM-DD HH:mm:ss').tz(userTimezone)
  return (
    <ListItem
      bonusTitleText={BonusPoints > 0 ? ` + ${BonusPoints} bonus points` : ''}
      description={Description}
      rightText={timestamp.format('h:mma')}
      title={`${Points} points`}
      titleColorAlt={Points < 0 ? 'red' : undefined}
      value={timestamp.calendar(null, formatDateHistory)}
    />
  )
}

export default function RewardsLevel(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { activity, loading, onRefresh, summary } = props
  return (
    <View style={styles.content}>
      <ScrollView
        contentContainerStyle={themeStyle.scrollContentTabScreen}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={loading} />}
        showsVerticalScrollIndicator={false}>
        <RewardsLevelSummary summary={summary} />
        <View style={styles.bottomSection}>
          <Text style={styles.activityTitleText}>ACTIVITY LOG</Text>
          <FlatList
            data={activity}
            ItemSeparatorComponent={ItemSeparator}
            keyExtractor={(item) => `${item.Description}${item.Timestamp}`}
            ListEmptyComponent={<Text style={styles.noActivity}>No activity</Text>}
            renderItem={renderActivityItem}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { ...themeStyle.flexView, backgroundColor: themeStyle.fadedGray },
    bottomSection: {
      backgroundColor: themeStyle.fadedGray,
      flex: 1,
      paddingTop: themeStyle.scale(16),
    },
    activityTitleText: {
      ...themeStyle.getTextStyle({ color: 'textGray', font: 'fontPrimaryBold', size: 14 }),
      marginLeft: themeStyle.scale(20),
      textTransform: Brand.TRANSFORM_HEADER_TEXT as TextTransform,
    },
    noActivity: { ...themeStyle.textPrimaryRegular16, textAlign: 'center' as 'center' },
  }
}
