//@ts-ignore
import bwipjs from 'bwip-js/dist/bwip-js-node'
import * as React from 'react'
import { Image, Text, View } from 'react-native'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = { number: number | string }

export default function Barcode(props: Props): React.ReactElement | null {
  const { number = 12345678 } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [image, setImage] = React.useState<any>(null)
  React.useEffect(() => {
    ;(async function makeImage() {
      try {
        const data = await bwipjs.toBuffer({
          bcid: 'code128', // Barcode type
          text: String(number), // Text to encode
          scale: 3, // 3x scaling factor
          height: themeStyle.scale(100), // Bar height, in millimeters
          includetext: false, // Show human-readable text
          textxalign: 'center' as 'center', // Always good to set this
        })
        setImage(`data:image/png;base64,${data.toString('base64')}`)
      } catch (e: any) {
        logError(e)
      }
    })()
  }, [number])
  if (image == null) {
    return null
  }
  return (
    <View style={themeStyle.viewCentered}>
      {image != null && <Image source={{ uri: image }} style={styles.barcode} />}
      <Text style={styles.text}>{number}</Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    barcode: {
      height: themeStyle.scale(100),
      width: themeStyle.window.width - themeStyle.scale(40),
    },
    text: {
      ...themeStyle.textPrimaryRegular16,
      letterSpacing: themeStyle.scale(5),
      marginTop: themeStyle.scale(8),
    },
  }
}
