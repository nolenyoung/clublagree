import * as React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import Share from 'react-native-share'
import { Button, Icon } from '../components'
import Brand from '../global/Brand'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'
import { API } from '../global/API'

async function onShare(info: Referral | null) {
  const { OfferName = '', SMSLanguage = '' } = info ?? {}
  try {
    const options = { message: SMSLanguage, title: OfferName } as const
    await Share.open(options)
  } catch {
    return
  }
}

export default function FriendInvite(props: RootNavigatorScreenProps<'FriendInvite'>) {
  const { navigate } = props.navigation
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [referralInfo, setReferralInfo] = React.useState<Referral | null>(null)
  const fetchInviteInfo = async () => {
    try {
      let response = await API.getReferral()
      if ('SMSLanguage' in response) {
        setReferralInfo(response)
      } else {
        setAction('toast', { text: response.message })
      }
    } catch (e) {
      logError(e)
      setAction('toast', { text: 'Unable to fetch invite info' })
    }
  }
  React.useEffect(() => {
    fetchInviteInfo()
  }, [])
  return (
    <View style={styles.content}>
      <Image source={Brand.IMAGES_FRIEND_INVITE} style={styles.backgroundImage} />
      <TouchableOpacity
        hitSlop={themeStyle.hitSlop}
        onPress={() => navigate('Home')}
        style={styles.closeButton}>
        <Icon name="clear" style={styles.closeIcon} />
      </TouchableOpacity>
      <View style={themeStyle.flexViewCentered}>
        <View style={styles.titleView}>
          <Text style={styles.titleText}>{Brand.STRING_FRIEND_INVITE_TITLE}</Text>
        </View>
        <Text style={styles.bodyText}>{Brand.STRING_FRIEND_INVITE_DESCRIPTION}</Text>
        <Button
          disabled={referralInfo == null || referralInfo?.SMSLanguage === ''}
          leftIcon="share"
          onPress={() => onShare(referralInfo)}
          text="Share Offer"
          width={(themeStyle.window.width * 2) / 3}
        />
      </View>
      <Text style={styles.footerText}>{Brand.STRING_FRIEND_INVITE_DISCLAIMER}</Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { ...themeStyle.content, backgroundColor: themeStyle.black },
    backgroundImage: {
      ...themeStyle.fullImageBackground,
      position: 'absolute' as const,
    },
    closeButton: {
      alignSelf: 'flex-end' as const,
      marginRight: themeStyle.scale(20),
      marginTop: themeStyle.hasNotch ? themeStyle.scale(54) : themeStyle.scale(44),
    },
    closeIcon: { color: themeStyle.textWhite, fontSize: themeStyle.scale(18) },
    titleView: {
      ...themeStyle.viewCentered,
      borderBottomWidth: themeStyle.scale(2),
      borderColor: themeStyle[Brand.COLOR_FRIEND_INVITE_TITLE_BARS as ColorKeys],
      borderTopWidth: themeStyle.scale(2),
      paddingVertical: themeStyle.scale(24),
    },
    titleText: {
      ...themeStyle.screenSecondaryTitleText,
      color: themeStyle.textWhite,
      textAlign: 'center' as const,
    },
    bodyText: {
      ...themeStyle.textPrimaryRegular16,
      color: themeStyle.colorWhite,
      marginVertical: themeStyle.scale(36),
      textAlign: 'center' as const,
    },
    footerText: {
      ...themeStyle.textPrimaryMedium12,
      color: themeStyle.colorWhite,
      marginBottom: themeStyle.scale(40),
      textAlign: 'center' as const,
    },
  }
}
