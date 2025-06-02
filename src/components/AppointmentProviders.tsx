import * as React from 'react'
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import Button from './Button'
import Input from './Input'
import ListEmptyComponent from './ListEmptyComponent'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { formatCoachName, logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = {
  onClose: () => void
  onSelect: (arg: Coach[]) => void
  selectedLocations: Location[]
  selectedProviders: Coach[]
}

function findUniqueProvider(p: Coach, item: Coach) {
  return p.ClientID === item.ClientID && p.CoachID === item.CoachID
}

export default function AppointmentProviders(props: Props): React.ReactElement {
  const { onClose, onSelect, selectedLocations, selectedProviders } = props
  const { themeStyle } = useTheme()
  const [coaches, setCoaches] = React.useState<Coach[]>([])
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [searchItems, setSearchItems] = React.useState<Coach[]>([])
  const [showSearchItems, setShowSearchItems] = React.useState(false)
  const onChangeText = React.useCallback(
    (text: string) => {
      if (text === '') {
        setSearchItems([])
        setShowSearchItems(false)
      } else {
        const filterArray = coaches.filter((coach) =>
          formatCoachName({ coach, lastInitialOnly: false })
            .toLowerCase()
            .includes(text.toLowerCase()),
        )
        setSearchItems(filterArray)
        setShowSearchItems(true)
      }
    },
    [coaches],
  )
  async function onFetchCoaches() {
    try {
      setLoading(true)
      let response = await API.getCoaches({
        //TODO update when API supports multiple ClientIDs
        ClientID: selectedLocations.map((loc) => loc.ClientID)[0],
      })
      if (Array.isArray(response)) {
        setCoaches(response)
      } else if ('message' in response) {
        setError(response.message)
      } else {
        setError(`Unable to get ${Brand.STRING_APPT_PROVIDER_TITLE_PLURAL.toLowerCase()}`)
      }
      setLoading(false)
    } catch (e) {
      logError(e)
      setError(`Unable to get ${Brand.STRING_APPT_PROVIDER_TITLE_PLURAL.toLowerCase()}`)
      setLoading(false)
    }
  }
  React.useEffect(() => {
    onFetchCoaches()
  }, [selectedLocations])
  return (
    <View style={themeStyle.flexView}>
      <View style={themeStyle.appointments.bannerView}>
        <TouchableOpacity onPress={() => onSelect([])} style={themeStyle.appointments.clearButton}>
          <Text style={themeStyle.appointments.clearButtonText}>Clear Filter</Text>
        </TouchableOpacity>
        <Text style={themeStyle.appointments.bannerTitle}>
          {Brand.STRING_APPT_PROVIDER_TITLE_PLURAL}
        </Text>
      </View>
      <View style={themeStyle.appointments.content}>
        <Input
          containerStyle={themeStyle.appointments.searchInput}
          labelColor={themeStyle.buttonTextOnMain}
          leftIcon="search"
          onChangeText={({ text }) => onChangeText(text)}
          placeholder={`Search for a ${Brand.STRING_APPT_PROVIDER_TITLE}`}
          placeholderTextColor={themeStyle.textGray}
          rowStyle={themeStyle.appointments.searchInputRow}
          textColor={themeStyle.textBlack}
        />
        <FlatList
          contentContainerStyle={themeStyle.appointments.listContent}
          data={showSearchItems ? searchItems : coaches}
          keyExtractor={(item) => `${item.CoachID}${item.Nickname}`}
          ListEmptyComponent={
            <ListEmptyComponent
              description={
                error !== ''
                  ? error
                  : `There are no ${Brand.STRING_APPT_PROVIDER_TITLE_PLURAL.toLowerCase()} to choose from.`
              }
              loading={loading}
              title={`No ${Brand.STRING_APPT_PROVIDER_TITLE_PLURAL}`}
            />
          }
          refreshControl={
            <RefreshControl onRefresh={() => onFetchCoaches()} refreshing={loading} />
          }
          renderItem={({ item }) => {
            const isSelected = selectedProviders.some((p) => findUniqueProvider(p, item))
            return (
              <TouchableOpacity
                onPress={() =>
                  onSelect(
                    isSelected
                      ? selectedProviders.filter((p) => !findUniqueProvider(p, item))
                      : [...selectedProviders, item],
                  )
                }
                style={[
                  themeStyle.appointments.item,
                  isSelected && { borderColor: themeStyle.brandPrimary, borderWidth: 1 },
                ]}>
                <Text
                  style={[
                    themeStyle.textPrimaryRegular12,
                    isSelected && { color: themeStyle.brandPrimary },
                  ]}>
                  {formatCoachName({ coach: item, lastInitialOnly: false })}
                </Text>
              </TouchableOpacity>
            )
          }}
          showsVerticalScrollIndicator={false}
        />
        <Button onPress={onClose} text="Done" />
      </View>
    </View>
  )
}
