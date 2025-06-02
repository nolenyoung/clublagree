import * as React from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import {
  Button,
  ClassSpot,
  ClassSpotDiamond,
  ClassSpotHexagon,
  ClassSpotInstructor,
  ClassSpotSquare,
  Header,
  Icon,
  ModalClassDescription,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = { isEdit?: boolean; onClose?: () => void }
type ScreenProps =
  | RootNavigatorScreenProps<'ClassBookingSpotEdit'>
  | ScheduleStackScreenProps<'ClassBookingSpot'>
  | WorkshopStackScreenProps<'WorkshopsBookingSpot'>
type NavigationEdit = RootNavigatorScreenProps<'ClassBookingSpotEdit'>['navigation']
type NavigationSchedule = ScheduleStackScreenProps<'ClassBookingSpot'>['navigation']
type NavigationWorkshops = WorkshopStackScreenProps<'WorkshopsBookingSpot'>['navigation']

function getSpotComponent(type?: string | null) {
  return type === 'hexagon'
    ? ClassSpotHexagon
    : type === 'diamond'
      ? ClassSpotDiamond
      : type === 'square'
        ? ClassSpotSquare
        : type === 'instructor'
          ? ClassSpotInstructor
          : ClassSpot
}

// This is used both as a screen in Routes, and a full screen component in ClassBooking

export default function ClassBookingSpot(props: ScreenProps | Props): React.ReactElement {
  const { navigation, route } = props as ScreenProps
  const { isEdit, onClose } = props as Props
  const { name } = route ?? {}
  const isEditFlow = name === 'ClassBookingSpotEdit' || isEdit
  const { goBack = () => {} } = navigation ?? {}
  const {
    Class,
    Layout: layoutConfig,
    SpotID,
    workshops,
  } = useSelector((state: ReduxState) => state.bookingDetails)
  const { ClientID, PersonID, RegistrationID } = Class ?? {}
  const {
    Cols = '1',
    HasSpotsAvailable = true,
    Layout = [],
    Legend = [],
    Rows = '1',
  } = layoutConfig ?? {}
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [loading, setLoading] = React.useState(true)
  const [listSize, setListSize] = React.useState({ height: 0, width: 0 })
  const [noticeShown, setNoticeShown] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [selectedSpot, setSelectedSpot] = React.useState<any>(null)
  const [spotSize, setSpotSize] = React.useState(0)
  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true)
      let response = await API.getClassLayout({
        ClientID: ClientID ?? 0,
        PersonID,
        RegistrationID: RegistrationID ?? 0,
      })
      if (response.Layout != null) {
        setAction('bookingDetails', { Layout: response.Layout })
      } else {
        setAction('toast', { text: response.message })
      }
      setRefreshing(false)
    } catch (e: any) {
      logError(e)
      setRefreshing(false)
      setAction('toast', { text: 'Unable to refresh class layout.' })
    }
  }, [ClientID, PersonID, RegistrationID])
  const onSubmit = async () => {
    if (isEditFlow) {
      if (selectedSpot != null) {
        try {
          let response = await API.updateClassSpot({
            Action: 'Reserve',
            ClientID: ClientID ?? 0,
            PersonID,
            RegistrationID: RegistrationID ?? 0,
            Spot: selectedSpot,
          })
          cleanAction('activeButton')
          if (response.code !== 200) {
            setAction('toast', { text: response.message })
          } else {
            setAction('toast', { text: 'Spot updated.', type: 'success' })
            onClose && onClose()
          }
          goBack && goBack()
        } catch (e: any) {
          logError(e)
          cleanAction('activeButton')
          setAction('toast', { text: 'Unable to update spot.' })
        }
      } else {
        setAction('toast', { text: 'Please select a spot.' })
      }
    } else {
      setAction('bookingDetails', { SpotID: selectedSpot })
      onClose && onClose()
      if (navigation?.navigate) {
        isEditFlow
          ? (navigation as NavigationEdit).goBack()
          : workshops
            ? (navigation as NavigationWorkshops).navigate('ClassBooking')
            : (navigation as NavigationSchedule).navigate('ClassBooking')
      }
    }
  }
  React.useEffect(() => {
    const { height, width } = listSize
    if (height > 0 && width > 0) {
      const maxHeight = height / Number(Rows)
      const maxWidth = width / Number(Cols)
      setSpotSize(Math.floor(Math.min(maxHeight, maxWidth)))
      setLoading(false)
    }
  }, [Cols, Rows, listSize])
  React.useEffect(() => {
    if (SpotID != null) {
      setSelectedSpot(SpotID)
    }
  }, [SpotID])
  return (
    <View style={themeStyle.flexView}>
      <Header
        leftComponent={
          <Pressable onPress={() => (onClose != null ? onClose() : goBack())}>
            <Icon name="arrow-back" style={themeStyle.headerIcon} />
          </Pressable>
        }
        title="Pick Your Spot"
      />
      <View style={themeStyle.screenSecondary}>
        {Legend.length > 1 && (
          <View style={styles.legend}>
            {Legend.map((l) => {
              const { Type, Value } = l
              const SpotComponent = getSpotComponent(Type)
              return (
                <View key={Value} style={themeStyle.rowAligned}>
                  <View style={styles.legendItemShape}>
                    <SpotComponent available={true} onPress={() => {}} selected={false} text="" />
                  </View>
                  <Text style={styles.legendItemText}>{Value}</Text>
                </View>
              )
            })}
          </View>
        )}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled={true}
          onLayout={(event) => {
            const { height, width } = event.nativeEvent.layout
            setListSize({ height, width })
          }}
          refreshControl={
            <RefreshControl
              colors={[themeStyle.textWhite]}
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={themeStyle.textWhite}
            />
          }
          showsVerticalScrollIndicator={false}>
          <ScrollView bounces={false} horizontal={true} showsHorizontalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator color={themeStyle.textWhite} size="large" />
            ) : (
              <View
                style={[
                  styles.spotsGrid,
                  { width: spotSize * Number(Cols) },
                  spotSize === 0 && { opacity: 0 },
                ]}>
                {Layout?.map((spot: ClassSpot) => {
                  const { Col, Label, Row, SpotID: spotId, Status, Type } = spot || {}
                  const SpotComponent = getSpotComponent(Type)
                  return (
                    <View
                      key={`${Col}${Label}${Row}${Status}`}
                      style={[styles.spot, { height: spotSize, width: spotSize }]}>
                      {Type == null ? null : (
                        <SpotComponent
                          available={Status === 'available'}
                          onPress={() => setSelectedSpot(spotId)}
                          selected={selectedSpot == spotId}
                          text={Label}
                        />
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </ScrollView>
        </ScrollView>
        {isEditFlow && !HasSpotsAvailable && selectedSpot == null && (
          <Text style={styles.noSpotsText}>
            {`If there are no spots available, a spot will be assigned on arrival.`}
          </Text>
        )}
        <Button
          animated={isEditFlow}
          color={themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys]}
          disabled={HasSpotsAvailable && selectedSpot == null}
          gradient={Brand.BUTTON_GRADIENT}
          onPress={onSubmit}
          style={styles.submitButton}
          text={isEditFlow ? 'Save' : 'Continue'}
          textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
        />
      </View>
      {isEdit && (
        <ModalClassDescription
          details={{
            Description: `I’m sorry. The spot you selected was grabbed by someone else before your booking was completed. Please pick a different spot.`,
            Name: 'Spot Already Booked',
          }}
          onClose={() => setNoticeShown(true)}
          visible={!noticeShown}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    legend: {
      ...themeStyle.rowAlignedAround,
      alignSelf: 'center' as 'center',
      borderBottomWidth: themeStyle.scale(1),
      borderColor: themeStyle.textWhite,
      marginTop: themeStyle.scale(14),
      paddingBottom: themeStyle.scale(14),
      width: '100%' as const,
    },
    legendItemShape: {
      height: themeStyle.scale(20),
      marginRight: themeStyle.scale(8),
      width: themeStyle.scale(20),
    },
    legendItemText: { ...themeStyle.textPrimaryRegular14, color: themeStyle.textWhite },
    scrollContent: {
      alignItems: 'center' as 'center',
      flexGrow: 1,
      paddingVertical: themeStyle.scale(16),
    },
    spotsGrid: {
      flexDirection: 'row' as 'row',
      flexWrap: 'wrap' as 'wrap',
      height: '100%' as const,
      width: '100%' as const,
    },
    spot: { padding: themeStyle.scale(4) },
    noSpotsText: {
      ...themeStyle.textPrimaryRegular12,
      color: themeStyle.textWhite,
      marginBottom: themeStyle.scale(16),
      textAlign: 'center' as 'center',
    },
    submitButton: { marginBottom: themeStyle.scale(40) },
  }
}
