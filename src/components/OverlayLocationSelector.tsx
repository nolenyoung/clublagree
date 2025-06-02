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
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated'
import ButtonText from './ButtonText'
import Icon from './Icon'
import Input from './Input'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ModalBanner from './ModalBanner'
import Brand from '../global/Brand'
import { ANIMATION_DURATIONS } from '../global/Constants'
import {
  formatMarketSections,
  getCurrentLocation,
  logEvent,
  onSearchMarketLocations,
} from '../global/Functions'
import { useLocationPermission, useTheme } from '../global/Hooks'

const ViewByOptions = { distance: 'View Near Me', region: 'View By Region' }
type ViewByType = (typeof ViewByOptions)[keyof typeof ViewByOptions]

type Props<V> = {
  alternateStyling?: boolean
  height?: number // Use for a fixed height
  listBackgroundColor?: string
  listItemTextColor?: string
  listOnly?: boolean
  locationId: unknown
  locations: V[]
  maxHeight?: number // Use for a variable height with a fixed max height
  onClose: () => void
  onFetchLocations?: (
    loc?: { Latitude: number; Longitude: number },
    locationRefresh?: boolean,
  ) => Promise<void>
  onSelect: (arg1: V) => Promise<void> | void
  preventCloseOnSelect?: boolean
  showSortTabs?: boolean
  title?: string
}

type RenderItemProps<V> = {
  item: V
  listItemTextColor?: string
  locationId: unknown
  onSelectNumber: (item: V) => void
  themeStyle: ThemeStyle
  viewBy: ViewByType
}

function renderItem<V extends Partial<Location>>(props: RenderItemProps<V>) {
  const { item, listItemTextColor, locationId, onSelectNumber, themeStyle, viewBy } = props
  const { Distance_Km, Distance_Mi } = item
  const distance = Brand.DEFAULT_COUNTRY === 'US' ? Distance_Mi : Distance_Km
  const selected =
    `${item.ClientID}-${item.LocationID}` === locationId || item.LocationID === locationId
  return (
    <Pressable
      onPress={() => onSelectNumber(item)}
      style={[
        themeStyle.appointments.locations.locationItem,
        viewBy === ViewByOptions.distance && { marginLeft: 0 },
      ]}>
      <View style={[themeStyle.checkbox.empty, selected && themeStyle.checkbox.selected]}>
        {selected && <Icon name="check" style={themeStyle.checkbox.icon} />}
      </View>
      <View style={themeStyle.appointments.locations.locationDetailsView}>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={[
            themeStyle.appointments.locations.locationName,
            ...(listItemTextColor != null ? [{ color: listItemTextColor }] : []),
          ]}>
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
        {item.City !== '' && item.State !== '' && (
          <Text
            allowFontScaling={false}
            ellipsizeMode="tail"
            numberOfLines={1}
            style={themeStyle.appointments.locations.locationDetailsText}>
            {`${item.City}, ${item.State}`}
          </Text>
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

export default function OverlayLocationSelector<V extends Partial<Location>>(
  props: Props<V>,
): React.ReactElement | null {
  const {
    alternateStyling,
    height,
    listBackgroundColor,
    listItemTextColor,
    listOnly = false,
    locationId,
    locations,
    maxHeight,
    onClose,
    preventCloseOnSelect = false,
    onFetchLocations,
    onSelect,
    showSortTabs = false,
    title = 'Select Location',
  } = props
  const { height: keyboardHeight } = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true })
  const distancesFetched = React.useRef(false)
  const inputRef = React.useRef<InputRef>(undefined)
  const inputDistanceRef = React.useRef<InputRef>(undefined)
  const listRef = React.useRef<SectionList<V, MarketSection<V>> | null>(null)
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
        const filterArray = onSearchMarketLocations(text, marketLocations)
        setSearchItems(filterArray)
        setShowSearchItems(true)
      }
    },
    [marketLocations],
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
  const onSelectNumber = React.useCallback(
    (location: V) => {
      onSelect(location)
      if (!preventCloseOnSelect) {
        onClose()
      }
    },
    [onClose, onSelect, preventCloseOnSelect],
  )
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
    let timeoutId: NodeJS.Timeout | undefined
    Keyboard.dismiss()
    timeoutId = setTimeout(() => {
      if (typeof locationId === 'string') {
        const sectionIndex = marketLocations.findIndex((s) => s.id === locationMap[locationId])
        if (sectionIndex !== -1) {
          const itemIndex = marketLocations[sectionIndex].data.findIndex(
            (loc) => `${loc.ClientID}-${loc.LocationID}` === locationId,
          )
          if (itemIndex !== -1 && marketLocations[sectionIndex]?.data?.[itemIndex] != null) {
            listRef.current?.scrollToLocation({ itemIndex, sectionIndex })
          }
        }
      }
    }, 500)
    return () => {
      timeoutId != null && clearTimeout(timeoutId)
    }
  }, [locationId, locationMap, locations])
  React.useEffect(() => {
    if (!distancesFetched.current || refreshDistances.current) {
      onFetchLocations?.(userLocation, true)?.then(() => setLoading(false))
    }
  }, [onFetchLocations, userLocation])
  const animatedStyle = useAnimatedStyle(() => {
    return { paddingBottom: keyboardHeight.value }
  })
  if (locations == null || locations.length === 0) {
    return null
  }
  const list = (
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
      {locations.length > 10 && (
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
          textColor={themeStyle.textBlack}
        />
      )}
      {locations.length > 10 && (
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
          textColor={themeStyle.textBlack}
        />
      )}
      {viewBy === ViewByOptions.distance ? (
        <FlatList
          contentContainerStyle={[
            themeStyle.listContent,
            listBackgroundColor != null && { backgroundColor: listBackgroundColor },
          ]}
          data={
            permission && !loading
              ? showSearchItemsDistance
                ? searchItemsDistance
                : locations
              : []
          }
          extraData={locationId}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) => `${item.LocationID}${item.Nickname}`}
          ListEmptyComponent={
            <ListEmptyComponent
              containerStyle={{
                marginBottom: themeStyle.scale(100),
                marginTop: themeStyle.scale(60),
              }}
              description={
                permission
                  ? 'There are no locations to choose from.'
                  : 'Enable location permissions in your phone settings to sort by proximity to you.'
              }
              loading={loading}
              title={permission ? 'No Results Found' : 'Location permissions are disabled.'}
            />
          }
          onScrollToIndexFailed={() => {}}
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
            renderItem({ item, listItemTextColor, locationId, onSelectNumber, themeStyle, viewBy })
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <SectionList
          contentContainerStyle={[
            themeStyle.listContent,
            listBackgroundColor != null && { backgroundColor: listBackgroundColor },
          ]}
          extraData={locationId}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) => `${item.LocationID}${item.Nickname}`}
          ListEmptyComponent={
            <ListEmptyComponent
              description="Tweak your search criteria."
              loading={loading}
              title="No results found."
            />
          }
          onScrollToIndexFailed={() => {}}
          ref={(ref) => {
            listRef.current = ref
          }}
          refreshControl={
            <RefreshControl
              colors={['transparent']}
              tintColor={'transparent'}
              onRefresh={() => onFetchLocations?.(userLocation, true)}
              refreshing={false}
            />
          }
          renderItem={({ item }) =>
            renderItem({ item, listItemTextColor, locationId, onSelectNumber, themeStyle, viewBy })
          }
          renderSectionHeader={({ section }) => {
            const { title: sectionTitle } = section
            return (
              <View style={themeStyle.item}>
                <View style={styles.headerRow}>
                  <Text style={themeStyle.sectionTitleText}>{sectionTitle}</Text>
                </View>
              </View>
            )
          }}
          sections={showSearchItems ? searchItems : marketLocations}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </>
  )
  if (listOnly) {
    return list
  }
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
        style={[
          themeStyle.modalContent,
          height != null && { height },
          maxHeight != null && { maxHeight },
          animatedStyle,
        ]}>
        <ModalBanner alternateStyling={alternateStyling} onClose={onClose} title={title} />
        {list}
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
    searchInput: { margin: themeStyle.scale(20) },
    searchInputRow: {
      ...themeStyle.rowAligned,
      backgroundColor: themeStyle.fadedGray,
      height: themeStyle.scale(51),
      paddingHorizontal: themeStyle.scale(16),
    },
    headerRow: { flexDirection: 'row' as const },
    locationItem: { ...themeStyle.item, marginLeft: themeStyle.scale(36) },
  }
}
