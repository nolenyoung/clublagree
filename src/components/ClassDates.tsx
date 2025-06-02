import moment from 'moment'
import * as React from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Icon from './Icon'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { formatDate, logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanFilters } from '../redux/reducers'
import { setAction } from '../redux/actions'

type Props = {
  ClientID: number
  currentFilter: CurrentFilterState
  LocationID: number
  onSelect: (arg1: string) => void
  selectedDate: string
}

export default function ClassDates(props: Props): React.ReactElement {
  const { ClientID, currentFilter, LocationID, onSelect, selectedDate } = props
  const { navigate } = useNavigation()
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [maxDate, setMaxDate] = React.useState(moment().add(60, 'days').toISOString())
  const filterApplied = React.useMemo(() => {
    return Object.keys(cleanFilters).some((key) => {
      if (
        Array.isArray(cleanFilters[key as keyof typeof cleanFilters]) &&
        Array.isArray(currentFilter[key as keyof typeof currentFilter])
      ) {
        return (
          (currentFilter[key as keyof typeof currentFilter] as number[] | string[]).length !== 0
        )
      }
      return (
        cleanFilters[key as keyof typeof cleanFilters] !==
        currentFilter[key as keyof typeof currentFilter]
      )
    })
  }, [currentFilter])
  React.useEffect(() => {
    ;(async function getClassDates() {
      try {
        let response = await API.getMinMaxClassDates({ LocationID, ClientID })
        const { LastClassAvailable } = response
        if (
          LastClassAvailable != null &&
          typeof LastClassAvailable === 'string' &&
          moment(LastClassAvailable, 'YYYY-MM-DD').diff(moment(), 'days') > 60
        ) {
          setMaxDate(moment(LastClassAvailable, 'YYYY-MM-DD').toISOString())
        }
      } catch (e: any) {
        logError(e)
      }
    })()
  }, [ClientID, LocationID])
  const dates = React.useMemo(() => {
    let dateArray: Array<string> = []
    for (let i = 0; moment().add(i, 'days').isSameOrBefore(maxDate, 'day'); i++) {
      dateArray.push(moment().add(i, 'days').format('YYYY-MM-DD'))
    }
    return dateArray
  }, [maxDate])
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.weekdayText}>
          {moment(selectedDate).format(formatDate('dddd, MMM D'))}
        </Text>
        <Pressable
          onPress={() => {
            setAction('loading', { loading: true })
            navigate('ClassFilters')
          }}
          style={filterApplied ? styles.filterButtonApplied : undefined}>
          <View style={themeStyle.rowAligned}>
            <Icon
              name="sliders"
              style={[
                styles.filterIcon,
                filterApplied && {
                  color: themeStyle[Brand.COLOR_SCHEDULE_FILTER_TEXT_ACTIVE as ColorKeys],
                },
              ]}
            />
            <Text
              style={[
                themeStyle.textPrimaryRegular14,
                {
                  color: filterApplied
                    ? themeStyle[Brand.COLOR_SCHEDULE_FILTER_TEXT_ACTIVE as ColorKeys]
                    : themeStyle[Brand.COLOR_SCHEDULE_FILTER_TEXT as ColorKeys],
                },
              ]}>
              filters
            </Text>
          </View>
        </Pressable>
      </View>
      <FlatList
        bounces={false}
        contentContainerStyle={styles.dateListContent}
        data={dates}
        extraData={[onSelect, selectedDate]}
        keyExtractor={(item) => item}
        horizontal={true}
        renderItem={({ item, index }) => {
          const selected = selectedDate === item
          const weekdayItemText = moment(item).format('dd').toUpperCase()
          return (
            <Pressable
              onPress={() => onSelect(item)}
              style={[
                styles.listButton,
                selected && styles.listButtonSelected,
                index === dates.length - 1 && { marginRight: 0 },
              ]}>
              <View style={themeStyle.viewCentered}>
                <Text style={[styles.weekdayItemText, selected && styles.weekdayItemSelectedText]}>
                  {weekdayItemText.includes('S') || weekdayItemText.includes('T')
                    ? weekdayItemText
                    : weekdayItemText.substring(0, 2)}
                </Text>
                <View style={styles.dayItemView}>
                  <Text style={[styles.dayItemText, selected && styles.dayItemSelectedText]}>
                    {moment(item).format('D')}
                  </Text>
                </View>
              </View>
            </Pressable>
          )
        }}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    container: {
      backgroundColor: themeStyle[Brand.COLOR_SCHEDULE_DATES_SECTION as ColorKeys],
      borderBottomWidth: themeStyle.scale(1),
      borderColor: themeStyle[Brand.COLOR_SCHEDULE_DATES_SECTION_BORDER as ColorKeys],
      paddingTop: themeStyle.scale(26),
    },
    headerRow: {
      ...themeStyle.rowAlignedBetween,
      marginBottom: themeStyle.scale(22),
      paddingHorizontal: themeStyle.scale(22),
    },
    filterButtonApplied: {
      backgroundColor: themeStyle[Brand.COLOR_SCHEDULE_FILTER_BUTTON_ACTIVE as ColorKeys],
      borderRadius: themeStyle.scale(4),
      paddingHorizontal: themeStyle.scale(8),
      paddingVertical: themeStyle.scale(2),
    },
    filterIcon: {
      color: themeStyle[Brand.COLOR_SCHEDULE_FILTER_TEXT as ColorKeys],
      fontSize: themeStyle.scale(16),
      marginRight: themeStyle.scale(8),
    },
    weekdayText: {
      ...themeStyle.textPrimaryBold14,
      color: themeStyle[Brand.COLOR_SCHEDULE_FILTER_TEXT as ColorKeys],
      marginBottom: themeStyle.scale(2),
    },
    dayText: {
      ...themeStyle.textPrimaryBold16,
      color: themeStyle[Brand.COLOR_SCHEDULE_DATE_SELECTED as ColorKeys],
    },
    dateListContent: { paddingHorizontal: themeStyle.scale(22) },
    listButton: {
      marginRight: (themeStyle.window.width - themeStyle.scale(218)) / 7,
      paddingBottom: themeStyle.scale(16),
    },
    listButtonSelected: {
      borderBottomWidth: themeStyle.scale(4),
      borderColor: themeStyle[Brand.COLOR_SCHEDULE_DATE_SELECTED as ColorKeys],
    },
    weekdayItemText: {
      ...themeStyle.textPrimaryRegular12,
      color: themeStyle[Brand.COLOR_SCHEDULE_DATE as ColorKeys],
      marginBottom: themeStyle.scale(10),
    },
    weekdayItemSelectedText: {
      ...themeStyle.textPrimaryMedium12,
      color: themeStyle[Brand.COLOR_SCHEDULE_DATE_SELECTED as ColorKeys],
      marginBottom: themeStyle.scale(10),
    },
    dayItemView: {
      ...themeStyle.viewCentered,
      height: themeStyle.scale(24),
      width: themeStyle.scale(28),
    },
    dayItemText: {
      ...themeStyle.textPrimaryRegular14,
      color: themeStyle[Brand.COLOR_SCHEDULE_DATE as ColorKeys],
    },
    dayItemSelectedText: {
      ...themeStyle.textPrimaryMedium14,
      color: themeStyle[Brand.COLOR_SCHEDULE_DATE_SELECTED as ColorKeys],
    },
  }
}
