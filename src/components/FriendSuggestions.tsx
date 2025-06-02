import * as React from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import Button from './Button'
import FriendCard from './FriendCard'
import Icon from './Icon'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = {
  loading: boolean
  pending: Array<Friend>
  setPending: (arg1: (arg1: Array<Friend>) => Array<Friend>) => void
  setSuggested: (arg1: (arg1: Array<Friend>) => Array<Friend>) => void
  suggested: Array<Friend>
}

export default function FriendSuggestions(props: Props): React.ReactElement {
  const { loading, pending, setPending, setSuggested, suggested } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const onAccept = React.useCallback(
    async (item: Friend) => {
      try {
        setPending((prev) =>
          prev.filter((p) => p.clientID !== item.clientID || p.personID !== item.personID),
        )
        let response = await API.acceptFriendRequest({
          ClientID: item.clientID,
          PersonID: item.personID,
        })
        if (response.code !== 200) {
          setPending((prev) => [...prev, item])
        }
      } catch (e: any) {
        logError(e)
        setPending((prev) => [...prev, item])
        setAction('toast', { text: 'Unable to accept request.' })
      }
    },
    [setPending],
  )
  const onAdd = React.useCallback(
    async (item: Friend) => {
      try {
        setSuggested((prev) => {
          let newSuggested = [...prev]
          const index = newSuggested.findIndex(
            (p) => p.clientID === item.clientID && p.personID === item.personID,
          )
          if (index !== -1) {
            newSuggested[index].existingRequestStatus = 'pending'
            return newSuggested
          } else {
            return newSuggested
          }
        })
        let response = await API.createFriend({ ClientID: item.clientID, PersonID: item.personID })
        if (response.code !== 200) {
          setSuggested((prev) => {
            let newSuggested = [...prev]
            const index = newSuggested.findIndex(
              (p) => p.clientID === item.clientID && p.personID === item.personID,
            )
            if (index !== -1) {
              newSuggested[index].existingRequestStatus = 'suggested'
              return newSuggested
            } else {
              return newSuggested
            }
          })
        }
      } catch (e: any) {
        logError(e)
        setSuggested((prev) => {
          let newSuggested = [...prev]
          const index = newSuggested.findIndex(
            (p) => p.clientID === item.clientID && p.personID === item.personID,
          )
          if (index !== -1) {
            newSuggested[index].existingRequestStatus = 'suggested'
            return newSuggested
          } else {
            return newSuggested
          }
        })
        setAction('toast', { text: 'Unable to send request.' })
      }
    },
    [setSuggested],
  )
  if (loading) {
    return <View style={themeStyle.flexView} />
  }
  return (
    <>
      {pending.length > 0 && (
        <FlatList
          data={pending}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) => `PendingFriend${item.clientID}${item.personID}`}
          renderItem={({ item }) => {
            return (
              <FriendCard
                {...item}
                rightComponent={
                  <View style={themeStyle.rowAligned}>
                    <Button
                      gradient={Brand.BUTTON_GRADIENT}
                      onPress={() => onAccept(item)}
                      small={true}
                      text="Accept"
                    />
                    <Pressable>
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
      <FlatList
        data={suggested}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={(item) => `SuggestedFriend${item.clientID}${item.personID}`}
        ListEmptyComponent={
          <ListEmptyComponent
            description={`Check back later for suggestions\nof people to add as friends.`}
            title={`No suggestions`}
          />
        }
        ListHeaderComponent={
          suggested.length > 0 ? (
            <Text style={themeStyle.sectionTitleTextFriend}>People you may know...</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const { existingRequestStatus } = item
          return (
            <FriendCard
              {...item}
              hideLastName={false}
              rightComponent={
                <Button
                  disabled={existingRequestStatus === 'pending'}
                  gradient={Brand.BUTTON_GRADIENT}
                  onPress={() => onAdd(item)}
                  small={true}
                  text={existingRequestStatus === 'pending' ? 'Requested' : 'Add Friend'}
                />
              }
            />
          )
        }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    icon: {
      color: themeStyle.textIconX,
      fontSize: themeStyle.scale(11),
      marginLeft: themeStyle.scale(12),
    },
  }
}
