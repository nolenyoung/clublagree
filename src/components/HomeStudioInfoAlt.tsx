import * as React from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Icon from './Icon'
import ModalHomeStudioInfo from './ModalHomeStudioInfo'
import ModalUserProfiles from './ModalUserProfiles'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError, openExternalLink } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = { data: Location }

export default function HomeStudioInfoAlt(props: Props): React.ReactElement {
  const {
    Address = '',
    City = '',
    ClientID,
    Email = '',
    LocationID,
    Nickname = '',
    Phone = '',
    SMSNumber = '',
    State = '',
  } = props.data
  const numAccounts = useSelector((state: ReduxState) => state.user.numAccounts ?? 1)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [info, setInfo] = React.useState<any>(undefined)
  const [modalHomeStudio, setModalHomeStudio] = React.useState(false)
  const [modalSwitchAccount, setModalSwitchAccount] = React.useState(false)
  const onCloseSwitchModal = React.useCallback(() => {
    setModalSwitchAccount(false)
  }, [])
  const urlFormattedAddress = `${Address?.replace(/\s/g, '+') ?? ''}%2C${
    City?.replace(/\s/g, '+') ?? ''
  }%2C${State?.replace(/\s/g, '+') ?? ''}`
  React.useEffect(() => {
    ;(async function getBusinessInfo() {
      try {
        const response = await API.getBusinessInfo({ ClientID, LocationID })
        if (Array.isArray(response?.Hours)) {
          setInfo(response)
        }
      } catch (e: any) {
        logError(e)
      }
    })()
  }, [ClientID, LocationID])
  const switchAccountsEnabled = Brand.UI_ACCOUNT_SWITCHING && numAccounts > 1
  return (
    <>
      <View style={styles.content}>
        <Pressable disabled={!switchAccountsEnabled} onPress={() => setModalSwitchAccount(true)}>
          <View style={styles.nicknameRow}>
            <Icon name="locationPin" style={styles.iconPin} />
            <Text style={themeStyle.textPrimaryBold16}>{Nickname}</Text>
            {switchAccountsEnabled && <Icon name="chevron-down" style={styles.iconArrow} />}
          </View>
        </Pressable>
        <View style={styles.iconRow}>
          <Pressable
            onPress={() =>
              openExternalLink(
                Platform.OS === 'android'
                  ? `https://www.google.com/maps/dir/?api=1&destination=${urlFormattedAddress}`
                  : `maps://?address=${urlFormattedAddress}`,
              )
            }
            style={styles.contactButton}>
            <Icon name="locationPin" style={styles.iconContact} />
          </Pressable>
          {Phone !== '' && (
            <Pressable
              onPress={() => openExternalLink(`tel:${Phone}`)}
              style={styles.contactButtonWithMargin}>
              <Icon name="phone-filled" style={styles.iconContact} />
            </Pressable>
          )}
          {SMSNumber !== '' && (
            <Pressable
              onPress={() => openExternalLink(`sms:${SMSNumber}`)}
              style={styles.contactButtonWithMargin}>
              <Icon name="sms-filled" style={styles.iconContact} />
            </Pressable>
          )}
          {Email !== '' && (
            <Pressable
              onPress={() => openExternalLink(`mailto:${Email}`)}
              style={styles.contactButtonWithMargin}>
              <Icon
                name="email-filled"
                style={[styles.iconContact, { fontSize: themeStyle.scale(14) }]}
              />
            </Pressable>
          )}
          {Brand.UI_HOME_STUDIO_INFO_MODAL && info != null && (
            <Pressable
              onPress={() => setModalHomeStudio(true)}
              style={styles.contactButtonWithMargin}>
              <Icon name="info-i" style={styles.iconContact} />
            </Pressable>
          )}
        </View>
      </View>
      {modalHomeStudio && (
        <ModalHomeStudioInfo
          data={props.data}
          info={info}
          onClose={() => setModalHomeStudio(false)}
        />
      )}
      {modalSwitchAccount && <ModalUserProfiles onClose={onCloseSwitchModal} />}
    </>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const contactButton = {
    ...themeStyle.viewCentered,
    backgroundColor: themeStyle.white,
    borderRadius: themeStyle.scale(17.5),
    height: themeStyle.scale(35),
    width: themeStyle.scale(35),
  } as const
  return {
    content: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.fadedGray,
      height: themeStyle.scale(112),
      width: '100%' as const,
    },
    iconPin: {
      color: themeStyle.brandSecondary,
      fontSize: themeStyle.scale(20),
      marginRight: themeStyle.scale(8),
    },
    iconArrow: {
      color: themeStyle.brandSecondary,
      fontSize: themeStyle.scale(10),
      marginLeft: themeStyle.scale(8),
    },
    nicknameRow: {
      ...themeStyle.rowAligned,
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(16),
    },
    iconRow: { ...themeStyle.rowAligned },
    contactButton,
    contactButtonWithMargin: { ...contactButton, marginLeft: themeStyle.scale(24) },
    iconContact: { color: themeStyle.brandSecondary, fontSize: themeStyle.scale(16) },
  }
}
