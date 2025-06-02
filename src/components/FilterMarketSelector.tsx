import * as React from 'react'
import {
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native'
import ButtonText from './ButtonText'
import Checkbox from './Checkbox'
import Icon from './Icon'
import Input from './Input'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import Brand from '../global/Brand'
import { getCurrentLocation, logEvent } from '../global/Functions'
import { useLocationPermission, useTheme } from '../global/Hooks'

const ViewByOptions = { distance: 'View Near Me', region: 'View By Region' }
type ViewByType = (typeof ViewByOptions)[keyof typeof ViewByOptions]

type Props<V> = {
  getItem: (arg1: V) => { selected: boolean; text: string }
  getSectionSelected: (arg1: MarketSection<V>) => boolean
  items: MarketSection<V>[]
  keyExtractor: (arg1: V) => string
  locationsWithSearchTerms: (V & { searchTerms: string[] })[]
  onFetchLocations?: (
    loc?: { Latitude: number; Longitude: number },
    setLoading?: (loading: boolean) => void,
  ) => void
  onSearch: (arg1: string) => MarketSection<V>[]
  onSelect: (arg1: V) => void
  onSelectSection: (arg1: MarketSection<V>, arg2: boolean) => void
  selectedItems: Array<number> | Array<string>
  showSortTabs?: boolean
}

type RenderItemProps<V> = {
  item: V
  selected: boolean
  onSelectLocation: (item: V) => void
  themeStyle: ThemeStyle
  viewBy: ViewByType
}

function renderItem<V extends Partial<Location>>(props: RenderItemProps<V>) {
  const { item, selected, onSelectLocation, themeStyle, viewBy } = props
  const { Distance_Km, Distance_Mi, hasFutureClasses } = item
  const disabled = !hasFutureClasses
  const distance = Brand.DEFAULT_COUNTRY === 'US' ? Distance_Mi : Distance_Km
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
        {!hasFutureClasses && (
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

export default function FilterMarketSelector<V extends Partial<Location>>(
  props: Props<V>,
): React.ReactElement {
  const {
    getItem,
    getSectionSelected,
    items,
    keyExtractor,
    locationsWithSearchTerms,
    onFetchLocations,
    onSearch,
    onSelect,
    onSelectSection,
    selectedItems,
    showSortTabs = false,
  } = props
  const distancesFetched = React.useRef(false)
  const inputRef = React.useRef<InputRef>(undefined)
  const inputDistanceRef = React.useRef<InputRef>(undefined)
  const refreshDistances = React.useRef(false)
  const { onCheckPermission, permission } = useLocationPermission(false)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [loading, setLoading] = React.useState(true)
  const [searchItems, setSearchItems] = React.useState<MarketSection<V>[]>([])
  const [searchItemsDistance, setSearchItemsDistance] = React.useState<V[]>([])
  const [showSearchItems, setShowSearchItems] = React.useState(false)
  const [showSearchItemsDistance, setShowSearchItemsDistance] = React.useState(false)
  const [userLocation, setUserLocation] = React.useState<
    { Latitude: number; Longitude: number } | undefined
  >(undefined)
  const [viewBy, setViewBy] = React.useState<ViewByType>(ViewByOptions.region)
  const onChangeText = React.useCallback(
    (text: string) => {
      if (text === '') {
        setSearchItems([])
        setShowSearchItems(false)
      } else {
        const filterArray = onSearch(text)
        setSearchItems(filterArray)
        setShowSearchItems(true)
      }
    },
    [onSearch],
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
    Keyboard.dismiss()
    return () => {
      inputRef.current?.onResetInput()
      setSearchItems([])
      setShowSearchItems(false)
    }
  }, [])
  React.useEffect(() => {
    if (!distancesFetched.current || refreshDistances.current) {
      onFetchLocations && onFetchLocations(userLocation, setLoading)
    }
  }, [userLocation])
  return (
    <>
      {showSortTabs && (
        <View style={styles.tabRow}>
          <ButtonText
            color={
              viewBy === ViewByOptions.region ? themeStyle.buttonTextOnMain : themeStyle.textGray
            }
            onPress={() => onViewByChange(ViewByOptions.region)}
            style={[styles.tabButton, viewBy === ViewByOptions.region && styles.tabButtonSelected]}
            text={ViewByOptions.region}
            textStyle={
              viewBy === ViewByOptions.region
                ? { fontFamily: themeStyle.fontPrimaryBold }
                : undefined
            }
          />
          <ButtonText
            color={
              viewBy === ViewByOptions.distance ? themeStyle.buttonTextOnMain : themeStyle.textGray
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
      )}
      <Input
        containerStyle={[
          styles.searchInput,
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
        rowStyle={styles.searchInputRow}
        textColor={themeStyle.textGray}
      />
      <Input
        containerStyle={[
          styles.searchInput,
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
        rowStyle={styles.searchInputRow}
        textColor={themeStyle.textGray}
      />
      {viewBy === ViewByOptions.distance ? (
        <FlatList
          data={
            permission && !loading
              ? showSearchItemsDistance
                ? searchItemsDistance
                : locationsWithSearchTerms
              : []
          }
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) => `${item[Brand.UI_CLASS_FILTERS_MARKET_KEY]}${item.Nickname}`}
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
          renderItem={({ item }) => {
            const { selected } = getItem(item)
            return renderItem({ item, selected, onSelectLocation: onSelect, themeStyle, viewBy })
          }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <SectionList
          contentContainerStyle={themeStyle.listContent}
          extraData={selectedItems}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={keyExtractor}
          ListEmptyComponent={
            <ListEmptyComponent
              description="Tweak your search criteria."
              title="No results found."
            />
          }
          refreshControl={
            <RefreshControl
              colors={['transparent']}
              tintColor={'transparent'}
              onRefresh={() => onFetchLocations && onFetchLocations(userLocation, setLoading)}
              refreshing={false}
            />
          }
          renderItem={({ item }) => {
            const { selected } = getItem(item)
            return renderItem({ item, selected, onSelectLocation: onSelect, themeStyle, viewBy })
          }}
          renderSectionHeader={({ section }) => {
            const { title: sectionTitle } = section
            const selected = getSectionSelected(section)
            return (
              <Checkbox
                containerStyle={themeStyle.item}
                onPress={() => onSelectSection(section, selected)}
                selected={selected}
                text={sectionTitle}
                textStyle={styles.headerText}
              />
            )
          }}
          onScrollToIndexFailed={() => {}}
          sections={showSearchItems ? searchItems : items}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </>
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
    searchInput: { margin: themeStyle.scale(20) },
    searchInputRow: {
      ...themeStyle.rowAligned,
      backgroundColor: themeStyle.fadedGray,
      height: themeStyle.scale(51),
      paddingHorizontal: themeStyle.scale(16),
    },
    headerText: { fontFamily: themeStyle.fontPrimaryBold },
    locationItem: { ...themeStyle.item, marginLeft: themeStyle.scale(36) },
  }
}
