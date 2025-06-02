import * as React from 'react'
import { ActivityIndicator, Image, Platform, Text, View } from 'react-native'
import { useCachedImage, useTheme } from '../global/Hooks'

type Props = {
  border?: { color: string; width: number }
  size?: number
  source: string | null | undefined
  style?: ViewStyleProp
  text?: string
}

export default function Avatar(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { border, size = themeStyle.scale(40), source, style, text = '' } = props
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState<boolean | null>(null)
  const path = useCachedImage(source)
  const parentStyle = { borderRadius: size / 2, height: size, width: size }
  const sizeMinusBorder = size - (border?.width ?? 0) * 2
  const imageStyle = {
    borderRadius: sizeMinusBorder / 2,
    height: sizeMinusBorder,
    overflow: 'hidden' as const,
    resizeMode: 'cover' as const,
    width: sizeMinusBorder,
  }
  const iconSize = { fontSize: sizeMinusBorder / 2 }
  React.useEffect(() => {
    if (source != null) {
      setLoading(true)
      setSuccess(null)
    }
  }, [source])
  return (
    <View
      accessible={true}
      accessibilityLabel={'User Avatar'}
      accessibilityRole="image"
      style={[styles.avatar, parentStyle, style]}>
      {path != null && path !== '' && (
        <Image
          onError={() => setSuccess(false)}
          onLoad={() => setSuccess(true)}
          onLoadEnd={() => setLoading(false)}
          resizeMethod="resize"
          source={{ uri: path }}
          style={imageStyle}
        />
      )}
      {loading && success == null && (
        <ActivityIndicator
          color={themeStyle.separator.backgroundColor}
          size="small"
          style={styles.loader}
        />
      )}
      {((success === (Platform.OS === 'android' ? null : false) && path != null) ||
        source == null) && <Text style={[styles.text, iconSize]}>{text}</Text>}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    avatar: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.white,
      shadowColor: themeStyle.black,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.16,
      shadowRadius: themeStyle.scale(1),
      elevation: 2,
      zIndex: 2,
    },
    loader: { position: 'absolute' as const, zIndex: 2 },
    text: {
      color: themeStyle.textBlack,
      fontFamily: themeStyle.fontPrimaryBold,
      position: 'absolute' as 'absolute',
      textAlign: 'center' as 'center',
    },
  }
}
