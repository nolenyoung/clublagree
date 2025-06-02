import * as React from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'
import { openExternalLink } from '../global/Functions'

type Props = { data: Location }

export default function HomeStudioInfo(props: Props): React.ReactElement {
  const {
    Address = '',
    City = '',
    Email = '',
    Nickname = '',
    Phone = '',
    SMSNumber = '',
    State = '',
  } = props.data
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const urlFormattedAddress = `${Address?.replace(/\s/g, '+') ?? ''}%2C${
    City?.replace(/\s/g, '+') ?? ''
  }%2C${State?.replace(/\s/g, '+') ?? ''}`
  return (
    <View style={styles.content}>
      <Pressable
        onPress={() =>
          openExternalLink(
            Platform.OS === 'android'
              ? `https://www.google.com/maps/dir/?api=1&destination=${urlFormattedAddress}`
              : `maps://?address=${urlFormattedAddress}`,
          )
        }>
        <View style={styles.nicknameRow}>
          <Icon name="locationPin" style={styles.iconPin} />
          <Text style={themeStyle.textPrimaryRegular16}>{Nickname}</Text>
        </View>
      </Pressable>
      <View style={styles.iconRow}>
        {Phone !== '' && (
          <Pressable onPress={() => openExternalLink(`tel:${Phone}`)} style={styles.contactButton}>
            <Icon name="phone" style={styles.iconContact} />
          </Pressable>
        )}
        {SMSNumber !== '' && (
          <Pressable
            onPress={() => openExternalLink(`sms:${SMSNumber}`)}
            style={styles.contactButton}>
            <Icon name="sms" style={styles.iconContact} />
          </Pressable>
        )}
        {Email !== '' && (
          <Pressable
            onPress={() => openExternalLink(`mailto:${Email}`)}
            style={styles.contactButton}>
            <Icon name="email" style={styles.iconContact} />
          </Pressable>
        )}
      </View>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: {
      ...themeStyle.rowAligned,
      alignSelf: 'center' as 'center',
      marginTop: themeStyle.scale(16),
    },
    iconPin: {
      color: themeStyle.gray,
      fontSize: themeStyle.scale(16),
      marginRight: themeStyle.scale(8),
    },
    nicknameRow: {
      ...themeStyle.rowAligned,
      borderColor: themeStyle.gray,
      borderRightWidth: themeStyle.scale(1),
      paddingRight: themeStyle.scale(16),
    },
    iconRow: { ...themeStyle.rowAligned },
    contactButton: {},
    iconContact: {
      color: themeStyle.brandPrimary,
      fontSize: themeStyle.scale(16),
      marginLeft: themeStyle.scale(24),
    },
  }
}
