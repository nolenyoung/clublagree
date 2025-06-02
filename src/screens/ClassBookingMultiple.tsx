import moment from 'moment'
import * as React from 'react'
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { Button, Checkbox, Header, Icon, ItemSeparator, ListEmptyComponent } from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import {
  addToCalendar,
  fetchClasses,
  formatCoachName,
  formatDate,
  logError,
  logEvent,
} from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

export default function ClassBookingMultiple(
  props:
    | ScheduleStackScreenProps<'ClassBookingMultiple'>
    | WorkshopStackScreenProps<'ClassBookingMultiple'>,
): React.ReactElement {
  const { goBack, popToTop } = props.navigation
  const Class = useSelector((state: ReduxState) => state.bookingDetails.Class) as ClassInfo
  const currentFilter = useSelector((state: ReduxState) => state.currentFilter)
  const autoAddToCalendar = useSelector((state: ReduxState) => state.deviceCalendars.autoAdd)
  const {
    ClientID,
    EndDateTime,
    Location,
    PersonClientID,
    PersonID,
    RegistrationID,
    StartDateTime,
  } = Class ?? {}
  const { LocationID, Nickname } = Location ?? {}
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [booked, setBooked] = React.useState(false)
  const [bookedClasses, setBookedClasses] = React.useState<ClassInfo[]>([])
  const [classes, setClasses] = React.useState<ClassInfo[]>([])
  const [selectedClasses, setSelectedClasses] = React.useState<ClassInfo[]>([])
  const onAddToCalendar = React.useCallback(async () => {
    await addToCalendar(bookedClasses, true)
  }, [bookedClasses])
  const onBack = React.useCallback(() => {
    if (booked) {
      popToTop()
    } else {
      goBack()
    }
  }, [booked, StartDateTime])
  const onBook = async () => {
    try {
      let error = false
      let newBookedClasses: Array<ClassInfo> = []
      for (const selectedClass of selectedClasses) {
        const { ClientID: id, RegistrationID: regId } = selectedClass
        let response = await API.createClassPreBook({
          ClientID: id,
          PersonClientID,
          PersonID,
          RegistrationID: regId,
        })
        if (response?.Packages?.length > 0) {
          const { Remaining } = response.Packages[0]
          const { Status } = response || {}
          const { isClassFull } = Status
          if (Remaining > 0) {
            let bookingResponse = await API[
              isClassFull ? 'createWaitlistSpot' : 'createClassBooking'
            ]({
              ClientID: id,
              PackageID: response.Packages[0].PackageID,
              PersonClientID,
              PersonID,
              RegistrationID: regId,
            })
            if (bookingResponse?.Status === 'Success') {
              await logEvent('booking_multiple_completed', selectedClass)
              newBookedClasses.push(selectedClass)
            } else {
              error = true
            }
          } else {
            error = true
            break
          }
        } else {
          error = true
          break
        }
      }
      if (error) {
        setAction('toast', {
          text: `Some classes could not be booked.\nItems marked 'booked' have been reserved.`,
        })
      }
      setBookedClasses(newBookedClasses)
      setBooked(true)
      if (autoAddToCalendar) {
        addToCalendar(newBookedClasses, false)
      }
      cleanAction('activeButton')
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
      setAction('toast', { text: 'An error was encountered.' })
    }
  }
  const onFetchClasses = async () => {
    try {
      let fetchedClasses = await fetchClasses({
        ...currentFilter,
        ClientID,
        endDate: '',
        endTime: moment(StartDateTime).format('HH:mm:ss'),
        FutureOnly: true,
        locations: [`${ClientID}-${LocationID}`],
        similarClassesAs: `${ClientID}-${RegistrationID}`,
        startDate: moment().format('YYYY-MM-DD'),
        startTime: moment(StartDateTime).format('HH:mm:ss'),
      })
      if (Array.isArray(fetchedClasses)) {
        setClasses(fetchedClasses)
      }
    } catch (e: any) {
      logError(e)
      cleanAction('loading')
    }
  }
  React.useEffect(() => {
    if (Class != null) {
      setSelectedClasses([Class])
    }
    onFetchClasses()
  }, [])
  return (
    <View style={themeStyle.flexView}>
      <Header
        leftComponent={
          <Pressable onPress={onBack}>
            <Icon name={booked ? 'clear' : 'arrow-back'} style={styles.backIcon} />
          </Pressable>
        }
        title="Book Multiple"
      />
      <View style={styles.classInfoView}>
        <Text style={styles.classNameText}>{Nickname}</Text>
        <View style={themeStyle.rowAligned}>
          <Text style={styles.classDetailText}>
            {`${moment(StartDateTime).format('h:mma')} - ${moment(EndDateTime).format('h:mma')}`}
          </Text>
        </View>
      </View>
      <View style={themeStyle.contentWhite}>
        <FlatList
          data={booked ? selectedClasses : classes}
          extraData={[selectedClasses, bookedClasses]}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={<ListEmptyComponent description="" title="No classes available" />}
          keyExtractor={(item) => `${item.ClientID}-${item.RegistrationID}`}
          refreshControl={<RefreshControl onRefresh={onFetchClasses} refreshing={false} />}
          renderItem={({ item }) => {
            const onPressClass = () =>
              setSelectedClasses((prev) => {
                if (
                  prev.length > 0 &&
                  prev.some(
                    (i) => i.ClientID === item.ClientID && i.RegistrationID === item.RegistrationID,
                  )
                ) {
                  return prev.filter(
                    (i) => i.ClientID !== item.ClientID || i.RegistrationID !== item.RegistrationID,
                  )
                } else {
                  return [...prev, item]
                }
              })
            const bookingSuccess = bookedClasses.some(
              (c) => c.ClientID === item.ClientID && c.RegistrationID === item.RegistrationID,
            )
            const disabled = booked || item.Available == 0 || !item.onlineBookingAvailable
            const selected = selectedClasses.some(
              (c) => c.ClientID === item.ClientID && c.RegistrationID === item.RegistrationID,
            )
            return (
              <Pressable
                disabled={disabled}
                onPress={onPressClass}
                style={[themeStyle.item, disabled && { opacity: 0.4 }]}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  {!booked && (
                    <Checkbox
                      containerStyle={{ marginTop: themeStyle.scale(2) }}
                      disabled={disabled}
                      onPress={onPressClass}
                      selected={selected}
                    />
                  )}
                  <View style={styles.infoView}>
                    <View style={styles.itemTitleRow}>
                      <Text
                        style={[
                          themeStyle.itemTitleText,
                          { marginBottom: 0 },
                          booked && { marginRight: themeStyle.scale(12) },
                        ]}>
                        {moment(item.StartDateTime).calendar(null, {
                          sameDay: '[Today]',
                          nextDay: '[Tomorrow]',
                          nextWeek: formatDate('dddd, MMMM D'),
                          sameElse: formatDate('dddd, MMMM D'),
                        })}
                      </Text>
                      {booked && (
                        <View style={themeStyle.rowAligned}>
                          <Icon
                            name={bookingSuccess ? 'check' : 'clear'}
                            style={styles.bookedIcon}
                          />
                          <Text style={styles.bookedText}>
                            {bookingSuccess ? 'booked' : 'failed'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={themeStyle.itemDetailText}>
                      {`${
                        Brand.UI_COACH_HIDE_UPCOMING
                          ? ''
                          : formatCoachName({ addWith: true, coach: item.Coach })
                      }`}
                      {!disabled
                        ? `${Brand.UI_COACH_HIDE_UPCOMING ? '' : ', '}${item.Available} of ${
                            item.Capacity
                          } open`
                        : ''}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <View style={themeStyle.fixedBottomButtonView}>
        <Button
          animated={!booked}
          disabled={!booked && selectedClasses.length === 0}
          gradient={Brand.BUTTON_GRADIENT}
          leftIcon={booked ? 'date-range' : ''}
          onPress={booked ? onAddToCalendar : onBook}
          style={themeStyle.fixedBottomButton}
          text={
            booked
              ? 'Add to Calendar'
              : `Book ${selectedClasses.length} ${selectedClasses.length > 1 ? 'Classes' : 'Class'}`
          }
        />
      </View>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    backIcon: { color: themeStyle.textWhite, fontSize: themeStyle.scale(20) },
    classInfoView: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.fadedGray,
      borderBottomWidth: themeStyle.scale(1.5),
      borderColor: themeStyle.lightGray,
      padding: themeStyle.scale(20),
    },
    classNameText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 24 }),
      marginBottom: themeStyle.scale(2),
      textAlign: 'center' as 'center',
    },
    classDetailText: themeStyle.getTextStyle({
      color: 'textBlack',
      font: 'fontPrimaryRegular',
      size: 14,
    }),
    classDetailDivider: {
      backgroundColor: themeStyle.lightGray,
      height: '100%' as const,
      marginHorizontal: themeStyle.scale(12),
      width: themeStyle.scale(1.5),
    },
    infoView: { flex: 1, marginLeft: themeStyle.scale(12) },
    itemTitleRow: { ...themeStyle.rowAlignedBetween, marginBottom: themeStyle.scale(2) },
    bookedIcon: { color: themeStyle.brandPrimary, fontSize: themeStyle.scale(12) },
    bookedText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 14 }),
      marginLeft: themeStyle.scale(8),
    },
  }
}
