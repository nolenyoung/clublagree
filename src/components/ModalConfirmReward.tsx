import * as React from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SvgCss } from 'react-native-svg/css'
import media from '../assets/media'
import Barcode from './Barcode'
import Button from './Button'
import ModalBanner from './ModalBanner'
import RewardsLocationSelector from './RewardsLocationSelector'
import Toast from './Toast'
import { API } from '../global/API'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'
import InputFriend from './InputFriend'

type Props = {
  alternateStyling?: boolean
  locations: Array<RewardsItemLocation>
  onClose: (arg1: boolean) => void
  reward: RewardsItemRedeem
}

// Conditionally render this modal so that state resets whenever it is closed

export default function ModalConfirmReward(props: Props): React.ReactElement {
  const { alternateStyling, locations, onClose, reward } = props
  const { Description, OptionID, Points, Title, Type, Who } = reward
  const scrollRef = React.useRef<ScrollView | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [fetching, setFetching] = React.useState(false)
  const [friend, setFriend] = React.useState<any>(null)
  const [friendInputVisible, setFriendInputVisible] = React.useState(false)
  const [location, setLocation] = React.useState<RewardsItemLocation | null | undefined>(null)
  const [locationsVisible, setLocationsVisible] = React.useState(Type === 'purchase')
  const [purchaseComplete, setPurchaseComplete] = React.useState(false)
  const [voucher, setVoucher] = React.useState<number | null | undefined>(null)
  const onClosed = () => onClose(purchaseComplete)
  const onLocationSelected = React.useCallback(
    (loc: RewardsItemLocation) => {
      setLocation(loc)
      if (Who === 'friend') {
        setFriendInputVisible(true)
      }
      setLocationsVisible(false)
    },
    [Who],
  )
  const onRedeem = React.useCallback(async () => {
    if (OptionID != null) {
      try {
        setFetching(true)
        let response = await API.redeemRewardsOption({ OptionID })
        setFetching(false)
        const { PointBalance, Voucher } = response
        if (PointBalance != null) {
          setAction('rewards', { pointBalance: PointBalance })
        }
        if (Voucher != null) {
          setVoucher(Voucher)
        }
      } catch (e: any) {
        setFetching(false)
        logError(e)
        setAction('toast', { text: 'Unable to redeem reward.' })
      }
    }
  }, [OptionID])
  const onRedeemPurchase = React.useCallback(async () => {
    if (location != null && OptionID != null) {
      try {
        setFetching(true)
        let response = await API.redeemRewardsPurchase({
          ...(friend != null
            ? {
                Friend: { ...friend, ClientID: location.ClientID, LocationID: location.LocationID },
                Who: 'friend',
              }
            : {}),
          ...location,
          OptionID,
        })
        setFetching(false)
        if (!response.error && (response.code == null || response.code == 200)) {
          setFriendInputVisible(false)
          setPurchaseComplete(true)
        } else {
          setAction('toast', { text: response.message })
        }
      } catch (e: any) {
        setFetching(false)
        logError(e)
        setAction('toast', { text: 'Unable to redeem purchase.' })
      }
    } else {
      setAction('toast', { text: 'Item could not be redeemed.' })
    }
  }, [friend, location, OptionID])
  const onSubmitFriend = React.useCallback((friendInfo: FriendInfo) => {
    setFriend(friendInfo)
    setFriendInputVisible(false)
  }, [])
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClosed}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable onPress={onClosed} style={themeStyle.flexView} />
        <View style={themeStyle.modalContent}>
          <ModalBanner
            alternateStyling={alternateStyling}
            onClose={onClosed}
            title={
              voucher != null
                ? 'Rewards Voucher'
                : friendInputVisible
                  ? 'Enter Friend Info'
                  : locationsVisible
                    ? 'Select Location'
                    : purchaseComplete
                      ? 'Redemption Complete'
                      : 'Confirm Redemption'
            }
          />
          <View
            style={[
              styles.content,
              {
                display:
                  friendInputVisible || locationsVisible || voucher != null || purchaseComplete
                    ? 'none'
                    : 'flex',
              },
            ]}>
            {fetching && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" />
              </View>
            )}
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              <View style={themeStyle.rowBetween}>
                <Text style={themeStyle.itemTitleText}>{Title}</Text>
                <View style={themeStyle.viewCentered}>
                  <Text style={themeStyle.itemTitleText}>{Points} pts</Text>
                </View>
              </View>
              <Text style={styles.finePrintText}>{Description}</Text>
              <Button
                onPress={Type === 'purchase' ? onRedeemPurchase : onRedeem}
                style={styles.purchaseButton}
                text="Redeem"
              />
              <Text style={styles.finePrintText}>
                {`Once you press confirm, ${Points} points will be deducted from your balance. All redemptions are final.`}
              </Text>
            </ScrollView>
          </View>
          <View
            style={[
              styles.content,
              {
                display: locationsVisible && !friendInputVisible ? 'flex' : 'none',
                paddingBottom: themeStyle.scale(40),
              },
            ]}>
            <RewardsLocationSelector locations={locations} onSelect={onLocationSelected} />
          </View>
          <View style={[styles.content, { display: voucher != null ? 'flex' : 'none' }]}>
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled" scrollEnabled={false}>
              <View style={styles.voucherTitleRow}>
                <Text style={themeStyle.itemTitleText}>{Title}</Text>
                <View style={themeStyle.viewCentered}>
                  <Text style={themeStyle.itemTitleText}>{Points} pts</Text>
                </View>
              </View>
              {voucher != null && <Barcode number={voucher} />}
              <Text style={styles.completeText}>
                {`This voucher will expire in 15 minutes.\nYou will not lose your points if it’s not redeemed during that time frame.`}
              </Text>
            </ScrollView>
          </View>
          <View style={[styles.content, { display: purchaseComplete ? 'flex' : 'none' }]}>
            <SvgCss
              color={themeStyle.brandPrimary}
              height={themeStyle.scale(62)}
              style={styles.thankYouImage}
              width={themeStyle.scale(62)}
              xml={media.iconCheckCircle}
            />
            <Text style={styles.thankYouText}>Thank You!</Text>
            <Text style={styles.purchaseCompleteText}>
              {`${Points} points have been deducted\nfrom your balance.`}
            </Text>
          </View>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.friendInputContent}
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
            scrollEnabled={false}
            style={{ display: friendInputVisible ? 'flex' : 'none' }}>
            <Text style={styles.friendIntroText}>
              {`Please enter your friend's info. We'll drop a free class credit into their account and send them an email inviting them to book a class.`}
            </Text>
            <InputFriend
              buttonAnimation={false}
              scrollRef={scrollRef}
              onSubmit={onSubmitFriend}
              visible={friendInputVisible}
            />
          </ScrollView>
        </View>
        <Toast />
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { padding: themeStyle.scale(20) },
    loadingOverlay: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.backgroundModalFade,
      bottom: 0,
      elevation: 2,
      left: 0,
      position: 'absolute' as 'absolute',
      right: 0,
      top: -0.5,
      zIndex: 2,
    },
    finePrintText: {
      ...themeStyle.itemDetailText,
      marginBottom: themeStyle.scale(16),
      marginTop: themeStyle.scale(4),
    },
    purchaseButton: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(12),
      marginTop: themeStyle.scale(20),
      width: '100%' as const,
    },
    voucherTitleRow: { ...themeStyle.rowBetween, marginBottom: themeStyle.scale(16) },
    completeText: {
      ...themeStyle.itemDetailText,
      marginVertical: themeStyle.scale(24),
      textAlign: 'center' as 'center',
    },
    thankYouImage: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(20),
      marginTop: themeStyle.scale(16),
    },
    thankYouText: {
      ...themeStyle.largeTitleText,
      marginBottom: themeStyle.scale(4),
      textAlign: 'center' as 'center',
    },
    purchaseCompleteText: {
      ...themeStyle.textPrimaryRegular16,
      marginBottom: themeStyle.scale(42),
      textAlign: 'center' as 'center',
    },
    friendIntroText: {
      ...themeStyle.textPrimaryRegular14,
      marginBottom: themeStyle.scale(14),
      textAlign: 'center' as 'center',
    },
    friendInputContent: { padding: themeStyle.scale(20) },
  }
}
