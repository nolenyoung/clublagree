import moment from 'moment'
import * as React from 'react'
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { BasicDayProps } from 'react-native-calendars/src/calendar/day/basic'
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated'
import Button from './Button'
import ButtonText from './ButtonText'
import ContractSigning from './ContractSigning'
import Icon from './Icon'
import InputBilling from './InputBilling'
import ModalBanner from './ModalBanner'
import Toast from './Toast'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { ANIMATION_DURATIONS } from '../global/Constants'
import { logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = {
  alternateStyling?: boolean
  ClientID: number
  LocationID: number
  onClose: () => void
  onPurchaseSuccess: () => Promise<void> | void
  PersonClientID: number | undefined | null
  PersonID?: string
  RegistrationID?: number | undefined
  selectedPackage: Pricing & { Name?: string }
}

const currentMonth = moment().format('YYYY-MM')
const maxStartDate = moment().add(60, 'days').endOf('day').format('YYYY-MM-DD')
const today = moment().format('YYYY-MM-DD')

// Conditionally render this modal so that state resets whenever it is closed

export default function ModalConfirmPurchase(props: Props): React.ReactElement {
  const {
    alternateStyling,
    ClientID,
    LocationID,
    onClose,
    onPurchaseSuccess,
    PersonClientID,
    PersonID,
    RegistrationID,
    selectedPackage,
  } = props
  const {
    AllowChooseStartDateContract = false,
    FinePrint = '',
    Heading = '',
    Name = '',
    Price = '',
    ProductID = 0,
    StartDateOptions,
    TotalCharge = '',
  } = selectedPackage
  const { AvailableDates = [], UnavailableDates = [] } = StartDateOptions ?? {}
  const keyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true })
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [agreementTerms, setAgreementTerms] = React.useState<string | null | undefined>(null)
  const [agreementVisible, setAgreementVisible] = React.useState(false)
  const [billingError, setBillingError] = React.useState<string | null | undefined>(null)
  const [details, setDetails] = React.useState<PurchaseTotalDetails | undefined>(undefined)
  const [discountApplied, setDiscountApplied] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [giftCard, setGiftCard] = React.useState('')
  const [promoCode, setPromoCode] = React.useState('')
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth)
  const [selectedStartDate, setSelectedStartDate] = React.useState(moment().format('YYYY-MM-DD'))
  const [showCardInput, setShowCardInput] = React.useState(false)
  const [showPromoInput, setShowPromoInput] = React.useState(false)
  const [signature, setSignature] = React.useState<string | null | undefined>(null)
  const onAgreementSigned = React.useCallback(async (image: string) => {
    setSignature(image)
    setAgreementVisible(false)
    await logEvent('purchase_agreement_signed')
  }, [])
  const onApplyDiscount = async (enteredDiscount: boolean, initialRender?: boolean) => {
    try {
      setFetching(true)
      let response = await API.getPurchaseTotal({
        ClientID,
        GiftCard: giftCard,
        LocationID,
        ProductID,
        PromoCode: promoCode,
      })
      const { code, Details, message, Success } = response
      if (Success) {
        setBillingError(null)
        const { AgreementTerms } = Details ?? {}
        if (enteredDiscount) {
          setDiscountApplied(true)
          setShowCardInput(false)
          setShowPromoInput(false)
        }
        setDetails(Details)
        if (
          Brand.UI_PURCHASE_SIGNING &&
          AgreementTerms != null &&
          AgreementTerms !== '' &&
          signature == null
        ) {
          setAgreementTerms(AgreementTerms)
          setAgreementVisible(true)
        }
      } else if (code === 508) {
        setAction('toast', { text: message })
        setBillingError('total')
      } else if (message != null) {
        setAction('toast', { text: message })
      }
      if (initialRender) {
        await logEvent('purchase_initiate')
        await API.createEventLog({
          ClientID,
          EventType: 'purchase',
          PersonID,
          ProductID,
          RegistrationID: RegistrationID ?? -1,
        })
      }
      setFetching(false)
    } catch (e: any) {
      logError(e)
      setDiscountApplied(false)
      setFetching(false)
      setAction('toast', { text: 'Unable to fetch some purchase details.' })
    }
  }
  const onBuy = async () => {
    setFetching(true)
    let params: CreatePurchaseParams & {
      ClientSignature?: string | undefined
      ProductID: string | number
    } = {
      ClientID,
      GiftCard: giftCard,
      LocationID,
      PersonClientID,
      PersonID,
      ProductID,
      PromoCode: promoCode,
    }
    if (signature != null) {
      params = { ...params, ClientSignature: signature }
    }
    if (selectedStartDate != null) {
      params = { ...params, StartDate: selectedStartDate }
    }
    try {
      const purchaseResponse = await API.createPurchase(params)
      setFetching(false)
      if (purchaseResponse.Success) {
        if (purchaseResponse.Details != null) {
          const {
            DiscountTotal,
            GrandTotal,
            ProductDescription,
            ProductID: productId,
            SubTotal,
            SubTotalwithDiscount,
            TaxTotal,
          } = purchaseResponse.Details
          // Log purchase details with proper type casting
          await logEvent('purchase_completed', {
            DiscountTotal: Number(DiscountTotal),
            GrandTotal: Number(GrandTotal),
            ProductDescription,
            ProductID: productId,
            SubTotal: Number(SubTotal),
            SubTotalwithDiscount: Number(SubTotalwithDiscount),
            TaxTotal: Number(TaxTotal),
          } as Record<keyof PurchaseDetails, boolean | number | string>)
          await logEvent('purchase', {
            coupon: promoCode,
            currency: 'USD',
            items: [{ item_id: productId, item_name: Name }],
            tax: Number(TaxTotal),
            transaction_id: `${ClientID}${PersonID}${PersonClientID}${Date.now()}`,
            value: Number(SubTotalwithDiscount),
          })
        }
        onPurchaseSuccess()
      } else if (purchaseResponse.code === 508) {
        setAction('toast', { text: purchaseResponse.message })
        setBillingError('buy')
      } else {
        setAction('toast', {
          text:
            purchaseResponse?.message ??
            'Unable to complete purchase.\nPlease ensure payment method is up to date.',
        })
      }
    } catch (e: any) {
      logError(e)
      setFetching(false)
      setAction('toast', { text: 'Unable to complete purchase.' })
    }
  }
  const onCancelDiscount = React.useCallback(async () => {
    setDiscountApplied(false)
    setShowCardInput(false)
    setShowPromoInput(false)
    setPromoCode('')
    setGiftCard('')
    await logEvent(`purchase_remove_${showCardInput ? 'gift_card' : 'promo_code'}`)
  }, [showCardInput])
  const onExit = async () => {
    if (billingError != null) {
      await logEvent('purchase_billing_update_exit')
    }
    onClose()
  }
  React.useEffect(() => {
    setDetails((prev) => {
      if (prev != null) {
        return { ...prev, GrandTotal: TotalCharge }
      } else {
        return undefined
      }
    })
  }, [TotalCharge])
  React.useEffect(() => {
    onApplyDiscount(false, true)
  }, [])
  React.useEffect(() => {
    if (AvailableDates.length > 0) {
      setSelectedStartDate(AvailableDates[0])
    }
  }, [AvailableDates])
  const {
    CardAmount = '0',
    Contract,
    DiscountTotal: discount = '0',
    GiftCardAmount = '0',
    GiftCardBalance = '0',
    GrandTotal: totalCharge,
    SubTotalwithDiscount,
  } = details ?? {}
  const {
    FirstPaymentDiscount = '0',
    FirstPaymentSubtotal = '0',
    FirstPaymentTotal = '0',
    RecurPaymentTotal = '0',
  } = Contract ?? {}
  const maxHeight = themeStyle.window.height - themeStyle.scale(150)
  const showDiscountPrice = Number(SubTotalwithDiscount) < Number(Price)
  const showFinePrint = FinePrint !== ''
  const animatedContentView = useAnimatedStyle(() => {
    return { marginBottom: keyboard.height.value }
  })
  return (
    <Animated.View
      entering={FadeIn.duration(ANIMATION_DURATIONS.overlayBackdropFade)}
      exiting={FadeOut.duration(ANIMATION_DURATIONS.overlayBackdropFade).delay(
        ANIMATION_DURATIONS.overlayContentTranslation,
      )}
      style={themeStyle.overlayContainerLevel2}>
      <Pressable
        onPress={() => {
          Keyboard.dismiss()
          onExit()
        }}
        style={themeStyle.overlayDismissArea}
      />
      <Animated.View
        entering={SlideInDown.duration(ANIMATION_DURATIONS.overlayContentTranslation).delay(
          ANIMATION_DURATIONS.overlayBackdropFade,
        )}
        exiting={SlideOutDown.duration(ANIMATION_DURATIONS.overlayContentTranslation)}
        style={[
          styles.content,
          agreementVisible
            ? { height: maxHeight }
            : billingError != null && { backgroundColor: themeStyle.white },
          animatedContentView,
        ]}>
        <ModalBanner
          alternateStyling={alternateStyling}
          onClose={onExit}
          title={billingError != null ? 'Update Billing Info' : 'Confirm Purchase'}
        />
        {fetching && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
          </View>
        )}
        <View style={[styles.mainContent, agreementVisible && themeStyle.flexView]}>
          <View
            style={[
              { display: agreementVisible || billingError != null ? 'none' : 'flex' },
              agreementVisible && themeStyle.flexView,
            ]}>
            <View
              style={[
                themeStyle.rowBetween,
                !showFinePrint && { marginBottom: themeStyle.scale(16) },
              ]}>
              <Text numberOfLines={1} style={[themeStyle.itemTitleText, { flex: 1 }]}>
                {Heading || Name}
              </Text>
              <View style={themeStyle.viewCentered}>
                {showDiscountPrice && totalCharge != null && (
                  <Text style={themeStyle.itemTitleText}>
                    {`${Brand.DEFAULT_CURRENCY}${totalCharge}`}
                  </Text>
                )}
                <Text style={[themeStyle.itemTitleText, showDiscountPrice && styles.oldPriceText]}>
                  {`${Brand.DEFAULT_CURRENCY}${Price}`}
                </Text>
              </View>
            </View>
            {AllowChooseStartDateContract && (
              <>
                <Text allowFontScaling={false} style={styles.datePickerText}>
                  {'Select a contract start date below.'}
                </Text>
                <Calendar
                  dayComponent={({ date, marking, state }) => {
                    const notAvailable =
                      UnavailableDates.includes(date?.dateString ?? '') ||
                      (AvailableDates.length > 0 &&
                        !AvailableDates.includes(date?.dateString ?? '')) ||
                      state === 'disabled'
                    const selected = marking?.selected || state === 'selected'
                    return (
                      <Pressable
                        disabled={notAvailable}
                        onPress={() => setSelectedStartDate(date?.dateString ?? '')}
                        style={[
                          themeStyle.calendarTheme['stylesheet.day.basic'].base,
                          notAvailable && { borderColor: themeStyle.paleGray },
                          selected && themeStyle.calendarTheme['stylesheet.day.basic'].selected,
                        ]}>
                        <Text
                          style={[
                            themeStyle.calendarTheme.textDayStyle,
                            date?.dateString === today &&
                              themeStyle.calendarTheme['stylesheet.day.basic'].todayText,
                            notAvailable && { color: themeStyle.paleGray },
                            selected &&
                              themeStyle.calendarTheme['stylesheet.day.basic'].selectedText,
                          ]}>
                          {date?.day}
                        </Text>
                      </Pressable>
                    )
                  }}
                  disableAllTouchEventsForDisabledDays={true}
                  disableAllTouchEventsForInactiveDays={true}
                  disableArrowLeft={selectedMonth === currentMonth}
                  disableArrowRight={moment(selectedMonth, 'YYYY-MM').isSame(
                    moment(maxStartDate, 'YYYY-MM-DD'),
                    'month',
                  )}
                  hideExtraDays
                  markedDates={{ [selectedStartDate]: { selected: true } }}
                  markingType="multi-period"
                  maxDate={StartDateOptions?.EndDate ?? maxStartDate}
                  minDate={StartDateOptions?.StartDate ?? today}
                  monthFormat="MMMM yyyy"
                  onDayPress={({ dateString: day }: { dateString: string }) => {
                    setSelectedStartDate(day)
                  }}
                  onMonthChange={(data: { dateString: moment.MomentInput }) =>
                    setSelectedMonth(moment(data.dateString).format('YYYY-MM'))
                  }
                  showWeekNumbers={false}
                  theme={themeStyle.calendarTheme}
                />
              </>
            )}
            {showFinePrint && <Text style={styles.finePrintText}>{FinePrint}</Text>}
            {(showCardInput || showPromoInput) && discountApplied && Number(discount) != 0 && (
              <View style={themeStyle.rowAligned}>
                <View style={styles.successView}>
                  <Text style={styles.successText}>
                    {`Success! Your new subtotal is ${Brand.DEFAULT_CURRENCY}${Number(
                      Contract != null ? FirstPaymentSubtotal : SubTotalwithDiscount,
                    ).toFixed(2)}`}
                  </Text>
                </View>
                <TouchableOpacity hitSlop={themeStyle.hitSlop} onPress={onCancelDiscount}>
                  <Icon name="clear" style={styles.cancelIcon} />
                </TouchableOpacity>
              </View>
            )}
            {!discountApplied &&
              (showCardInput || showPromoInput ? (
                <View style={themeStyle.rowAligned}>
                  <View style={styles.discountInputRow}>
                    <TextInput
                      allowFontScaling={false}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onChangeText={showCardInput ? setGiftCard : setPromoCode}
                      placeholder={showCardInput ? 'Enter card #' : 'Enter code'}
                      placeholderTextColor={themeStyle.textGray}
                      style={styles.discountInput}
                    />
                    <TouchableOpacity
                      onPress={async () => {
                        onApplyDiscount(true)
                        await logEvent(
                          `purchase_apply_${showCardInput ? 'gift_card' : 'promo_code'}`,
                        )
                      }}>
                      <Icon name="arrow-forward" style={styles.forwardIcon} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity hitSlop={themeStyle.hitSlop} onPress={onCancelDiscount}>
                    <Icon name="clear" style={styles.cancelIcon} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.discountButtonRow}>
                  <ButtonText
                    color={themeStyle.textBlack}
                    onPress={async () => {
                      setShowPromoInput(true)
                      await logEvent('purchase_use_promo_code')
                    }}
                    text="Have a promo code?"
                  />
                  <View style={styles.discountButtonDivider} />
                  <ButtonText
                    color={themeStyle.textBlack}
                    onPress={async () => {
                      setShowCardInput(true)
                      await logEvent('purchase_use_gift_card')
                    }}
                    text="Have a gift card?"
                  />
                </View>
              ))}
            <Button
              disabled={(showCardInput || showPromoInput) && Number(discount) === 0}
              onPress={
                Brand.UI_PURCHASE_SIGNING && agreementTerms != null && signature == null
                  ? () => setAgreementVisible(true)
                  : onBuy
              }
              style={styles.purchaseButton}
              text="Purchase"
            />
            <Text style={styles.chargeText}>
              {fetching
                ? ''
                : Contract != null
                  ? `You will be charged ${Brand.DEFAULT_CURRENCY}${FirstPaymentTotal} today.${
                      Number(FirstPaymentDiscount) > 0
                        ? `\nA ${Brand.DEFAULT_CURRENCY}${FirstPaymentDiscount} discount has been applied.`
                        : ''
                    }\nYour recurring payment will be ${Brand.DEFAULT_CURRENCY}${RecurPaymentTotal}.`
                  : GiftCardAmount != null && Number(GiftCardAmount) !== 0
                    ? `Your gift card balance is ${Brand.DEFAULT_CURRENCY}${GiftCardBalance}. Your card will be charged ${Brand.DEFAULT_CURRENCY}${CardAmount}.`
                    : totalCharge != null
                      ? `You will be charged ${Brand.DEFAULT_CURRENCY}${totalCharge}.`
                      : ''}
            </Text>
          </View>
          <View style={{ display: agreementVisible ? 'flex' : 'none', flex: 1 }}>
            <ContractSigning
              agreement={agreementTerms}
              onClose={async () => {
                await logEvent('purchase_agreement_exit')
                if (signature != null) {
                  setAgreementVisible(false)
                } else {
                  onExit()
                }
              }}
              onContinue={onAgreementSigned}
            />
          </View>
          <View style={{ display: billingError != null ? 'flex' : 'none' }}>
            <InputBilling
              clientId={PersonClientID ?? undefined}
              modalSelection={false}
              onUpdated={async () => {
                setBillingError(null)
                billingError === 'total' ? onApplyDiscount(false) : onBuy()
                await logEvent('purchase_billing_update_completed')
              }}
              personId={PersonID}
            />
          </View>
        </View>
      </Animated.View>
      <Toast />
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const commonContainer = {
    backgroundColor: themeStyle.white,
    flex: 1,
    height: themeStyle.scale(44),
    marginRight: themeStyle.scale(16),
    paddingHorizontal: themeStyle.scale(12),
  } as const
  return {
    content: {
      ...themeStyle.overlayContent,
      marginTop: themeStyle.scale(20),
      maxHeight: themeStyle.window.height - themeStyle.scale(40),
    },
    mainContent: {
      backgroundColor: themeStyle.overlayContent.backgroundColor,
      padding: themeStyle.scale(20),
    },
    loadingOverlay: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.backgroundModalFade,
      bottom: 0,
      left: 0,
      position: 'absolute' as 'absolute',
      right: 0,
      top: -0.5,
      zIndex: 2,
    },
    oldPriceText: {
      ...themeStyle.textItemSecondary,
      marginLeft: themeStyle.scale(4),
      textDecorationLine: 'line-through' as 'line-through',
    },
    datePickerText: {
      ...themeStyle.textPrimaryRegular14,
      marginBottom: themeStyle.scale(8),
      marginTop: themeStyle.scale(8),
      textAlign: 'center' as const,
    },
    datePickerButton: {
      alignSelf: 'center' as const,
      borderColor: themeStyle.brandPrimary,
      borderWidth: themeStyle.scale(2),
      marginBottom: themeStyle.scale(16),
      width: themeStyle.window.width * 0.6,
    },
    finePrintText: {
      ...themeStyle.itemDetailText,
      marginBottom: themeStyle.scale(16),
      marginTop: themeStyle.scale(4),
    },
    discountButtonRow: { ...themeStyle.rowAlignedAround, height: themeStyle.scale(44) },
    discountButtonDivider: {
      backgroundColor: themeStyle.paleGray,
      height: themeStyle.scale(26),
      width: themeStyle.scale(1.5),
    },
    discountInputRow: { ...themeStyle.rowAligned, ...commonContainer },
    discountInput: {
      ...themeStyle.inputText,
      color: themeStyle.textBlack,
      fontSize: themeStyle.scale(14),
    },
    forwardIcon: { color: themeStyle.brandPrimary, fontSize: themeStyle.scale(18) },
    cancelIcon: { color: themeStyle.textGray, fontSize: themeStyle.scale(18) },
    successView: { ...themeStyle.flexViewCentered, ...commonContainer },
    successText: themeStyle.getTextStyle({
      color: 'textGreen',
      font: 'fontPrimaryRegular',
      size: 14,
    }),
    purchaseButton: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(12),
      marginTop: themeStyle.scale(20),
      width: '100%' as const,
    },
    chargeText: {
      ...themeStyle.itemDetailText,
      color: themeStyle.textBlack,
      marginBottom: themeStyle.scale(12),
      textAlign: 'center' as 'center',
    },
  }
}
