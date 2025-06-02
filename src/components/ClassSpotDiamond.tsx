import * as React from 'react'
import { Pressable, Text } from 'react-native'
import Svg, { Polygon } from 'react-native-svg'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = {
  available: boolean
  onPress: () => void
  selected: boolean
  text: string
}

export default function ClassSpotDiamond(props: Props): React.ReactElement {
  const { available, onPress, selected, text } = props
  const [size, setSize] = React.useState(0)
  const { themeStyle } = useTheme()
  const styles = React.useMemo(() => getStyles(themeStyle, size), [size, themeStyle])
  return (
    <Pressable
      disabled={!available}
      onLayout={(event) => {
        setSize(event.nativeEvent.layout.height)
      }}
      onPress={onPress}
      style={styles.content}>
      <React.Fragment>
        <Svg height={size} width={size}>
          {size > 0 && (
            <Polygon
              points={`${size / 2},${size} ${size},${size / 2} ${size / 2},0 0,${size / 2}`}
              fill={
                selected ? themeStyle.brandPrimary : available ? themeStyle.white : themeStyle.gray
              }
            />
          )}
        </Svg>
        <Text style={[styles.text, selected && styles.selectedText]}>{text}</Text>
      </React.Fragment>
    </Pressable>
  )
}

function getStyles(themeStyle: ThemeStyle, spotSize: number) {
  return {
    content: { ...themeStyle.viewCentered, height: '100%', width: '100%' } as const,
    text: {
      alignSelf: 'center' as 'center',
      color: themeStyle.textBlack,
      fontFamily: themeStyle.fontPrimaryRegular,
      fontSize: spotSize === 0 ? 1 : spotSize / 2.5,
      position: 'absolute' as 'absolute',
      textAlign: 'center' as 'center',
      zIndex: 2,
    },
    selectedText: {
      color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys],
      fontFamily: themeStyle.fontPrimaryBold,
    },
  }
}
