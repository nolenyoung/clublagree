import moment from 'moment'
import * as React from 'react'
import { FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import { Avatar, Button, Header, Icon, ItemSeparator } from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import {
  addToCalendar,
  formatCoachName,
  formatDate,
  getAppointmentPrebookInfo,
  logError,
} from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

export default function AppointmentDetailsMultiple(
  props: AppointmentStackScreenProps<'AppointmentDetailsMultiple'>,
): React.ReactElement {
  const { goBack } = props.navigation
  const { bookingComplete, selectedFamilyMember, timeSlots } = useSelector(
    (state: ReduxState) => state.appointmentBooking,
  )
  const autoAddToCalendar = useSelector((state: ReduxState) => state.deviceCalendars.autoAdd)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [bookedSessions, setBookedSessions] = React.useState<AppointmentTimeSlot[]>([])
  const [savedToCalendar, setSavedToCalendar] = React.useState(false)
  const onBook = async () => {
    try {
      setAction('loading', { loading: true })
      for await (const timeSlot of timeSlots) {
        try {
          const {
            ClientID,
            Coach,
            EndDateTime,
            Location,
            SessionName,
            SessionTypeID,
            StartDateTime,
          } = timeSlot
          const { CoachID } = Coach ?? {}
          const { LocationID } = Location ?? {}
          let preBookData = await getAppointmentPrebookInfo(timeSlot, true, selectedFamilyMember)
          if (preBookData != null) {
            const { packages } = preBookData
            if (packages.length > 0) {
              const response = await API.createAppointmentBooking({
                AppointmentDescription: SessionName,
                ClientID,
                CoachID,
                EndDateTime,
                LocationID,
                SessionTypeID,
                StartDateTime,
                User: selectedFamilyMember,
              })
              if (response?.Status === 'Booked') {
                setBookedSessions((prev) => [...prev, timeSlot])
              } else {
                setAction('toast', { text: response.message })
              }
            }
          }
        } catch (e: any) {
          logError(e)
          return
        }
      }
      setAction('appointmentBooking', { bookingComplete: true })
    } catch (e: any) {
      logError(e)
      setAction('toast', { text: 'Unable to complete booking.' })
    } finally {
      cleanAction('loading')
    }
  }
  const onCalendarAdd = async () => {
    for (const timeSlot of bookedSessions) {
      const { Coach, EndDateTime, Location, SessionName, StartDateTime } = timeSlot
      await addToCalendar(
        [{ Coach, EndDateTime, Location, Name: SessionName, StartDateTime }],
        true,
      )
    }
    setSavedToCalendar(true)
  }
  React.useEffect(() => {
    if (bookedSessions.length > 0 && autoAddToCalendar) {
      addToCalendar(bookedSessions, false)
    }
  }, [autoAddToCalendar, bookedSessions])
  return (
    <View style={themeStyle.screen}>
      <Header
        leftComponent={
          <Pressable onPress={() => goBack()}>
            <Icon name="arrow-back" style={themeStyle.headerIcon} />
          </Pressable>
        }
        title="Book Multiple"
      />
      <View style={styles.titleView}>
        <Text style={themeStyle.appointments.timeNameText}>{timeSlots[0]?.SessionName ?? ''}</Text>
      </View>
      <FlatList
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        data={timeSlots}
        extraData={[bookedSessions, bookingComplete]}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={(item) => `${item.AppointmentID}${item.StartDateTime}`}
        renderItem={({ item }) => {
          const { AppointmentID, Coach, EndDateTime, Location, StartDateTime } = item
          const bookingSuccess = bookedSessions.some(
            (timeSlot) =>
              `${timeSlot.AppointmentID}${timeSlot.EndDateTime}${timeSlot.StartDateTime}` ===
              `${AppointmentID}${EndDateTime}${StartDateTime}`,
          )
          return (
            <View style={themeStyle.appointments.scheduleSummary.item}>
              {Brand.UI_APPOINTMENT_RESULTS_PHOTO && (
                <View style={themeStyle.appointments.scheduleSummary.avatar}>
                  <Avatar size={themeStyle.scale(50)} source={Coach?.Headshot} />
                </View>
              )}
              <View style={themeStyle.appointments.scheduleSummary.infoView}>
                <Text
                  allowFontScaling={false}
                  style={themeStyle.appointments.scheduleSummary.itemTitleText}>
                  {`${moment(StartDateTime).format(formatDate('dddd, MMMM D'))}`}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={themeStyle.appointments.scheduleSummary.itemTimeText}>
                  {`${moment(StartDateTime).format('h:mma')} - ${moment(EndDateTime).format('h:mma')}`}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={themeStyle.appointments.scheduleSummary.itemSubTitle}>
                  {Location?.Nickname}
                </Text>
                {!Brand.UI_COACH_HIDE_SCHEDULE && (
                  <Text
                    allowFontScaling={false}
                    style={themeStyle.appointments.scheduleSummary.itemSubTitle}>
                    {formatCoachName({ addWith: true, coach: Coach })}
                  </Text>
                )}
              </View>
              {(bookingSuccess || bookingComplete) && (
                <View style={styles.bookingSuccessView}>
                  <Icon
                    name={bookingSuccess ? 'check' : 'clear'}
                    style={[styles.bookedIcon, !bookingSuccess && { color: themeStyle.red }]}
                  />
                  <Text style={[styles.bookedText, !bookingSuccess && { color: themeStyle.red }]}>
                    {bookingSuccess ? 'booked' : 'failed'}
                  </Text>
                </View>
              )}
            </View>
          )
        }}
        showsVerticalScrollIndicator={false}
      />
      {!bookingComplete && (
        <View style={themeStyle.fixedBottomButtonView}>
          <Button
            gradient={Brand.BUTTON_GRADIENT}
            onPress={onBook}
            style={styles.bookButton}
            text={'Book Appointments'}
            textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
          />
        </View>
      )}
      {bookingComplete && (
        <View style={styles.buttonRow}>
          <TouchableOpacity disabled={savedToCalendar} onPress={onCalendarAdd}>
            <View style={themeStyle.viewCentered}>
              <Icon name="date-range" style={styles.icon} />
              <Text style={styles.shareText}>Add to Calendar</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    titleView: { ...themeStyle.appointments.titleView, paddingTop: themeStyle.scale(20) },
    scrollContent: { flexGrow: 1, paddingHorizontal: themeStyle.scale(20) },
    nameText: { ...themeStyle.sectionTitleText, textAlign: 'center' as 'center' },
    bookButton: { backgroundColor: themeStyle.brandPrimary, width: '100%' as const },
    buttonRow: {
      ...themeStyle.rowAlignedEvenly,
      marginBottom: themeStyle.edgeInsets.bottom + themeStyle.scale(8),
      marginTop: themeStyle.scale(12),
    },
    shareText: themeStyle.getTextStyle({
      color: 'textBlack',
      font: 'fontPrimaryRegular',
      size: 16,
    }),
    icon: {
      color: themeStyle.textGray,
      fontSize: themeStyle.scale(30),
      marginBottom: themeStyle.scale(8),
    },
    bookingSuccessView: { ...themeStyle.viewCentered, position: 'absolute' as const, right: 0 },
    bookedIcon: { color: themeStyle.brandPrimary, fontSize: themeStyle.scale(12) },
    bookedText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 14 }),
      marginTop: themeStyle.scale(4),
    },
  }
}
