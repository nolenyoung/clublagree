import * as React from 'react'
import { FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'
import Icon from './Icon'
import ItemSeparator from './ItemSeparator'
import { ANIMATION_DURATIONS, MONTHS, YEARS } from '../global/Constants'
import { useTheme } from '../global/Hooks'

type Props = {
  isYearSelector: boolean
  onPress: (item: string) => Promise<void> | void
  selectedOption: string
  setVisible: React.Dispatch<React.SetStateAction<boolean>>
}

export default function OverlayBillingExpiration(props: Props): React.ReactElement {
  const { isYearSelector, onPress, selectedOption, setVisible } = props
  const listRef = React.useRef<FlatList | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const data = isYearSelector ? YEARS : MONTHS
  const index = data.findIndex((i) => i.value === selectedOption)
  return (
    <Animated.View
      entering={FadeIn.duration(ANIMATION_DURATIONS.overlayBackdropFade)}
      exiting={FadeOut.duration(ANIMATION_DURATIONS.overlayBackdropFade).delay(
        ANIMATION_DURATIONS.overlayContentTranslation,
      )}
      style={styles.container}>
      <Pressable onPress={() => setVisible(false)} style={themeStyle.overlayDismissArea} />
      <Animated.View
        entering={SlideInDown.duration(ANIMATION_DURATIONS.overlayContentTranslation).delay(
          ANIMATION_DURATIONS.overlayBackdropFade,
        )}
        exiting={SlideOutDown.duration(ANIMATION_DURATIONS.overlayContentTranslation)}
        style={styles.content}>
        <View style={themeStyle.overlayTitleRow}>
          <Text style={themeStyle.overlayTitleText}>
            {isYearSelector ? 'Expiration Year' : 'Expiration Month'}
          </Text>
          <TouchableOpacity onPress={() => setVisible(false)}>
            <Icon
              name="clear"
              style={[themeStyle.modalCloseIcon, { color: themeStyle.textGray }]}
            />
          </TouchableOpacity>
        </View>
        <FlatList
          contentContainerStyle={themeStyle.scrollViewContent}
          data={data}
          extraData={selectedOption}
          getItemLayout={themeStyle.getItemLayoutLocation}
          initialScrollIndex={index !== -1 && isYearSelector ? index : 0}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) => `${item.value}`}
          ref={(ref) => {
            listRef.current = ref
          }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onPress(item.value)} style={styles.item}>
              <View style={themeStyle.rowAlignedBetween}>
                <Text style={styles.text}>{item.key}</Text>
                {selectedOption === item.value && <Icon name="check" style={styles.icon} />}
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    container: { ...themeStyle.overlayContainerLevel2, justifyContent: 'flex-start' as const },
    content: {
      ...themeStyle.overlayContent,
      alignSelf: 'center' as const,
      borderTopLeftRadius: themeStyle.scale(20),
      borderTopRightRadius: themeStyle.scale(20),
      borderRadius: themeStyle.scale(20),
      height: themeStyle.window.height - themeStyle.edgeInsets.top - themeStyle.edgeInsets.bottom,
      marginTop: themeStyle.edgeInsets.top,
      padding: themeStyle.scale(20),
      width: themeStyle.window.width - themeStyle.scale(40),
    },
    descriptionText: { ...themeStyle.overlaySubTitleText, marginBottom: themeStyle.scale(20) },
    item: { ...themeStyle.rowAligned, height: themeStyle.scale(44) },
    text: { ...themeStyle.inputText, color: themeStyle.textBlack },
    icon: { color: themeStyle.textBlack, fontSize: themeStyle.scale(16) },
  }
}
