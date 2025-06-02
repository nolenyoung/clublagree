import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Barcode from './Barcode'
import { useTheme } from '../global/Hooks'

type Props = {
  id: string | null | undefined
  onClose: () => void
  visible: boolean
}

export default function ModalClientIdentification(props: Props): React.ReactElement | null {
  const { id, onClose, visible } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const height = themeStyle.window.height
  const translateY = useSharedValue(height)
  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ translateY: translateY.value }] }
  }, [])
  React.useEffect(() => {
    translateY.value = withTiming(visible ? -height : 0, {
      duration: 300,
    })
  }, [height, visible])
  if (id == null) {
    return null
  }
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable onPressIn={onClose} style={themeStyle.flexView} />
      <View style={themeStyle.modalContent}>
        <View style={themeStyle.modalBannerRow}>
          <Text style={themeStyle.modalTitleText}>Client Identification</Text>
        </View>
        <View style={styles.content}>
          <Barcode number={id} />
        </View>
      </View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    container: {
      height: themeStyle.window.height,
      position: 'absolute' as const,
      top: themeStyle.window.height,
      width: themeStyle.window.width,
      zIndex: 99,
    },
    content: { paddingHorizontal: themeStyle.scale(20), paddingVertical: themeStyle.scale(40) },
  }
}
