import * as React from 'react'
import { Pressable, ScrollView, SectionList, Text, View } from 'react-native'
import { useMMKVListener } from 'react-native-mmkv'
import { useSelector } from 'react-redux'
import {
  AppointmentLocations,
  Button,
  ButtonText,
  Checkbox,
  Header,
  Icon,
  OverlayAppointmentProviders,
  SliderTimeRange,
} from '../components'
import Brand from '../global/Brand'
import { PROVIDER_TYPES, STORAGE_KEYS } from '../global/Constants'
import { formatCoachName, formatMarketSections, logEvent, sortProviders } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'
import { initialAppointmentPreferences } from '../redux/reducers'
import { mmkvStorage } from '../redux/store'

export default function AppointmentFilters(
  props: AppointmentStackScreenProps<'AppointmentFilters'>,
) {
  const { goBack } = props.navigation
  const { customWorkflow } = props.route.params ?? {}
  const allProviders = React.useRef(
    JSON.parse(mmkvStorage.getString(STORAGE_KEYS.apptProvidersAll) ?? '[]'),
  )
  const showGenderFilter = React.useRef(
    mmkvStorage.getBoolean(STORAGE_KEYS.apptShowGenderFilter) ?? false,
  )
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const appointmentPreferences = useSelector((state: ReduxState) => state.appointmentPreferences)
  const [filters, setFilters] = React.useState(appointmentPreferences)
  const [modalLocations, setModalLocations] = React.useState(false)
  const [modalProviders, setModalProviders] = React.useState(false)
  const { endTime, gender, locations, providers, startTime } = filters
  const locationKeys = Object.keys(locations)
  const providerKeys = Object.keys(providers).sort((a, b) =>
    sortProviders(providers[a], providers[b]),
  )
  const [allLocations, setAllLocations] = React.useState<Location[]>(
    JSON.parse(mmkvStorage.getString(STORAGE_KEYS.apptLocationsAll) ?? '[]'),
  )
  useMMKVListener((key) => {
    if (key === STORAGE_KEYS.apptLocationsAll) {
      setAllLocations(JSON.parse(mmkvStorage.getString(STORAGE_KEYS.apptLocationsAll) ?? '[]'))
    }
  }, mmkvStorage)
  const { marketLocations } = React.useMemo(
    () => formatMarketSections(Object.keys(locations).map((key) => locations[key])),
    [locations],
  )
  const { locationMap: allLocationsMap } = React.useMemo(
    () => formatMarketSections(allLocations),
    [allLocations],
  )
  return (
    <View style={themeStyle.screen}>
      <Header
        leftComponent={
          <ButtonText
            onPress={() =>
              setFilters((prev) => ({
                ...prev,
                endTime: initialAppointmentPreferences.endTime,
                gender: initialAppointmentPreferences.gender,
                providers: initialAppointmentPreferences.providers,
                startTime: initialAppointmentPreferences.startTime,
              }))
            }
            style={styles.clearButton}
            text="clear filters"
          />
        }
        rightIcon="clear"
        rightIconPress={async () => {
          await logEvent('appt_filters_go_back')
          goBack()
        }}
      />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <View style={[styles.sectionView, { paddingBottom: themeStyle.scale(8) }]}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={themeStyle.rowAlignedBetween}>
            <Text style={themeStyle.textPrimaryRegular14}>{`Filter by available locations.`}</Text>
            <ButtonText
              color={themeStyle.buttonTextOnMain}
              onPress={async () => {
                setModalLocations(true)
                await logEvent('appt_filters_locations_view_all')
              }}
              text="view all"
            />
          </View>
          <SectionList
            bounces={false}
            extraData={[allLocations, locations]}
            getItemLayout={themeStyle.getItemLayout}
            keyExtractor={(item) => `${item[Brand.UI_CLASS_FILTERS_MARKET_KEY]}${item.Nickname}`}
            renderItem={({ item }) => {
              const { hasAppointments } = item
              const key = `${item.ClientID}-${item.LocationID}`
              const { [key]: existing, ...rest } = locations
              return (
                <Pressable
                  onPress={() => setFilters((prev) => ({ ...prev, locations: rest }))}
                  style={themeStyle.appointments.locations.locationItem}>
                  <View style={[themeStyle.checkbox.empty, themeStyle.checkbox.selected]}>
                    <Icon name="check" style={themeStyle.checkbox.icon} />
                  </View>

                  <View style={themeStyle.appointments.locations.locationDetailsView}>
                    {!hasAppointments && (
                      <Text style={themeStyle.appointments.locations.comingSoonText}>
                        COMING SOON
                      </Text>
                    )}
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
                      {item.City}
                    </Text>
                  </View>
                </Pressable>
              )
            }}
            renderSectionHeader={({ section }) => {
              const { title: sectionTitle } = section
              const selected =
                allLocations.filter((loc) => loc[Brand.UI_CLASS_FILTERS_MARKET_KEY] === section.id)
                  .length ===
                locationKeys.filter((loc) => allLocationsMap[loc] === section.id).length
              return (
                <Checkbox
                  containerStyle={themeStyle.item}
                  onPress={() => {
                    const sectionLocations = allLocations.filter(
                      (loc) => loc[Brand.UI_CLASS_FILTERS_MARKET_KEY] === section.id,
                    )
                    let updatedLocations = { ...locations }
                    for (const loc of sectionLocations) {
                      const key = `${loc.ClientID}-${loc.LocationID}`
                      delete updatedLocations[key]
                    }
                    setFilters((prev) => ({ ...prev, locations: updatedLocations }))
                  }}
                  selected={selected}
                  text={sectionTitle}
                  textStyle={themeStyle.appointments.locations.headerText}
                />
              )
            }}
            scrollEnabled={false}
            sections={marketLocations}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        </View>
        <View style={styles.sectionView}>
          <Text style={styles.sectionTitle}>{Brand.STRING_APPT_PROVIDER_TITLE}</Text>
          {showGenderFilter.current && (
            <>
              <Text style={themeStyle.textPrimaryRegular14}>{`Filter by gender.`}</Text>
              <View style={styles.genderRow}>
                <Pressable
                  onPress={() => setFilters((prev) => ({ ...prev, gender: PROVIDER_TYPES.all }))}
                  style={[
                    styles.genderOption,
                    gender === PROVIDER_TYPES.all && styles.genderOptionSelected,
                  ]}>
                  <Text
                    style={[
                      themeStyle.textPrimaryMedium14,
                      gender === PROVIDER_TYPES.all && {
                        color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys],
                      },
                    ]}>
                    All
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilters((prev) => ({ ...prev, gender: PROVIDER_TYPES.female }))}
                  style={[
                    styles.genderOption,
                    gender === PROVIDER_TYPES.female && styles.genderOptionSelected,
                  ]}>
                  <Text
                    style={[
                      themeStyle.textPrimaryMedium14,
                      gender === PROVIDER_TYPES.female && {
                        color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys],
                      },
                    ]}>
                    Female
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFilters((prev) => ({ ...prev, gender: PROVIDER_TYPES.male }))}
                  style={[
                    styles.genderOption,
                    gender === PROVIDER_TYPES.male && styles.genderOptionSelected,
                  ]}>
                  <Text
                    style={[
                      themeStyle.textPrimaryMedium14,
                      gender === PROVIDER_TYPES.male && {
                        color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys],
                      },
                    ]}>
                    Male
                  </Text>
                </Pressable>
              </View>
            </>
          )}
          <View style={themeStyle.rowAlignedBetween}>
            <Text style={themeStyle.textPrimaryRegular14}>
              {`Filter by available ${Brand.STRING_APPT_PROVIDER_TITLE_PLURAL.toLowerCase()}.`}
            </Text>
            <ButtonText
              color={themeStyle.buttonTextOnMain}
              onPress={async () => {
                setModalProviders(true)
                await logEvent('appt_filters_providers_view_all')
              }}
              text="view all"
            />
          </View>
          {providerKeys.map((key) => {
            const { [key]: provider, ...rest } = providers
            return (
              <Checkbox
                containerStyle={styles.checkbox}
                key={key}
                onPress={() => setFilters((prev) => ({ ...prev, providers: rest }))}
                selected={true}
                text={formatCoachName({
                  coach: provider,
                  lastInitialOnly: Brand.UI_COACH_LAST_INITIAL_ONLY,
                })}
              />
            )
          })}
        </View>
        <View style={[styles.sectionView, { borderBottomWidth: 0 }]}>
          <Text style={styles.sectionTitle}>Time</Text>
          <Text style={themeStyle.textPrimaryRegular14}>{`See options between...`}</Text>
          <SliderTimeRange
            containerStyle={styles.timeSlider}
            endValue={endTime}
            onSetEnd={(t) => setFilters((prev) => ({ ...prev, endTime: t }))}
            onSetStart={(t) => setFilters((prev) => ({ ...prev, startTime: t }))}
            startValue={startTime}
          />
        </View>
      </ScrollView>
      <View style={themeStyle.fixedBottomButtonView}>
        <Button
          gradient={Brand.BUTTON_GRADIENT}
          onPress={async () => {
            setAction('appointmentPreferences', filters)
            await logEvent('appt_filters_see_results')
            goBack()
          }}
          style={themeStyle.fixedBottomButton}
          text="Apply Changes"
        />
      </View>
      {modalProviders && (
        <OverlayAppointmentProviders
          onClose={() => setModalProviders(false)}
          onSelect={(key, value) => {
            if (providers[key] != null) {
              let newProviders = { ...providers }
              delete newProviders[key]
              setFilters((prev) => ({ ...prev, providers: newProviders }))
            } else {
              setFilters((prev) => ({ ...prev, providers: { ...providers, [key]: value } }))
            }
          }}
          providers={allProviders.current}
          selectedProviders={providerKeys}
        />
      )}
      {modalLocations && (
        <AppointmentLocations
          onClose={() => setModalLocations(false)}
          onSelect={(locs) => setFilters((prev) => ({ ...prev, locations: locs }))}
          selectedLocations={locations}
          visible={true}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    clearButton: { alignSelf: 'flex-start' as const },
    sectionView: {
      borderBottomWidth: themeStyle.scale(1),
      borderColor: themeStyle.separator.backgroundColor,
      padding: themeStyle.scale(20),
      paddingBottom: themeStyle.scale(24),
    },
    sectionTitle: { ...themeStyle.sectionTitleText, marginBottom: themeStyle.scale(4) },
    checkbox: { marginLeft: themeStyle.scale(20), marginTop: themeStyle.scale(20) },
    genderRow: { ...themeStyle.rowAlignedEvenly, marginVertical: themeStyle.scale(20) },
    genderOption: {
      ...themeStyle.viewCentered,
      borderColor: themeStyle.brandPrimary,
      borderRadius: themeStyle.scale(20),
      borderWidth: themeStyle.scale(2),
      height: themeStyle.scale(40),
      width: (themeStyle.window.width - themeStyle.scale(40)) / 3.5,
    },
    genderOptionSelected: { backgroundColor: themeStyle.brandPrimary, borderWidth: 0 },
    timeSlider: { marginBottom: themeStyle.scale(12), marginTop: themeStyle.scale(8) },
  }
}
