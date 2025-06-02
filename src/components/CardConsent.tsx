import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'

type Props = {
  disclaimer?: string
  error?: boolean
  setTerms: (arg1: (arg1: boolean) => boolean) => void
  terms: boolean
  text: string
}

export default function CardConsent(props: Props): React.ReactElement {
  const { disclaimer, setTerms, terms, text } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const onToggleTerms = React.useCallback(() => setTerms((prev) => !prev), [])
  return (
    <View collapsable={false}>
      <Pressable onPress={onToggleTerms}>
        <View style={styles.row}>
          <View style={[styles.emptyCheckbox, terms && styles.selectedCheckbox]}>
            {terms && <Icon name="check" style={styles.checkmark} />}
          </View>
          <Text style={styles.text}>{text}</Text>
        </View>
      </Pressable>
      <Text style={styles.disclaimer}>{disclaimer}</Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const checkbox = { height: themeStyle.scale(20), width: themeStyle.scale(20) } as const
  return {
    row: { flexDirection: 'row' as 'row' },
    emptyCheckbox: {
      ...themeStyle.viewCentered,
      ...checkbox,
      backgroundColor: themeStyle.paleGray,
    },
    selectedCheckbox: { ...checkbox, backgroundColor: themeStyle.brandPrimary },
    checkmark: { color: themeStyle.textWhite, fontSize: themeStyle.scale(9) },
    text: {
      color: themeStyle.textWhite,
      fontFamily: themeStyle.fontPrimaryRegular,
      fontSize: themeStyle.scale(14),
      flex: 1,
      letterSpacing: themeStyle.scale(0.5),
      lineHeight: themeStyle.scale(20),
      marginLeft: themeStyle.scale(16),
    },
    disclaimer: {
      color: themeStyle.textWhite,
      fontFamily: themeStyle.fontPrimaryRegular,
      fontSize: themeStyle.scale(12),
      letterSpacing: themeStyle.scale(0.5),
      marginTop: themeStyle.scale(16),
      opacity: 0.75,
    },
  }
}
