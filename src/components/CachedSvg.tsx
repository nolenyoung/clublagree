import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SvgCss } from 'react-native-svg/css'
import { useCachedSVG, useTheme } from '../global/Hooks'

type Props = {
  addBorder?: boolean
  color?: string
  height: number
  indicatorColor?: string
  indicatorSize?: 'small' | 'large'
  onLoad?: () => void
  resizeMode?: 'cover' | 'stretch' | 'contain'
  source: string | null | undefined
  style?: ViewStyleProp
  width: number
}

export default function CachedSvg(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    addBorder = false,
    color,
    height,
    indicatorColor = themeStyle.white,
    indicatorSize = 'small',
    onLoad,
    resizeMode = 'cover',
    source,
    style,
    width,
  } = props
  const [loading, setLoading] = React.useState(true)
  const xml = useCachedSVG(source)
  React.useEffect(() => {
    if (xml != null && xml !== '') {
      setLoading(false)
      onLoad && onLoad()
    }
  }, [onLoad, xml])
  return (
    <View
      style={[
        {
          ...themeStyle.viewCentered,
          backgroundColor: resizeMode === 'contain' ? themeStyle.colorWhite : 'transparent',
          height,
          overflow: 'hidden' as const,
          width,
        },
        addBorder && styles.border,
        style,
      ]}>
      {xml != null && xml !== '' && (
        <SvgCss color={color} height={height} width={width} xml={xml} />
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
    border: { borderWidth: themeStyle.scale(1), borderColor: themeStyle.backgroundGray },
  }
}
