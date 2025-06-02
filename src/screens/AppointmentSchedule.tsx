import { useIsFocused } from '@react-navigation/native'
import moment from 'moment'
import * as React from 'react'
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { useMMKVBoolean } from 'react-native-mmkv'
import { useSelector } from 'react-redux'
import {
  AppointmentScheduleItem,
  AppointmentScheduleSummary,
  Header,
  Icon,
  ListEmptyComponent,
  ModalFamilySelector,
  TabBar,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { PROVIDER_TYPES, STORAGE_KEYS } from '../global/Constants'
import {
  formatDate,
  getAppointmentPrebookInfo,
  getScheduleDates,
  logError,
  sortAppointmentTimeSlots,
  sortProviders,
} from '../global/Functions'
import { useRefreshOnForeground, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'
import { mmkvStorage } from '../redux/store'

const defaultMaxDate = moment().add(60, 'days').format('YYYY-MM-DD')

export default function AppointmentSchedule(
  props: AppointmentStackScreenProps<'AppointmentSchedule'>,
) {
  const { navigate, popToTop } = props.navigation
  const { customWorkflow } = props.route.params ?? {}
  const isFocused = useIsFocused()
  const dateListRef = React.useRef<FlatList | null>(null)
  const timeSlotListRef = React.useRef<FlatList | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    allowFamilyBooking,
    bookingComplete,
    modalFamilySelector,
    multiple,
    selectedFamilyMember,
    tempScheduleItem,
    timeSlots,
  } = useSelector((state: ReduxState) => state.appointmentBooking)
  const { date, endTime, gender, locations, providers, startTime, type } = useSelector(
    (state: ReduxState) => state.appointmentPreferences,
  )
  const { clientId, personId } = useSelector((state: ReduxState) => state.user)
  const locationKeys = Object.keys(locations)
  const providerKeys = Object.keys(providers)
  const locationsString = locationKeys.toString()
  const [showGenderFilter = false] = useMMKVBoolean(STORAGE_KEYS.apptShowGenderFilter, mmkvStorage)
  const [loading, setLoading] = React.useState(true)
  const [dates, setDates] = React.useState<{ date: string; disabled: boolean }[]>(
    getScheduleDates(defaultMaxDate),
  )
  const [times, setTimes] = React.useState<AppointmentTimeSlot[]>([])
  const onContinueFamily = React.useCallback(
    async (member?: FamilyMember) => {
      const item = tempScheduleItem as AppointmentTimeSlot
      setAction('appointmentBooking', {
        modalFamilySelector: false,
        tempScheduleItem: undefined,
        selectedFamilyMember: member ?? undefined,
      })
      let bookingData = await getAppointmentPrebookInfo(item, false, member)
      if (bookingData != null) {
        navigate('AppointmentDetails')
      }
    },
    [tempScheduleItem],
  )
  const onFetchTimes = async () => {
    if (type != null) {
      try {
        setLoading(true)
        const ShowUTCTime = false
        let data: APIAppointmentTimesArgs = {
          Date: date,
          EndTime: `${endTime}:00:00`,
          Locations: locationsString,
          SessionName: type.SessionName,
          ShowUTCTime,
          StartTime: `${startTime}:00:00`,
        }
        const response = await API.getAppointmentTimes(data)
        if ('AvailableTimes' in response) {
          const { AvailableTimes, Coaches, Locations, SessionTypes, Settings } = response
          const { AllowFamilyBooking, MaxDate = defaultMaxDate } = Settings ?? {}
          const slots: AppointmentTimeSlot[] = []
          let genderFilter = false
          for (const item of AvailableTimes) {
            if (item.SessionTimes.length === 0) {
              // If there are no session times available go to the next item
              continue
            }
            const Coach = Coaches.find((coach) => {
              return (
                coach.ClientID === item.ClientID && String(coach.CoachID) === String(item.CoachID)
              )
            })
            const Location = Locations.find(
              (loc) => loc.ClientID === item.ClientID && loc.LocationID === item.LocationID,
            )
            let SessionName
            for (const sessionType of SessionTypes) {
              if (
                sessionType.ClientID === item.ClientID &&
                sessionType.LocationID === item.LocationID &&
                sessionType.SessionTypeID === item.SessionTypeID
              ) {
                SessionName = sessionType.SessionName
              }
              if (sessionType.ShowGenderFilter) {
                genderFilter = true
              }
              if (SessionName != null && genderFilter) break
            }
            if (Location == null || Coach == null || SessionName == null) {
              // If the location, coach, or session name cannot be determined go to the next item
              continue
            }
            const { SessionTimes, ...rest } = item
            for (const sessionTime of SessionTimes) {
              // We map only the properties we need to reduce item size
              const formattedItem = {
                ...rest,
                Coach,
                EndDateTime: ShowUTCTime
                  ? moment
                      .utc(sessionTime.EndUTC, 'YYYY-MM-DD HH:mm:ss')
                      .local()
                      .format('YYYY-MM-DD HH:mm:ss')
                  : sessionTime.End,
                Location,
                SessionName,
                StartDateTime: ShowUTCTime
                  ? moment
                      .utc(sessionTime.StartUTC, 'YYYY-MM-DD HH:mm:ss')
                      .local()
                      .format('YYYY-MM-DD HH:mm:ss')
                  : sessionTime.Start,
              }
              slots.push(formattedItem)
            }
          }
          mmkvStorage.set(STORAGE_KEYS.apptShowGenderFilter, genderFilter)
          setDates(getScheduleDates(MaxDate))
          setTimes(slots.sort(sortAppointmentTimeSlots))
          setAction('appointmentBooking', { allowFamilyBooking: AllowFamilyBooking })
          // Consolidate the Coaches based upon name/nickname to create the filters
          if (Coaches.length > 0) {
            let allProviders: { [name: string]: Coach } = { ...providers }
            for (const Coach of Coaches) {
              const { FirstName, LastName, Nickname } = Coach
              if (Brand.UI_COACH_NICKNAME) {
                if (allProviders[Nickname] == null) {
                  allProviders[Nickname] = Coach
                }
              } else {
                if (allProviders[`${FirstName}-${LastName}`] == null) {
                  allProviders[`${FirstName}-${LastName}`] = Coach
                }
              }
            }
            // Save all providers returned from search results plus selected providers to disk for filter screen
            mmkvStorage.set(
              STORAGE_KEYS.apptProvidersAll,
              JSON.stringify(Object.values(allProviders).sort(sortProviders)),
            )
          }
        } else {
          setTimes([])
          if (response.code !== 605) {
            setAction('toast', { text: response.message })
          }
        }
      } catch (e) {
        setTimes([])
        logError(e)
        setAction('toast', { text: 'Unable to get session times.' })
      } finally {
        setLoading(false)
      }
    } else {
      setAction('toast', {
        text: 'Please choose a location and session type.',
      })
    }
  }
  React.useEffect(() => {
    onFetchTimes()
  }, [date, endTime, locationsString, startTime, type])
  React.useEffect(() => {
    timeSlotListRef.current?.scrollToOffset({ offset: 0 })
  }, [endTime, gender, locationsString, providerKeys, startTime])
  React.useEffect(() => {
    if (bookingComplete && isFocused) {
      cleanAction('appointmentBooking')
      onFetchTimes()
    }
  }, [bookingComplete, isFocused])
  const filteredTimes = times.filter(
    (t) =>
      (!showGenderFilter ||
        gender === PROVIDER_TYPES.all ||
        (showGenderFilter && gender !== PROVIDER_TYPES.all && t.Coach.Type === gender)) &&
      (providerKeys.length === 0 ||
        (providerKeys.length > 0 &&
          providers[
            Brand.UI_COACH_NICKNAME ? t.Coach.Nickname : `${t.Coach.FirstName}-${t.Coach.LastName}`
          ] != null)),
  )
  const currentDateIndex = React.useMemo(() => {
    const realIndex = dates.findIndex((d) => d.date === date) - moment(date).day()
    return realIndex < 0 ? 0 : realIndex
  }, [date, dates])
  React.useEffect(() => {
    dateListRef.current?.scrollToIndex({ animated: false, index: currentDateIndex })
  }, [currentDateIndex])
  useRefreshOnForeground(onFetchTimes)
  return (
    <View style={themeStyle.screen}>
      <Header
        leftComponent={
          <Pressable onPress={() => popToTop()}>
            <Icon name="arrow-back" style={themeStyle.headerIcon} />
          </Pressable>
        }
        rightIcon="sliders"
        rightIconPress={() => navigate('AppointmentFilters')}
        title="Book"
      />
      <View style={themeStyle.flexView}>
        {/** Following View keeps the FlatList correctly sized */}
        <View style={styles.dayContainer}>
          <FlatList
            bounces={false}
            contentContainerStyle={styles.dayListContent}
            data={dates}
            decelerationRate="fast"
            extraData={date}
            getItemLayout={(
              data: ArrayLike<any> | null | undefined,
              index: number,
            ): { index: number; length: number; offset: number } => {
              const length = (themeStyle.window.width - themeStyle.scale(20)) / 7
              return { length, index, offset: length * index }
            }}
            horizontal={true}
            initialScrollIndex={currentDateIndex}
            keyExtractor={(item) => item.date}
            ref={(ref) => {
              dateListRef.current = ref
            }}
            renderItem={({ item }) => {
              const selected = date === item.date
              return (
                <Pressable
                  disabled={item.disabled}
                  onPress={() => setAction('appointmentPreferences', { date: item.date })}
                  style={[styles.dayButton, { opacity: item.disabled ? 0.4 : 1 }]}>
                  <View style={themeStyle.viewCentered}>
                    <Text
                      style={[
                        styles.dayText,
                        selected && {
                          color:
                            themeStyle[Brand.COLOR_APPT_SCHEDULE_DAY_OF_WEEK_SELECTED as ColorKeys],
                        },
                      ]}>
                      {moment(item.date).format('dd').toUpperCase()}
                    </Text>
                    <View
                      style={[
                        styles.dayCircle,
                        selected && themeStyle.calendarTheme['stylesheet.day.basic'].selected,
                      ]}>
                      <Text
                        style={[
                          styles.dayText,
                          selected && themeStyle.calendarTheme['stylesheet.day.basic'].selectedText,
                        ]}>
                        {moment(item.date).format('D')}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )
            }}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            snapToOffsets={dates.map(
              (_, i) => (themeStyle.window.width - themeStyle.scale(20)) * i + 1,
            )}
          />
        </View>
        <FlatList
          contentContainerStyle={styles.content}
          data={loading ? [] : filteredTimes}
          extraData={[
            allowFamilyBooking,
            bookingComplete,
            date,
            multiple,
            selectedFamilyMember,
            timeSlots,
          ]}
          keyExtractor={(item) => `${item.AppointmentID}${item.StartDateTime}`}
          ListEmptyComponent={
            <ListEmptyComponent
              description={`Tweak the 'filter' criteria or\nselect a different day.`}
              loading={loading}
              title={`No sessions available.`}
            />
          }
          ListHeaderComponent={
            <View style={themeStyle.appointments.titleView}>
              <Text style={styles.dateText}>
                {moment(date, 'YYYY-MM-DD').format(formatDate('dddd, MMMM D'))}
              </Text>
              <Text style={themeStyle.appointments.timeNameText}>{type?.SessionName}</Text>
            </View>
          }
          ref={(ref) => {
            timeSlotListRef.current = ref
          }}
          refreshControl={
            <RefreshControl
              colors={[themeStyle.transparent]}
              onRefresh={onFetchTimes}
              refreshing={false}
              tintColor={themeStyle.transparent}
            />
          }
          renderItem={({ item }) => (
            <AppointmentScheduleItem
              allowFamilyBooking={allowFamilyBooking}
              item={item}
              multiple={multiple && !bookingComplete}
              selectedFamilyMember={selectedFamilyMember}
              timeSlots={timeSlots}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <TabBar />
      {multiple && timeSlots.length > 0 && !bookingComplete && (
        <AppointmentScheduleSummary timeSlots={timeSlots} />
      )}
      {modalFamilySelector && (
        <ModalFamilySelector
          ClientID={clientId}
          navigate={navigate}
          onClose={() =>
            setAction('appointmentBooking', {
              modalFamilySelector: false,
              tempScheduleItem: undefined,
            })
          }
          onContinueMyself={onContinueFamily}
          onSelect={onContinueFamily}
          PersonID={personId}
          selectedMember={selectedFamilyMember}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    dayContainer: { backgroundColor: themeStyle.fadedGray },
    dayListContent: { paddingRight: themeStyle.scale(20), paddingVertical: themeStyle.scale(20) },
    dayButton: {
      paddingLeft: themeStyle.scale(20),
      width: (themeStyle.window.width - themeStyle.scale(20)) / 7,
    },
    dayText: { ...themeStyle.calendarTheme.textDayStyle, color: themeStyle.darkGray },
    dayCircle: {
      ...themeStyle.calendarTheme['stylesheet.day.basic'].base,
      marginTop: themeStyle.scale(4),
    },
    content: { flexGrow: 1, paddingVertical: themeStyle.scale(20) },
    dateText: {
      ...themeStyle.textPrimaryMedium14,
      marginBottom: themeStyle.scale(4),
      textAlign: 'center' as const,
    },
  }
}
