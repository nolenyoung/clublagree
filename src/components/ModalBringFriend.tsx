import moment from 'moment'
import * as React from 'react'
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SvgCss } from 'react-native-svg/css'
import media from '../assets/media'
import Button from './Button'
import InputBilling from './InputBilling'
import InputFriend from './InputFriend'
import ModalBanner from './ModalBanner'
import PackageOptionsList from './PackageOptionsList'
import Toast from './Toast'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { formatDate, formatCoachName, formatName, logError, logEvent } from '../global/Functions'
import { useKeyboardListener, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  alternateStyling?: boolean
  classInfo:
    | Partial<BookedClassInfo>
    | (ClassInfo & {
        PackageID: number
      })
  onClose: () => Promise<void> | void
}

export default function ModalBringFriend(props: Props): React.ReactElement {
  const { alternateStyling, classInfo, onClose } = props
  const {
    Coach,
    ClientID,
    Location,
    Name,
    PackageID,
    PersonClientID,
    PersonID,
    RegistrationID,
    StartDateTime,
  } = classInfo
  const { LocationID } = Location ?? {}
  const { height: keyboardHeight, open: keyboardOpen } = useKeyboardListener()
  const scrollRef = React.useRef<ScrollView | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [billingError, setBillingError] = React.useState<any>(null)
  const [bookingSuccess, setBookingSuccess] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [savedFriendInfo, setSavedFriendInfo] = React.useState<any>(null)
  const [packageOptions, setPackageOptions] = React.useState<Pricing[]>([])
  const [selectedPackage, setSelectedPackage] = React.useState<Pricing | null | undefined>(null)
  const onSubmit = React.useCallback(
    async (friendInfo: FriendInfo) => {
      try {
        let info: CreateBookingInfo = {
          ClientID: ClientID ?? 0,
          PackageID,
          PersonClientID,
          PersonID,
          RegistrationID: RegistrationID ?? 0,
        }
        if (packageOptions.length > 0) {
          if (selectedPackage == null) {
            cleanAction('activeButton')
            setAction('toast', { text: 'Please select a package to purchase.' })
            return
          } else {
            info = { ...info, ProductID: selectedPackage.ProductID }
          }
        }
        let response = await API.createClassBookingFriend({ classInfo: info, friendInfo })
        setLoading(false)
        cleanAction('activeButton')
        if (response?.code === 508) {
          setAction('toast', { text: response.message })
          setSavedFriendInfo(friendInfo)
          setBillingError('buy')
        } else {
          if (response?.Status === 'Success') {
            setSavedFriendInfo(friendInfo)
            setBookingSuccess(true)
            await logEvent('bring_friend_completed')
          } else {
            setAction('toast', { text: Brand.STRING_ERROR_BRING_FRIEND ?? response.message })
          }
        }
      } catch (e: any) {
        logError(e)
        cleanAction('activeButton')
        setAction('toast', { text: 'Unable to book friend.' })
      }
    },
    [
      ClientID,
      LocationID,
      PackageID,
      packageOptions,
      PersonClientID,
      PersonID,
      RegistrationID,
      selectedPackage,
    ],
  )
  React.useEffect(() => {
    ;(async function checkPrebook() {
      try {
        let response = await API.createClassPreBook({
          ClientID: ClientID ?? 0,
          Friend: true,
          PersonClientID,
          PersonID,
          RegistrationID: RegistrationID ?? 0,
        })
        const { MembershipOptions = [], PackageCount = 0, PackageOptions = [] } = response
        if (PackageCount === 0) {
          if (PackageOptions.length === 0) {
            setAction('toast', {
              text: `I’m sorry, but ‘bring a friend’ is not available for this class. Please contact the studio for assistance.`,
            })
            onClose()
          } else {
            let highlightedOptions: Array<Pricing> = []
            let regularOptions: Array<Pricing> = []
            for (const option of PackageOptions) {
              option.Highlight == 1 ? highlightedOptions.push(option) : regularOptions.push(option)
            }
            setPackageOptions([
              ...highlightedOptions,
              ...MembershipOptions.map((option: Pricing) => ({ ...option, isMembership: true })),
              ...regularOptions,
            ])
            setLoading(false)
          }
        }
        setLoading(false)
      } catch (e: any) {
        logError(e)
        setLoading(false)
        setAction('toast', { text: 'Unable to check available package options.' })
        onClose()
      }
    })()
  }, [ClientID, PersonClientID, PersonID, RegistrationID])
  const hasDisclaimer = Brand.STRING_BRING_FRIEND_DISCLAIMER != null
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={keyboardOpen ? () => Keyboard.dismiss() : onClose}
          style={themeStyle.flexView}
        />
        <Animated.View style={[themeStyle.modalContent, { marginBottom: keyboardHeight }]}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" />
            </View>
          )}
          <ModalBanner
            alternateStyling={alternateStyling}
            onClose={onClose}
            title={bookingSuccess ? 'Booking Confirmed' : 'Bring a Friend'}
          />
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
            style={{ display: billingError != null ? 'none' : 'flex' }}>
            {bookingSuccess ? (
              <View style={styles.inputView}>
                <SvgCss
                  color={themeStyle.brandPrimary}
                  height={themeStyle.scale(62)}
                  style={styles.successImage}
                  width={themeStyle.scale(62)}
                  xml={media.iconCheckCircle}
                />
                <Text style={styles.completeText}>
                  {`Your friend `}
                  <Text style={themeStyle.textPrimaryBold16}>
                    {formatName(savedFriendInfo?.FirstName, savedFriendInfo?.LastName)}
                  </Text>
                  {`\nhas been booked to join you.${Brand.STRING_BRING_FRIEND_SUCCESS ?? ''}`}
                </Text>
                <Text style={styles.classNameText}>{Name}</Text>
                <Text style={styles.dateText}>
                  {moment(StartDateTime).format(formatDate('dddd, MMMM D [at] h:mma'))}
                </Text>
                <Text style={styles.timeText}>
                  {formatCoachName({ addWith: true, coach: Coach })}
                </Text>
                <Button
                  gradient={Brand.BUTTON_GRADIENT}
                  onPress={onClose}
                  style={styles.submitButton}
                  text="Done"
                />
              </View>
            ) : (
              <View style={styles.inputView}>
                <Text style={styles.classNameText}>{Name}</Text>
                <Text style={styles.dateText}>
                  {moment(StartDateTime).format(formatDate('dddd, MMMM D [at] h:mma'))}
                </Text>
                <Text style={styles.timeText}>
                  {formatCoachName({ addWith: true, coach: Coach })}
                </Text>
                <Text
                  style={[
                    styles.introText,
                    hasDisclaimer && { marginBottom: themeStyle.scale(4) },
                  ]}>
                  {packageOptions.length !== 0
                    ? Brand.STRING_BRING_FRIEND_INTRO_NO_PACKAGES
                    : Brand.STRING_BRING_FRIEND_INTRO}
                </Text>
                {hasDisclaimer && (
                  <Text style={styles.disclaimerText}>{Brand.STRING_BRING_FRIEND_DISCLAIMER}</Text>
                )}
                <PackageOptionsList
                  alternateStyling={true}
                  //@ts-ignore
                  onSelect={async (p) => {
                    setSelectedPackage(p)
                    await logEvent('bring_friend_package_selected')
                  }}
                  packageOptions={packageOptions}
                  packages={[]}
                  scrollEnabled={false}
                  selectionMode="buy"
                  //@ts-ignore
                  selectedItem={selectedPackage}
                />
                <Text style={styles.sectionTitle}>{`Your Friend's Info`}</Text>
                <InputFriend scrollRef={scrollRef} onSubmit={onSubmit} visible={true} />
              </View>
            )}
          </ScrollView>
          <View style={[styles.content, { display: billingError != null ? 'flex' : 'none' }]}>
            <InputBilling
              modalSelection={false}
              onUpdated={() => {
                setBillingError(null)
                if (savedFriendInfo != null) {
                  setLoading(true)
                  onSubmit(savedFriendInfo)
                }
              }}
            />
          </View>
        </Animated.View>
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
    inputView: { padding: themeStyle.scale(20) },
    classNameText: {
      ...themeStyle.textPrimaryBold16,
      marginBottom: themeStyle.scale(4),
      textAlign: 'center' as 'center',
      textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
    },
    dateText: {
      ...themeStyle.textPrimaryMedium16,
      marginBottom: themeStyle.scale(4),
      textAlign: 'center' as 'center',
    },
    timeText: { ...themeStyle.textPrimaryRegular16, textAlign: 'center' as 'center' },
    introText: {
      ...themeStyle.textPrimaryRegular14,
      marginVertical: themeStyle.scale(14),
      textAlign: 'center' as 'center',
    },
    disclaimerText: {
      ...themeStyle.getTextStyle({ color: 'textGray', font: 'fontPrimaryItalic', size: 10 }),
      marginBottom: themeStyle.scale(14),
    },
    sectionTitle: {
      ...themeStyle.sectionTitleText,
      marginBottom: themeStyle.scale(16),
      textAlign: 'center' as 'center',
    },
    successImage: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(20),
      marginTop: themeStyle.scale(16),
    },
    completeText: {
      ...themeStyle.textPrimaryRegular16,
      marginBottom: themeStyle.scale(20),
      textAlign: 'center' as 'center',
    },
    submitButton: {
      marginBottom: themeStyle.scale(10),
      marginTop: themeStyle.scale(42),
      width: '100%' as const,
    },
  }
}

type CreateBookingInfo = {
  ClientID: number
  PackageID: number | undefined
  PersonClientID: number | null | undefined
  PersonID: string | undefined
  ProductID?: number | undefined
  RegistrationID: number
}
