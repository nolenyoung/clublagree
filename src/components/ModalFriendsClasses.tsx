import * as React from 'react'
import { ActivityIndicator, FlatList, Modal, Pressable, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import ClassScheduleItem from './ClassScheduleItem'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ModalBanner from './ModalBanner'
import Toast from './Toast'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { getPrebookInfo, logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = { friend: Friend; onClose: () => void; visible: boolean }

export default function ModalFriendsClasses(props: Props): React.ReactElement {
  const {
    friend: { clientID, firstName, personID },
    onClose,
    visible,
  } = props
  const { navigate } = useNavigation()
  const scrollRef = React.useRef<FlatList | null>(null)
  const { themeStyle } = useTheme()
  const [classes, setClasses] = React.useState<ClassInfo[]>([])
  const [loading, setLoading] = React.useState(false)
  const onBook = React.useCallback(async (selectedClass: ClassInfo) => {
    getPrebookInfo({ navigate, onClose, selectedClass })
  }, [])
  const onFetchClasses = React.useCallback(async () => {
    try {
      setLoading(true)
      let response = await API.getFriendsClasses({ ClientID: clientID, PersonID: personID })
      if (Array.isArray(response)) {
        setClasses(response)
      } else {
        setAction('toast', { text: response.message })
      }
      setLoading(false)
    } catch (e: any) {
      setAction('toast', {
        text: `Unable to fetch ${firstName}${firstName.endsWith('s') ? "'" : "'s"} classes.`,
      })
      logError(e)
      setLoading(false)
    }
  }, [clientID, firstName, personID])
  const onRefresh = React.useCallback(() => {}, [])
  React.useEffect(() => {
    if (visible) {
      onFetchClasses()
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
        <View style={themeStyle.modalContent}>
          <ModalBanner
            alternateStyling={false}
            onClose={onClose}
            title={`${firstName}${firstName.endsWith('s') ? "'" : "'s"} Classes`}
          />
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={classes}
            extraData={loading}
            ItemSeparatorComponent={ItemSeparator}
            keyExtractor={(item) => `${item.RegistrationID}${item.Name}`}
            ListEmptyComponent={
              loading ? (
                <View style={themeStyle.listEmptyLoadingView}>
                  <ActivityIndicator size="large" />
                </View>
              ) : (
                <ListEmptyComponent
                  description={`${firstName} does not have any upcoming ${Brand.STRING_CLASS_TITLE_PLURAL_LC}.`}
                  title={`No upcoming ${Brand.STRING_CLASS_TITLE_PLURAL_LC}.`}
                />
              )
            }
            ref={scrollRef}
            renderItem={({ item }) => {
              const userInClass = item.UserStatus?.isUserInClass
              const userOnWaitlist = item.UserStatus?.isUserOnWaitlist
              return (
                <ClassScheduleItem
                  details={item}
                  hideInfo={true}
                  onPress={
                    userInClass
                      ? () => setAction('classToCancel', { item, onRefresh, type: 'class' })
                      : userOnWaitlist
                        ? () => setAction('classToCancel', { item, onRefresh, type: 'waitlist' })
                        : () => onBook(item)
                  }
                  showCancel={userInClass || userOnWaitlist}
                  showClassDate={true}
                />
              )
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
      <Toast />
    </Modal>
  )
}
