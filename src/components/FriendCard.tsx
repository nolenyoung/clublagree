import * as React from 'react'
import { Text, View } from 'react-native'
import Avatar from './Avatar'
import { useTheme } from '../global/Hooks'
import { formatName, formatNameWithLastInitial } from '../global/Functions'

type Props = Friend & {
  hideLastName?: boolean
  rightComponent?: React.ReactNode
}

export default function FriendCard(props: Props): React.ReactElement {
  const { avatar, firstName, hideLastName, lastName, locationName = '', rightComponent } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={styles.content}>
      <Avatar size={themeStyle.scale(56)} source={avatar} />
      <View style={styles.infoView}>
        <Text style={themeStyle.textItemPrimary}>
          {hideLastName
            ? formatNameWithLastInitial(firstName, lastName)
            : formatName(firstName, lastName)}
        </Text>
        <Text style={themeStyle.textItemSecondary}>{locationName}</Text>
      </View>
      {rightComponent}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: {
      ...themeStyle.rowAligned,
      paddingHorizontal: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(16),
    },
    infoView: { flex: 1, marginHorizontal: themeStyle.scale(10) },
  }
}
