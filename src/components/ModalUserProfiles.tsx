import * as React from 'react'
import { ActivityIndicator, FlatList, Keyboard, Modal, Pressable, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import ListItem from './ListItem'
import ModalBanner from './ModalBanner'
import { API } from '../global/API'
import { logError, logUserContext } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'
import ItemSeparator from './ItemSeparator'

type Props = { alternateStyling?: boolean; onClose: () => void; visible?: boolean }

export default function ModalUserProfiles(props: Props): React.ReactElement {
  const { alternateStyling, onClose, visible = true } = props
  const { clientId, firstName, lastName, personId } = useSelector((state: ReduxState) => state.user)
  const { themeStyle } = useTheme()
  const [loading, setLoading] = React.useState(true)
  const [options, setOptions] = React.useState<UserProfile[]>([])
  const onSelect = React.useCallback(
    (item: UserProfile) => {
      const userInfo = {
        ...item,
        clientId: item.clientID,
        locationId: item.locationID,
        personId: item.personID,
      }
      logUserContext(userInfo)
      setAction('user', userInfo)
      onClose()
    },
    [onClose],
  )
  const filteredOptions = React.useMemo(
    () => options.filter((opt) => !(opt.clientID === clientId && opt.personID === personId)),
    [clientId, options, personId],
  )
  React.useEffect(() => {
    ;(async function getOptions() {
      setLoading(true)
      try {
        let response = await API.getUserProfiles()
        if (Array.isArray(response)) {
          setOptions(response)
          setLoading(false)
        } else {
          setLoading(false)
          setAction('toast', { text: response?.message ?? 'Unable to get profiles.' })
          setOptions([])
        }
      } catch (e: any) {
        setOptions([])
        logError(e)
        setLoading(false)
        setAction('toast', { text: 'Unable to get profiles.' })
      }
    })()
  }, [firstName, lastName])
  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss()
    }
  }, [visible])
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={alternateStyling ? themeStyle.modalContentAlt : themeStyle.modalContent}>
          <ModalBanner
            alternateStyling={alternateStyling}
            onClose={onClose}
            title="Select an Account"
          />
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={filteredOptions}
            keyExtractor={(item) => `${item.clientID}${item.personID}${item.locationName}`}
            ItemSeparatorComponent={ItemSeparator}
            ListEmptyComponent={
              <View style={themeStyle.listEmptyLoadingView}>
                {loading ? (
                  <ActivityIndicator size="large" />
                ) : (
                  <Text
                    style={{
                      ...themeStyle.textPrimaryRegular16,
                      textAlign: 'center' as 'center',
                    }}>
                    No options available
                  </Text>
                )}
              </View>
            }
            renderItem={({ item }) => {
              return (
                <ListItem
                  description={`#${item.personID}`}
                  onPress={() => onSelect(item)}
                  rightArrow={true}
                  title={item.locationName}
                />
              )
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  )
}
