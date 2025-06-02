import * as React from 'react'
import { FlatList, ScrollView, SectionList, Text, TouchableOpacity, View } from 'react-native'
import { useMMKVListener } from 'react-native-mmkv'
import { useSelector } from 'react-redux'
import {
  AnimatedBallTriangleLoader,
  Button,
  ButtonText,
  Checkbox,
  ClassTimeSlider,
  Header,
  Icon,
  ModalFilterMarketSelector,
  ModalFilterSelector,
} from '../components'
import Brand from '../global/Brand'
import {
  fetchClasses,
  fetchClassFilters,
  formatCoachName,
  formatMarketSections,
  formatSelectedMarketLocations,
  logError,
  logEvent,
  onHandleMarketFilterSelection,
  onSearchMarketLocations,
  sortProviders,
} from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'
import { initialCurrentFilter } from '../redux/reducers'
import { STORAGE_KEYS } from '../global/Constants'
import { mmkvStorage } from '../redux/store'
import { API } from '../global/API'

export default function ClassFilters(
  props:
    | RootNavigatorScreenProps<'ClassFilters'>
    | ScheduleStackScreenProps<'ClassFilters'>
    | WorkshopStackScreenProps<'WorkshopsFilters'>,
) {
  const { goBack } = props.navigation
  const workshops = props.route?.params?.workshops ?? false
  const buttonLoader = React.useRef<string>('')
  const [filters, setFilters] = React.useState(
    JSON.parse(mmkvStorage.getString(STORAGE_KEYS.classFilters) ?? '{}'),
  )
  const currentFilter = useSelector((state: ReduxState) => state.currentFilter)
  const loading = useSelector((state: ReduxState) => state.loading.loading)
  const clientId = useSelector((state: ReduxState) => state.user.clientId)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    classCount,
    classTypes: currentClassTypes,
    coaches: currentFilterCoaches,
    locations: currentLocations,
  } = currentFilter
  const { classTypes = [], coaches = [], lastUpdated } = filters as ClassFilters
  const [allLocations, setAllLocations] = React.useState<Location[]>([])
  // Selected coaches with full coach details. Redux is only storing unique coach ids for selections
  const [currentCoaches, setCurrentCoaches] = React.useState<Coach[]>([])
  // List of coaches available based upon selected locations
  const [filteredCoaches, setFilteredCoaches] = React.useState<Coach[]>([])
  const [modalCoaches, setModalCoaches] = React.useState(false)
  const [modalLocations, setModalLocations] = React.useState(false)
  const { locationMap, locationsWithSearchTerms, marketLocations } = React.useMemo(
    () => formatMarketSections(allLocations),
    [allLocations],
  )
  const currentMarketLocations = React.useMemo(
    () => formatSelectedMarketLocations(allLocations, currentLocations),
    [allLocations, currentLocations],
  )
  const onClearFilters = async () => {
    cleanAction('currentFilter')
    fetchClasses({ ...initialCurrentFilter, CountOnly: true, FutureOnly: true, workshops })
    await logEvent('filters_clear')
  }
  async function onFetchLocations(
    loc?: { Latitude: number; Longitude: number },
    setLoading?: (loading: boolean) => void,
  ) {
    try {
      setLoading?.(true)
      let response = await API.getStudios(loc)
      if (Array.isArray(response)) {
        const filteredResponse = response.filter((r) => !r.hideIfNoClasses || r.hasFutureClasses)
        if (response.length > 0 && 'Distance_Mi' in response[0]) {
          filteredResponse.sort((a, b) => {
            if (Brand.DEFAULT_COUNTRY === 'US') {
              return Number(a.Distance_Mi) - Number(b.Distance_Mi)
            }
            return Number(a.Distance_Km) - Number(b.Distance_Km)
          })
        }
        setAllLocations(filteredResponse)
      }
    } catch (e) {
      logError(e)
    } finally {
      setLoading?.(false)
    }
  }
  const onPressClassType = async (item: ClassType) => {
    const { classTypes: types } = currentFilter
    const { TypeID } = item
    let updatedTypes = [...types]
    let typeIndex = updatedTypes.findIndex((id) => id === TypeID)
    if (typeIndex != -1) {
      updatedTypes.splice(typeIndex, 1)
    } else {
      updatedTypes.push(TypeID)
    }
    setAction('currentFilter', { classTypes: updatedTypes })
    fetchClasses({
      ...currentFilter,
      CountOnly: true,
      classTypes: updatedTypes,
      FutureOnly: true,
      workshops,
    })
    await logEvent('filters_class_type_selected', { classTypes: updatedTypes })
  }
  const onPressCoach = async (item: Coach) => {
    const { coaches: existingCoaches } = currentFilter
    const selectedCoach = `${item.ClientID}-${item.CoachID}`
    let updatedCoaches = [...existingCoaches]
    let coachIndex = updatedCoaches.findIndex((id) => id === selectedCoach)
    if (coachIndex != -1) {
      updatedCoaches.splice(coachIndex, 1)
    } else {
      updatedCoaches.push(selectedCoach)
    }
    setAction('currentFilter', { coaches: updatedCoaches })
    fetchClasses({
      ...currentFilter,
      CountOnly: true,
      coaches: updatedCoaches,
      FutureOnly: true,
      workshops,
    })
    await logEvent('filters_coach_selected', { coaches: updatedCoaches })
  }
  const onPressLocation = async (item: Location) => {
    const { locations: existingLocations } = currentFilter
    const { ClientID, LocationID } = item
    let updatedLocations = [...existingLocations]
    let locationIndex = updatedLocations.findIndex((id) => id === `${ClientID}-${LocationID}`)
    if (locationIndex !== -1) {
      updatedLocations.splice(locationIndex, 1)
    } else {
      updatedLocations.push(`${ClientID}-${LocationID}`)
    }
    setAction('currentFilter', { locations: updatedLocations })
    fetchClasses({
      ...currentFilter,
      CountOnly: true,
      locations: updatedLocations,
      FutureOnly: true,
      workshops,
    })
    await logEvent('filters_location_selected', { locations: updatedLocations })
  }
  const onPressMarket = async (section: MarketSection<Location>, selected: boolean) => {
    const updatedLocations = onHandleMarketFilterSelection({
      allLocations,
      section,
      selected,
      selectedLocations: currentLocations,
    })
    setAction('currentFilter', { locations: updatedLocations })
    fetchClasses({
      ...currentFilter,
      CountOnly: true,
      locations: updatedLocations,
      FutureOnly: true,
      workshops,
    })
    await logEvent('filters_location_selected', { locations: updatedLocations })
  }
  useMMKVListener((key: string) => {
    if (key === STORAGE_KEYS.classFilters) {
      setFilters(JSON.parse(mmkvStorage.getString(STORAGE_KEYS.classFilters) ?? '{}'))
    }
  }, mmkvStorage)
  React.useEffect(() => {
    onFetchLocations()
    fetchClasses({ ...currentFilter, CountOnly: true, FutureOnly: true, workshops })
  }, [])
  React.useEffect(() => {
    fetchClassFilters(lastUpdated)
  }, [lastUpdated])
  React.useEffect(() => {
    if (buttonLoader.current !== '') {
      loading
        ? setAction('activeButton', { id: buttonLoader.current })
        : cleanAction('activeButton')
    }
  }, [loading])
  React.useEffect(() => {
    const sortedSelections = currentFilterCoaches
      .map((c) => coaches.find((item) => c === `${item.ClientID}-${item.CoachID}`))
      .filter((i) => i != null)
      .sort(sortProviders)
    setCurrentCoaches(sortedSelections)
    setFilteredCoaches(
      coaches
        .filter(
          (coach) =>
            (sortedSelections.length > 0 &&
              sortedSelections.some(
                (c) => `${c.ClientID}-${c.CoachID}` === `${coach.ClientID}-${coach.CoachID}`,
              )) ||
            (currentLocations.length === 0 && (clientId == null || coach.ClientID === clientId)) ||
            (currentLocations.length > 0 &&
              currentLocations.some((loc) => {
                const [locationClientId, locationLocationId] = loc.split('-')
                return (
                  String(locationClientId) === String(coach.ClientID) &&
                  coach.LocationIDs?.some((l) => String(l) === String(locationLocationId))
                )
              })),
        )
        .sort(sortProviders),
    )
  }, [clientId, coaches, currentFilterCoaches, currentLocations])
  return (
    <View style={themeStyle.flexView}>
      <Header
        leftComponent={
          <ButtonText onPress={onClearFilters} style={styles.clearButton} text="clear filters" />
        }
        rightComponent={
          <TouchableOpacity
            hitSlop={themeStyle.hitSlopLarge}
            onPress={async () => {
              await logEvent('filters_exit')
              goBack()
            }}>
            <Icon name="clear" style={styles.closeIcon} />
          </TouchableOpacity>
        }
      />
      <View style={themeStyle.contentWhite}>
        {loading && (
          <View style={themeStyle.flexViewCentered}>
            <AnimatedBallTriangleLoader />
          </View>
        )}
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ display: loading ? 'none' : 'flex' }}>
          {classTypes.length > 1 && (
            <React.Fragment>
              <FlatList
                contentContainerStyle={styles.listContent}
                data={classTypes}
                extraData={currentClassTypes}
                keyExtractor={(item) => `${item.TypeID}${item.Name}`}
                ListHeaderComponent={
                  <View style={styles.listHeader}>
                    <Text style={themeStyle.sectionTitleText}>
                      {`${Brand.STRING_CLASS_TITLE} Type`}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const selected = currentClassTypes.some((type) => type == item.TypeID)
                  return (
                    <Checkbox
                      containerStyle={styles.checkbox}
                      onPress={() => onPressClassType(item)}
                      selected={selected}
                      text={item.Name}
                    />
                  )
                }}
                scrollEnabled={false}
              />
              <View style={styles.listSeparator} />
            </React.Fragment>
          )}
          {Brand.UI_CLASS_FILTERS_MARKETS
            ? marketLocations.length > 0 &&
              allLocations.length > 1 && (
                <React.Fragment>
                  <SectionList
                    contentContainerStyle={styles.listContent}
                    extraData={[allLocations, marketLocations]}
                    keyExtractor={(item) =>
                      `${item[Brand.UI_CLASS_FILTERS_MARKET_KEY]}${item.Nickname}`
                    }
                    ListEmptyComponent={<Text style={styles.emptyListText}>None Selected</Text>}
                    ListHeaderComponent={
                      <View style={styles.listHeader}>
                        <Text style={themeStyle.sectionTitleText}>Location</Text>
                        <View style={styles.sectionDescriptionRow}>
                          <View style={styles.nearbyLocationsView}>
                            <Text style={themeStyle.textPrimaryRegular14}>
                              List of selected locations.
                            </Text>
                          </View>
                          <ButtonText
                            color={themeStyle.buttonTextOnMain}
                            onPress={async () => {
                              setModalLocations(true)
                              await logEvent('filters_location_view_all')
                            }}
                            text="view all"
                          />
                        </View>
                      </View>
                    }
                    renderItem={({ item }) => {
                      return (
                        <Checkbox
                          containerStyle={styles.locationCheckbox}
                          onPress={() => onPressLocation(item)}
                          selected={true}
                          text={item.Nickname}
                        />
                      )
                    }}
                    renderSectionHeader={({ section }) => {
                      const { title } = section
                      const selected =
                        allLocations.filter(
                          (loc) => loc[Brand.UI_CLASS_FILTERS_MARKET_KEY] === section.id,
                        ).length ===
                        currentLocations.filter((loc) => locationMap[loc] === section.id).length
                      return (
                        <Checkbox
                          containerStyle={themeStyle.item}
                          onPress={() => onPressMarket(section, selected)}
                          selected={selected}
                          text={title}
                          textStyle={styles.headerText}
                        />
                      )
                    }}
                    scrollEnabled={false}
                    sections={currentMarketLocations}
                  />
                  <View style={styles.listSeparator} />
                </React.Fragment>
              )
            : allLocations.length > 1 && (
                <React.Fragment>
                  <FlatList
                    contentContainerStyle={styles.listContent}
                    data={currentLocations}
                    extraData={allLocations}
                    keyExtractor={(item, index) => {
                      const location = allLocations.find(
                        (loc) => item === `${loc.ClientID}-${loc.LocationID}`,
                      )
                      if (location == null) {
                        return `Location${index}`
                      }
                      return `${location.LocationID}${location.Nickname}`
                    }}
                    ListEmptyComponent={<Text style={styles.emptyListText}>None Selected</Text>}
                    ListHeaderComponent={
                      <View style={styles.listHeader}>
                        <Text style={themeStyle.sectionTitleText}>Location</Text>
                        <View style={styles.sectionDescriptionRow}>
                          <View style={styles.nearbyLocationsView}>
                            <Text style={themeStyle.textPrimaryRegular14}>
                              List of selected locations.
                            </Text>
                          </View>
                          <ButtonText
                            color={themeStyle.buttonTextOnMain}
                            onPress={async () => {
                              setModalLocations(true)
                              await logEvent('filters_location_view_all')
                            }}
                            text="view all"
                          />
                        </View>
                      </View>
                    }
                    renderItem={({ item }) => {
                      const location = allLocations.find(
                        (l) => `${l.ClientID}-${l.LocationID}` === item,
                      )
                      if (location == null) {
                        return null
                      }
                      return (
                        <Checkbox
                          containerStyle={styles.checkbox}
                          onPress={() => onPressLocation(location)}
                          selected={true}
                          text={location.Nickname}
                        />
                      )
                    }}
                    scrollEnabled={false}
                  />
                  <View style={styles.listSeparator} />
                </React.Fragment>
              )}
          {!Brand.UI_CLASS_FILTERS_HIDE_COACHES && coaches.length > 0 && (
            <React.Fragment>
              <FlatList
                contentContainerStyle={styles.listContent}
                data={currentCoaches}
                extraData={filteredCoaches}
                keyExtractor={(item) => `${item.CoachID}${item.ClientID}${item.Email}`}
                ListEmptyComponent={<Text style={styles.emptyListText}>None Selected</Text>}
                ListHeaderComponent={
                  <View style={styles.listHeader}>
                    <Text style={themeStyle.sectionTitleText}>{Brand.COACH_TITLE}</Text>
                    <View style={styles.sectionDescriptionRow}>
                      <View style={styles.nearbyLocationsView}>
                        <Text style={themeStyle.textPrimaryRegular14}>
                          {`List of selected ${Brand.COACH_TITLE_PLURAL_LC}.`}
                        </Text>
                      </View>
                      <ButtonText
                        color={themeStyle.buttonTextOnMain}
                        onPress={async () => {
                          setModalCoaches(true)
                          await logEvent('filters_coach_view_all')
                        }}
                        text="view all"
                      />
                    </View>
                  </View>
                }
                renderItem={({ item }) => {
                  return (
                    <Checkbox
                      containerStyle={styles.checkbox}
                      onPress={() => onPressCoach(item)}
                      selected={true}
                      text={formatCoachName({
                        coach: item,
                        lastInitialOnly: Brand.UI_COACH_LAST_INITIAL_ONLY,
                      })}
                    />
                  )
                }}
                scrollEnabled={false}
              />
              <View style={styles.listSeparator} />
            </React.Fragment>
          )}
          <View style={styles.timeView}>
            <Text style={themeStyle.sectionTitleText}>Time</Text>
            <Text style={styles.seeClassesTimeText}>
              {`See ${Brand.STRING_CLASS_TITLE_PLURAL_LC} between...`}
            </Text>
            <ClassTimeSlider workshops={workshops} />
          </View>
        </ScrollView>
      </View>
      <View style={themeStyle.fixedBottomButtonView}>
        <Button
          gradient={Brand.BUTTON_GRADIENT}
          onPress={async () => {
            await logEvent('filters_see_results')
            goBack()
          }}
          showSpinner={loading}
          style={themeStyle.fixedBottomButton}
          text={
            classCount > 0
              ? `See ${classCount?.toLocaleString()} ${Brand.STRING_CLASS_TITLE_PLURAL}`
              : `No ${Brand.STRING_CLASS_TITLE_PLURAL} Found`
          }
          toggleSelfDisabled={(f) => {
            buttonLoader.current = f
          }}
        />
      </View>
      {Brand.UI_CLASS_FILTERS_MARKETS && modalLocations && (
        <ModalFilterMarketSelector
          getItem={(item) => ({
            selected: currentLocations.some((loc) => loc === `${item.ClientID}-${item.LocationID}`),
            text: item.Nickname,
          })}
          getSectionSelected={(section) =>
            allLocations.filter((loc) => loc[Brand.UI_CLASS_FILTERS_MARKET_KEY] === section.id)
              .length === currentLocations.filter((loc) => locationMap[loc] === section.id).length
          }
          items={marketLocations}
          keyExtractor={(item) => `${item[Brand.UI_CLASS_FILTERS_MARKET_KEY]}${item.Nickname}`}
          locationsWithSearchTerms={locationsWithSearchTerms}
          onClose={() => setModalLocations(false)}
          onFetchLocations={onFetchLocations}
          onSearch={(text) => onSearchMarketLocations(text, marketLocations)}
          onSelect={onPressLocation}
          onSelectSection={onPressMarket}
          selectedItems={currentLocations}
          showSortTabs={true}
          title="Select Locations"
          visible={true}
        />
      )}
      {!Brand.UI_CLASS_FILTERS_MARKETS && modalLocations && (
        <ModalFilterSelector
          getItem={(item) => {
            return {
              selected: currentLocations.some(
                (loc) => loc === `${item.ClientID}-${item.LocationID}`,
              ),
              text: item.Nickname,
            }
          }}
          items={allLocations}
          keyExtractor={(item) => `${item.LocationID}${item.Nickname}`}
          onClose={() => setModalLocations(false)}
          onSearch={(text) =>
            allLocations.filter((item) => item.Nickname?.toLowerCase().includes(text.toLowerCase()))
          }
          onSelect={onPressLocation}
          selectedItems={currentLocations}
          title="Select Locations"
          visible={modalLocations}
        />
      )}
      {modalCoaches && (
        <ModalFilterSelector
          getItem={(item) => {
            return {
              selected: currentCoaches.some(
                (coach) =>
                  `${coach.ClientID}-${coach.CoachID}` === `${item.ClientID}-${item.CoachID}`,
              ),
              text: formatCoachName({
                coach: item as Coach,
                lastInitialOnly: Brand.UI_COACH_LAST_INITIAL_ONLY,
              }),
            }
          }}
          items={filteredCoaches}
          keyExtractor={(item) => `${item.CoachID}${item.ClientID}${item.Email}`}
          onClose={() => setModalCoaches(false)}
          onSearch={(text) =>
            filteredCoaches.filter((item) =>
              formatCoachName({
                coach: item,
                lastInitialOnly: Brand.UI_COACH_LAST_INITIAL_ONLY,
              })
                .toLowerCase()
                .includes(text.toLowerCase()),
            )
          }
          onSelect={onPressCoach}
          selectedItems={currentFilter.coaches}
          title={`Select ${Brand.COACH_TITLE_PLURAL}`}
          visible={true}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const checkbox = { marginBottom: themeStyle.scale(20) }
  return {
    clearButton: { alignSelf: 'flex-start' as 'flex-start' },
    closeIcon: { color: themeStyle.textWhite, fontSize: themeStyle.scale(16) },
    scrollContent: { paddingVertical: themeStyle.scale(32) },
    listContent: { paddingHorizontal: themeStyle.scale(27) },
    listHeader: { marginBottom: themeStyle.scale(20) },
    sectionDescriptionRow: { ...themeStyle.rowAligned, marginTop: themeStyle.scale(4) },
    listSeparator: { ...themeStyle.separator, marginVertical: themeStyle.scale(20) },
    checkbox,
    headerText: { fontFamily: themeStyle.fontPrimaryBold },
    locationCheckbox: { ...checkbox, marginLeft: themeStyle.scale(36) },
    nearbyLocationsView: {
      borderColor: themeStyle.black,
      borderRightWidth: themeStyle.scale(1),
      marginRight: themeStyle.scale(8),
      paddingRight: themeStyle.scale(8),
    },
    emptyListText: themeStyle.getTextStyle({
      color: 'textGray',
      font: 'fontPrimaryRegular',
      size: 14,
    }),
    timeView: { paddingHorizontal: themeStyle.scale(27) },
    seeClassesTimeText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryRegular', size: 14 }),
      marginBottom: themeStyle.scale(32),
      marginTop: themeStyle.scale(4),
    },
  }
}
