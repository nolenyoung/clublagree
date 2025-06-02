import * as React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../global/Hooks'

type Props = {
  description?: string
  title: string
  titleComponent?: React.ReactNode
}

export default function ListHeader(props: Props): React.ReactElement {
  const { description = '', title, titleComponent } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={styles.headerView}>
      <View style={styles.sectionTitleRow}>
        <Text style={themeStyle.sectionTitleText}>{title}</Text>
        {titleComponent}
      </View>
      {description !== '' && <Text style={styles.sectionDescription}>{description}</Text>}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    headerView: { paddingHorizontal: themeStyle.scale(20), paddingVertical: themeStyle.scale(14) },
    sectionTitleRow: { ...themeStyle.rowAlignedBetween, marginBottom: themeStyle.scale(8) },
    sectionDescription: { ...themeStyle.textPrimaryRegular14, color: themeStyle.textGray },
  }
}
