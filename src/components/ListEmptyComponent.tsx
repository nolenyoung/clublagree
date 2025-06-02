import * as React from 'react'
import { Text, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'
import AnimatedBallTriangleLoader from './AnimatedBallTriangleLoader'

type Props = {
  containerStyle?: ViewStyleProp
  description: string
  loading?: boolean
  title: string
}

export default function ListEmptyComponent(props: Props): React.ReactElement {
  const { containerStyle, description, loading = false, title } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={[styles.noClassesView, containerStyle]}>
      {loading && (
        <View style={styles.loadingView}>
          <AnimatedBallTriangleLoader />
        </View>
      )}
      {!loading && (
        <>
          <Icon name="clear" style={styles.noClassesIcon} />
          <Text style={styles.noClassesTitle}>{title}</Text>
          <Text style={styles.noClassesDescription}>{description}</Text>
        </>
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    noClassesView: {
      alignItems: 'center' as 'center',
      marginTop: themeStyle.scale(100),
      paddingHorizontal: themeStyle.scale(40),
    },
    noClassesIcon: {
      color: themeStyle.buttonTextOnMain,
      fontSize: themeStyle.scale(56),
      marginBottom: themeStyle.scale(28),
    },
    loadingView: { ...themeStyle.viewCentered, marginBottom: themeStyle.scale(16) },
    noClassesTitle: {
      ...themeStyle.sectionTitleText,
      marginBottom: themeStyle.scale(12),
      textAlign: 'center' as 'center',
    },
    noClassesDescription: { ...themeStyle.textPrimaryRegular16, textAlign: 'center' as 'center' },
  }
}
