import moment from 'moment'
import * as React from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import Avatar from './Avatar'
import FriendCard from './FriendCard'
import Icon from './Icon'
import ModalImageActions from './ModalImageActions'
import Switch from './Switch'
import { API } from '../global/API'
import { logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { selectCamera, selectGallery } from '../global/ImageSelector'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  avatar: string | null | undefined
  blocked: Array<Friend>
  onUpdateBlocked: (arg1: Friend, arg2: 'add' | 'remove') => void
  privacy: boolean
  requireSearchOptin: boolean
  searchVisibility: boolean
  setAvatar: (arg1?: string | null | undefined) => void
  setPrivacy: (arg1: boolean) => void
  setSearchVisibility: (arg1: boolean) => void
}

export default function FriendSettings(props: Props): React.ReactElement {
  const {
    avatar,
    blocked = [],
    onUpdateBlocked,
    privacy,
    requireSearchOptin,
    searchVisibility,
    setAvatar,
    setSearchVisibility,
    setPrivacy,
  } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [modalImage, setModalImage] = React.useState(false)
  const onRemoveBlockedFriend = React.useCallback(
    async (item: Friend) => {
      try {
        onUpdateBlocked(item, 'remove')
        let response = await API.deleteFriendBlock({
          ClientID: item.clientID,
          PersonID: item.personID,
        })
        if (response.code !== 200) {
          onUpdateBlocked(item, 'add')
        }
      } catch (e: any) {
        logError(e)
        onUpdateBlocked(item, 'add')
        setAction('toast', { text: 'Unable to remove user.' })
      }
    },
    [onUpdateBlocked],
  )
  const onSelectImage = React.useCallback(async (action: string) => {
    if (action === 'remove') {
      try {
        let response = await API.deleteUserAvatar()
        const { Avatar: image } = response ?? {}
        if (image != null) {
          setAction('user', { avatar: image })
          setAvatar(image)
          await logEvent('friends_remove_photo')
        }
      } catch (e: any) {
        logError(e)
        setAction('toast', { text: 'Unable to remove your avatar.' })
      }
    } else {
      let photo = null
      if (action === 'take') {
        photo = await selectCamera({ multiple: false })
        await logEvent('friends_take_photo')
      } else {
        photo = await selectGallery({ multiple: false })
        await logEvent('friends_choose_photo')
      }
      if (!Array.isArray(photo) && photo?.uri != null) {
        try {
          setAction('loading', { loading: true })
          const photoType = photo.type ?? 'image/png'
          const name = `profilePhoto_${moment().valueOf()}`
          let response = await API.updateUser({
            Avatar: {
              filename: `${name}.${photoType.includes('jpeg') ? 'jpg' : 'png'}`,
              name,
              type: photoType,
              uri: photo.uri,
            },
          })
          const { Avatar: image } = response
          setAction('user', { avatar: image })
          setAvatar(image)
          cleanAction('loading')
        } catch (e: any) {
          logError(e)
          cleanAction('loading')
          setAction('toast', { text: 'Update picture failed.' })
        }
      }
    }
    setModalImage(false)
  }, [])
  const onTogglePrivacy = React.useCallback(async () => {
    const initialPrivacy = privacy
    setPrivacy(!initialPrivacy)
    try {
      let response = await API.setFriendSettings({ Private: !initialPrivacy })
      if (response.code !== 200) {
        setPrivacy(initialPrivacy)
      } else {
        await logEvent('friends_privacy_toggle')
      }
    } catch (e: any) {
      logError(e)
      setPrivacy(initialPrivacy)
      setAction('toast', { text: 'Privacy update failed.' })
    }
  }, [privacy])
  const onToggleSearchVisibility = React.useCallback(async () => {
    const initialVisibility = searchVisibility
    setSearchVisibility(!initialVisibility)
    try {
      let response = await API.setFriendSettings({ Searchable: !initialVisibility })
      if (response.code !== 200) {
        setSearchVisibility(initialVisibility)
      } else {
        await logEvent('friends_search_visibility_toggle')
      }
    } catch (e: any) {
      logError(e)
      setSearchVisibility(initialVisibility)
      setAction('toast', { text: 'Search visibility update failed.' })
    }
  }, [searchVisibility])
  return (
    <>
      <Pressable
        onPress={async () => {
          setModalImage(true)
          await logEvent('friends_edit_photo')
        }}
        style={styles.editPhotoButton}>
        <View style={themeStyle.viewCentered}>
          <Avatar size={themeStyle.scale(130)} source={avatar} />
          <Text style={styles.editPhotoText}>edit photo</Text>
        </View>
      </Pressable>
      <View style={themeStyle.separator} />
      <View style={themeStyle.sectionViewFriend}>
        <Text style={themeStyle.sectionTitleTextFriend}>Privacy</Text>
        <View style={styles.privacyToggleView}>
          <Switch
            containerStyle={styles.privacyToggle}
            onPress={onTogglePrivacy}
            selected={privacy}
          />
          <View style={themeStyle.flexView}>
            <Text style={themeStyle.textItemPrimary}>Private Account</Text>
            <Text style={themeStyle.textItemSecondary}>
              {`A private account requires you to approve friend requests. Only the people you accept will be able to see which classes you are attending.`}
            </Text>
          </View>
        </View>
      </View>
      {requireSearchOptin && (
        <View style={styles.privacyToggleView}>
          <Switch
            containerStyle={styles.privacyToggle}
            onPress={onToggleSearchVisibility}
            selected={searchVisibility}
          />
          <View style={themeStyle.flexView}>
            <Text style={themeStyle.textItemPrimary}>Visible in Searches</Text>
            <Text style={themeStyle.textItemSecondary}>
              {`Flip this option on so your friends can find you in the search results.`}
            </Text>
          </View>
        </View>
      )}
      {blocked.length > 0 && (
        <>
          <View style={themeStyle.separator} />
          <View style={themeStyle.sectionViewFriend}>
            <Text style={themeStyle.sectionTitleTextFriend}>Blocked</Text>
            <FlatList
              data={blocked}
              keyExtractor={(item) => `${item.personID}`}
              renderItem={({ item }) => {
                return (
                  <FriendCard
                    {...item}
                    rightComponent={
                      <Pressable onPress={() => onRemoveBlockedFriend(item)}>
                        <Icon name="clear" style={styles.removeIcon} />
                      </Pressable>
                    }
                  />
                )
              }}
            />
          </View>
        </>
      )}
      <ModalImageActions
        onClose={() => setModalImage(false)}
        onSelect={onSelectImage}
        visible={modalImage}
      />
    </>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    editPhotoButton: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(28),
      marginTop: themeStyle.scale(22),
    },
    editPhotoText: {
      ...themeStyle.textPrimaryRegular16,
      color: themeStyle.textGray,
      marginTop: themeStyle.scale(14),
      textAlign: 'center' as 'center',
    },
    privacyToggleView: {
      flexDirection: 'row' as 'row',
      paddingHorizontal: themeStyle.scale(20),
      width: '100%' as const,
    },
    privacyToggle: { marginRight: themeStyle.scale(12) },
    removeIcon: { color: themeStyle.textIconX, fontSize: themeStyle.scale(12) },
  }
}
