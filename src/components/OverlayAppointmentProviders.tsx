import * as React from 'react'
import { FlatList, Pressable } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated'
import Checkbox from './Checkbox'
import Input from './Input'
import ItemSeparator from './ItemSeparator'
import ModalBanner from './ModalBanner'
import Brand from '../global/Brand'
import { ANIMATION_DURATIONS } from '../global/Constants'
import { formatCoachName, onSearchProviders } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = {
  onClose: () => void
  onSelect: (key: string, value: Coach) => void
  providers: Coach[]
  selectedProviders: string[]
}

export default function OverlayAppointmentProviders(props: Props): React.ReactElement {
  const { onClose, onSelect, providers, selectedProviders } = props
  const { height } = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true })
  const inputRef = React.useRef<InputRef>(undefined)
  const listRef = React.useRef<FlatList | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [searchItems, setSearchItems] = React.useState<Coach[]>([])
  const [showSearchItems, setShowSearchItems] = React.useState(false)
  const onClearSearch = React.useCallback(() => {
    inputRef.current?.onResetInput()
    setSearchItems([])
    setShowSearchItems(false)
  }, [])
  const onChangeText = React.useCallback(
    ({ text }: { text: string }) => {
      if (text === '') {
        setSearchItems([])
        setShowSearchItems(false)
      } else {
        const filterArray = onSearchProviders(text, providers)
        setSearchItems(filterArray)
        setShowSearchItems(true)
      }
    },
    [providers],
  )
  const animatedStyle = useAnimatedStyle(() => {
    return { paddingBottom: height.value }
  })
  const maxHeight = themeStyle.window.height - themeStyle.scale(250)
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
        style={[themeStyle.modalContent, maxHeight != null && { maxHeight }, animatedStyle]}>
        <ModalBanner
          onClose={onClose}
          title={`Select ${Brand.STRING_APPT_PROVIDER_TITLE_PLURAL}`}
        />
        {providers.length > 15 && (
          <Input
            containerStyle={styles.searchInput}
            getInputRef={(ref) => {
              inputRef.current = ref
            }}
            onChangeText={onChangeText}
            placeholder="Search"
            placeholderTextColor={themeStyle.textGray}
            rightIcon="clear"
            rightIconPress={onClearSearch}
            rowStyle={styles.searchInputRow}
            textColor={themeStyle.textGray}
          />
        )}
        <FlatList
          bounces={false}
          contentContainerStyle={themeStyle.listContent}
          data={showSearchItems ? searchItems : providers}
          extraData={selectedProviders}
          getItemLayout={themeStyle.getItemLayout}
          keyExtractor={(item) =>
            Brand.UI_COACH_NICKNAME ? item.Nickname : `${item.FirstName}-${item.LastName}`
          }
          ItemSeparatorComponent={ItemSeparator}
          ref={listRef}
          renderItem={({ item }) => {
            const key = Brand.UI_COACH_NICKNAME
              ? item.Nickname
              : `${item.FirstName}-${item.LastName}`
            const selected = selectedProviders.includes(key)
            return (
              <Checkbox
                containerStyle={themeStyle.item}
                onPress={() => onSelect(key, item)}
                selected={selected}
                text={formatCoachName({
                  coach: item,
                  lastInitialOnly: Brand.UI_COACH_LAST_INITIAL_ONLY,
                })}
              />
            )
          }}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    searchInput: { margin: themeStyle.scale(20) },
    searchInputRow: {
      backgroundColor: themeStyle.fadedGray,
      height: themeStyle.scale(51),
      paddingHorizontal: themeStyle.scale(16),
    },
  }
}
