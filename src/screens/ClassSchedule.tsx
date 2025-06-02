import { useIsFocused } from '@react-navigation/native'
import * as React from 'react'
import { FlatList, RefreshControl, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import moment from 'moment'
import {
  AnimatedBallTriangleLoader,
  ClassDates,
  ClassScheduleItem,
  Header,
  ItemSeparator,
  ListEmptyComponent,
  ModalConfirmationCancel,
  ModalFitMetrixBooking,
  ModalUserProfiles,
  TabBar,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { fetchClasses, getPrebookInfo, logError, logEvent } from '../global/Functions'
import { useRefreshOnForeground, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

const onSignIn = () => setAction('toast', { text: 'Please sign in.' })

export default function ClassSchedule(props: ScheduleStackScreenProps<'ClassScheduleBase'>) {
  const {
    navigation: { navigate },
    route: { params },
  } = props
  const isFocused = useIsFocused()
  const scrollRef = React.useRef<FlatList | null>(null)
  const currentFilter = useSelector((state: ReduxState) => state.currentFilter)
  const {
    clientId,
    locationId,
    numAccounts = 1,
    personId,
  } = useSelector((state: ReduxState) => state.user)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [classes, setClasses] = React.useState<ClassInfo[]>([])
  const [loading, setLoading] = React.useState(true)
  const [modalFitMetrixBooking, setModalFitMetrixBooking] = React.useState(false)
  const [modalSwitchAccount, setModalSwitchAccount] = React.useState(false)
  const [muscleFocusData, setMuscleFocusData] = React.useState<MuscleFocus[]>([])
  const [selectedClass, setSelectedClass] = React.useState<any>(null)
  const [selectedDate, setSelectedDate] = React.useState(
    params?.date ?? moment().format('YYYY-MM-DD'),
  )
  const [selectedMuscleFocus, setSelectedMuscleFocus] = React.useState<MuscleFocus | undefined>(
    undefined,
  )
  const signedIn = clientId != null && personId != null
  const onFetchClasses = React.useCallback(async () => {
    try {
      setLoading(true)
      let response = await fetchClasses({
        ...currentFilter,
        endDate: selectedDate,
        FutureOnly: true,
        hideLoader: true,
        startDate: selectedDate,
        workshops: false,
      })
      if (response != null && Array.isArray(response)) {
        setClasses(response)
      }
    } catch (e: any) {
      logError(e)
    } finally {
      setLoading(false)
    }
  }, [currentFilter, selectedDate])
  const onFetchMuscleFocus = async () => {
    try {
      let response = await API.getMuscleFocus()
      if (Array.isArray(response)) {
        setMuscleFocusData(response)
      } else if ('message' in response) {
        setAction('toast', { text: response.message })
      }
    } catch (e) {
      logError(e)
    }
  }
  const onSelectDate = React.useCallback((date: string) => {
    scrollRef.current?.scrollToOffset({ offset: 0, animated: true })
    setSelectedDate(date)
    logEvent('schedule_date_selected')
  }, [])
  const onRefresh = React.useCallback((item: BookedClassInfo | ClassInfo) => {
    setClasses((prev) => {
      let newClasses = [...prev]
      const classIndex = newClasses.findIndex(
        (c) => c.RegistrationID === item.RegistrationID && c.ClientID === item.ClientID,
      )
      if (classIndex !== -1) {
        newClasses[classIndex] = {
          ...newClasses[classIndex],
          UserStatus: {
            ...newClasses[classIndex].UserStatus,
            isUserInClass: false,
            isUserOnWaitlist: false,
          },
        }
      }
      return newClasses
    })
    cleanAction('loading')
    setAction('toast', { text: 'Reservation cancelled.', type: 'success' })
  }, [])
  React.useEffect(() => {
    if (isFocused) {
      cleanAction('bookingDetails')
      onFetchClasses()
    }
  }, [clientId, currentFilter, isFocused, personId, selectedDate])
  React.useEffect(() => {
    if (isFocused && Brand.UI_SCHEDULE_MUSCLE_FOCUS) {
      onFetchMuscleFocus()
    }
  }, [isFocused])
  React.useEffect(() => {
    if (classes.length > 0 && muscleFocusData.length > 0 && Brand.UI_SCHEDULE_MUSCLE_FOCUS) {
      setSelectedMuscleFocus(muscleFocusData.find((d) => d.Date === selectedDate))
    }
  }, [classes, muscleFocusData, selectedDate])
  useRefreshOnForeground(onFetchClasses)
  return (
    <View style={themeStyle.flexView}>
      <Header
        menu={true}
        {...(Brand.UI_ACCOUNT_SWITCHING && numAccounts > 1
          ? {
              rightIcon: Brand.UI_ACCOUNT_SWITCHING_ICON,
              rightIconPress: async () => {
                setModalSwitchAccount(true)
                await logEvent('schedule_switch_account')
              },
            }
          : {})}
        title={Brand.STRING_SCREEN_TITLE_SCHEDULE}
      />
      <ClassDates
        ClientID={clientId ?? 0}
        currentFilter={currentFilter}
        LocationID={locationId ?? 0}
        onSelect={onSelectDate}
        selectedDate={selectedDate}
      />
      {loading && (
        <View style={themeStyle.flexViewCentered}>
          <AnimatedBallTriangleLoader />
        </View>
      )}
      <View style={[themeStyle.flexView, { display: loading ? 'none' : 'flex' }]}>
        {Brand.UI_SCHEDULE_MUSCLE_FOCUS && selectedMuscleFocus != null && classes.length > 0 && (
          <View style={styles.muscleFocusBanner}>
            <Text allowFontScaling={false} style={styles.muscleFocusText}>
              {`Muscle Focus: ${selectedMuscleFocus.LowerBody} & ${selectedMuscleFocus.UpperBody}`}
            </Text>
          </View>
        )}
        <FlatList
          contentContainerStyle={themeStyle.listContent}
          data={classes}
          extraData={signedIn}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) =>
            `${item.RegistrationID}${item.Name}${item.Location?.Nickname}${item.ClientID}`
          }
          ListEmptyComponent={
            <ListEmptyComponent
              description={`Tweak the 'filter' criteria or\nselect a different day.`}
              title={`No ${Brand.STRING_CLASS_TITLE_PLURAL_LC} available.`}
            />
          }
          ref={scrollRef}
          refreshControl={<RefreshControl onRefresh={onFetchClasses} refreshing={false} />}
          renderItem={({ item }) => {
            const userInClass = item.UserStatus?.isUserInClass
            const userOnWaitlist = item.UserStatus?.isUserOnWaitlist
            return (
              <ClassScheduleItem
                details={item}
                onPress={
                  !signedIn
                    ? onSignIn
                    : userInClass && (!Brand.UI_FAMILY_BOOKING || !item.allowFamilyBooking)
                      ? () => setAction('classToCancel', { item, onRefresh, type: 'class' })
                      : userOnWaitlist && (!Brand.UI_FAMILY_BOOKING || !item.allowFamilyBooking)
                        ? () => setAction('classToCancel', { item, onRefresh, type: 'waitlist' })
                        : () =>
                            getPrebookInfo({
                              navigate,
                              selectedClass: item,
                              setModalFitMetrixBooking,
                              setSelectedClass,
                            })
                }
                showCancel={
                  (userInClass || userOnWaitlist) &&
                  (!Brand.UI_FAMILY_BOOKING || !item.allowFamilyBooking)
                }
              />
            )
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <TabBar />
      <ModalConfirmationCancel />
      {Brand.UI_FITMETRIX_BOOKING && selectedClass != null && (
        <ModalFitMetrixBooking
          onClose={() => {
            setSelectedClass(null)
            setModalFitMetrixBooking(false)
            onFetchClasses()
          }}
          selectedClass={selectedClass}
          title={`Book a ${Brand.STRING_CLASS_TITLE}`}
          visible={modalFitMetrixBooking}
        />
      )}
      {modalSwitchAccount && <ModalUserProfiles onClose={() => setModalSwitchAccount(false)} />}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    muscleFocusBanner: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.brandPrimary,
      height: themeStyle.scale(40),
      width: themeStyle.window.width,
    },
    muscleFocusText: {
      ...themeStyle.textPrimaryBold14,
      color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys],
      textAlign: 'center' as const,
      textTransform: Brand.TRANSFORM_SECTION_TITLE_TEXT as TextTransform,
    },
  }
}
