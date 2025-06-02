import * as React from 'react'
import { Animated } from 'react-native'
import { createIconSetFromFontello } from 'react-native-vector-icons'
import fontelloConfig from '../global/Icons.json'
const FontelloIcon = createIconSetFromFontello(fontelloConfig)
const AnimatedIcon = Animated.createAnimatedComponent(FontelloIcon as any)

type Props = { name: string; style: TextStyleProp }

export default function Icon(props: Props): React.ReactElement {
  const { name, style } = props
  return <AnimatedIcon name={name} style={style} />
}
