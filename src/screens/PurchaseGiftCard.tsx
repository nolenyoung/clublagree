import moment from 'moment'
import * as React from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { SvgCss } from 'react-native-svg/css'
import media from '../assets/media'
import {
  Button,
  Checkbox,
  GiftCardOption,
  Header,
  Input,
  InputButton,
  ModalDateTimePicker,
  ModalGiftCardSelector,
  OverlayLocationSelector,
  ModalMonthSelector,
  ModalSelector,
  ModalYearSelector,
  Switch,
  TabBar,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import {
  formatCreditCard,
  formatDateFuture,
  formatPhoneNumber,
  logError,
  logEvent,
  validateExpiry,
  validateTextOnChange,
} from '../global/Functions'
import { useListStates, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

const requiredBillingFields = [
  'address',
  'billingName',
  'cardCSC',
  'cardNumber',
  'city',
  'postalCode',
]

export default function PurchaseGiftCard(props: RootNavigatorScreenProps<'PurchaseGiftCard'>) {
  const { navigate } = props.navigation
  const activeInput = React.useRef('')
  const addressRef = React.useRef<InputRef>(undefined)
  const billingNameRef = React.useRef<InputRef>(undefined)
  const cardCSCRef = React.useRef<InputRef>(undefined)
  const cardNumberRef = React.useRef<InputRef>(undefined)
  const cityRef = React.useRef<InputRef>(undefined)
  const customValueRef = React.useRef<InputRef>(undefined)
  const emailRef = React.useRef<InputRef>(undefined)
  const fieldPositions = React.useRef<{ [field: string]: number }>({})
  const firstNameRef = React.useRef<InputRef>(undefined)
  const lastNameRef = React.useRef<InputRef>(undefined)
  const messageBodyRef = React.useRef<InputRef>(undefined)
  const phoneNumberRef = React.useRef<InputRef>(undefined)
  const postalRef = React.useRef<InputRef>(undefined)
  const scrollRef = React.useRef<ScrollView | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    clientId,
    Country: country = Brand.DEFAULT_COUNTRY,
    locationId,
    personId,
  } = useSelector((state: ReduxState) => state.user)
  const { selectedState, setState, state, states } = useListStates(country)
  const [address, setAddress] = React.useState('')
  const [billingName, setBillingName] = React.useState('')
  const [bookingSuccess, setBookingSuccess] = React.useState(false)
  const [cardNumber, setCardNumber] = React.useState('')
  const [cardCSC, setCardCSC] = React.useState('')
  const [city, setCity] = React.useState('')
  const [customValue, setCustomValue] = React.useState('')
  const [deliveryDate, setDeliveryDate] = React.useState<Date>(new Date())
  const [email, setEmail] = React.useState('')
  const [expiryError, setExpiryError] = React.useState(false)
  const [firstName, setFirstName] = React.useState('')
  const [giftCards, setGiftCards] = React.useState<GiftCardFormatted[]>([])
  const [invalidFields, setInvalidFields] = React.useState(
    ['firstName', 'lastName', 'phoneNumber', 'messageBody'].filter((i) => i !== ''),
  )
  const [lastName, setLastName] = React.useState('')
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [loadingGiftCards, setLoadingGiftCards] = React.useState(false)
  const [location, setLocation] = React.useState<Partial<Location> | undefined>()
  const [locations, setLocations] = React.useState<Partial<Location>[]>([])
  const [messageBody, setMessageBody] = React.useState('')
  const [modalGiftCard, setModalGiftCard] = React.useState(false)
  const [modalLocations, setModalLocations] = React.useState(false)
  const [modalMonth, setModalMonth] = React.useState(false)
  const [modalState, setModalState] = React.useState(false)
  const [modalYear, setModalYear] = React.useState(false)
  const [month, setMonth] = React.useState('')
  const [selectedGiftCard, setSelectedGiftCard] = React.useState<GiftCardFormatted | undefined>()
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = React.useState(false)
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [useExistingBilling, setUseExistingBilling] = React.useState(true)
  const [year, setYear] = React.useState('')
  const [zipcode, setZipcode] = React.useState('')
  const onFetchLocations = React.useCallback(async () => {
    try {
      setAction('loading', { loading: true })
      let response = await API.getUserLocations()
      if ('Locations' in response && Array.isArray(response.Locations)) {
        const userLocations = response.Locations
        setLocations(userLocations)
        if (userLocations.length === 1) {
          setLocation(userLocations[0])
        }
      } else if ('message' in response) {
        setAction('toast', { text: response.message })
      }
      cleanAction('loading')
    } catch (e: any) {
      logError(e)
      cleanAction('loading')
    }
  }, [clientId, locationId])
  const onFetchGiftCards = async (loc: Partial<Location>) => {
    setLoadingGiftCards(true)
    try {
      let response = await API.getGiftCards({
        ClientID: loc.ClientID ?? 0,
        LocationID: loc.LocationID ?? 0,
      })
      if (Array.isArray(response)) {
        setSelectedGiftCard(undefined)
        let allLayouts = []
        for (const gc of response) {
          const { Layouts, ...rest } = gc
          for (const layout of Layouts) {
            allLayouts.push({ ...layout, ...rest })
          }
        }
        setGiftCards(allLayouts)
      } else if ('message' in response) {
        setAction('toast', { text: response.message })
      }
    } catch (e) {
      logError(e)
      setAction('toast', { text: 'Unable to get gift card information.' })
    } finally {
      setLoadingGiftCards(false)
    }
  }
  const onSubmit = async () => {
    try {
      const formattedCustomValue = customValue.replace(Brand.DEFAULT_CURRENCY, '')
      let info: APIGiftCardPurchaseParams = {
        GiftCard: {
          CardValue:
            formattedCustomValue !== ''
              ? Number(formattedCustomValue)
              : (selectedGiftCard?.CardValue ?? 0),
          ClientID: location?.ClientID ?? 0,
          DeliveryDate: deliveryDate?.toISOString(),
          GiftCardID: selectedGiftCard?.ProductID ?? 0,
          LayoutID: selectedGiftCard?.LayoutID ?? 0,
          LocationID: location?.LocationID ?? 0,
          Message: messageBody,
          RecipientEmail: email,
          RecipientName: `${firstName} ${lastName}`,
          RecipientPhone: phoneNumber.replace(/\D/g, ''),
        },
        UseCardOnFile: useExistingBilling,
        User: {
          BillingAddress: address,
          BillingCity: city,
          BillingName: billingName,
          BillingPostalCode: zipcode,
          BillingState: state,
          ClientID: clientId as number,
          CreditCardNumber: cardNumber,
          CVV: cardCSC,
          ExpMonth: month,
          ExpYear: year,
          PersonID: personId as string,
        },
      }
      let response = await API.createPurchaseGiftCard(info)
      cleanAction('activeButton')
      if ('PurchaseAmount' in response) {
        setBookingSuccess(true)
        await logEvent('gift_card_purchase')
      } else {
        if (response?.code === 508 || response?.code === 512) {
          setAction('toast', { text: response.message })
          setUseExistingBilling(false)
        } else {
          setAction('toast', { text: Brand.STRING_ERROR_BRING_FRIEND ?? response.message })
        }
      }
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
      setAction('toast', { text: 'Unable to purchase gift card.' })
    }
  }
  const onToggleMonthModal = React.useCallback(() => {
    setModalMonth((prev) => !prev)
  }, [])
  const onToggleStateModal = React.useCallback(() => {
    setModalState((prev) => !prev)
  }, [])
  const onToggleYearModal = React.useCallback(() => {
    setModalYear((prev) => !prev)
  }, [])
  React.useEffect(() => {
    onFetchLocations()
  }, [])
  React.useEffect(() => {
    if (location != null) {
      onFetchGiftCards(location)
    }
  }, [location])
  React.useEffect(() => {
    if (month !== '' && year !== '') {
      const { invalid } = validateExpiry(month, year)
      setExpiryError(invalid)
    }
  }, [month, year])
  React.useEffect(() => {
    if (useExistingBilling) {
      setExpiryError(false)
      setInvalidFields((prev) => prev.filter((p) => !requiredBillingFields.includes(p)))
    } else {
      setExpiryError(true)
      setMonth('')
      setState('')
      setYear('')
      setInvalidFields((prev) => [...prev, ...requiredBillingFields])
    }
  }, [useExistingBilling])
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} title="Gift Cards" />
      {bookingSuccess ? (
        <View style={themeStyle.content}>
          <View style={themeStyle.flexViewCentered}>
            <SvgCss
              color={themeStyle.brandPrimary}
              height={themeStyle.scale(100)}
              style={styles.successImage}
              width={themeStyle.scale(100)}
              xml={media.iconCheckCircle}
            />
            <Text
              allowFontScaling={false}
              style={styles.completeTitleText}>{`Purchase Complete`}</Text>
            <Text allowFontScaling={false} style={styles.completeBodyText}>
              {`Your gift card will be delivered to ${firstName} ${moment(
                deliveryDate.toISOString(),
              ).calendar(null, formatDateFuture('[on] dddd, MMMM D, YYYY'))}.`}
            </Text>
            <Button
              gradient={Brand.BUTTON_GRADIENT}
              onPress={() => navigate('Home')}
              style={styles.submitButton}
              text="Done"
            />
          </View>
        </View>
      ) : (
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          ref={scrollRef}
          scrollToOverflowEnabled={true}
          showsVerticalScrollIndicator={false}>
          <View style={styles.inputView}>
            <Text style={styles.introText}>
              {`To purchase a gift card, select a location, pick the card you'd like, and enter the recipient's info below.`}
            </Text>
            <Text style={styles.sectionTitle}>Location</Text>
            <InputButton
              containerStyle={styles.locationButtonContainer}
              borderColor={themeStyle.textBlack}
              buttonStyle={styles.locationButton}
              textColor={themeStyle.textBlack}
              onPress={() => setModalLocations(true)}
              value={location?.Nickname ?? 'Select a Location'}
            />
            {location != null && (
              <>
                <Text style={styles.sectionTitle}>Card Option</Text>
                {loadingGiftCards ? (
                  <ActivityIndicator color={styles.inputRow.backgroundColor} size="large" />
                ) : selectedGiftCard != null ? (
                  <>
                    <View
                      style={[
                        themeStyle.rowAlignedBetween,
                        !selectedGiftCard.EditableByConsumer && {
                          marginBottom: themeStyle.scale(24),
                        },
                      ]}>
                      <View style={themeStyle.flexView}>
                        <GiftCardOption details={selectedGiftCard} />
                      </View>
                      <Button onPress={() => setModalGiftCard(true)} small={true} text="Change" />
                    </View>
                    {selectedGiftCard.EditableByConsumer && (
                      <Input
                        borderColor={styles.inputRow.backgroundColor}
                        containerStyle={styles.customAmountInput}
                        defaultValue={
                          selectedGiftCard.CardValue != 0
                            ? String(selectedGiftCard.CardValue)
                            : undefined
                        }
                        format={(text) =>
                          text !== '' && !text.startsWith(Brand.DEFAULT_CURRENCY)
                            ? `${Brand.DEFAULT_CURRENCY}${text}`
                            : text === Brand.DEFAULT_CURRENCY
                              ? ''
                              : text
                        }
                        getInputRef={(ref) => {
                          customValueRef.current = ref
                        }}
                        hideErrorLabel={true}
                        keyboardType="numeric"
                        label="Enter Gift Card Amount"
                        labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                        onChangeText={({ text, setError }) =>
                          validateTextOnChange({
                            errorOnChange: false,
                            setError,
                            setInvalidFields,
                            setState: setCustomValue,
                            text,
                            type: 'giftCardAmount',
                          })
                        }
                        onEndEditing={(text, setError) =>
                          validateTextOnChange({
                            errorOnChange: true,
                            setError,
                            setInvalidFields,
                            setState: setCustomValue,
                            text,
                            type: 'giftCardAmount',
                          })
                        }
                        onFocus={() => {
                          scrollRef.current?.scrollTo({
                            x: 0,
                            y: fieldPositions.current.customGCAmount - themeStyle.scale(100),
                          })
                        }}
                        onLayout={(e) => {
                          fieldPositions.current.customGCAmount = e.nativeEvent.layout.y
                        }}
                        placeholder={`${Brand.DEFAULT_CURRENCY}0.00`}
                        placeholderTextColor={themeStyle.textGray}
                        rowStyle={styles.customAmountInputRow}
                        style={styles.customAmountInputField}
                        textColor={themeStyle.textBlack}
                      />
                    )}
                  </>
                ) : (
                  <InputButton
                    containerStyle={styles.locationButtonContainer}
                    borderColor={themeStyle.textBlack}
                    buttonStyle={styles.locationButton}
                    textColor={themeStyle.textBlack}
                    onPress={() => setModalGiftCard(true)}
                    value={'Select a Card Option'}
                  />
                )}
              </>
            )}
            {selectedGiftCard != null && (
              <>
                <Text style={styles.sectionTitle}>{`Recipient’s Info`}</Text>
                <View
                  onLayout={(e) => {
                    fieldPositions.current.firstName = e.nativeEvent.layout.y
                  }}
                  style={[themeStyle.rowAlignedBetween, styles.inputContainer]}>
                  <Input
                    allowFontScaling={false}
                    containerStyle={{ width: '48%' }}
                    getInputRef={(ref) => {
                      firstNameRef.current = ref
                    }}
                    hideErrorLabel={true}
                    onChangeText={({ text, setError }) =>
                      validateTextOnChange({
                        errorOnChange: false,
                        setError,
                        setInvalidFields,
                        setState: setFirstName,
                        text,
                        type: 'firstName',
                      })
                    }
                    onEndEditing={(text, setError) => {
                      validateTextOnChange({
                        errorOnChange: true,
                        setError,
                        setInvalidFields,
                        setState: setFirstName,
                        text,
                        type: 'firstName',
                      })
                    }}
                    onFocus={() => {
                      scrollRef.current?.scrollTo({
                        x: 0,
                        y: fieldPositions.current.firstName - themeStyle.scale(100),
                      })
                    }}
                    onSubmitEditing={() => {
                      lastNameRef.current?.focus()
                    }}
                    placeholder="First Name"
                    placeholderTextColor={themeStyle.textGray}
                    returnKeyType="next"
                    rowStyle={styles.inputRow}
                    style={styles.input}
                    textColor={themeStyle.textBlack}
                  />
                  <Input
                    allowFontScaling={false}
                    containerStyle={{ width: '48%' }}
                    getInputRef={(ref) => {
                      lastNameRef.current = ref
                    }}
                    hideErrorLabel={true}
                    onChangeText={({ text, setError }) =>
                      validateTextOnChange({
                        errorOnChange: false,
                        setError,
                        setInvalidFields,
                        setState: setLastName,
                        text,
                        type: 'lastName',
                      })
                    }
                    onEndEditing={(text, setError) => {
                      validateTextOnChange({
                        errorOnChange: true,
                        setError,
                        setInvalidFields,
                        setState: setLastName,
                        text,
                        type: 'lastName',
                      })
                    }}
                    onFocus={() => {
                      scrollRef.current?.scrollTo({
                        x: 0,
                        y: fieldPositions.current.firstName - themeStyle.scale(100),
                      })
                    }}
                    onSubmitEditing={() => {
                      phoneNumberRef.current?.focus()
                    }}
                    placeholder="Last Name"
                    placeholderTextColor={themeStyle.textGray}
                    returnKeyType="next"
                    rowStyle={styles.inputRow}
                    style={styles.input}
                    textColor={themeStyle.textBlack}
                  />
                </View>
                <Input
                  allowFontScaling={false}
                  autoComplete="tel"
                  containerStyle={styles.inputContainer}
                  format={(n) => formatPhoneNumber(n, Brand.DEFAULT_COUNTRY)}
                  getInputRef={(ref) => {
                    phoneNumberRef.current = ref
                  }}
                  hideErrorLabel={true}
                  key="phoneInput"
                  keyboardType="phone-pad"
                  onChangeText={({ text, setError }) =>
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setInvalidFields,
                      setState: setPhoneNumber,
                      text,
                      type: 'phoneNumber',
                      validationParams: [country ?? Brand.DEFAULT_COUNTRY],
                    })
                  }
                  onEndEditing={(text, setError) =>
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setInvalidFields,
                      setState: setPhoneNumber,
                      text,
                      type: 'phoneNumber',
                      validationParams: [country ?? Brand.DEFAULT_COUNTRY],
                    })
                  }
                  onFocus={() => {
                    activeInput.current = 'phoneNumber'
                    scrollRef.current?.scrollTo({
                      x: 0,
                      y: fieldPositions.current.phoneNumber - themeStyle.scale(100),
                    })
                  }}
                  onLayout={(e) => {
                    fieldPositions.current.phoneNumber = e.nativeEvent.layout.y
                  }}
                  //onSubmitEditing was not working when implemented
                  onBlur={() => {
                    emailRef.current?.focus()
                  }}
                  placeholder="Mobile Phone"
                  placeholderTextColor={themeStyle.textGray}
                  returnKeyType="next"
                  rowStyle={styles.inputRow}
                  style={styles.input}
                  textColor={themeStyle.textBlack}
                  textContentType="telephoneNumber"
                />
                <Input
                  allowFontScaling={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                  containerStyle={styles.inputContainer}
                  getInputRef={(ref) => {
                    emailRef.current = ref
                  }}
                  hideErrorLabel={true}
                  keyboardType="email-address"
                  onChangeText={({ text, setError }) =>
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setInvalidFields,
                      setState: setEmail,
                      text,
                      type: 'email',
                    })
                  }
                  onEndEditing={(text, setError) => {
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setInvalidFields,
                      setState: setEmail,
                      text,
                      type: 'email',
                    })
                  }}
                  onFocus={() => {
                    activeInput.current = 'email'
                    scrollRef.current?.scrollTo({
                      x: 0,
                      y: fieldPositions.current.email - themeStyle.scale(100),
                    })
                  }}
                  onLayout={(e) => {
                    fieldPositions.current.email = e.nativeEvent.layout.y
                  }}
                  placeholder="Email Address"
                  placeholderTextColor={themeStyle.textGray}
                  returnKeyType="done"
                  rowStyle={styles.inputRow}
                  style={styles.input}
                  textColor={themeStyle.textBlack}
                />
                <Text style={styles.subSectionTitle}>Delivery Date (optional)</Text>
                <InputButton
                  onPress={() => setShowDeliveryDatePicker(true)}
                  buttonStyle={[styles.inputRow, styles.inputContainer]}
                  textColor={themeStyle.textBlack}
                  textStyle={styles.input}
                  value={moment(deliveryDate.toISOString()).calendar(
                    null,
                    formatDateFuture('dddd, MMMM D, YYYY'),
                  )}
                />
                <Input
                  allowFontScaling={false}
                  containerStyle={styles.inputContainer}
                  getInputRef={(ref) => {
                    messageBodyRef.current = ref
                  }}
                  hideErrorLabel={true}
                  multiline={true}
                  onChangeText={({ text, setError }) =>
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setInvalidFields,
                      setState: setMessageBody,
                      text,
                      type: 'messageBody',
                    })
                  }
                  onEndEditing={(text, setError) => {
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setInvalidFields,
                      setState: setMessageBody,
                      text,
                      type: 'messageBody',
                    })
                    activeInput.current === 'messageBody' &&
                      useExistingBilling &&
                      scrollRef.current?.scrollToEnd()
                  }}
                  onFocus={() => {
                    activeInput.current = 'messageBody'
                    scrollRef.current?.scrollTo({
                      x: 0,
                      y: fieldPositions.current.messageBody - themeStyle.scale(100),
                    })
                  }}
                  onLayout={(e) => {
                    fieldPositions.current.messageBody = e.nativeEvent.layout.y
                  }}
                  placeholder="Type a short message to be included to the recipient."
                  placeholderTextColor={themeStyle.textGray}
                  returnKeyType="done"
                  rowStyle={[
                    styles.inputRow,
                    { alignItems: 'flex-start' as const, minHeight: themeStyle.scale(80) },
                  ]}
                  style={[styles.input, { height: '100%' as const }]}
                  submitBehavior="blurAndSubmit"
                  textColor={themeStyle.textBlack}
                />
                <Text style={styles.sectionTitle}>{`Billing Info`}</Text>
                <View style={styles.useExistingBillingRow}>
                  <Switch
                    onPress={() => setUseExistingBilling((prev) => !prev)}
                    selected={useExistingBilling}
                  />
                  <Text style={styles.useExistingBillingText}>Use card on file</Text>
                </View>
                {!useExistingBilling && (
                  <>
                    <Text style={styles.subSectionTitle}>Payment Details</Text>
                    <Input
                      autoComplete="cc-number"
                      borderColor={styles.inputRow.backgroundColor}
                      containerStyle={styles.inputContainer}
                      format={formatCreditCard}
                      getInputRef={(ref) => {
                        cardNumberRef.current = ref
                      }}
                      hideErrorLabel={true}
                      key="cardNumberInput"
                      keyboardType="number-pad"
                      maxLength={19}
                      onChangeText={({ text, setError }) =>
                        validateTextOnChange({
                          errorOnChange: false,
                          setError,
                          setInvalidFields,
                          setState: setCardNumber,
                          text,
                          type: 'cardNumber',
                        })
                      }
                      onEndEditing={(text, setError) =>
                        validateTextOnChange({
                          errorOnChange: true,
                          setError,
                          setInvalidFields,
                          setState: setCardNumber,
                          text,
                          type: 'cardNumber',
                        })
                      }
                      onFocus={() => {
                        activeInput.current = 'cardNumber'
                        scrollRef.current?.scrollTo({
                          x: 0,
                          y: fieldPositions.current.cardNumber - themeStyle.scale(100),
                        })
                      }}
                      onLayout={(e) => {
                        fieldPositions.current.cardNumber = e.nativeEvent.layout.y
                      }}
                      placeholder="Enter Card Number"
                      placeholderTextColor={themeStyle.textGray}
                      returnKeyType="next"
                      rowStyle={styles.inputRow}
                      style={styles.input}
                      textColor={themeStyle.textBlack}
                      textContentType="creditCardNumber"
                    />
                    <View
                      onLayout={(e) => {
                        fieldPositions.current.cardExpiry = e.nativeEvent.layout.y
                      }}
                      style={[themeStyle.rowAlignedBetween, styles.inputContainer]}>
                      <InputButton
                        borderColor={styles.inputRow.backgroundColor}
                        buttonStyle={[styles.inputRow, { marginBottom: 0 }]}
                        containerStyle={{ width: '30%' as const }}
                        onPress={onToggleMonthModal}
                        textColor={month === '' ? themeStyle.textGray : themeStyle.textBlack}
                        textStyle={styles.input}
                        value={month || 'MM'}
                      />
                      <InputButton
                        borderColor={styles.inputRow.backgroundColor}
                        buttonStyle={[styles.inputRow, { marginBottom: 0 }]}
                        containerStyle={{ width: '30%' as const }}
                        onPress={onToggleYearModal}
                        textColor={year === '' ? themeStyle.textGray : themeStyle.textBlack}
                        textStyle={styles.input}
                        value={year || 'YYYY'}
                      />
                      <Input
                        autoComplete="cc-csc"
                        borderColor={styles.inputRow.backgroundColor}
                        containerStyle={{ width: '30%' as const }}
                        getInputRef={(ref) => {
                          cardCSCRef.current = ref
                        }}
                        hideErrorLabel={true}
                        keyboardType="number-pad"
                        maxLength={4}
                        onChangeText={({ text, setError }) =>
                          validateTextOnChange({
                            errorOnChange: false,
                            setError,
                            setInvalidFields,
                            setState: setCardCSC,
                            text,
                            type: 'cardCSC',
                          })
                        }
                        onEndEditing={(text, setError) =>
                          validateTextOnChange({
                            errorOnChange: true,
                            setError,
                            setInvalidFields,
                            setState: setCardCSC,
                            text,
                            type: 'cardCSC',
                          })
                        }
                        onFocus={() => {
                          activeInput.current = 'cardCSC'
                          scrollRef.current?.scrollTo({
                            x: 0,
                            y: fieldPositions.current.cardExpiry - themeStyle.scale(100),
                          })
                        }}
                        //onSubmitEditing was not working when implemented
                        onBlur={() => {
                          billingNameRef.current?.focus()
                        }}
                        placeholder="CVV"
                        placeholderTextColor={themeStyle.textGray}
                        returnKeyType="next"
                        rowStyle={styles.inputRow}
                        style={styles.input}
                        textColor={themeStyle.textBlack}
                        textContentType="creditCardSecurityCode"
                      />
                    </View>
                    <Text style={styles.subSectionTitle}>Billing Address</Text>
                    <Input
                      autoComplete="cc-name"
                      borderColor={styles.inputRow.backgroundColor}
                      containerStyle={styles.inputContainer}
                      getInputRef={(ref) => {
                        billingNameRef.current = ref
                      }}
                      hideErrorLabel={true}
                      onChangeText={({ text, setError }) =>
                        validateTextOnChange({
                          errorOnChange: false,
                          setError,
                          setInvalidFields,
                          setState: setBillingName,
                          text,
                          type: 'billingName',
                        })
                      }
                      onEndEditing={(text, setError) =>
                        validateTextOnChange({
                          errorOnChange: true,
                          setError,
                          setInvalidFields,
                          setState: setBillingName,
                          text,
                          type: 'billingName',
                        })
                      }
                      onFocus={() => {
                        activeInput.current = 'billingName'
                        scrollRef.current?.scrollTo({ x: 0, y: fieldPositions.current.billingName })
                      }}
                      onLayout={(event) => {
                        fieldPositions.current.billingName =
                          event.nativeEvent.layout.y - themeStyle.scale(100)
                      }}
                      onSubmitEditing={() => {
                        addressRef.current?.focus()
                      }}
                      placeholder="Name on Card"
                      placeholderTextColor={themeStyle.textGray}
                      returnKeyType="next"
                      rowStyle={styles.inputRow}
                      style={styles.input}
                      textColor={themeStyle.textBlack}
                      textContentType="creditCardName"
                    />
                    <Input
                      autoComplete="street-address"
                      borderColor={styles.inputRow.backgroundColor}
                      containerStyle={styles.inputContainer}
                      getInputRef={(ref) => {
                        addressRef.current = ref
                      }}
                      hideErrorLabel={true}
                      key="addressInput"
                      onChangeText={({ text, setError }) => {
                        const autofilled = text.length > 0 && text.length - address.length > 1
                        validateTextOnChange({
                          errorOnChange: false,
                          setError,
                          setInvalidFields,
                          setState: setAddress,
                          text,
                          type: 'address',
                        })
                        autofilled && cityRef.current?.focus()
                      }}
                      onEndEditing={(text, setError) =>
                        validateTextOnChange({
                          errorOnChange: true,
                          setError,
                          setInvalidFields,
                          setState: setAddress,
                          text,
                          type: 'address',
                        })
                      }
                      onFocus={() => {
                        activeInput.current = 'address'
                        scrollRef.current?.scrollTo({ x: 0, y: fieldPositions.current.address })
                      }}
                      onLayout={(event) => {
                        fieldPositions.current.address =
                          event.nativeEvent.layout.y - themeStyle.scale(100)
                      }}
                      onSubmitEditing={() => {
                        cityRef.current?.focus()
                      }}
                      placeholder="Street Address"
                      placeholderTextColor={themeStyle.textGray}
                      returnKeyType="next"
                      rowStyle={styles.inputRow}
                      style={styles.input}
                      textColor={themeStyle.textBlack}
                      textContentType="streetAddressLine1"
                    />
                    <Input
                      borderColor={styles.inputRow.backgroundColor}
                      containerStyle={styles.inputContainer}
                      getInputRef={(ref) => {
                        cityRef.current = ref
                      }}
                      hideErrorLabel={true}
                      key="cityInput"
                      onChangeText={({ text, setError }) =>
                        validateTextOnChange({
                          errorOnChange: false,
                          setError,
                          setInvalidFields,
                          setState: setCity,
                          text,
                          type: 'city',
                        })
                      }
                      onEndEditing={(text, setError) =>
                        validateTextOnChange({
                          errorOnChange: true,
                          setError,
                          setInvalidFields,
                          setState: setCity,
                          text,
                          type: 'city',
                        })
                      }
                      onFocus={() => {
                        activeInput.current = 'city'
                        scrollRef.current?.scrollTo({ x: 0, y: fieldPositions.current.city })
                      }}
                      onLayout={(event) => {
                        fieldPositions.current.city =
                          event.nativeEvent.layout.y - themeStyle.scale(100)
                      }}
                      placeholder="City"
                      placeholderTextColor={themeStyle.textGray}
                      returnKeyType="done"
                      rowStyle={styles.inputRow}
                      style={styles.input}
                      textColor={themeStyle.textBlack}
                      textContentType="addressCity"
                    />
                    <InputButton
                      borderColor={styles.inputRow.backgroundColor}
                      buttonStyle={[styles.inputRow, styles.inputContainer]}
                      onPress={onToggleStateModal}
                      textColor={
                        selectedState.Label == '' ? themeStyle.textGray : themeStyle.textBlack
                      }
                      textStyle={styles.input}
                      value={selectedState.Label || 'State'}
                    />
                    <Input
                      autoComplete="postal-code"
                      borderColor={styles.inputRow.backgroundColor}
                      containerStyle={styles.inputContainer}
                      getInputRef={(ref) => {
                        postalRef.current = ref
                      }}
                      hideErrorLabel={true}
                      key="postalInput"
                      onChangeText={({ text, setError }) =>
                        validateTextOnChange({
                          errorOnChange: false,
                          setError,
                          setInvalidFields,
                          setState: setZipcode,
                          text,
                          type: 'postalCode',
                          validationParams: [country],
                        })
                      }
                      onEndEditing={(text, setError) => {
                        validateTextOnChange({
                          errorOnChange: true,
                          setError,
                          setInvalidFields,
                          setState: setZipcode,
                          text,
                          type: 'postalCode',
                          validationParams: [country],
                        })
                        activeInput.current === 'postalCode' &&
                          scrollRef.current?.scrollToEnd({ animated: true })
                      }}
                      onFocus={() => {
                        activeInput.current = 'postalCode'
                        scrollRef.current?.scrollTo({
                          x: 0,
                          y: fieldPositions.current.postal,
                        })
                      }}
                      onLayout={(event) => {
                        fieldPositions.current.postal =
                          event.nativeEvent.layout.y - themeStyle.scale(100)
                      }}
                      placeholder={country === 'AU' ? 'Postcode' : 'Postal Code'}
                      placeholderTextColor={themeStyle.textGray}
                      returnKeyType="done"
                      rowStyle={styles.inputRow}
                      style={styles.input}
                      textColor={themeStyle.textBlack}
                      textContentType="postalCode"
                    />
                  </>
                )}
                <Checkbox
                  activeOpacity={1}
                  containerStyle={styles.terms}
                  onPress={() => setTermsAccepted((prev) => !prev)}
                  selected={termsAccepted}
                  text={selectedGiftCard.GiftCardTerms}
                />
                <Button
                  animated={true}
                  disabled={
                    invalidFields.length > 0 ||
                    !termsAccepted ||
                    (selectedGiftCard.CardValue == 0 &&
                      selectedGiftCard.EditableByConsumer &&
                      (customValue.trim() === '' ||
                        isNaN(Number(customValue.replace(Brand.DEFAULT_CURRENCY, ''))))) ||
                    (!useExistingBilling && (expiryError || selectedState.Value === ''))
                  }
                  gradient={Brand.BUTTON_GRADIENT}
                  onPress={() => {
                    location == null
                      ? () => {
                          cleanAction('activeButton')
                          setAction('toast', { text: 'Please select a location.' })
                          return
                        }
                      : selectedGiftCard == null
                        ? () => {
                            cleanAction('activeButton')
                            setAction('toast', { text: 'Please select a gift card to purchase.' })
                            return
                          }
                        : onSubmit()
                  }}
                  style={styles.submitButton}
                  text="Submit"
                />
              </>
            )}
          </View>
        </ScrollView>
      )}
      <TabBar />
      {showDeliveryDatePicker && (
        <ModalDateTimePicker
          minimumDate={new Date()}
          mode="date"
          display="default"
          onSelect={setDeliveryDate}
          onClose={() => setShowDeliveryDatePicker(false)}
          value={deliveryDate}
          visible={true}
        />
      )}
      {modalLocations && (
        <OverlayLocationSelector
          locationId={location != null ? `${location.ClientID}-${location.LocationID}` : undefined}
          locations={locations}
          onClose={() => setModalLocations(false)}
          onSelect={(loc) => {
            setLocation(loc)
            setModalLocations(false)
          }}
        />
      )}
      {giftCards.length > 0 && modalGiftCard && (
        <ModalGiftCardSelector
          data={giftCards}
          onClose={() => setModalGiftCard(false)}
          onSelect={(gc) => {
            if (gc.EditableByConsumer) {
              const stringValue = gc.CardValue > 0 ? String(gc.CardValue) : ''
              setCustomValue(stringValue)
              customValueRef.current?.onTextChanged(stringValue)
              if (gc.CardValue === 0 && !invalidFields.includes('giftCardAmount')) {
                setInvalidFields((prev) => [...prev, 'giftCardAmount'])
              }
            } else {
              setCustomValue('')
              customValueRef.current?.onResetInput()
              setInvalidFields((prev) => prev.filter((p) => p !== 'giftCardAmount'))
            }
            setSelectedGiftCard(gc)
            setModalGiftCard(false)
          }}
          value={selectedGiftCard}
        />
      )}
      {modalMonth && (
        <ModalMonthSelector
          alternateStyling={true}
          onClose={onToggleMonthModal}
          onSelect={setMonth}
          selectedMonth={month}
          visible={true}
        />
      )}
      {modalState && (
        <ModalSelector
          alternateStyling={true}
          data={states}
          onClose={onToggleStateModal}
          onSelect={setState}
          title="Select State"
          value={state}
          visible={true}
        />
      )}
      {modalYear && (
        <ModalYearSelector
          alternateStyling={true}
          onClose={onToggleYearModal}
          onSelect={setYear}
          selectedYear={year}
          visible={true}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { padding: themeStyle.scale(20) },
    inputView: { padding: themeStyle.scale(20) },
    introText: {
      ...themeStyle.textPrimaryRegular14,
      marginBottom: themeStyle.scale(16),
      textAlign: 'center' as 'center',
    },
    locationButtonContainer: {
      alignSelf: 'flex-start' as const,
      minWidth: themeStyle.window.width / 1.5,
    },
    locationButton: {
      borderColor: themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys],
      borderRadius: themeStyle.scale(Brand.BUTTON_LARGE_RADIUS),
      borderWidth: themeStyle.scale(1),
      paddingHorizontal: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(8),
    },
    customAmountInput: {
      marginBottom: themeStyle.scale(24),
      marginTop: themeStyle.scale(16),
      width: '60%' as const,
    },
    customAmountInputRow: {
      backgroundColor: themeStyle.fadedGray,
      borderBottomWidth: 0,
      minHeight: themeStyle.scale(42),
      paddingHorizontal: themeStyle.scale(16),
    },
    customAmountInputField: {
      color: themeStyle.textBlack,
      fontSize: themeStyle.scale(14),
      paddingVertical: 0,
    },
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
    disclaimerText: {
      ...themeStyle.getTextStyle({ color: 'textGray', font: 'fontPrimaryItalic', size: 10 }),
      marginBottom: themeStyle.scale(14),
    },
    sectionTitle: {
      ...themeStyle.sectionTitleText,
      marginBottom: themeStyle.scale(16),
    },
    subSectionTitle: {
      ...themeStyle.textPrimaryBold14,
      color: themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys],
      marginBottom: themeStyle.scale(12),
    },
    inputContainer: { marginBottom: themeStyle.scale(12) },
    inputRow: {
      backgroundColor: themeStyle.fadedGray,
      borderBottomWidth: 0,
      minHeight: themeStyle.scale(42),
      paddingHorizontal: themeStyle.scale(16),
    },
    input: { color: themeStyle.textBlack, fontSize: themeStyle.scale(14), paddingVertical: 0 },
    terms: { marginVertical: themeStyle.scale(12) },
    useExistingBillingRow: { ...themeStyle.rowAligned, marginBottom: themeStyle.scale(16) },
    useExistingBillingText: { ...themeStyle.textPrimaryBold14, marginLeft: themeStyle.scale(12) },
    successImage: { alignSelf: 'center' as 'center', marginBottom: themeStyle.scale(20) },
    completeTitleText: {
      ...themeStyle.textPrimaryBold20,
      marginBottom: themeStyle.scale(8),
      textAlign: 'center' as 'center',
    },
    completeBodyText: {
      ...themeStyle.textPrimaryRegular16,
      marginBottom: themeStyle.scale(24),
      textAlign: 'center' as 'center',
    },
    submitButton: { marginTop: themeStyle.scale(24), width: '100%' as const },
  }
}
