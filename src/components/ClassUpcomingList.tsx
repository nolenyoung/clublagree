import moment from 'moment'
import * as React from 'react'
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import Geolocation from '@react-native-community/geolocation'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import Button from './Button'
import Icon from './Icon'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ModalBringFriend from './ModalBringFriend'
import ModalConfirmationCancel from './ModalConfirmationCancel'
import ModalDoorUnlock from './ModalDoorUnlock'
import ModalFilterSelector from './ModalFilterSelector'
import ModalFitMetrixBooking from './ModalFitMetrixBooking'
import ModalPermissionLocation from './ModalPermissionLocation'
import TagFamilyMember from './TagFamilyMember'
import TagWaitlist from './TagWaitlist'
import { API } from '../global/API'
import Brand from '../global/Brand'
import {
  addToCalendar,
  calculateDistance,
  formatCoachName,
  formatDate,
  formatName,
  getFamilyMemberKey,
  logError,
  logEvent,
  openExternalLink,
  //@ts-ignore
  renderClassDetail,
} from '../global/Functions'
import { useFamilyClassFiltering, useLocationPermission, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  classes: Array<BookedClassInfo>
  family: Array<Partial<FamilyMember>>
  hideFilters?: boolean
  onFetch?: () => Promise<void>
  scrollEnabled?: boolean
  setClasses: (arg1: (arg1: Array<BookedClassInfo>) => Array<BookedClassInfo>) => void
}

export default function ClassUpcomingList(props: Props): React.ReactElement {
  const { classes, family, hideFilters, onFetch, scrollEnabled = true, setClasses } = props
  const locationMoment = useSelector((state: ReduxState) => state.oneTimeMoments.locationPermission)
  const {
    filterApplied,
    filteredClasses,
    modalFilterFamily,
    onSelectFamilyMember,
    onToggleFilterModal,
    selectedFamily,
    showFamilyTag,
  } = useFamilyClassFiltering(classes, family)
  const { onCheckPermission, permission: locationPermission } =
    useLocationPermission(locationMoment)
  const { navigate } = useNavigation()
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [fitmetrixSpotDetails, setFitmetrixSpotDetails] = React.useState<{
    fitmetrixLocation: number
    registrationID: number
  } | null>(null)
  const [location, setLocation] = React.useState({ coords: { latitude: 0, longitude: 0 } })
  const [modalBringFriend, setModalBringFriend] = React.useState(false)
  const [modalDoorUnlock, setModalDoorUnlock] = React.useState<BookedClassInfo | null | undefined>(
    null,
  )
  const [modalFitMetrixBooking, setModalFitMetrixBooking] = React.useState(false)
  const [modalLocationPermission, setModalLocationPermission] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState<BookedClassInfo | null>(null)
  const dataFiltered = filterApplied && !hideFilters
  const dataLength = dataFiltered ? filteredClasses.length : classes.length
  const onAddToCalendar = React.useCallback(async (item: BookedClassInfo) => {
    await addToCalendar([item], true)
  }, [])
  const onFitMetrixBooking = React.useCallback((item: BookedClassInfo) => {
    setSelectedClass(item)
    setModalFitMetrixBooking(true)
  }, [])
  const onCheckIn = React.useCallback(
    async (item: BookedClassInfo) => {
      try {
        let response = await API.updateUserClassVisitStatus({
          ClientID: item.ClientID,
          Status: 'SignedIn',
          VisitRefNo: item.VisitRefNo,
        })
        if (response.error != null) {
          setAction('toast', { text: response.message })
        } else {
          onFetch && onFetch()
          setAction('toast', { text: 'Successfully checked in.', type: 'success' })
        }
      } catch (e: any) {
        logError(e)
        setAction('toast', { text: 'Unable to complete check in.' })
      }
    },
    [onFetch],
  )
  const onEditFitmetrixSpot = React.useCallback(async (item: BookedClassInfo) => {
    try {
      let response = await API.getDictionaryData({
        ClientID: item.ClientID,
        LocationID: item.LocationID,
      })
      if (Array.isArray(response)) {
        const fitmetrix = response.find((i) => i.Parameter === 'fitmetrix')
        setFitmetrixSpotDetails({
          fitmetrixLocation: fitmetrix?.Value,
          registrationID: item.RegistrationID,
        })
      } else {
        setAction('toast', { text: 'Unable to get fitmetrix location details.' })
      }
    } catch (e) {
      logError(e)
      setAction('toast', { text: 'Unable to get information needed to change spot.' })
    }
  }, [])
  const onEditSpot = React.useCallback(async (item: BookedClassInfo) => {
    try {
      let response = await API.getClassLayout({
        ClientID: item.ClientID,
        PersonID: item.PersonID,
        RegistrationID: item.RegistrationID,
      })
      cleanAction('activeButton')
      if (response.Layout != null) {
        setAction('bookingDetails', {
          Class: item,
          Layout: response.Layout,
          SpotID: item.Spot?.SpotID,
        })
        //@ts-ignore
        navigate('ClassBookingSpotEdit')
      } else {
        setAction('toast', { text: response.message })
      }
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
      setAction('toast', { text: 'Unable to get class layout.' })
    }
  }, [])
  const onRefresh = React.useCallback((item: Partial<BookedClassInfo>) => {
    setClasses((prev) => {
      let newFutureClasses = [...prev]
      const classIndex = newFutureClasses.findIndex(
        (c) =>
          c.RegistrationID === item.RegistrationID &&
          c.ClientID === item.ClientID &&
          c.VisitRefNo === item.VisitRefNo,
      )
      if (classIndex != -1) {
        newFutureClasses.splice(classIndex, 1)
        return newFutureClasses
      }
      return prev
    })
    cleanAction('loading')
    setAction('toast', { text: 'Removed successfully.', type: 'success' })
  }, [])
  React.useEffect(() => {
    if (Brand.UI_CLASS_CHECK_IN && !locationMoment && dataLength > 0) {
      setModalLocationPermission(true)
    }
  }, [dataLength, locationMoment])
  React.useEffect(() => {
    let watchId: number | null = null
    if (locationPermission) {
      Geolocation.getCurrentPosition(setLocation, () => {}, {
        distanceFilter: 5,
        maximumAge: 0,
        timeout: 5000,
      })
      watchId = Geolocation.watchPosition(setLocation, () => {}, {
        distanceFilter: 5,
        fastestInterval: 60000,
        interval: 60000,
        useSignificantChanges: true,
      })
    }
    return () => {
      watchId && Geolocation.clearWatch(watchId)
    }
  }, [locationPermission])
  return (
    <React.Fragment>
      <FlatList
        bounces={onFetch != null}
        contentContainerStyle={themeStyle.scrollContentTabScreen}
        data={dataFiltered ? filteredClasses : classes}
        extraData={[locationPermission, location.coords]}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={(item) => `${item.RegistrationID}${item.VisitRefNo}`}
        ListEmptyComponent={
          <ListEmptyComponent
            description={Brand.STRING_NO_UPCOMING_CLASSES_BOOKINGS}
            title={`No ${Brand.STRING_CLASS_TITLE_PLURAL_LC}.`}
          />
        }
        ListHeaderComponent={
          family.length > 1 && !hideFilters ? (
            <TouchableOpacity onPress={onToggleFilterModal} style={themeStyle.filterButton}>
              <View style={themeStyle.rowAligned}>
                <Icon
                  name="sliders"
                  style={[
                    themeStyle.filterIcon,
                    filterApplied && { color: themeStyle.brandPrimary },
                  ]}
                />
                <Text
                  style={[
                    themeStyle.textPrimaryRegular14,
                    filterApplied && { color: themeStyle.brandPrimary },
                  ]}>
                  filters
                </Text>
              </View>
            </TouchableOpacity>
          ) : null
        }
        refreshControl={<RefreshControl onRefresh={onFetch} refreshing={false} />}
        renderItem={({ item }) => {
          const {
            bringFriendAvailable,
            brivoAccess,
            Coach,
            FirstName,
            hideFamilyTag = false,
            isCancellable,
            IsWaitlist,
            LastName,
            Location: { DoorCode, Latitude, Longitude, Nickname },
            Name,
            onlineBookingAvailable,
            PersonID,
            RoomName,
            showSelfieTool = false,
            Spot,
            StartDateTime,
            Status,
            Type,
            VirtualStreamLink,
          } = item
          let checkIn = false
          const isAppointment = Type === 'Appointment'
          const member = { FirstName, LastName, PersonID } as const
          const spotLabel = Spot?.Label
          const showDoorCode = DoorCode !== '' && DoorCode != null
          const showRoomName = Brand.UI_UPCOMING_ROOM_NAME && RoomName !== '' && RoomName != null
          const virtual = VirtualStreamLink && VirtualStreamLink !== ''
          if (
            Brand.UI_CLASS_CHECK_IN &&
            locationPermission &&
            Status.toLowerCase() === 'booked' &&
            moment().isSameOrBefore(moment(StartDateTime), 'minute') &&
            moment().isSameOrAfter(moment(StartDateTime).subtract(15, 'minutes'))
          ) {
            const distance = calculateDistance(
              Number(Latitude),
              Number(Longitude),
              location.coords.latitude,
              location.coords.longitude,
              'feet',
            )
            if (distance < 400) {
              checkIn = true
            }
          }
          return (
            <View
              style={[
                styles.item,
                IsWaitlist &&
                  Brand.COLOR_WAITLISTED_CLASS != null && {
                    backgroundColor: themeStyle[Brand.COLOR_WAITLISTED_CLASS as ColorKeys],
                  },
              ]}>
              {showFamilyTag && !hideFamilyTag && <TagFamilyMember member={member} />}
              <View style={styles.itemTitleRow}>
                <Text style={styles.classNameText}>{Name}</Text>
                <Text style={[styles.itemTitleText, { textAlign: 'right' }]}>
                  {moment(StartDateTime).calendar(null, {
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    nextWeek: 'dddd',
                    sameElse: formatDate('ddd M/D'),
                  })}
                </Text>
              </View>
              <View
                style={[
                  styles.itemDetailsRow,
                  (showDoorCode || showRoomName) && { marginBottom: 0 },
                ]}>
                <Text style={styles.itemLocationText}>
                  {renderClassDetail
                    ? renderClassDetail({ classInfo: item, formatCoachName })
                    : `${Nickname}${
                        Brand.UI_COACH_HIDE_UPCOMING
                          ? ''
                          : ' ' + formatCoachName({ addWith: true, coach: Coach })
                      }`}
                </Text>
                <Text style={styles.itemTimeText}>
                  {moment(StartDateTime).format(formatDate('h:mma'))}
                </Text>
              </View>
              {showRoomName && (
                <Text style={[styles.doorCodeText, showDoorCode && { marginBottom: 0 }]}>
                  {`Room Name: ${RoomName}`}
                </Text>
              )}
              {showDoorCode && <Text style={styles.doorCodeText}>{`Door Code: ${DoorCode}`}</Text>}
              {Brand.UI_PICK_SPOT &&
                (spotLabel != null || Brand.UI_FITMETRIX_BOOKING) &&
                !IsWaitlist && (
                  <Button
                    onPress={async () => {
                      Brand.UI_FITMETRIX_BOOKING ? onEditFitmetrixSpot(item) : onEditSpot(item)
                      await logEvent('upcoming_list_edit_spot')
                    }}
                    small={true}
                    style={styles.editSpotButton}
                    text={
                      spotLabel === '' || spotLabel == null
                        ? Brand.UI_FITMETRIX_BOOKING
                          ? 'Change Your Spot'
                          : 'Pick Your Spot'
                        : `Spot #${spotLabel}`
                    }
                    textColor="textDarkGray"
                  />
                )}
              <View style={themeStyle.rowAlignedBetween}>
                {!IsWaitlist ? (
                  <View style={themeStyle.rowAligned}>
                    {brivoAccess && (
                      <Button
                        color={themeStyle[Brand.COLOR_BUTTON_BRING_FRIEND as ColorKeys]}
                        gradient={Brand.BUTTON_GRADIENT}
                        leftIcon="icon-unlock"
                        onPress={async () => {
                          setModalDoorUnlock(item)
                          await logEvent('upcoming_list_door_unlock')
                        }}
                        small={true}
                        style={styles.bringFriendButton}
                        text="Unlock Door"
                        textColor={Brand.COLOR_BUTTON_BRING_FRIEND_TEXT as ColorKeys}
                      />
                    )}
                    {(virtual ||
                      checkIn ||
                      (bringFriendAvailable && onlineBookingAvailable && !isAppointment)) && (
                      <Button
                        color={themeStyle[Brand.COLOR_BUTTON_BRING_FRIEND as ColorKeys]}
                        gradient={Brand.BUTTON_GRADIENT}
                        leftIcon={checkIn ? 'check' : undefined}
                        onPress={
                          virtual
                            ? async () => {
                                openExternalLink(VirtualStreamLink)
                                await logEvent('upcoming_list_virtual_stream')
                              }
                            : checkIn
                              ? async () => {
                                  onCheckIn(item)
                                  await logEvent('upcoming_list_check_in')
                                }
                              : async () => {
                                  setSelectedClass(item)
                                  setModalBringFriend(true)
                                  await logEvent('upcoming_list_bring_friend')
                                }
                        }
                        small={true}
                        style={styles.bringFriendButton}
                        text={virtual ? 'Launch' : checkIn ? 'Check In' : 'Bring Friend'}
                        textColor={Brand.COLOR_BUTTON_BRING_FRIEND_TEXT as ColorKeys}
                      />
                    )}
                    <Button
                      color={themeStyle[Brand.COLOR_BUTTON_CALENDAR as ColorKeys]}
                      onPress={async () => {
                        onAddToCalendar(item)
                        await logEvent('upcoming_list_add_to_calendar')
                      }}
                      small={true}
                      text="+ Calendar"
                      textColor={Brand.COLOR_BUTTON_CALENDAR_TEXT as ColorKeys}
                    />
                  </View>
                ) : (
                  <TagWaitlist
                    classInfo={item}
                    onFetch={onFetch}
                    onFitMetrix={() => onFitMetrixBooking(item)}
                  />
                )}
                {isCancellable && (
                  <Button
                    color={themeStyle[Brand.COLOR_BUTTON_CANCEL as ColorKeys]}
                    onPress={
                      IsWaitlist
                        ? async () => {
                            setAction('classToCancel', { item, onRefresh, type: 'waitlist' })
                            await logEvent('upcoming_list_cancel_waitlist')
                          }
                        : isAppointment
                          ? async () => {
                              setAction('classToCancel', { item, onRefresh, type: 'appointment' })
                              await logEvent('upcoming_list_cancel_appointment')
                            }
                          : async () => {
                              setAction('classToCancel', { item, onRefresh, type: 'class' })
                              await logEvent(`upcoming_list_cancel_${Brand.STRING_CLASS_TITLE_LC}`)
                            }
                    }
                    small={true}
                    style={themeStyle.buttonClassItem}
                    text={IsWaitlist ? Brand.STRING_BUTTON_CANCEL_WAITLIST : 'Cancel'}
                    textColor={Brand.COLOR_BUTTON_CANCEL_TEXT as ColorKeys}
                  />
                )}
              </View>
            </View>
          )
        }}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
      />
      <ModalConfirmationCancel />
      {selectedClass != null && modalBringFriend && (
        <ModalBringFriend
          classInfo={selectedClass}
          onClose={async () => {
            setSelectedClass(null)
            setModalBringFriend(false)
            await logEvent('bring_friend_exit')
          }}
        />
      )}
      {modalDoorUnlock != null && (
        <ModalDoorUnlock
          classInfo={modalDoorUnlock}
          onClose={() => setModalDoorUnlock(null)}
          visible={true}
        />
      )}
      {family.length > 1 && !hideFilters && (
        <ModalFilterSelector
          getItem={(item) => {
            return {
              selected: selectedFamily.some((m) => m === getFamilyMemberKey(item)),
              text: formatName(item.FirstName, item.LastName),
            }
          }}
          hideSearch={true}
          items={family}
          keyExtractor={getFamilyMemberKey}
          onClose={onToggleFilterModal}
          onSearch={(text) =>
            family.filter((item) =>
              formatName(item.FirstName, item.LastName).toLowerCase().includes(text.toLowerCase()),
            )
          }
          onSelect={onSelectFamilyMember}
          selectedItems={selectedFamily}
          title={`Select Family Members`}
          visible={modalFilterFamily}
        />
      )}
      {Brand.UI_FITMETRIX_BOOKING && selectedClass != null && (
        <ModalFitMetrixBooking
          onClose={() => {
            setSelectedClass(null)
            setModalFitMetrixBooking(false)
            onFetch && onFetch()
          }}
          selectedClass={selectedClass}
          title={`Manage ${Brand.STRING_CLASS_TITLE}`}
          visible={modalFitMetrixBooking}
        />
      )}
      <ModalPermissionLocation
        onClose={async () => {
          setAction('oneTimeMoments', { locationPermission: true })
          setModalLocationPermission(false)
          await onCheckPermission()
        }}
        visible={modalLocationPermission}
      />
    </React.Fragment>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const itemLocationText = {
    ...themeStyle.getTextStyle({ color: 'textGray', font: 'fontPrimaryRegular', size: 13 }),
    marginTop: themeStyle.scale(2),
    textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
  } as const
  const itemTitleText = {
    ...themeStyle.textItemPrimary,
    marginBottom: 0,
    textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
  } as const
  return {
    item: { paddingHorizontal: themeStyle.scale(24), paddingVertical: themeStyle.scale(12) },
    itemTitleRow: { ...themeStyle.rowBetween, marginBottom: themeStyle.scale(8) },
    itemTitleText,
    classNameText: { ...itemTitleText, flex: 1, marginRight: themeStyle.scale(8) },
    itemDetailsRow: { ...themeStyle.rowAlignedBetween, marginBottom: themeStyle.scale(14) },
    itemLocationText,
    itemTimeText: {
      ...themeStyle.getTextStyle({ color: 'textDarkGray', font: 'fontPrimaryRegular', size: 14 }),
      textAlign: 'right' as 'right',
    },
    doorCodeText: { ...itemLocationText, marginBottom: themeStyle.scale(14) },
    itemDurationText: themeStyle.getTextStyle({
      color: 'textGray',
      font: 'fontPrimaryRegular',
      size: 11,
    }),
    editSpotButton: {
      ...themeStyle.rowAlignedCenter,
      backgroundColor: themeStyle.fadedGray,
      borderRadius: themeStyle.scale(4),
      marginBottom: themeStyle.scale(14),
      paddingHorizontal: themeStyle.scale(8),
    },
    bringFriendButton: { marginRight: themeStyle.scale(8) },
  }
}
