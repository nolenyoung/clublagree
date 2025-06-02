import * as React from 'react'
import { Pressable, SectionList, Text, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'
import Button from './Button'
import Input from './Input'
import ListEmptyComponent from './ListEmptyComponent'
import ModalBanner from './ModalBanner'
import { ANIMATION_DURATIONS } from '../global/Constants'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = {
  onClose: () => void
  selectedType: AppointmentFiltersType | undefined
  typeCount: number
  types: AppointmentFiltersTypeSection[]
  visible: boolean
}

export default function AppointmentType(props: Props): React.ReactElement | null {
  const { onClose, selectedType, typeCount, types, visible } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [searchItems, setSearchItems] = React.useState<AppointmentFiltersTypeSection[]>([])
  const [showSearchItems, setShowSearchItems] = React.useState(false)
  const onChangeText = React.useCallback(
    (text: string) => {
      if (text === '') {
        setSearchItems([])
        setShowSearchItems(false)
      } else {
        let filterArray = []
        for (const section of types) {
          let items = []
          const { data } = section
          items = data.filter((d) => d.SessionName.toLowerCase().includes(text.toLowerCase()))
          if (items.length > 0) {
            filterArray.push({ ...section, data: items })
          }
        }
        setSearchItems(filterArray)
        setShowSearchItems(true)
      }
    },
    [types],
  )
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
        <ModalBanner onClose={onClose} title={'Select Session Type'} />
        <View style={themeStyle.appointments.content}>
          {typeCount > 10 && (
            <Input
              containerStyle={themeStyle.appointments.searchInput}
              labelColor={themeStyle.buttonTextOnMain}
              leftIcon="search"
              onChangeText={({ text }) => onChangeText(text)}
              placeholder="Search for an Appointment Type"
              placeholderTextColor={themeStyle.textGray}
              rowStyle={themeStyle.appointments.searchInputRow}
              textColor={themeStyle.textBlack}
            />
          )}
          <SectionList
            bounces={false}
            contentContainerStyle={themeStyle.appointments.listContent}
            keyExtractor={(item) => `${item.SessionTypeID}${item.SessionName}`}
            ListEmptyComponent={
              <ListEmptyComponent
                description={'There are no apopointment types to choose from.'}
                title="No Types"
              />
            }
            renderItem={({ item }) => {
              const isSelected =
                selectedType?.SessionName === item.SessionName &&
                selectedType?.SessionTypeID === item.SessionTypeID
              return (
                <TouchableOpacity
                  onPress={() => {
                    setAction('appointmentPreferences', { type: item })
                    onClose()
                  }}
                  style={[
                    themeStyle.appointments.item,
                    isSelected && { borderColor: themeStyle.brandPrimary, borderWidth: 1 },
                  ]}>
                  <Text style={[styles.itemText, isSelected && { color: themeStyle.brandPrimary }]}>
                    {item.SessionName}
                  </Text>
                </TouchableOpacity>
              )
            }}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            sections={showSearchItems ? searchItems : types}
            showsVerticalScrollIndicator={false}
          />
          <Button onPress={onClose} text="Done" />
        </View>
      </Animated.View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    sectionTitle: {
      ...themeStyle.textPrimaryRegular12,
      color: themeStyle.gray,
      marginBottom: themeStyle.scale(8),
      marginTop: themeStyle.scale(8),
    },
    itemText: { ...themeStyle.textPrimaryRegular12, marginLeft: themeStyle.scale(20) },
  }
}
