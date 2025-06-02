import * as React from 'react'
import { Keyboard, Pressable, View } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated'
import Button from './Button'
import Input from './Input'
import ModalBanner from './ModalBanner'
import { ANIMATION_DURATIONS } from '../global/Constants'
import { useTheme } from '../global/Hooks'

type Props = InputProps & { onClose: () => void; notes?: string; title?: string }

export default function OverlayNoteEntry(props: Props): React.ReactElement {
  const { onClose, notes = '', title, ...textInputProps } = props
  const { height } = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true })
  const inputRef = React.useRef<InputRef>(undefined)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const animatedStyle = useAnimatedStyle(() => {
    return { marginBottom: height.value }
  })
  function focusTextInput() {
    inputRef.current?.focus()
  }
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
        entering={SlideInDown.duration(ANIMATION_DURATIONS.overlayContentTranslation)
          .delay(ANIMATION_DURATIONS.overlayBackdropFade)
          .withCallback(() => runOnJS(focusTextInput)())}
        exiting={SlideOutDown.duration(ANIMATION_DURATIONS.overlayContentTranslation)}
        style={[themeStyle.modalContent, maxHeight != null && { maxHeight }, animatedStyle]}>
        <Pressable onPress={() => Keyboard.dismiss()}>
          <ModalBanner onClose={onClose} title={title ?? 'Enter Notes'} />
          <View style={styles.content}>
            <Input
              defaultValue={notes}
              getInputRef={(ref) => {
                inputRef.current = ref
              }}
              placeholder="Enter Notes"
              returnKeyType="default"
              rowStyle={styles.notesRow}
              style={styles.notesInput}
              textColor={themeStyle.textBlack}
              {...textInputProps}
            />
            <Button onPress={onClose} style={styles.button} text="Save & Close" />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { padding: themeStyle.scale(20) },
    notesRow: { borderBottomWidth: 0, paddingVertical: 0 },
    notesInput: themeStyle.getTextStyle({
      color: 'textBlack',
      font: 'fontPrimaryRegular',
      size: 13,
    }),
    button: { marginBottom: themeStyle.edgeInsets.bottom, marginTop: themeStyle.scale(16) },
  }
}
