import * as React from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import {
  FriendList,
  FriendSettings,
  FriendSuggestions,
  Header,
  HeaderTabs,
  TabBar,
} from '../components'
import { API } from '../global/API'
import { logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

const tabs = ['ALL', 'SUGGESTIONS', 'SETTINGS']

export default function Friends(): React.ReactElement {
  const scrollRef = React.useRef<ScrollView | null>(null)
  const { themeStyle } = useTheme()
  const [avatar, setAvatar] = React.useState<any>(null)
  const [blocked, setBlocked] = React.useState<Friend[]>([])
  const [friends, setFriends] = React.useState<Friend[]>([])
  const [loading, setLoading] = React.useState(true)
  const [pending, setPending] = React.useState<Friend[]>([])
  const [privacy, setPrivacy] = React.useState(false)
  const [requireSearchOptin, setRequireSearchOptin] = React.useState(false)
  const [searchVisibility, setSearchVisibility] = React.useState(false)
  const [searchMode, setSearchMode] = React.useState(false)
  const [selectedTab, setSelectedTab] = React.useState('SUGGESTIONS')
  const [suggested, setSuggested] = React.useState<Friend[]>([])
  const onFetchFriends = React.useCallback(async () => {
    try {
      setLoading(true)
      let response = await API.getFriends()
      if (response.message) {
        setAction('toast', { text: response.message })
      }
      const {
        Blocked = [],
        Friends: FriendsList = [],
        Pending = [],
        Settings = {},
        Suggested = [],
      } = response
      setAvatar(Settings.Avatar)
      setBlocked(Blocked)
      setFriends(FriendsList)
      setPending(Pending)
      setPrivacy(Settings.Private ?? false)
      setRequireSearchOptin(Settings.RequireSearchOptin ?? false)
      setSearchVisibility(Settings.Searchable ?? false)
      setSuggested(Suggested)
      setLoading(false)
    } catch (e: any) {
      logError(e)
      setLoading(false)
      setAction('toast', { text: 'Unable to fetch friend information.' })
    }
  }, [])
  const onToggleSearchMode = React.useCallback(() => {
    setSelectedTab('ALL')
    setSearchMode((prev) => !prev)
  }, [])
  const onUpdateBlocked = React.useCallback((item: Friend, action: 'add' | 'remove') => {
    setBlocked((prev) => {
      if (action === 'add') {
        return [...prev, item]
      } else {
        return prev.filter((p) => p.clientID !== item.clientID || p.personID !== item.personID)
      }
    })
  }, [])
  React.useEffect(() => {
    onFetchFriends()
  }, [])
  React.useEffect(() => {
    if (searchMode && selectedTab !== 'ALL') {
      setSearchMode(false)
    }
  }, [searchMode, selectedTab])
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ x: 0, y: 0 })
  }, [searchMode])
  return (
    <View style={themeStyle.flexView}>
      <Header
        menu={true}
        rightIcon="search"
        rightIconPress={onToggleSearchMode}
        size="tall"
        title="Friends"
      />
      <HeaderTabs
        counts={[{ count: pending.length, tab: 'SUGGESTIONS' }]}
        onSelectTab={async (t) => {
          setSelectedTab(t)
          await logEvent(`friends_tab_${t.toLowerCase()}`)
        }}
        selectedTab={selectedTab}
        tabs={tabs}
      />
      <View style={themeStyle.screenContentTabs}>
        <ScrollView
          contentContainerStyle={themeStyle.scrollContentTabScreen}
          ref={scrollRef}
          refreshControl={<RefreshControl onRefresh={onFetchFriends} refreshing={loading} />}
          showsVerticalScrollIndicator={false}>
          {selectedTab === 'ALL' && (
            <FriendList
              friends={friends}
              onToggleSearchMode={onToggleSearchMode}
              searchMode={searchMode}
              setFriends={setFriends}
            />
          )}
          {selectedTab === 'SUGGESTIONS' && (
            <FriendSuggestions
              loading={loading}
              pending={pending}
              setPending={setPending}
              suggested={suggested}
              setSuggested={setSuggested}
            />
          )}
          {selectedTab === 'SETTINGS' && (
            <FriendSettings
              avatar={avatar}
              blocked={blocked}
              onUpdateBlocked={onUpdateBlocked}
              privacy={privacy}
              requireSearchOptin={requireSearchOptin}
              searchVisibility={searchVisibility}
              setAvatar={setAvatar}
              setPrivacy={setPrivacy}
              setSearchVisibility={setSearchVisibility}
            />
          )}
        </ScrollView>
      </View>
      <TabBar />
    </View>
  )
}
