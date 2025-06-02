import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import ModalRequestSong from './ModalRequestSong'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

export default function RequestSong(): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [modal, setModal] = React.useState(false)
  return (
    <>
      <TouchableOpacity
        accessible={true}
        accessibilityLabel="Request a Song"
        accessibilityRole="button"
        onPress={() => setModal(true)}
        style={styles.button}>
        <View style={themeStyle.rowAlignedEvenly}>
          <Icon name="music" style={[styles.leftIcon, { color: themeStyle.brandPrimary }]} />
          <Text style={styles.text}>Request a Song</Text>
        </View>
      </TouchableOpacity>
      {modal && <ModalRequestSong onClose={() => setModal(false)} />}
    </>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const icon = {
    color: themeStyle.textBlack,
    fontSize: themeStyle.scale(19),
    textAlign: 'center' as 'center',
  } as const
  return {
    button: {
      alignSelf: 'center' as 'center',
      backgroundColor: themeStyle.fadedGray,
      borderRadius: themeStyle.scale(Brand.BUTTON_SMALL_RADIUS),
      height: themeStyle.scale(44),
      justifyContent: 'center' as 'center',
      marginVertical: themeStyle.scale(20),
      overflow: 'hidden' as 'hidden',
      paddingHorizontal: themeStyle.scale(12),
      width: '60%' as const,
    },
    leftIcon: icon,
    text: {
      ...themeStyle.getTextStyle({
        color: 'textBlack',
        font: Brand.BUTTON_LARGE_FONT as FontKeys,
        size: 14,
      }),
      textTransform: Brand.TRANSFORM_BUTTON_SMALL_TEXT as TextTransform,
    },
  }
}
