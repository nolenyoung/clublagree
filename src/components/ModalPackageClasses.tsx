import moment from 'moment'
import * as React from 'react'
import { ActivityIndicator, FlatList, Modal, Pressable, View } from 'react-native'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ListItem from './ListItem'
import ModalBanner from './ModalBanner'
import Toast from './Toast'
import { API } from '../global/API'
import { formatDate, logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'
import TagNoShow from './TagNoShow'

type Props = { data: Purchase | Sale; onClose: () => void }

export default function ModalPackageClasses(props: Props): React.ReactElement {
  const { data, onClose } = props
  const scrollRef = React.useRef<FlatList | null>(null)
  const { themeStyle } = useTheme()
  const [classes, setClasses] = React.useState<UserPackageDetails[]>([])
  const [loading, setLoading] = React.useState(false)
  const onFetchClasses = React.useCallback(async () => {
    try {
      setLoading(true)
      const { clientID, saleID } = data as Sale
      const { SaleID } = data as Purchase
      let response = await API.getUserPackageDetails({
        ClientID: clientID,
        SaleID: SaleID ?? saleID,
      })
      if (Array.isArray(response)) {
        setClasses(response)
      } else {
        setAction('toast', { text: response.message })
      }
      setLoading(false)
    } catch (e: any) {
      setAction('toast', { text: `Unable to fetch package details.` })
      logError(e)
      setLoading(false)
    }
  }, [data])
  React.useEffect(() => {
    onFetchClasses()
  }, [])
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={themeStyle.modalContent}>
          <ModalBanner alternateStyling={false} onClose={onClose} title="Package Details" />
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={classes}
            extraData={loading}
            ItemSeparatorComponent={ItemSeparator}
            keyExtractor={(item) => `${item.StartDateTime}${item.PersonID}`}
            ListEmptyComponent={
              loading ? (
                <View style={themeStyle.listEmptyLoadingView}>
                  <ActivityIndicator size="large" />
                </View>
              ) : (
                <ListEmptyComponent
                  containerStyle={{
                    marginBottom: themeStyle.scale(40),
                    marginTop: themeStyle.scale(40),
                  }}
                  description={`No bookings have been made with this pricing option. It may take up to 24 hours after a booking is made to appear.`}
                  title={`No Bookings`}
                />
              )
            }
            ref={scrollRef}
            renderItem={({ item }: { item: UserPackageDetails }) => {
              const { AppointmentDescription, AppointmentStatus, LocationName, StartDateTime } =
                item
              return (
                <ListItem
                  description={LocationName}
                  rightText={moment(StartDateTime).format(formatDate('h:mma'))}
                  tag={
                    AppointmentStatus === 'noshow' || AppointmentStatus === 'latecancelled' ? (
                      <TagNoShow
                        text={AppointmentStatus === 'noshow' ? 'No Show' : 'Late Cancelled'}
                      />
                    ) : undefined
                  }
                  title={AppointmentDescription}
                  value={moment(StartDateTime).format(formatDate('M/D/YY'))}
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
