import * as React from 'react'
import { RefreshControl, SectionList, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import {
  Button,
  Header,
  ItemSeparator,
  ListEmptyComponent,
  ListHeader,
  ModalConfirmPurchase,
  ModalFamilySelector,
  OverlayLocationSelector,
  ModalPurchaseConfirmation,
  TabBar,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

const renderSectionHeader = ({ section }: { section: { Description: string; Title: string } }) => {
  const { Description, Title } = section
  return <ListHeader description={Description} title={Title} />
}

export default function StudioPricing(props: RootNavigatorScreenProps<'StudioPricing'>) {
  const { navigate } = props.navigation
  const { clientId, locationId, personId } = useSelector((state: ReduxState) => state.user)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [location, setLocation] = React.useState<
    Partial<Location> | { ClientID: null; LocationID: null }
  >({ ClientID: null, LocationID: null })
  const [locations, setLocations] = React.useState<Partial<Location>[]>([])
  const [modalConfirmPurchase, setModalConfirmPurchase] = React.useState(false)
  const [modalFamilySelector, setModalFamilySelector] = React.useState(false)
  const [modalLocation, setModalLocation] = React.useState(false)
  const [modalPurchaseConfirmation, setModalPurchaseConfirmation] = React.useState(false)
  const [pricing, setPricing] = React.useState<
    {
      data: Pricing[]
      Description: string
      SortOrder: number | null
      Title: string
      Type: string
      TypeID: string
    }[]
  >([])
  const [selectedFamilyMember, setSelectedFamilyMember] = React.useState<
    FamilyMember | null | undefined
  >(null)
  const [selectedPackage, setSelectedPackage] = React.useState<any>(null)
  const signedIn = clientId != null && personId != null
  const onSelectItem = React.useCallback((item: Pricing) => {
    setSelectedPackage(item)
    if (Brand.UI_FAMILY_BOOKING) {
      setModalFamilySelector(true)
    } else {
      setModalConfirmPurchase(true)
    }
  }, [])
  const onFetchPricing = React.useCallback(
    async (loc: Partial<Location> | { ClientID: number | null; LocationID: number | null }) => {
      try {
        setAction('loading', { loading: true })
        let data = {
          ClientID: loc.ClientID ?? clientId ?? 0,
          LocationID: loc.LocationID ?? locationId ?? 0,
        }
        let response = await API.getStudioPricing(data)
        const { Pricing, PricingGroups = [] } = response
        if (Array.isArray(Pricing) && PricingGroups.length > 0) {
          let sections = []
          for (let group of PricingGroups) {
            const { TypeID } = group
            const pricingData = Pricing.filter((p) => Number(p.PackageType) === Number(TypeID))
            if (pricingData.length > 0) {
              sections.push({ ...group, data: pricingData })
            }
          }
          setPricing(sections)
        }
        cleanAction('loading')
      } catch (e: any) {
        logError(e)
        cleanAction('loading')
      }
    },
    [clientId, locationId],
  )
  const onPurchase = React.useCallback(() => {
    setModalConfirmPurchase(false)
    setTimeout(() => setModalPurchaseConfirmation(true), 250)
  }, [])
  const onSelectLocation = React.useCallback((loc: Partial<Location>) => {
    setLocation(loc)
    onFetchPricing(loc)
  }, [])
  const onSignIn = React.useCallback(() => {
    setAction('toast', { text: 'Please sign in.' })
  }, [])
  const onToggleModalLocation = React.useCallback(() => {
    setModalLocation((prev) => !prev)
  }, [])
  const onFetchData = React.useCallback(
    async (loc?: { Latitude: number; Longitude: number }, locationRefresh?: boolean) => {
      try {
        !locationRefresh && setAction('loading', { loading: true })
        let response = await API.getStudios(loc)
        let ClientID = clientId
        let LocationID = locationId
        if (Array.isArray(response)) {
          if (response.length > 0 && 'Distance_Mi' in response[0]) {
            response.sort((a, b) => {
              if (Brand.DEFAULT_COUNTRY === 'US') {
                return Number(a.Distance_Mi) - Number(b.Distance_Mi)
              }
              return Number(a.Distance_Km) - Number(b.Distance_Km)
            })
          }
          setLocations(response)
          const locationMatch = response.find(
            (res) => res.ClientID === clientId && res.LocationID === locationId,
          )
          if (locationMatch == null) {
            const loc = response.find((res) => res.ClientID === clientId)
            if (loc) {
              ClientID = loc.ClientID
              LocationID = loc.LocationID
            } else {
              ClientID = response[0].ClientID
              LocationID = response[0].LocationID
            }
            setLocation({ ClientID, LocationID })
          }
        }
        !locationRefresh && onFetchPricing({ ClientID, LocationID })
      } catch (e: any) {
        logError(e)
        cleanAction('loading')
      }
    },
    [clientId, locationId, onFetchPricing],
  )
  const onSelectFamilyMember = React.useCallback((item: FamilyMember) => {
    setSelectedFamilyMember(item)
    setModalFamilySelector(false)
    setTimeout(() => setModalConfirmPurchase(true), 300)
  }, [])
  React.useEffect(() => {
    onFetchData()
  }, [])
  const selectedLocation = `${location.ClientID ?? clientId ?? locations[0]?.ClientID}-${
    location.LocationID ?? locationId ?? locations[0]?.LocationID
  }`
  const locationName = React.useMemo(() => {
    return (
      locations?.find(
        (loc: Partial<Location>) => `${loc.ClientID}-${loc.LocationID}` === selectedLocation,
      )?.Nickname ?? ''
    )
  }, [locations, selectedLocation])
  const locationsDisabled =
    Brand.UI_HIDE_PRICING_LOCATIONS || (Brand.UI_PRICING_DISABLE_LOCATIONS_LOGGED_IN && signedIn)
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} title={Brand.STRING_SCREEN_TITLE_PRICING} />
      <View style={styles.content}>
        <Button
          disabled={locationsDisabled}
          disabledStyling={false}
          onPress={onToggleModalLocation}
          rightIcon={locationsDisabled ? undefined : 'chevron-down'}
          small={true}
          style={styles.locationButton}
          text={locationName}
          textColor="textDarkGray"
        />
        <SectionList
          contentContainerStyle={themeStyle.scrollViewContent}
          extraData={location}
          keyExtractor={(item) => `${item.PackageType}${item.ProductID}`}
          ListEmptyComponent={
            <ListEmptyComponent
              description={`There are no pricing options\navailable for this location.`}
              title="No pricing options available."
            />
          }
          refreshControl={
            <RefreshControl onRefresh={() => onFetchPricing(location)} refreshing={false} />
          }
          renderItem={({ item }) => {
            const { Description = '', EyebrowText = '', Heading, Price } = item
            return (
              <View style={styles.item}>
                <View style={styles.itemDetailView}>
                  {EyebrowText !== '' && <Text style={themeStyle.eyebrowText}>{EyebrowText}</Text>}
                  <Text style={themeStyle.textPrimaryBold16}>{Heading}</Text>
                  {Description !== '' && Description != null && (
                    <Text style={styles.itemDescriptionText}>{Description}</Text>
                  )}
                </View>
                <View style={themeStyle.rowAligned}>
                  <Text style={themeStyle.textPrimaryBold16}>
                    {`${Brand.DEFAULT_CURRENCY}${Price}`}
                  </Text>
                  <Button
                    gradient={Brand.BUTTON_GRADIENT}
                    onPress={!signedIn ? onSignIn : () => onSelectItem(item)}
                    small={true}
                    style={styles.buyButton}
                    text="Buy"
                  />
                </View>
              </View>
            )
          }}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={ItemSeparator}
          sections={pricing}
          SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      </View>
      {Brand.UI_FAMILY_BOOKING && modalFamilySelector && (
        <ModalFamilySelector
          ClientID={location?.ClientID ?? clientId ?? 0}
          navigate={navigate}
          onClose={() => setModalFamilySelector(false)}
          onContinueMyself={() => {
            setModalFamilySelector(false)
            setTimeout(() => setModalConfirmPurchase(true), 300)
          }}
          onSelect={onSelectFamilyMember}
          PersonID={personId}
          selectedMember={selectedFamilyMember}
        />
      )}
      {locations.length !== 0 && modalLocation && (
        <OverlayLocationSelector
          height={themeStyle.window.height * 0.85}
          locationId={selectedLocation}
          locations={locations}
          onClose={onToggleModalLocation}
          onFetchLocations={onFetchData}
          onSelect={onSelectLocation}
          showSortTabs={true}
        />
      )}
      <ModalPurchaseConfirmation
        onClose={() => setModalPurchaseConfirmation(false)}
        showBanner={true}
        visible={modalPurchaseConfirmation}
      />
      <TabBar />
      {modalConfirmPurchase && selectedPackage != null && (
        <ModalConfirmPurchase
          ClientID={location?.ClientID ?? clientId ?? 0}
          LocationID={location?.LocationID ?? locationId ?? 0}
          onClose={() => {
            setSelectedFamilyMember(null)
            setModalConfirmPurchase(false)
          }}
          onPurchaseSuccess={onPurchase}
          PersonClientID={selectedFamilyMember?.ClientID ?? undefined}
          PersonID={selectedFamilyMember?.PersonID ?? undefined}
          selectedPackage={selectedPackage}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { ...themeStyle.contentWhite, paddingTop: themeStyle.scale(20) },
    locationButton: {
      alignSelf: 'flex-end' as 'flex-end',
      backgroundColor: themeStyle.fadedGray,
      marginBottom: themeStyle.scale(8),
      marginRight: themeStyle.scale(20),
    },
    item: {
      ...themeStyle.rowAlignedBetween,
      paddingHorizontal: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(16),
    },
    itemDetailView: { flex: 1, marginRight: themeStyle.scale(12) },
    itemDescriptionText: {
      ...themeStyle.textPrimaryRegular14,
      color: themeStyle.textGray,
      marginTop: themeStyle.scale(4),
    },
    buyButton: { marginLeft: themeStyle.scale(12) },
    sectionSeparator: { height: themeStyle.scale(8) },
  }
}
