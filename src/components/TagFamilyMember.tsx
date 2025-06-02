import * as React from 'react'
import { Text, View } from 'react-native'
import { formatName } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = { member: Partial<FamilyMember> }

export default function TagFamilyMember(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { member } = props
  return (
    <View style={styles.tag}>
      <Text numberOfLines={1} style={themeStyle.textPrimaryBold12}>
        {formatName(member.FirstName, member.LastName)}
      </Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    tag: {
      alignSelf: 'flex-start' as const, //Needed to control width
      backgroundColor: themeStyle.fadedGray,
      borderRadius: themeStyle.scale(4),
      marginBottom: themeStyle.scale(8),
      paddingHorizontal: themeStyle.scale(8),
      paddingVertical: themeStyle.scale(4),
      width: 'auto' as const,
    },
  }
}
