import moment from 'moment'
import * as React from 'react'
import { Platform, Text, TouchableOpacity, View } from 'react-native'
import InAppReview from 'react-native-in-app-review'
import Share from 'react-native-share'
import { useSelector } from 'react-redux'
import {
  Avatar,
  Button,
  ButtonText,
  Icon,
  ModalBringFriend,
  ModalChooseAddOns,
  ModalChoosePackage,
  ModalConfirmPurchase,
  ModalFitMetrixBooking,
  ModalPurchaseConfirmation,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import {
  addToCalendar,
  formatCoachName,
  formatDate,
  formatEventInfo,
  logError,
  logEvent,
} from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'
import ClassBookingSpot from './ClassBookingSpot'
import OverlayClientInfoNeeded from '../components/OverlayClientInfoNeeded'

export default function ClassBooking(
  props: ScheduleStackScreenProps<'ClassBooking'> | WorkshopStackScreenProps<'ClassBooking'>,
) {
  const { goBack, navigate, popToTop } =
    props.navigation as ScheduleStackScreenProps<'ClassBooking'>['navigation']
  const {
    Addons = [] as Array<AddOn>,
    Class,
    informationRequired,
    Layout,
    PackageCount,
    PackageOptions,
    Packages,
    SpotID,
    Status,
  } = useSelector((state: ReduxState) => state.bookingDetails)
  const autoAddToCalendar = useSelector((state: ReduxState) => state.deviceCalendars.autoAdd)
  const dateReviewed = useSelector((state: ReduxState) => state.oneTimeMoments.appReview)
  const previousScreen = useSelector((state: ReduxState) => state.screens.previousScreen)
  const promptReview = useSelector((state: ReduxState) => state.user.promptReview)
  const {
    ClientID,
    Coach,
    EndDateTime,
    Location,
    Name,
    PersonID,
    PersonClientID,
    RegistrationID,
    StartDateTime,
  } = Class ?? {}
  const { ClassType } = (Class ?? {}) as Partial<ClassInfo>
  const { Headshot } = Coach ?? {}
  const {
    Address: LocationAddress,
    City: LocationCity,
    LocationID,
    Nickname,
    State: LocationState,
    Virtual,
    Zip: LocationZip,
  } = Location ?? {}
  const { isClassFull } = Status
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [bookingConfirmed, setBookingConfirmed] = React.useState(false)
  const [bringFriendAvailable, setBringFriendAvailable] = React.useState(false)
  const [modalBringFriend, setModalBringFriend] = React.useState(false)
  const [modalChooseAddOns, setModalChooseAddOns] = React.useState(false)
  const [modalChoosePackage, setModalChoosePackage] = React.useState(false)
  const [modalChooseSpot, setModalChooseSpot] = React.useState(false)
  const [modalConfirmPurchase, setModalConfirmPurchase] = React.useState(false)
  const [modalFitMetrixBooking, setModalFitMetrixBooking] = React.useState(false)
  const [modalPurchaseConfirmation, setModalPurchaseConfirmation] = React.useState(false)
  const [purchaseNeeded, setPurchaseNeeded] = React.useState(false)
  const [selectedAddOns, setSelectedAddOns] = React.useState<Array<AddOn>>([])
  const [selectedPackage, setSelectedPackage] = React.useState<any>(null)
  const [savedToCalendar, setSavedToCalendar] = React.useState(false)
  const { PackageID, ProductID } = selectedPackage || {}
  const onBook = async (skipAddOns: boolean = false) => {
    try {
      setAction('loading', { loading: true })
      const response = await API[isClassFull ? 'createWaitlistSpot' : 'createClassBooking']({
        ...(Brand.UI_PICK_SPOT && SpotID != null ? { Spot: SpotID } : {}),
        ClientID: ClientID ?? 0,
        PackageID: PackageID ?? Packages[0]?.PackageID,
        PersonClientID,
        PersonID,
        RegistrationID: RegistrationID ?? 0,
      })
      if (response?.Status === 'Success') {
        await logEvent(`booking_${isClassFull ? 'waitlist' : 'book'}`)
        if (selectedAddOns.length > 0 && !skipAddOns) {
          try {
            await API.createPurchaseAddons({
              AddonIDs: selectedAddOns.map((addOn) => addOn.ProductID).toString(),
              ClientID: ClientID ?? 0,
              LocationID: LocationID ?? 0,
              PersonClientID,
              PersonID,
              RegistrationID,
            })
          } catch (e: any) {
            logError(e)
            setAction('toast', { text: 'Unable to purchase add ons.' })
          }
        }
        cleanAction('loading')
        setBringFriendAvailable(response.bringFriendAvailable)
        setBookingConfirmed(true)
        if (autoAddToCalendar && Class != null) {
          const saved = await addToCalendar([Class], false)
          setSavedToCalendar(saved)
        }
        const goToSpots =
          Brand.UI_PICK_SPOT &&
          (Layout?.Layout?.length ?? 0) > 0 &&
          !Layout?.NoSpotsAvailable &&
          !isClassFull
        if (goToSpots && response?.spotBooked === false) {
          setModalChooseSpot(true)
        }
      } else {
        cleanAction('loading')
        setAction('toast', { text: response.message })
      }
    } catch (e: any) {
      logError(e)
      setAction('toast', { text: 'Unable to complete booking.' })
      cleanAction('loading')
    }
  }
  const onCalendarAdd = React.useCallback(async () => {
    if (Class != null) {
      const saved = await addToCalendar([Class], true)
      setSavedToCalendar(saved)
    }
  }, [Class, Location])
  const onPurchase = async () => {
    try {
      setModalConfirmPurchase(false)
      if (Brand.UI_FITMETRIX_BOOKING) {
        setTimeout(() => setModalFitMetrixBooking && setModalFitMetrixBooking(true), 300)
        return
      }
      setAction('loading', { loading: true })
      const response = await API[isClassFull ? 'createWaitlistSpot' : 'createClassBooking']({
        ...(Brand.UI_PICK_SPOT && SpotID != null ? { Spot: SpotID } : {}),
        ClientID: ClientID ?? 0,
        PackageID: ProductID,
        PersonClientID,
        PersonID,
        RegistrationID: RegistrationID ?? 0,
      })
      if (response?.Status === 'Success') {
        await logEvent(`booking_${isClassFull ? 'waitlist' : 'book'}`)
        setPurchaseNeeded(false)
        if (selectedAddOns.length > 0) {
          try {
            await API.createPurchaseAddons({
              AddonIDs: selectedAddOns.map((addOn) => addOn.ProductID).toString(),
              ClientID: ClientID ?? 0,
              LocationID: LocationID ?? 0,
              PersonClientID,
              PersonID,
              RegistrationID,
            })
          } catch (e: any) {
            logError(e)
            setAction('toast', { text: 'Unable to purchase add ons.' })
          }
        }
        cleanAction('loading')
        setModalPurchaseConfirmation(true)
        setBookingConfirmed(true)
        const goToSpots =
          Brand.UI_PICK_SPOT &&
          (Layout?.Layout?.length ?? 0) > 0 &&
          !Layout?.NoSpotsAvailable &&
          !isClassFull
        if (goToSpots && response?.spotBooked === false) {
          setModalChooseSpot(true)
        }
      } else {
        cleanAction('loading')
        setAction('toast', { text: response.message })
      }
    } catch (e: any) {
      logError(e)
      cleanAction('loading')
    }
  }
  const onContinue = React.useCallback(() => {
    setModalChooseAddOns(false)
    if (ProductID != null) {
      onPurchase()
    } else {
      onBook()
    }
  }, [onBook, onPurchase, ProductID])
  const onExit = async () => {
    await logEvent('booking_exit')
    popToTop()
  }
  const onSelectAddOns = React.useCallback((addOn: AddOn, action: 'add' | 'remove') => {
    setSelectedAddOns((prev) => {
      if (action === 'remove') {
        return prev.filter((p) => p.ProductID !== addOn.ProductID)
      } else {
        return [...prev, addOn]
      }
    })
  }, [])
  const onSelectPackage = React.useCallback(
    async (item: Pricing | Package) => {
      await logEvent('booking_package_selected')
      setSelectedPackage(item)
      setModalChoosePackage(false)
      if (PackageCount === 0) {
        setPurchaseNeeded(true)
        setModalConfirmPurchase(true)
      }
    },
    [PackageCount],
  )
  const onShare = React.useCallback(async () => {
    try {
      if (Class != null) {
        const event = formatEventInfo(Class)
        await Share.open({
          failOnCancel: false,
          message: Platform.OS === 'android' ? event.description : event.notes,
          title: event.title,
          url: '',
        })
        await logEvent('booking_share_info')
      }
    } catch (e: any) {
      logError(e)
    }
  }, [Class])
  React.useEffect(() => {
    if (
      bookingConfirmed &&
      !modalChooseSpot &&
      !modalPurchaseConfirmation &&
      promptReview &&
      (dateReviewed == null || moment().isAfter(moment(dateReviewed, 'YYYY-MM-DD').add(90, 'days')))
    ) {
      InAppReview.RequestInAppReview()
        .then((hasFlowFinishedSuccessfully) => {
          if (hasFlowFinishedSuccessfully) {
            setAction('oneTimeMoments', { appReview: moment().format('YYYY-MM-DD') })
          }
        })
        .catch(() => {})
    }
  }, [bookingConfirmed, dateReviewed, modalChooseSpot, modalPurchaseConfirmation, promptReview])
  if (informationRequired != null) {
    return (
      <OverlayClientInfoNeeded
        onClose={onExit}
        onSuccess={() => {
          setAction('bookingDetails', { informationRequired: null })
        }}
        requiredInfo={informationRequired}
      />
    )
  }
  return (
    <>
      <View style={[themeStyle.screenSecondary, modalChooseSpot && { display: 'none' }]}>
        <TouchableOpacity
          hitSlop={themeStyle.hitSlop}
          onPress={onExit}
          style={themeStyle.buttonClose}>
          <Icon
            name="clear"
            style={[
              themeStyle.closeIcon,
              { color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys] },
            ]}
          />
        </TouchableOpacity>
        <View style={themeStyle.flexViewCentered}>
          {Brand.UI_BOOKING_AVATAR && (
            <Avatar size={themeStyle.scale(111)} style={styles.avatar} source={Headshot} />
          )}
          <Text style={styles.titleText}>
            {bookingConfirmed
              ? isClassFull
                ? `You're waitlisted.`
                : `You're booked.`
              : isClassFull
                ? Brand.STRING_BOOKING_CLASS_FULL
                : `Let's book it.`}
          </Text>
          <View style={styles.classDescriptionView}>
            <Text style={styles.classNameText}>{Name}</Text>
            <Text style={styles.dateText}>
              {moment(StartDateTime).format(formatDate('dddd, MMMM D'))}
            </Text>
            <Text style={styles.timeText}>
              {`${moment(StartDateTime).format('h:mma')} - ${moment(EndDateTime).format('h:mma')}${
                Brand.UI_COACH_HIDE_UPCOMING
                  ? ''
                  : '\n' + formatCoachName({ addWith: true, coach: Coach })
              }`}
            </Text>
          </View>
          <View style={styles.locationView}>
            <Text style={styles.dateText}>{Nickname}</Text>
            <Text style={styles.locationText}>
              {Virtual == '1'
                ? 'This is a virtual class.'
                : `${LocationAddress ?? ''}\n${LocationCity ?? ''}, ${LocationState ?? ''} ${
                    LocationZip ?? ''
                  }`}
            </Text>
            {Brand.STRING_BOOKING_DISCLAIMER != null && (
              <Text style={styles.disclaimerText}>{Brand.STRING_BOOKING_DISCLAIMER}</Text>
            )}
            {bringFriendAvailable && !isClassFull && bookingConfirmed && (
              <Button
                color={themeStyle[Brand.COLOR_BUTTON_BRING_FRIEND as ColorKeys]}
                gradient={Brand.BUTTON_GRADIENT}
                onPress={async () => {
                  setModalBringFriend(true)
                  await logEvent('booking_bring_friend')
                }}
                small={true}
                style={styles.bringFriendButton}
                text="Bring a Friend"
              />
            )}
          </View>
        </View>
        {!bookingConfirmed && (
          <View style={styles.buttonView}>
            <Button
              color={themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys]}
              gradient={Brand.BUTTON_GRADIENT}
              onPress={
                PackageCount !== 1 && (selectedPackage == null || purchaseNeeded)
                  ? async () => {
                      setModalChoosePackage(true)
                      await logEvent(`booking_package_${PackageCount === 0 ? 'buy' : 'choose'}`)
                    }
                  : Addons.length > 0 && !isClassFull
                    ? async () => {
                        setModalChooseAddOns(true)
                        await logEvent('booking_addons')
                      }
                    : () => onBook()
              }
              style={styles.bookButton}
              text={
                PackageCount > 1 && selectedPackage == null
                  ? 'Select Available Credit'
                  : PackageCount === 1 || (selectedPackage != null && !purchaseNeeded)
                    ? isClassFull
                      ? 'Get on the List!'
                      : 'Book It!'
                    : 'Buy a Pass'
              }
              textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
            />
            {((selectedPackage?.Remaining ?? 0) > 0 ||
              (PackageCount === 1 && (Packages[0]?.Remaining ?? 0) > 0)) &&
              !isClassFull && (
                <ButtonText
                  onPress={async () => {
                    await logEvent('booking_book_multiple')
                    navigate('ClassBookingMultiple', {
                      PackageID: PackageID ?? Packages[0].PackageID,
                    })
                  }}
                  style={styles.bookMultipleButton}
                  text={`Book Multiple ${Brand.STRING_CLASS_TITLE_PLURAL}`}
                  textStyle={styles.bookMultipleButtonText}
                />
              )}
          </View>
        )}
        {bookingConfirmed && (
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onShare}>
              <View style={themeStyle.viewCentered}>
                <Icon name="share" style={styles.icon} />
                <Text allowFontScaling={false} style={styles.shareText}>
                  Share Class Info
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity disabled={savedToCalendar} onPress={onCalendarAdd}>
              <View style={themeStyle.viewCentered}>
                <Icon name="date-range" style={styles.icon} />
                <Text allowFontScaling={false} style={styles.shareText}>
                  Add to Calendar
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        {bookingConfirmed && modalBringFriend && (
          <ModalBringFriend
            alternateStyling={true}
            classInfo={{ ...Class, PackageID: Packages[0]?.PackageID }}
            onClose={async () => {
              setModalBringFriend(false)
              await logEvent('bring_friend_exit')
            }}
          />
        )}
        {Addons.length > 0 && (
          <ModalChooseAddOns
            addOns={Addons}
            onClose={() => setModalChooseAddOns(false)}
            onContinue={onContinue}
            onSelect={onSelectAddOns}
            onSkip={async () => {
              setModalChooseAddOns(false)
              setSelectedAddOns([])
              onBook(true)
              await logEvent('booking_addons_skip')
            }}
            selectedAddOns={selectedAddOns}
            visible={modalChooseAddOns}
          />
        )}
        {modalChoosePackage && (
          <ModalChoosePackage
            onClose={() => setModalChoosePackage(false)}
            onSelect={onSelectPackage}
            packageOptions={PackageOptions}
            packages={Packages}
            selectionMode={PackageCount === 0 ? 'buy' : 'select'}
          />
        )}
        {Brand.UI_FITMETRIX_BOOKING && Class != null && (
          <ModalFitMetrixBooking
            onClose={() => goBack()}
            selectedClass={Class}
            title={`Book a ${Brand.STRING_CLASS_TITLE}`}
            visible={modalFitMetrixBooking}
          />
        )}
        {bookingConfirmed && modalPurchaseConfirmation && (
          <ModalPurchaseConfirmation
            onClose={() => setModalPurchaseConfirmation(false)}
            visible={modalPurchaseConfirmation}
          />
        )}
      </View>
      {modalChooseSpot && (
        <ClassBookingSpot isEdit={true} onClose={() => setModalChooseSpot(false)} />
      )}
      {modalConfirmPurchase && selectedPackage != null && (
        <ModalConfirmPurchase
          alternateStyling={true}
          ClientID={ClientID ?? 0}
          LocationID={LocationID ?? 0}
          onClose={() => setModalConfirmPurchase(false)}
          onPurchaseSuccess={async () => {
            setPurchaseNeeded(false)
            await logEvent('booking_package_purchased')
            if (Addons.length > 0 && !isClassFull) {
              setModalConfirmPurchase(false)
              setTimeout(async () => {
                setModalChooseAddOns(true)
                await logEvent('booking_addons')
              }, 300)
            } else {
              onPurchase()
            }
          }}
          PersonClientID={PersonClientID}
          PersonID={PersonID}
          RegistrationID={RegistrationID}
          selectedPackage={selectedPackage}
        />
      )}
    </>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    avatar: { marginBottom: themeStyle.scale(16) },
    titleText: {
      ...themeStyle.screenSecondaryTitleText,
      marginBottom: themeStyle.scale(34),
      textAlign: 'center' as 'center',
    },
    classDescriptionView: {
      ...themeStyle.viewCentered,
      borderColor: themeStyle[Brand.COLOR_SECONDARY_SCREEN_SEPARATOR as ColorKeys],
      borderBottomWidth: themeStyle.scale(1),
      borderTopWidth: themeStyle.scale(1),
      paddingVertical: themeStyle.scale(22),
      width: '100%' as const,
    },
    classNameText: {
      ...themeStyle.sectionTitleText,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
      marginBottom: themeStyle.scale(4),
      textAlign: 'center' as 'center',
    },
    dateText: {
      ...themeStyle.getTextStyle({
        color: Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys,
        font: 'fontPrimaryBold',
        size: 16,
      }),
      marginBottom: themeStyle.scale(6),
      textAlign: 'center' as 'center',
    },
    timeText: {
      ...themeStyle.getTextStyle({
        color: Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys,
        font: 'fontPrimaryRegular',
        size: 16,
      }),
      textAlign: 'center' as 'center',
      textTransform: Brand.TRANSFORM_BUTTON_SMALL_TEXT as TextTransform,
    },
    locationView: {
      ...themeStyle.viewCentered,
      paddingVertical: themeStyle.scale(22),
      width: '100%' as const,
    },
    locationText: {
      ...themeStyle.getTextStyle({
        color: Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys,
        font: 'fontPrimaryRegular',
        size: 13,
      }),
      opacity: 0.8,
      textAlign: 'center' as 'center',
    },
    disclaimerText: {
      ...themeStyle.getTextStyle({ color: 'lightGray', font: 'fontPrimaryRegular', size: 10 }),
      marginTop: themeStyle.scale(16),
    },
    buttonView: { alignItems: 'center' as 'center', marginBottom: themeStyle.scale(52) },
    bookButton: { width: '100%' as const },
    bookMultipleButton: { marginTop: themeStyle.scale(30) },
    bookMultipleButtonText: {
      ...themeStyle.getTextStyle({
        color: Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys,
        font: 'fontPrimaryBold',
        size: 19,
      }),
      textTransform: Brand.TRANSFORM_BUTTON_SMALL_TEXT as TextTransform,
    },
    bringFriendButton: { marginTop: themeStyle.scale(16) },
    buttonRow: { ...themeStyle.rowAlignedEvenly, marginBottom: themeStyle.scale(40) },
    shareText: themeStyle.getTextStyle({
      color: Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys,
      font: 'fontPrimaryRegular',
      size: 16,
    }),
    icon: {
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_ACTION_ICON as ColorKeys],
      fontSize: themeStyle.scale(30),
      marginBottom: themeStyle.scale(8),
    },
  }
}
