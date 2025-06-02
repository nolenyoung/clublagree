import * as React from 'react'
import { ActivityIndicator, DimensionValue, Image, View } from 'react-native'
import { useCachedImage, useTheme } from '../global/Hooks'

type Props = {
  addBorder?: boolean
  containerStyle?: any
  height: DimensionValue
  indicatorColor?: string
  indicatorSize?: 'small' | 'large'
  resizeMode?: 'cover' | 'stretch' | 'contain'
  source: number | string | undefined
  width: DimensionValue
}

export default function CachedImage(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    addBorder = false,
    containerStyle,
    height,
    indicatorColor = themeStyle.white,
    indicatorSize = 'small',
    resizeMode = 'cover',
    source,
    width,
  } = props
  const [loading, setLoading] = React.useState(true)
  const path = useCachedImage(source, setLoading)
  const commonStyle = { height, overflow: 'hidden', width } as const
  return (
    <View
      style={[themeStyle.viewCentered, commonStyle, addBorder && styles.border, containerStyle]}>
      {((path != null && path !== '') || typeof source === 'number') && (
        <Image
          onLoadEnd={() => setLoading(false)}
          resizeMethod="resize"
          source={typeof source === 'number' ? source : { uri: path }}
          style={[commonStyle, { resizeMode }]}
        />
      )}
      {loading && (
        <View style={styles.indicatorView}>
          <ActivityIndicator color={indicatorColor} size={indicatorSize} />
        </View>
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    indicatorView: { position: 'absolute' as 'absolute' },
    border: { borderWidth: themeStyle.scale(1), borderColor: themeStyle.gray },
  }
}
