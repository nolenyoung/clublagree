import * as React from 'react'
import { View } from 'react-native'
import { ClassHistoryList, ClassUpcomingList, Header, HeaderTabs, TabBar } from '../components'
import Brand from '../global/Brand'
import { useGetBookings, useRefreshOnForeground, useTheme } from '../global/Hooks'
import { cleanAction } from '../redux/actions'
import { logEvent } from '../global/Functions'

const tabs = ['UPCOMING', 'PAST']

export default function ClassList(): React.ReactElement {
  const { themeStyle } = useTheme()
  const {
    classes: futureClasses,
    family: futureFamily = [],
    onFetchClasses: onFetchFutureClasses,
    setClasses: setFutureClasses,
  } = useGetBookings({ FutureOnly: true, Type: 'Both' })
  const {
    classes: pastClasses,
    family: pastFamily = [],
    onFetchClasses: onFetchPastClasses,
  } = useGetBookings({ PastOnly: true, Type: 'Classes' })
  const [future, setFuture] = React.useState(Brand.DEFAULT_CLASS_LIST_FUTURE)
  const onSelectTab = React.useCallback(async (tab: string) => {
    setFuture(tab === 'UPCOMING')
    await logEvent(
      `${Brand.STRING_CLASS_TITLE_LC}_list_tab_${tab === 'UPCOMING' ? 'upcoming' : 'past'}`,
    )
  }, [])
  React.useEffect(() => {
    ;(async function getAllClasses() {
      await onFetchFutureClasses()
      await onFetchPastClasses()
      cleanAction('bookingDetails')
    })()
  }, [])
  useRefreshOnForeground(future ? onFetchFutureClasses : onFetchPastClasses)
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} size="tall" title={Brand.STRING_CLASS_LIST_TITLE} />
      <HeaderTabs
        onSelectTab={onSelectTab}
        selectedTab={future ? 'UPCOMING' : 'PAST'}
        tabs={tabs}
      />
      <View style={themeStyle.screenContentTabs}>
        <View style={{ flex: 1, display: future ? 'flex' : 'none' }}>
          <ClassUpcomingList
            classes={futureClasses}
            family={futureFamily}
            onFetch={onFetchFutureClasses}
            setClasses={setFutureClasses}
          />
        </View>
        <View style={{ flex: 1, display: !future ? 'flex' : 'none' }}>
          <ClassHistoryList
            classes={pastClasses}
            family={pastFamily}
            onFetch={onFetchPastClasses}
          />
        </View>
      </View>
      <TabBar />
    </View>
  )
}
