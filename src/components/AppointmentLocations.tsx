import * as React from 'react'
import { FlatList, Pressable, RefreshControl, SectionList, Text, View } from 'react-native'
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import Button from './Button'
import ButtonText from './ButtonText'
import Checkbox from './Checkbox'
import Icon from './Icon'
import Input from './Input'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ModalBanner from './ModalBanner'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { ANIMATION_DURATIONS, STORAGE_KEYS } from '../global/Constants'
import { formatMarketSections, getCurrentLocation, logError, logEvent } from '../global/Functions'
import { useLocationPermission, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'
import { mmkvStorage } from '../redux/store'

const ViewByOptions = { distance: 'View Near Me', region: 'View By Region' }
type ViewByType = (typeof ViewByOptions)[keyof typeof ViewByOptions]

type Props = {
  onClose: () => void
  onSelect?: (arg: { [key: string]: Location }) => void
  selectedLocations: { [key: string]: Location }
  visible: boolean
}

type RenderItemProps = {
  item: Location
  selectedLocations: { [key: string]: Location }
  onSelectLocation: (item: Location) => void
  themeStyle: ThemeStyle
  viewBy: ViewByType
}

function renderItem(props: RenderItemProps) {
  const { item, selectedLocations, onSelectLocation, themeStyle, viewBy } = props
  const { Distance_Km, Distance_Mi, hasAppointments } = item
  const disabled = !hasAppointments
  const distance = Brand.DEFAULT_COUNTRY === 'US' ? Distance_Mi : Distance_Km
  const selected = selectedLocations[`${item.ClientID}-${item.LocationID}`] != null
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onSelectLocation(item)}
      style={[
        themeStyle.appointments.locations.locationItem,
        viewBy === ViewByOptions.distance && { marginLeft: 0 },
      ]}>
      <View
        style={[
          themeStyle.checkbox.empty,
          selected && themeStyle.checkbox.selected,
          disabled && themeStyle.checkbox.disabled,
        ]}>
        {selected && <Icon name="check" style={themeStyle.checkbox.icon} />}
      </View>
      <View style={themeStyle.appointments.locations.locationDetailsView}>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={themeStyle.appointments.locations.locationName}>
          {item.Nickname}
        </Text>
        {item.Address !== '' && item.Address != null && (
          <Text
            allowFontScaling={false}
            ellipsizeMode="tail"
            numberOfLines={1}
            style={themeStyle.appointments.locations.locationDetailsText}>
            {item.Address}
          </Text>
        )}
        <Text
          allowFontScaling={false}
          ellipsizeMode="tail"
          numberOfLines={1}
          style={themeStyle.appointments.locations.locationDetailsText}>
          {`${item.City}, ${item.State}`}
        </Text>
        {!hasAppointments && (
          <View style={themeStyle.appointments.locations.comingSoonView}>
            <Text style={themeStyle.appointments.locations.comingSoonText}>COMING SOON</Text>
          </View>
        )}
      </View>
      {viewBy === ViewByOptions.distance && distance != undefined && (
        <Text style={themeStyle.appointments.locations.locationDetailsText}>
          {`${distance} ${Brand.DEFAULT_COUNTRY === 'US' ? 'mi' : 'km'}`}
        </Text>
      )}
    </Pressable>
  )
}

export default function AppointmentLocations(props: Props): React.ReactElement | null {
  const { onClose, onSelect, selectedLocations, visible } = props
  const selectedKeys = Object.keys(selectedLocations)
  const selectedCount = selectedKeys.length
  const distancesFetched = React.useRef(false)
  const inputRef = React.useRef<InputRef>(undefined)
  const inputDistanceRef = React.useRef<InputRef>(undefined)
  const refreshDistances = React.useRef(false)
  const { onCheckPermission, permission } = useLocationPermission(false)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { clientId, locationId } = useSelector((state: ReduxState) => state.user)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [locations, setLocations] = React.useState<Location[]>([])
  const [searchItems, setSearchItems] = React.useState<MarketSection<Location>[]>([])
  const [searchItemsDistance, setSearchItemsDistance] = React.useState<Location[]>([])
  const [showSearchItems, setShowSearchItems] = React.useState(false)
  const [showSearchItemsDistance, setShowSearchItemsDistance] = React.useState(false)
  const [userLocation, setUserLocation] = React.useState<
    { Latitude: number; Longitude: number } | undefined
  >(undefined)
  const [viewBy, setViewBy] = React.useState<ViewByType>(ViewByOptions.region)
  const { locationMap, locationsWithSearchTerms, marketLocations } = React.useMemo(
    () => formatMarketSections(locations),
    [locations],
  )
  const onChangeText = React.useCallback(
    (text: string) => {
      if (text === '') {
        setSearchItems([])
        setShowSearchItems(false)
      } else {
        const filterArray = marketLocations.filter((item) =>
          item.searchTerms.some((searchTerm) =>
            searchTerm.toLowerCase().includes(text.toLowerCase()),
          ),
        )
        setSearchItems(filterArray)
        setShowSearchItems(true)
      }
    },
    [locations],
  )
  const onClearSearch = React.useCallback(() => {
    inputRef.current?.onResetInput()
    setSearchItems([])
    setShowSearchItems(false)
  }, [])
  const onChangeTextDistance = React.useCallback(
    (text: string) => {
      if (text === '') {
        setSearchItemsDistance([])
        setShowSearchItemsDistance(false)
      } else {
        const filterArray = locationsWithSearchTerms.filter((item) =>
          item.searchTerms.some((searchTerm) =>
            searchTerm.toLowerCase().includes(text.toLowerCase()),
          ),
        )
        setSearchItemsDistance(filterArray)
        setShowSearchItemsDistance(true)
      }
    },
    [locationsWithSearchTerms],
  )
  const onClearSearchDistance = React.useCallback(() => {
    inputDistanceRef.current?.onResetInput()
    setSearchItemsDistance([])
    setShowSearchItemsDistance(false)
  }, [])
  async function onFetchLocations(loc: { Latitude: number; Longitude: number } | undefined) {
    try {
      setLoading(true)
      let response = await API.getStudios(loc)
      if (Array.isArray(response)) {
        const filteredResponse = response.filter(
          (r) => !r.hideIfNoAppointments || r.hasAppointments,
        )
        if (viewBy === ViewByOptions.distance) {
          distancesFetched.current = true
          refreshDistances.current = false
          filteredResponse.sort((a, b) => {
            if (Brand.DEFAULT_COUNTRY === 'US') {
              return Number(a.Distance_Mi) - Number(b.Distance_Mi)
            }
            return Number(a.Distance_Km) - Number(b.Distance_Km)
          })
        }
        setLocations(filteredResponse)
        mmkvStorage.set(STORAGE_KEYS.apptLocationsAll, JSON.stringify(filteredResponse))
        if (selectedCount === 0) {
          const homeStudioKey = `${clientId}-${locationId}`
          const homeStudio = filteredResponse.find(
            (r) => `${r.ClientID}-${r.LocationID}` === homeStudioKey,
          )
          if (homeStudio != null) {
            onSelect
              ? onSelect({ [homeStudioKey]: homeStudio })
              : setAction('appointmentPreferences', { locations: { [homeStudioKey]: homeStudio } })
          }
        } else {
          let updatedLocations: { [key: string]: Location } = {}
          for (const key of selectedKeys) {
            const foundLocation = response.find((l) => `${l.ClientID}-${l.LocationID}` === key)
            if (foundLocation != null) {
              updatedLocations[key] = foundLocation
            }
          }
          onSelect
            ? onSelect(updatedLocations)
            : setAction('appointmentPreferences', { locations: updatedLocations })
        }
      } else if (response.message != null) {
        setError(response.message)
      } else {
        setError('Unable to get locations')
      }
    } catch (e) {
      logError(e)
      setError('Unable to get locations')
    } finally {
      cleanAction('loading')
      setLoading(false)
    }
  }
  function onSelectLocation(item: Location) {
    const { ClientID, LocationID } = item
    const key = `${ClientID}-${LocationID}`
    const { [key]: existing, ...rest } = selectedLocations
    const updatedLocations = existing != null ? rest : { ...selectedLocations, [key]: item }
    onSelect
      ? onSelect(updatedLocations)
      : setAction('appointmentPreferences', { locations: updatedLocations })
  }
  function onSelectSection(section: MarketSection<Location>, selected: boolean) {
    const { id } = section
    const sectionLocations = locations.filter(
      (loc) => loc[Brand.UI_CLASS_FILTERS_MARKET_KEY] === id,
    )
    let updatedLocations = { ...selectedLocations }
    for (const loc of sectionLocations) {
      const key = `${loc.ClientID}-${loc.LocationID}`
      if (selected) {
        delete updatedLocations[key]
      } else {
        updatedLocations[key] = loc
      }
    }
    onSelect
      ? onSelect(updatedLocations)
      : setAction('appointmentPreferences', { locations: updatedLocations })
  }
  async function onViewByChange(tab: string) {
    if (tab === ViewByOptions.distance) {
      if (permission) {
        setViewBy(ViewByOptions.distance)
      } else {
        let allowed = await onCheckPermission()
        if (allowed) {
          setLoading(true)
          getCurrentLocation(setUserLocation, setLoading)
        }
        setViewBy(ViewByOptions.distance)
      }
      await logEvent(`appt_locations_view_by_distance`)
    } else {
      setViewBy(ViewByOptions.region)
      await logEvent(`appt_locations_view_by_region`)
    }
  }
  React.useEffect(() => {
    if (!distancesFetched.current || refreshDistances.current) {
      onFetchLocations(userLocation)
    }
  }, [userLocation])
  React.useEffect(() => {
    if (!visible) {
      distancesFetched.current = false
    }
  }, [visible])
  const maxHeight = themeStyle.window.height * 0.85
  if (!visible) return null
  return (
    <Animated.View
      entering={FadeIn.duration(ANIMATION_DURATIONS.overlayBackdropFade)}
      exiting={FadeOut.duration(ANIMATION_DURATIONS.overlayBackdropFade).delay(
        ANIMATION_DURATIONS.overlayContentTranslation,
      )}
      style={themeStyle.overlayContainerLevel2}>
      <Pressable onPressIn={onClose} style={themeStyle.flexView} />
      <Animated.View
        entering={SlideInDown.duration(ANIMATION_DURATIONS.overlayContentTranslation).delay(
          ANIMATION_DURATIONS.overlayBackdropFade,
        )}
        exiting={SlideOutDown.duration(ANIMATION_DURATIONS.overlayContentTranslation)}
        style={[themeStyle.modalContent, { height: maxHeight, maxHeight }]}>
        <ModalBanner onClose={onClose} title={'Select Location(s)'} />
        <View style={[themeStyle.appointments.content, { paddingHorizontal: 0 }]}>
          <View style={styles.tabRow}>
            <ButtonText
              color={
                viewBy === ViewByOptions.region ? themeStyle.buttonTextOnMain : themeStyle.textGray
              }
              onPress={() => onViewByChange(ViewByOptions.region)}
              style={[
                styles.tabButton,
                viewBy === ViewByOptions.region && styles.tabButtonSelected,
              ]}
              text={ViewByOptions.region}
              textStyle={
                viewBy === ViewByOptions.region
                  ? { fontFamily: themeStyle.fontPrimaryBold }
                  : undefined
              }
            />
            <ButtonText
              color={
                viewBy === ViewByOptions.distance
                  ? themeStyle.buttonTextOnMain
                  : themeStyle.textGray
              }
              onPress={() => onViewByChange(ViewByOptions.distance)}
              style={[
                styles.tabButton,
                viewBy === ViewByOptions.distance && styles.tabButtonSelected,
              ]}
              text={ViewByOptions.distance}
              textStyle={
                viewBy === ViewByOptions.distance
                  ? { fontFamily: themeStyle.fontPrimaryBold }
                  : undefined
              }
            />
          </View>
          <View style={themeStyle.content}>
            {locations.length > 10 && (
              <Input
                containerStyle={[
                  themeStyle.appointments.searchInput,
                  { display: viewBy === ViewByOptions.distance ? 'flex' : 'none' },
                ]}
                getInputRef={(ref) => {
                  inputDistanceRef.current = ref
                }}
                labelColor={themeStyle.buttonTextOnMain}
                leftIcon="search"
                onChangeText={({ text }) => onChangeTextDistance(text)}
                placeholder="Search for a Location"
                placeholderTextColor={themeStyle.textGray}
                rightIcon="clear"
                rightIconPress={onClearSearchDistance}
                rowStyle={themeStyle.appointments.searchInputRow}
                textColor={themeStyle.textBlack}
              />
            )}
            {marketLocations.length > 10 && (
              <Input
                containerStyle={[
                  themeStyle.appointments.searchInput,
                  { display: viewBy === ViewByOptions.region ? 'flex' : 'none' },
                ]}
                getInputRef={(ref) => {
                  inputRef.current = ref
                }}
                labelColor={themeStyle.buttonTextOnMain}
                leftIcon="search"
                onChangeText={({ text }) => onChangeText(text)}
                placeholder="Search for a Location"
                placeholderTextColor={themeStyle.textGray}
                rightIcon="clear"
                rightIconPress={onClearSearch}
                rowStyle={themeStyle.appointments.searchInputRow}
                textColor={themeStyle.textBlack}
              />
            )}
            {viewBy === ViewByOptions.distance ? (
              <FlatList
                data={
                  permission && !loading
                    ? showSearchItemsDistance
                      ? searchItemsDistance
                      : locations
                    : []
                }
                extraData={selectedLocations}
                ItemSeparatorComponent={ItemSeparator}
                keyExtractor={(item) =>
                  `${item[Brand.UI_CLASS_FILTERS_MARKET_KEY]}${item.Nickname}`
                }
                ListEmptyComponent={
                  <ListEmptyComponent
                    containerStyle={{ marginTop: themeStyle.scale(60) }}
                    description={
                      permission
                        ? 'There are no locations to choose from.'
                        : 'Enable location permissions in your phone settings to sort by proximity to you.'
                    }
                    loading={loading}
                    title={permission ? 'No Results Found' : 'Location permissions are disabled.'}
                  />
                }
                refreshControl={
                  <RefreshControl
                    colors={['transparent']}
                    tintColor={'transparent'}
                    onRefresh={async () => {
                      setLoading(true)
                      let allowed = await onCheckPermission()
                      if (allowed) {
                        refreshDistances.current = true
                        getCurrentLocation(setUserLocation, setLoading)
                      } else {
                        setLoading(false)
                      }
                    }}
                    refreshing={false}
                  />
                }
                renderItem={({ item }) =>
                  renderItem({ item, selectedLocations, onSelectLocation, themeStyle, viewBy })
                }
                onScrollToIndexFailed={() => {}}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <SectionList
                extraData={selectedLocations}
                ItemSeparatorComponent={ItemSeparator}
                keyExtractor={(item) =>
                  `${item[Brand.UI_CLASS_FILTERS_MARKET_KEY]}${item.Nickname}`
                }
                ListEmptyComponent={
                  <ListEmptyComponent
                    description={error !== '' ? error : 'There are no locations to choose from.'}
                    loading={loading}
                    title="No Locations"
                  />
                }
                refreshControl={
                  <RefreshControl
                    colors={['transparent']}
                    tintColor={'transparent'}
                    onRefresh={() => onFetchLocations(userLocation)}
                    refreshing={false}
                  />
                }
                renderItem={({ item }) =>
                  renderItem({ item, selectedLocations, onSelectLocation, themeStyle, viewBy })
                }
                renderSectionHeader={({ section }) => {
                  const { title: sectionTitle } = section
                  const selected =
                    locations.filter((loc) => loc[Brand.UI_CLASS_FILTERS_MARKET_KEY] === section.id)
                      .length ===
                    selectedKeys.filter((loc) => locationMap[loc] === section.id).length
                  return (
                    <Checkbox
                      containerStyle={themeStyle.item}
                      onPress={() => onSelectSection(section, selected)}
                      selected={selected}
                      text={sectionTitle}
                      textStyle={themeStyle.appointments.locations.headerText}
                    />
                  )
                }}
                onScrollToIndexFailed={() => {}}
                sections={loading ? [] : showSearchItems ? searchItems : marketLocations}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
              />
            )}
            <Button
              onPress={onClose}
              style={styles.doneButton}
              text={
                selectedCount === 0
                  ? 'No Locations Selected'
                  : selectedCount === 1
                    ? '1 Location Selected'
                    : `${selectedCount} Locations Selected`
              }
            />
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    tabRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: themeStyle.scale(16),
    },
    tabButton: {
      borderBottomWidth: themeStyle.scale(1),
      borderColor: themeStyle.gray,
      flex: 1,
      paddingBottom: themeStyle.scale(8),
    },
    tabButtonSelected: {
      borderBottomWidth: themeStyle.scale(2),
      borderColor: themeStyle.buttonTextOnMain,
    },
    doneButton: { marginTop: themeStyle.scale(16) },
  }
}
