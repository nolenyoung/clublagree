import moment from 'moment'
import * as React from 'react'
import { View } from 'react-native'
import { CalendarProps, CalendarList } from 'react-native-calendars'
import { Header, ListEmptyComponent, TabBar } from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'
import { logError } from '../global/Functions'
import { setAction } from '../redux/actions'

const maxDate = moment().format('YYYY-MM-DD')

export default function UserWorkoutCalendar(): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [data, setData] = React.useState({
    firstDate: '',
    markedDates: {},
    monthsToShow: 0,
    totalWorkouts: 0,
  })
  const [loading, setLoading] = React.useState(true)
  const onFetchWorkouts = async () => {
    try {
      setLoading(true)
      const response = await API.getUserWorkoutCalendar()
      if ('Calendar' in response) {
        const { Calendar, FirstLast } = response
        const { FirstClass = '' } = FirstLast ?? {}
        let markedDates: CalendarProps['markedDates'] = {}
        for (const date of Calendar) {
          const totalDots = date.NumVisits > 3 ? 3 : date.NumVisits
          markedDates[date.Day] = {
            dots: new Array(totalDots).fill(
              {
                color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys],
                selectedDotColor: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys],
              } as never,
              0,
              totalDots,
            ),
            selected: true,
          }
        }
        // Fallback to today if first class is empty or undefined
        const splitFirstClass = (FirstClass || maxDate).split('-')
        setData({
          firstDate: FirstClass,
          markedDates,
          monthsToShow: Math.floor(
            moment(moment().format('YYYY-MM'), 'YYYY-MM').diff(
              moment(`${splitFirstClass[0]}-${splitFirstClass[1]}`, 'YYYY-MM'),
              'months',
              true,
            ),
          ),
          totalWorkouts: Calendar.length,
        })
      }
    } catch (e) {
      logError(e)
      setAction('toast', { text: 'Unable to fetch workouts' })
    } finally {
      setLoading(false)
    }
  }
  React.useEffect(() => {
    onFetchWorkouts()
  }, [])
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} title={Brand.STRING_SCREEN_TITLE_CLASS_HISTORY_CALENDAR} />
      <View style={themeStyle.screen}>
        {loading || (!loading && data.totalWorkouts === 0) ? (
          <ListEmptyComponent description={``} loading={loading} title={`No workouts available.`} />
        ) : (
          <CalendarList
            calendarStyle={styles.calendar}
            disableAllTouchEventsForDisabledDays={true}
            futureScrollRange={0}
            hideExtraDays={true}
            markedDates={data.markedDates}
            markingType="multi-dot"
            maxDate={maxDate}
            minDate={data.firstDate}
            monthFormat="MMMM yyyy"
            pastScrollRange={data.monthsToShow}
            showScrollIndicator={false}
            showWeekNumbers={false}
            theme={styles.theme}
          />
        )}
      </View>
      <TabBar />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    calendar: {
      borderTopColor: themeStyle.separator.backgroundColor,
      borderTopWidth: themeStyle.scale(1),
    },
    theme: {
      ...themeStyle.calendarTheme,
      'stylesheet.calendar.header': {
        header: {
          alignItems: 'center',
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          marginTop: themeStyle.scale(16),
          paddingLeft: themeStyle.scale(10),
          paddingRight: themeStyle.scale(10),
        },
      },
      'stylesheet.marking': {
        dots: {
          ...themeStyle.rowAligned,
          alignSelf: 'center' as const,
          bottom: themeStyle.scale(3),
          position: 'absolute' as const,
        },
      },
      textDayStyle: {
        ...themeStyle.calendarTheme.textDayStyle,
        color: themeStyle.transparentBlack,
      },
    },
  }
}
