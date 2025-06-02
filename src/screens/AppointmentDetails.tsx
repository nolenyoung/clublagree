import moment from 'moment'
import * as React from 'react'
import { FlexAlignType, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import InAppReview from 'react-native-in-app-review'
import { useSelector } from 'react-redux'
import {
  Button,
  ButtonText,
  Icon,
  ModalChooseAppointmentAddOns,
  ModalChooseAppointmentPackage,
  ModalConfirmPurchase,
  ModalPurchaseConfirmation,
  OverlayNoteEntry,
  OverlayClientInfoNeeded,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { addToCalendar, formatCoachName, formatDate, logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, getState, setAction } from '../redux/actions'

export default function AppointmentDetails(
  props: AppointmentStackScreenProps<'AppointmentDetails'>,
): React.ReactElement {
  const { goBack } = props.navigation
  const {
    addOns,
    allowAddons,
    allowNotes,
    allowUnpaid,
    bookingComplete,
    informationRequired,
    notes,
    packageCount,
    packageOptions,
    packages,
    selectedFamilyMember,
    timeSlots,
  } = useSelector((state: ReduxState) => state.appointmentBooking)
  const autoAddToCalendar = useSelector((state: ReduxState) => state.deviceCalendars.autoAdd)
  const PersonID = useSelector((state: ReduxState) => state.user.personId ?? '')
  const { ClientID, Coach, EndDateTime, Location, SessionName, SessionTypeID, StartDateTime } =
    timeSlots[0] ?? {}
  const { CoachID } = Coach ?? {}
  const {
    Address: LocationAddress,
    City: LocationCity,
    LocationID,
    Nickname,
    State: LocationState,
    Virtual,
    Zip: LocationZip,
  } = Location ?? {}
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [infoFormVisible, setInfoFormVisible] = React.useState(false)
  const [modalChooseAddOns, setModalChooseAddOns] = React.useState(false)
  const [modalChoosePackage, setModalChoosePackage] = React.useState(false)
  const [modalConfirmPurchase, setModalConfirmPurchase] = React.useState(false)
  const [modalNoteEntry, setModalNoteEntry] = React.useState(false)
  const [modalPurchaseConfirmation, setModalPurchaseConfirmation] = React.useState(false)
  const [purchaseNeeded, setPurchaseNeeded] = React.useState(false)
  const [selectedAddOns, setSelectedAddOns] = React.useState<Array<AppointmentAddOn>>([])
  const [selectedPackage, setSelectedPackage] = React.useState<any>(null)
  const [savedToCalendar, setSavedToCalendar] = React.useState(false)
  const { ProductID } = selectedPackage || {}
  const onBook = async (skipAddOns: boolean = false) => {
    try {
      setAction('loading', { loading: true })
      const response = await API.createAppointmentBooking({
        ...(selectedAddOns.length > 0 && !skipAddOns
          ? { AddonIDs: selectedAddOns.map((addOn: AppointmentAddOn) => addOn.AddonID).toString() }
          : {}),
        AppointmentDescription: SessionName,
        ClientID,
        CoachID,
        EndDateTime,
        LocationID,
        Notes: notes,
        SessionTypeID,
        StartDateTime,
        User: selectedFamilyMember,
      })
      if (response?.Status === 'Booked') {
        await logEvent(`appt_booked`)
        cleanAction('loading')
        setAction('appointmentBooking', { bookingComplete: true })
        if (autoAddToCalendar) {
          const saved = await addToCalendar(
            [
              {
                Coach,
                EndDateTime,
                Location,
                Name: SessionName,
                StartDateTime,
              },
            ],
            false,
          )
          setSavedToCalendar(saved)
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
    const saved = await addToCalendar(
      [
        {
          Coach,
          EndDateTime,
          Location,
          Name: SessionName,
          StartDateTime,
        },
      ],
      true,
    )
    setSavedToCalendar(saved)
  }, [Coach, EndDateTime, Location, SessionName, StartDateTime])
  const onPurchase = async () => {
    try {
      setModalConfirmPurchase(false)
      setAction('loading', { loading: true })
      const response = await API.createAppointmentBooking({
        AppointmentDescription: SessionName,
        ClientID,
        CoachID,
        EndDateTime,
        LocationID,
        Notes: notes,
        SessionTypeID,
        StartDateTime,
        User: selectedFamilyMember,
      })
      if (response?.Status === 'Booked') {
        await logEvent(`appt_booked`)
        setPurchaseNeeded(false)
        if (selectedAddOns.length > 0) {
          try {
            await API.createPurchaseAddons({
              AddonIDs: selectedAddOns.map((addOn: AppointmentAddOn) => addOn.AddonID).toString(),
              ClientID,
              LocationID,
              PersonClientID: selectedFamilyMember?.ClientID, // uses current user clientID if null
              PersonID: selectedFamilyMember?.PersonID ?? PersonID,
            })
          } catch (e: any) {
            logError(e)
            setAction('toast', { text: 'Unable to purchase add ons.' })
          }
        }
        cleanAction('loading')
        setAction('appointmentBooking', { bookingComplete: true })
        setModalPurchaseConfirmation(true)
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
  const onSelectAddOns = React.useCallback((addOn: AppointmentAddOn, action: 'add' | 'remove') => {
    setSelectedAddOns((prev) => {
      if (action === 'remove') {
        return prev.filter((p) => p.AddonID !== addOn.AddonID)
      } else {
        return [...prev, addOn]
      }
    })
  }, [])
  const onSelectPackage = React.useCallback(
    async (item: AppointmentPackage | AppointmentPackageOptions | Pricing) => {
      setSelectedPackage(item)
      setModalChoosePackage(false)
      if (packageCount === 0) {
        setPurchaseNeeded(true)
        setModalConfirmPurchase(true)
      }
    },
    [packageCount],
  )
  const onSkip = React.useCallback(() => {
    setModalChooseAddOns(false)
    setSelectedAddOns([])
    onBook(true)
  }, [onBook])
  const onToggleAddOnsModal = React.useCallback(() => {
    setModalChooseAddOns((prev) => !prev)
  }, [])
  const onTogglePackageModal = React.useCallback(() => {
    setModalChoosePackage((prev) => !prev)
  }, [])
  React.useEffect(() => {
    const {
      oneTimeMoments: { appReview: dateReviewed },
      user: { promptReview },
    } = getState()
    if (
      bookingComplete &&
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
  }, [bookingComplete, modalPurchaseConfirmation])
  const bookAnyway = allowUnpaid && packageCount === 0 && packageOptions.length === 0
  const showAddons = addOns.length > 0 && allowAddons
  return (
    <View style={themeStyle.flexView}>
      <View style={themeStyle.screenSecondary}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollToOverflowEnabled={true}
          showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            hitSlop={themeStyle.hitSlop}
            onPress={() => goBack()}
            style={styles.backButton}>
            <Icon name="arrow-back" style={themeStyle.closeIcon} />
          </TouchableOpacity>
          <View style={themeStyle.flexViewCentered}>
            <Text style={styles.titleText}>
              {bookingComplete ? `You're booked.` : `Let's book it.`}
            </Text>
            <View style={styles.classDescriptionView}>
              <Text style={styles.classNameText}>{SessionName}</Text>
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
                  : `${LocationAddress}\n${LocationCity}, ${LocationState} ${LocationZip}`}
              </Text>
              {Brand.STRING_BOOKING_DISCLAIMER != null && (
                <Text style={styles.disclaimerText}>{Brand.STRING_BOOKING_DISCLAIMER}</Text>
              )}
            </View>
            {!bookingComplete && allowNotes && (
              <TouchableOpacity onPress={() => setModalNoteEntry(true)} style={styles.notesButton}>
                <View style={themeStyle.rowAligned}>
                  <Icon name="edit" style={styles.notesIcon} />
                  <Text>{notes.trim() !== '' ? 'Edit Notes' : `Add Notes (optional)`}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          {!bookingComplete && (
            <View style={styles.buttonView}>
              <Button
                color={themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys]}
                gradient={Brand.BUTTON_GRADIENT}
                onPress={
                  informationRequired != null
                    ? () => setInfoFormVisible(true)
                    : packageCount !== 1 &&
                        (selectedPackage == null || purchaseNeeded) &&
                        !bookAnyway
                      ? onTogglePackageModal
                      : showAddons
                        ? onToggleAddOnsModal
                        : onBook
                }
                style={styles.bookButton}
                text={
                  informationRequired != null
                    ? 'Enter Info'
                    : packageCount > 1 && selectedPackage == null
                      ? 'Select Available Credit'
                      : packageCount === 1 ||
                          (selectedPackage != null && !purchaseNeeded) ||
                          bookAnyway
                        ? 'Book It!'
                        : 'Buy a Pass'
                }
                textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
              />
              {(packages.length > 1 || (packages.length === 1 && packages[0].Remaining > 1)) &&
                informationRequired == null && (
                  <ButtonText
                    onPress={async () => {
                      await logEvent('appt_book_multiple')
                      setAction('appointmentBooking', { multiple: true })
                      goBack()
                    }}
                    style={styles.bookMultipleButton}
                    text={`Book Multiple`}
                    textStyle={styles.bookMultipleButtonText}
                  />
                )}
            </View>
          )}
          {bookingComplete && (
            <View style={styles.buttonRow}>
              <TouchableOpacity disabled={savedToCalendar} onPress={onCalendarAdd}>
                <View style={themeStyle.viewCentered}>
                  <Icon name="date-range" style={styles.icon} />
                  <Text style={styles.shareText}>Add to Calendar</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
      {showAddons && (
        <ModalChooseAppointmentAddOns
          addOns={addOns}
          onClose={onToggleAddOnsModal}
          onContinue={onContinue}
          onSelect={onSelectAddOns}
          onSkip={onSkip}
          selectedAddOns={selectedAddOns}
          visible={modalChooseAddOns}
        />
      )}
      <ModalChooseAppointmentPackage
        onClose={onTogglePackageModal}
        onSelect={onSelectPackage}
        packageOptions={packageOptions}
        packages={packages}
        selectionMode={packageCount === 0 ? 'buy' : 'select'}
        visible={modalChoosePackage}
      />
      {modalConfirmPurchase && selectedPackage != null && (
        <ModalConfirmPurchase
          alternateStyling={true}
          ClientID={ClientID}
          LocationID={LocationID}
          PersonClientID={selectedFamilyMember?.ClientID}
          PersonID={PersonID}
          onClose={() => setModalConfirmPurchase(false)}
          onPurchaseSuccess={async () => {
            setPurchaseNeeded(false)
            await logEvent('appt_package_purchased')
            if (showAddons) {
              setModalConfirmPurchase(false)
              setTimeout(() => setModalChooseAddOns(true), 300)
            } else {
              onPurchase()
            }
          }}
          selectedPackage={selectedPackage}
        />
      )}
      {infoFormVisible && informationRequired != null && (
        <OverlayClientInfoNeeded
          onClose={() => setInfoFormVisible(false)}
          onSuccess={() => {
            setAction('appointmentBooking', { informationRequired: null })
            setInfoFormVisible(false)
          }}
          requiredInfo={informationRequired}
        />
      )}
      {modalNoteEntry && (
        <OverlayNoteEntry
          borderColor={themeStyle[Brand.COLOR_LOGIN_INPUT_BORDER as ColorKeys]}
          containerStyle={styles.notesContainer}
          multiline={true}
          notes={notes}
          onChangeText={({ text }) => setAction('appointmentBooking', { notes: text })}
          onClose={() => setModalNoteEntry(false)}
          placeholder="Notes (optional)"
          placeholderTextColor={themeStyle.textBlack50}
        />
      )}
      {bookingComplete && modalPurchaseConfirmation && (
        <ModalPurchaseConfirmation
          onClose={() => setModalPurchaseConfirmation(false)}
          visible={modalPurchaseConfirmation}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    scrollContent: { flexGrow: 1 },
    backButton: {
      position: 'absolute' as 'absolute',
      top: themeStyle.hasNotch ? themeStyle.scale(54) : themeStyle.scale(44),
    },
    backIcon: {
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_ACTION_ICON as ColorKeys],
      fontSize: themeStyle.scale(20),
    },
    titleText: {
      ...themeStyle.screenSecondaryTitleText,
      marginBottom: themeStyle.scale(34),
      marginTop: themeStyle.scale(34),
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
      ...themeStyle.getTextStyle({
        color: Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys,
        font: 'fontPrimaryBold',
        size: 24,
      }),
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
      textAlign: 'center' as 'center',
    },
    disclaimerText: {
      ...themeStyle.getTextStyle({
        color: Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys,
        font: 'fontPrimaryRegular',
        size: 10,
      }),
      marginTop: themeStyle.scale(16),
    },
    notesButton: { marginVertical: themeStyle.scale(16) },
    notesIcon: {
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_ACTION_ICON as ColorKeys],
      fontSize: themeStyle.scale(18),
      marginRight: themeStyle.scale(8),
    },
    notesContainer: {
      backgroundColor: themeStyle.colorWhite,
      borderColor: themeStyle[Brand.COLOR_SECONDARY_SCREEN_SEPARATOR as ColorKeys],
      borderWidth: themeStyle.scale(1),
      maxHeight: themeStyle.scale(236),
      minHeight: themeStyle.scale(120),
      marginVertical: themeStyle.scale(16),
      padding: themeStyle.scale(8),
    },
    buttonView: { alignItems: 'center' as FlexAlignType, marginBottom: themeStyle.scale(52) },
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
