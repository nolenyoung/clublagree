import * as React from 'react'
import { View } from 'react-native'
import { Header, HeaderTabs, RewardsEarn, RewardsLevel, RewardsRedeem, TabBar } from '../components'
import { API } from '../global/API'
import { HEADER_TABS_REWARDS } from '../global/Constants'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

export default function Rewards(): React.ReactElement {
  const { themeStyle } = useTheme()
  const [activity, setActivity] = React.useState<RewardsActivity[]>([])
  const [earn, setEarn] = React.useState<RewardsItemEarn[]>([])
  const [loadingProgram, setLoadingProgram] = React.useState(false)
  const [loadingSummary, setLoadingSummary] = React.useState(false)
  const [locations, setLocations] = React.useState<RewardsItemLocation[]>([])
  const [redeem, setRedeem] = React.useState<RewardsItemRedeem[]>([])
  const [selectedTab, setSelectedTab] = React.useState<string>(HEADER_TABS_REWARDS[0])
  const [summary, setSummary] = React.useState<any>(undefined)
  const onFetch = React.useCallback(async () => {}, [])
  const onFetchProgram = React.useCallback(async () => {
    try {
      setLoadingProgram(true)
      let response = await API.getRewardsProgram()
      if (response.Earn && response.Redeem && response.Locations) {
        setEarn(response.Earn)
        setRedeem(response.Redeem)
        setLocations(response.Locations)
        setLoadingProgram(false)
      } else {
        setAction('toast', { text: response.message })
      }
    } catch (e: any) {
      logError(e)
      setLoadingProgram(false)
      setAction('toast', { text: 'Unable to fetch rewards program details.' })
    }
  }, [])
  const onFetchSummary = React.useCallback(async () => {
    try {
      setLoadingSummary(true)
      let summaryResponse = await API.getUserRewardsSummary()
      let activityResponse = await API.getUserRewardsActivity()
      if (summaryResponse?.Level) {
        setSummary(summaryResponse)
        setAction('rewards', { pointBalance: summaryResponse.PointBalance })
      }
      if (Array.isArray(activityResponse)) {
        setActivity(activityResponse)
      }
      setLoadingSummary(false)
    } catch (e: any) {
      logError(e)
      setLoadingSummary(false)
      setAction('toast', { text: 'Unable to fetch rewards summary.' })
    }
  }, [])
  React.useEffect(() => {
    onFetchSummary()
    onFetchProgram()
  }, [])
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} size="tall" title="Rewards" />
      <HeaderTabs
        onSelectTab={setSelectedTab}
        selectedTab={selectedTab}
        tabs={HEADER_TABS_REWARDS as unknown as string[]}
      />
      <View style={themeStyle.flexView}>
        {selectedTab === HEADER_TABS_REWARDS[0] && (
          <RewardsLevel
            activity={activity}
            loading={loadingSummary}
            onRefresh={onFetchSummary}
            summary={summary}
          />
        )}
        {selectedTab === HEADER_TABS_REWARDS[1] && (
          <RewardsEarn data={earn} loading={loadingProgram} onRefresh={onFetch} />
        )}
        {selectedTab === HEADER_TABS_REWARDS[2] && (
          <RewardsRedeem
            data={redeem}
            loading={loadingProgram}
            locations={locations}
            onRefresh={() => {
              onFetchSummary()
              onFetchProgram()
            }}
          />
        )}
      </View>
      <TabBar />
    </View>
  )
}
