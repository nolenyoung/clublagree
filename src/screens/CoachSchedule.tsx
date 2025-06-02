import { useIsFocused } from '@react-navigation/native'
import moment from 'moment'
import * as React from 'react'
import { RefreshControl, SectionList, Text, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import {
  ClassScheduleItem,
  FilterMarketSelector,
  Header,
  Icon,
  ItemSeparator,
  ListEmptyComponent,
  ModalConfirmationCancel,
  ModalFitMetrixBooking,
  ModalUserProfiles,
  TabBar,
} from '../components'
import Brand from '../global/Brand'
import {
  formatCoachName,
  formatMarketSections,
  getPrebookInfo,
  logError,
  onHandleMarketFilterSelection,
  onSearchMarketLocations,
} from '../global/Functions'
import { useRefreshOnForeground, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'
import { API } from '../global/API'

const onSignIn = () => setAction('toast', { text: 'Please sign in.' })

export default function CoachSchedule(props: RootNavigatorScreenProps<'CoachSchedule'>) {
  const { navigate } = props.navigation
  const { ClientID, CoachID } = props.route.params ?? {}
  const isFocused = useIsFocused()
  const { clientId, numAccounts = 1, personId } = useSelector((state: ReduxState) => state.user)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [coach, setCoach] = React.useState<Coach | undefined>(undefined)
  const [classes, setClasses] = React.useState<Array<{ key: string; data: ClassInfo[] }>>([])
  const [filtersVisible, setFiltersVisible] = React.useState(false)
  const [locations, setLocations] = React.useState<Location[]>([])
  const [modalFitMetrixBooking, setModalFitMetrixBooking] = React.useState(false)
  const [modalSwitchAccount, setModalSwitchAccount] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState<any>(null)
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>([])
  const filterApplied = selectedLocations.length > 0
  const signedIn = clientId != null && personId != null
  const { locationMap, locationsWithSearchTerms, marketLocations } = React.useMemo(
    () => formatMarketSections(locations),
    [locations],
  )
  const onBook = React.useCallback(async (item: ClassInfo) => {
    getPrebookInfo({ navigate, selectedClass: item, setModalFitMetrixBooking, setSelectedClass })
  }, [])
  const onCloseSwitchModal = React.useCallback(() => {
    setModalSwitchAccount(false)
  }, [])
  const onFetchClasses = async () => {
    try {
      setAction('loading', { loading: true })
      let response = await API.getCoachClasses({ ClientID, CoachID })
      if ('Classes' in response) {
        let allLocations: { [locationId: string]: Location } = {}
        let sectionsByDate: { [key: string]: ClassInfo[] } = {}
        for (const classInfo of response.Classes) {
          const { Location, StartDateTime } = classInfo
          if (allLocations[`${Location.ClientID}-${Location.LocationID}`] == null) {
            allLocations[`${Location.ClientID}-${Location.LocationID}`] = Location
          }
          const startDate = moment(StartDateTime).format('dddd, MMMM D')
          if (sectionsByDate[startDate] != null) {
            sectionsByDate[startDate].push(classInfo)
          } else {
            sectionsByDate[startDate] = [classInfo]
          }
        }
        setCoach(response.Coach)
        setClasses(Object.keys(sectionsByDate).map((key) => ({ key, data: sectionsByDate[key] })))
        setLocations(Object.keys(allLocations).map((key) => allLocations[key]))
      } else {
        setAction('toast', { text: response.message })
      }
    } catch (e: any) {
      logError(e)
      setAction('toast', { text: 'Unable to fetch schedule' })
    } finally {
      cleanAction('loading')
    }
  }
  const onPressLocation = async (item: Location) => {
    setSelectedLocations((prev) => {
      const { ClientID, LocationID } = item
      let updatedLocations = [...prev]
      let locationIndex = updatedLocations.findIndex((id) => id === `${ClientID}-${LocationID}`)
      if (locationIndex !== -1) {
        updatedLocations.splice(locationIndex, 1)
      } else {
        updatedLocations.push(`${ClientID}-${LocationID}`)
      }
      return updatedLocations
    })
  }
  const onPressMarket = async (section: MarketSection<Location>, selected: boolean) => {
    const updatedLocations = onHandleMarketFilterSelection({
      allLocations: locations,
      section,
      selected,
      selectedLocations,
    })
    setSelectedLocations(updatedLocations)
  }
  const onRefresh = React.useCallback((item: BookedClassInfo | ClassInfo) => {
    setClasses((prev) => {
      let newSections = [...prev]
      const sectionIndex = newSections.findIndex(
        (section) => section.key === moment(item.StartDateTime).format('dddd, MMMM D'),
      )
      if (sectionIndex !== -1) {
        let sectionClasses = [...newSections[sectionIndex].data]
        const classIndex = sectionClasses.findIndex(
          (c) => c.RegistrationID === item.RegistrationID && c.ClientID === item.ClientID,
        )
        if (classIndex !== -1) {
          sectionClasses[classIndex] = {
            ...sectionClasses[classIndex],
            UserStatus: {
              ...sectionClasses[classIndex].UserStatus,
              isUserInClass: false,
              isUserOnWaitlist: false,
            },
          }
          newSections[sectionIndex] = { ...newSections[sectionIndex], data: sectionClasses }
        }
      }
      return newSections
    })
    cleanAction('loading')
    setAction('toast', { text: 'Reservation cancelled.', type: 'success' })
  }, [])
  React.useEffect(() => {
    if (isFocused) {
      onFetchClasses()
      cleanAction('bookingDetails')
    }
  }, [isFocused])
  useRefreshOnForeground(onFetchClasses)
  const filteredClasses = React.useMemo(() => {
    if (selectedLocations.length === 0) {
      return classes
    }
    let sections = [...classes]
    return sections
      .map((s) => {
        const filteredClasses = s.data.filter((c) =>
          selectedLocations.includes(`${c.Location.ClientID}-${c.Location.LocationID}`),
        )
        if (filteredClasses.length > 0) {
          return { ...s, data: filteredClasses }
        }
        return null
      })
      .filter((fs) => fs != null)
  }, [classes, selectedLocations])
  return (
    <View style={themeStyle.flexView}>
      <Header
        menu={true}
        {...(Brand.UI_ACCOUNT_SWITCHING && numAccounts > 1
          ? {
              rightIcon: Brand.UI_ACCOUNT_SWITCHING_ICON,
              rightIconPress: () => setModalSwitchAccount(true),
            }
          : {})}
        title={coach == null ? 'Schedule' : formatCoachName({ coach })}
      />
      <View style={[themeStyle.flexView, { display: filtersVisible ? 'none' : 'flex' }]}>
        <View style={styles.headerRow}>
          {classes.length > 0 && locations.length > 0 && (
            <TouchableOpacity
              onPress={() => setFiltersVisible(true)}
              style={filterApplied ? styles.filterButtonApplied : undefined}>
              <View style={themeStyle.rowAligned}>
                <Icon
                  name="sliders"
                  style={[
                    styles.filterIcon,
                    filterApplied && { color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys] },
                  ]}
                />
                <Text
                  style={[
                    themeStyle.textPrimaryRegular14,
                    filterApplied && { color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys] },
                  ]}>
                  filters
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        <SectionList
          contentContainerStyle={themeStyle.listContent}
          // Following props added to address blank/skipping list
          decelerationRate="fast"
          directionalLockEnabled={true}
          disableVirtualization={true}
          extraData={[signedIn]}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) =>
            `${item.RegistrationID}${item.Name}${item.Location?.Nickname}${item.ClientID}`
          }
          ListEmptyComponent={
            <ListEmptyComponent
              description="Tweak the 'filter' criteria"
              title={`No ${Brand.STRING_CLASS_TITLE_PLURAL_LC} available.`}
            />
          }
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
                        : () => onBook(item)
                }
                showCancel={
                  (userInClass || userOnWaitlist) &&
                  (!Brand.UI_FAMILY_BOOKING || !item.allowFamilyBooking)
                }
              />
            )
          }}
          renderSectionHeader={({ section }) => (
            <View style={styles.headerView}>
              <Text style={styles.nameText}>{section.key}</Text>
            </View>
          )}
          sections={filteredClasses}
          showsVerticalScrollIndicator={false}
          // Following prop added to address blank/skipping list
          windowSize={41}
        />
      </View>
      <View style={[themeStyle.flexView, { display: filtersVisible ? 'flex' : 'none' }]}>
        <View style={[styles.headerRow, { justifyContent: 'space-between' as const }]}>
          <TouchableOpacity onPress={() => setFiltersVisible(false)}>
            <View style={themeStyle.rowAligned}>
              <Icon name="arrow-back" style={styles.filterIcon} />
              <Text style={themeStyle.textPrimaryRegular14}>back to list</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedLocations([])}>
            <View style={themeStyle.rowAligned}>
              <Icon name="clear" style={styles.filterIcon} />
              <Text style={themeStyle.textPrimaryRegular14}>clear filters</Text>
            </View>
          </TouchableOpacity>
        </View>
        <FilterMarketSelector
          getItem={(item) => ({
            selected: selectedLocations.some(
              (loc) => loc === `${item.ClientID}-${item.LocationID}`,
            ),
            text: item.Nickname,
          })}
          getSectionSelected={(section) =>
            locations.filter((loc) => loc[Brand.UI_CLASS_FILTERS_MARKET_KEY] === section.id)
              .length === selectedLocations.filter((loc) => locationMap[loc] === section.id).length
          }
          items={marketLocations}
          keyExtractor={(item) => `${item[Brand.UI_CLASS_FILTERS_MARKET_KEY]}${item.Nickname}`}
          locationsWithSearchTerms={locationsWithSearchTerms}
          onSearch={(text) => onSearchMarketLocations(text, marketLocations)}
          onSelect={onPressLocation}
          onSelectSection={onPressMarket}
          selectedItems={selectedLocations}
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
      {modalSwitchAccount && <ModalUserProfiles onClose={onCloseSwitchModal} />}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    headerRow: {
      ...themeStyle.rowAlignedEnd,
      marginVertical: themeStyle.scale(16),
      paddingHorizontal: themeStyle.scale(22),
    },
    filterButtonApplied: {
      backgroundColor: themeStyle.brandPrimary,
      borderRadius: themeStyle.scale(4),
      paddingHorizontal: themeStyle.scale(8),
      paddingVertical: themeStyle.scale(2),
    },
    filterIcon: {
      color: themeStyle.textBlack,
      fontSize: themeStyle.scale(16),
      marginRight: themeStyle.scale(8),
    },
    headerView: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.fadedGray,
      minHeight: themeStyle.scale(40),
    },
    nameText: {
      ...themeStyle.sectionTitleText,
      fontSize: themeStyle.scale(20),
      textAlign: 'center' as const,
    },
  }
}
