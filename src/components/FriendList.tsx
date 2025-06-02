import * as React from 'react'
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button from './Button'
import FriendCard from './FriendCard'
import Icon from './Icon'
import Input from './Input'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ModalConfirmation from './ModalConfirmation'
import ModalConfirmationCancel from './ModalConfirmationCancel'
import ModalFriendsClasses from './ModalFriendsClasses'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError } from '../global/Functions'
import { useSearchFriends, useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = {
  friends: Array<Friend>
  onToggleSearchMode: () => void
  searchMode: boolean
  setFriends: (arg1: (arg1: Array<Friend>) => Array<Friend>) => void
}

export default function FriendList(props: Props): React.ReactElement {
  const { friends, onToggleSearchMode, searchMode, setFriends } = props
  const classToCancel = useSelector((state: ReduxState) => state.classToCancel)
  const { filteredFriends, loading, onSearchFriends, setFilteredFriends, setSearchText } =
    useSearchFriends()
  const { themeStyle } = useTheme()
  const [friendToBlock, setFriendToBlock] = React.useState<
    (Friend & { listType: 'filter' | 'friend' }) | null
  >(null)
  const [modalFriendsClasses, setModalFriendsClasses] = React.useState(false)
  const [requestedFriends, setRequestedFriends] = React.useState<Friend[]>([])
  const [selectedFriend, setSelectedFriend] = React.useState<Friend | null>(null)
  const styles = getStyles(themeStyle)
  const onAddFriend = React.useCallback(async (item: Friend) => {
    try {
      setRequestedFriends((prev) => [...prev, item])
      let response = await API.createFriend({ ClientID: item.clientID, PersonID: item.personID })
      if (response.code !== 200) {
        setRequestedFriends((prev) =>
          prev.filter((p) => !(p.clientID === item.clientID && p.personID === item.personID)),
        )
      }
    } catch (e: any) {
      logError(e)
      setRequestedFriends((prev) =>
        prev.filter((p) => !(p.clientID === item.clientID && p.personID === item.personID)),
      )
      setAction('toast', { text: 'Unable to send request.' })
    }
  }, [])
  const onBlockFriend = React.useCallback(
    async (
      item: Friend & {
        listType: 'filter' | 'friend'
      },
    ) => {
      try {
        let response = await API.createFriendBlock({
          ClientID: item.clientID,
          PersonID: item.personID,
        })
        if (response.code === 200) {
          if (item.listType === 'friend') {
            setFriends((prev) =>
              prev.filter((p) => p.clientID !== item.clientID || p.personID !== item.personID),
            )
          } else {
            setFilteredFriends((prev) =>
              prev.filter((p) => p.clientID !== item.clientID || p.personID !== item.personID),
            )
          }
        }
      } catch (e: any) {
        logError(e)
        setAction('toast', { text: 'Unable to block user.' })
      }
    },
    [],
  )
  const onClearSearch = React.useCallback(() => {
    setSearchText('')
    onToggleSearchMode()
  }, [onToggleSearchMode, setSearchText])
  const onCloseModalBlock = React.useCallback(() => {
    setFriendToBlock(null)
  }, [])
  const onCloseModalClasses = React.useCallback(() => {
    setModalFriendsClasses(false)
    setSelectedFriend(null)
  }, [])
  return (
    <>
      {searchMode ? (
        <>
          <Input
            containerStyle={styles.searchInput}
            onChangeText={onSearchFriends}
            placeholder="Search"
            placeholderTextColor={themeStyle.textGray}
            rightIcon="clear"
            rightIconPress={onClearSearch}
            rowStyle={styles.searchInputRow}
            textColor={themeStyle.textGray}
          />
          {loading ? (
            <View style={themeStyle.listEmptyLoadingView}>
              <ActivityIndicator color={themeStyle.brandSecondary} size="large" />
            </View>
          ) : (
            <FlatList
              data={filteredFriends}
              extraData={[friends, requestedFriends]}
              ItemSeparatorComponent={ItemSeparator}
              keyExtractor={(item) => `SearchedFriends${item.clientID}${item.personID}`}
              ListEmptyComponent={
                <ListEmptyComponent
                  description="Tweak your search criteria."
                  title="No matching results."
                />
              }
              renderItem={({ item }) => {
                let isFriend = false
                let hasClasses: boolean = item.hasClasses
                const currentFriend = friends.find(
                  (f) => `${f.clientID}${f.personID}` === `${item.clientID}${item.personID}`,
                )
                const requested = requestedFriends.some(
                  (f) => `${f.clientID}${f.personID}` === `${item.clientID}${item.personID}`,
                )
                if (currentFriend != null) {
                  isFriend = true
                  hasClasses = currentFriend.hasClasses ?? false
                }
                return (
                  <FriendCard
                    {...item}
                    hideLastName={false}
                    rightComponent={
                      <View style={themeStyle.rowAligned}>
                        {((isFriend && hasClasses) || !isFriend) && (
                          <Button
                            disabled={requested}
                            gradient={Brand.BUTTON_GRADIENT}
                            leftIcon={isFriend ? 'date-range' : ''}
                            onPress={() => {
                              if (isFriend) {
                                setSelectedFriend(item)
                                setModalFriendsClasses(true)
                              } else {
                                onAddFriend(item)
                              }
                            }}
                            small={true}
                            text={
                              isFriend
                                ? Brand.STRING_CLASS_TITLE_PLURAL
                                : requested
                                  ? 'Requested'
                                  : 'Add Friend'
                            }
                          />
                        )}
                        <Pressable
                          onPress={() => setFriendToBlock({ ...item, listType: 'filter' })}>
                          <Icon name="clear" style={styles.icon} />
                        </Pressable>
                      </View>
                    }
                  />
                )
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        <FlatList
          data={friends}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) => `AllFriends${item.clientID}${item.personID}`}
          ListEmptyComponent={
            <ListEmptyComponent
              description={`Your friends will appear here.`}
              title={`Add your friends`}
            />
          }
          renderItem={({ item }) => {
            return (
              <FriendCard
                {...item}
                rightComponent={
                  <View style={themeStyle.rowAligned}>
                    {item.hasClasses && (
                      <Button
                        gradient={Brand.BUTTON_GRADIENT}
                        leftIcon="date-range"
                        onPress={() => {
                          setSelectedFriend(item)
                          setModalFriendsClasses(true)
                        }}
                        small={true}
                        text={Brand.STRING_CLASS_TITLE_PLURAL}
                      />
                    )}
                    <Pressable onPress={() => setFriendToBlock({ ...item, listType: 'friend' })}>
                      <Icon name="clear" style={styles.icon} />
                    </Pressable>
                  </View>
                }
              />
            )
          }}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
      <ModalConfirmationCancel />
      {friendToBlock != null && (
        <ModalConfirmation
          cancelText="Cancel"
          confirmationText={`They won’t be able to see your ${Brand.STRING_CLASS_TITLE_PLURAL_LC} or re-add you. If you change your mind, you will have to unblock on the ‘Settings’ page.`}
          continueText="Block"
          onClose={onCloseModalBlock}
          onContinue={() => {
            onBlockFriend(friendToBlock)
            setFriendToBlock(null)
          }}
          title="Block Friend"
          visible={friendToBlock != null}
        />
      )}
      {selectedFriend != null && classToCancel == null && (
        <ModalFriendsClasses
          friend={selectedFriend}
          onClose={onCloseModalClasses}
          visible={modalFriendsClasses}
        />
      )}
    </>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    searchInput: { marginHorizontal: themeStyle.scale(20) },
    searchInputRow: {
      backgroundColor: themeStyle.fadedGray,
      height: themeStyle.scale(51),
      paddingHorizontal: themeStyle.scale(16),
    },
    icon: {
      color: themeStyle.textIconX,
      fontSize: themeStyle.scale(11),
      marginLeft: themeStyle.scale(12),
    },
  }
}
