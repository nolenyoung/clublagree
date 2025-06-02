import { useIsFocused } from '@react-navigation/native'
import moment from 'moment'
import * as React from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { Calendar } from 'react-native-calendars'
import { useSelector } from 'react-redux'
import {
  AppointmentLocations,
  AppointmentType,
  Button,
  ButtonText,
  Header,
  InputButton,
  SliderTimeRange,
  TabBar,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { getUniqueId, logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'
import { initialAppointmentPreferences } from '../redux/reducers'

const currentMonth = moment().format('YYYY-MM')

export default function AppointmentSearch(props: AppointmentStackScreenProps<'AppointmentSearch'>) {
  const { navigate } = props.navigation
  const isFocused = useIsFocused()
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { date, endTime, locations, startTime, type } = useSelector(
    (state: ReduxState) => state.appointmentPreferences,
  )
  const locationKeys = Object.keys(locations)
  const locationsCount = locationKeys.length
  const locationsString = locationKeys.toString()
  // Used to reset the calendar back to current month on filter reset
  const [calendarKey, setCalendarKey] = React.useState('Calendar')
  const [currentSelectionType, setCurrentSelectionType] = React.useState('')
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth)
  const [typeCount, setTypeCount] = React.useState(0)
  const [types, setTypes] = React.useState<AppointmentFiltersTypeSection[]>([])
  const onSelectDate = React.useCallback(({ dateString: day }: { dateString: string }) => {
    setAction('appointmentPreferences', { date: day })
  }, [])
  React.useEffect(() => {
    setAction('appointmentPreferences', { date: moment().format('YYYY-MM-DD') })
  }, [])
  React.useEffect(() => {
    if (isFocused) {
      cleanAction('appointmentBooking')
    }
  }, [isFocused])
  React.useEffect(() => {
    if (locationsString !== '') {
      ;(async function getFilters() {
        try {
          let response = await API.getAppointmentFilters({ Locations: locationsString })
          if ('SessionCategories' in response && Array.isArray(response.SessionCategories)) {
            let numberOfTypes = 0
            let sections = []
            for (const category of response.SessionCategories) {
              const { Name, SessionTypes = [] } = category
              numberOfTypes += SessionTypes.length
              if (SessionTypes.length > 0) {
                sections.push({ category, data: SessionTypes, title: Name })
              }
            }
            setTypeCount(numberOfTypes)
            setTypes(sections)
            if (numberOfTypes === 1) {
              setAction('appointmentPreferences', { type: sections[0].data[0] })
            }
          } else if ('message' in response) {
            setAction('toast', { text: response.message })
          } else {
            setAction('toast', { text: 'Unable to get appointment types' })
          }
        } catch (e) {
          logError(e)
        }
      })()
    }
  }, [locationsString])
  const searchDisabled = type == null || Object.keys(date).length === 0
  const finishedLoadingFilters = locationsCount === 0 || (locationsCount > 0 && types.length > 0)
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} title="Book" />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Calendar
          disableAllTouchEventsForDisabledDays
          hideExtraDays
          disableArrowLeft={selectedMonth === currentMonth}
          initialDate={date}
          key={calendarKey}
          markedDates={{ [date]: { selected: true } }}
          markingType="multi-period"
          minDate={moment().format('YYYY-MM-DD')}
          monthFormat="MMMM yyyy"
          onDayPress={onSelectDate}
          onMonthChange={(data: { dateString: moment.MomentInput }) =>
            setSelectedMonth(moment(data.dateString).format('YYYY-MM'))
          }
          showWeekNumbers={false}
          style={styles.calendar}
          theme={themeStyle.calendarTheme}
        />
        {!finishedLoadingFilters && (
          <View style={styles.loadingView}>
            <ActivityIndicator color={themeStyle.textGray} size="large" />
          </View>
        )}
        {finishedLoadingFilters && (
          <InputButton
            borderColor={
              locationsCount > 0
                ? themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]
                : themeStyle.darkGray
            }
            buttonStyle={styles.filterButton}
            containerStyle={styles.locationTypeButton}
            onPress={() => setCurrentSelectionType('location')}
            selected={locationsCount > 0}
            textColor={themeStyle.textBlack}
            value={
              locationsCount === 1
                ? locations[locationKeys[0]].Nickname
                : locationsCount > 1
                  ? `${locationsCount} Locations`
                  : 'Select Location(s)'
            }
          />
        )}
        {locationsCount > 0 && types.length > 0 && (
          <InputButton
            borderColor={
              type != null
                ? themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]
                : themeStyle.darkGray
            }
            buttonStyle={styles.filterButton}
            onPress={() => setCurrentSelectionType('type')}
            selected={type != null}
            textColor={themeStyle.textBlack}
            value={type?.SessionName ?? 'Select Appointment Type'}
          />
        )}
        {finishedLoadingFilters && locationsCount > 0 && (
          <SliderTimeRange
            containerStyle={styles.timeSlider}
            endValue={endTime}
            onSetEnd={(t) => setAction('appointmentPreferences', { endTime: t })}
            onSetStart={(t) => setAction('appointmentPreferences', { startTime: t })}
            startValue={startTime}
          />
        )}
        {/** Used to properly space the bottom buttons when no location selected */}
        {locationsCount === 0 && <View style={themeStyle.flexView} />}
        <Button
          disabled={searchDisabled}
          onPress={() => navigate('AppointmentSchedule')}
          text="Search"
        />
        <ButtonText
          color={themeStyle.textBlack}
          onPress={() => {
            setAction('appointmentPreferences', initialAppointmentPreferences)
            setSelectedMonth(currentMonth)
            setCalendarKey(getUniqueId())
          }}
          style={styles.resetButton}
          text="Reset Filters"
        />
      </ScrollView>
      <TabBar />
      <AppointmentLocations
        onClose={() => setCurrentSelectionType('')}
        selectedLocations={locations}
        visible={currentSelectionType === 'location'}
      />
      <AppointmentType
        onClose={() => setCurrentSelectionType('')}
        selectedType={type}
        typeCount={typeCount}
        types={types}
        visible={locationsCount > 0 && currentSelectionType === 'type'}
      />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    scrollContent: {
      flexGrow: 1,
      paddingBottom: themeStyle.scale(20),
      paddingHorizontal: themeStyle.scale(20),
      paddingTop: themeStyle.scale(20),
    },
    calendar: { backgroundColor: themeStyle.colorWhite },
    clearDatesButton: { marginBottom: themeStyle.scale(8) },
    clearDatesText: { ...themeStyle.textPrimaryRegular12, opacity: 0.65 },
    locationTypeButton: { marginTop: themeStyle.scale(24) },
    loadingView: { ...themeStyle.viewCentered, height: themeStyle.scale(100) },
    timeSlider: {
      marginBottom: themeStyle.scale(52),
      marginTop: themeStyle.scale(8),
    },
    filterButton: {
      borderColor: themeStyle.darkGray,
      borderRadius: themeStyle.scale(8),
      borderWidth: themeStyle.scale(1),
      paddingHorizontal: themeStyle.scale(8),
      paddingVertical: themeStyle.scale(16),
    },
    upcomingSessionButton: {
      borderTopWidth: themeStyle.scale(1),
      marginTop: themeStyle.scale(28),
    },
    resetButton: { marginTop: themeStyle.scale(20) },
  }
}
