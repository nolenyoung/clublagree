import moment from 'moment'
import * as React from 'react'
import { Keyboard, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Button from './Button'
import Header from './Header'
import Icon from './Icon'
import Input from './Input'
import InputButton from './InputButton'
import InputDatePicker from './InputDatePicker'
import OverlayAddressCountry from './OverlayAddressCountry'
import OverlayAddressState from './OverlayAddressState'
import OverlayBillingExpiration from './OverlayBillingExpiration'
import { API } from '../global/API'
import Brand from '../global/Brand'
import {
  BILLING_INFO_FIELDS,
  EMERGENCY_CONTACT_FIELDS,
  MONTHS,
  REQUIRED_CLIENT_ADDRESS_TEXT_INPUTS,
  YEARS,
} from '../global/Constants'
import {
  formatCreditCard,
  formatPhoneNumber,
  logError,
  validateTextOnChange,
} from '../global/Functions'
import { useListCountries, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  onClose: () => void
  onSuccess: () => void
  requiredInfo: InformationRequired
}

export default function OverlayClientInfoNeeded(props: Props): React.ReactElement {
  const { onClose, onSuccess, requiredInfo } = props
  const {
    AddressRequired,
    BillingInfo,
    CountryCode: countryCode,
    EmergencyContact,
    MissingFields = [],
    User,
  } = requiredInfo ?? {}
  const activeInput = React.useRef<string>('')
  const addressRef = React.useRef<InputRef>(undefined)
  const apartmentRef = React.useRef<InputRef>(undefined)
  const cardNumberRef = React.useRef<InputRef>(undefined)
  const cityRef = React.useRef<InputRef>(undefined)
  const fieldPosition = React.useRef<{ [key: string]: number }>({})
  const inputFields = React.useRef<{ [apiParam: string]: string }>(
    Object.fromEntries(MissingFields.map((f) => [f.apiParam, ''])),
  )
  const missingFieldInputs = React.useRef<{ [key: string]: InputRef }>({})
  const postalRef = React.useRef<InputRef>(undefined)
  const scrollRef = React.useRef<ScrollView | null>(null)
  const { countries } = useListCountries()
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [address, setAddress] = React.useState('')
  const [apartment, setApartment] = React.useState('')
  const [cardNumber, setCardNumber] = React.useState('')
  const [city, setCity] = React.useState('')
  const [country, setCountry] = React.useState<{ Label: string; Value: string }>({
    Label: '',
    Value: '',
  })
  const [expirationInvalid, setExpirationInvalid] = React.useState(true)
  const [invalidFields, setInvalidFields] = React.useState([
    ...MissingFields.map((f) => f.apiParam),
    ...(AddressRequired ? REQUIRED_CLIENT_ADDRESS_TEXT_INPUTS : []),
    ...(BillingInfo ? BILLING_INFO_FIELDS.map((f) => f.apiParam) : []),
    ...(EmergencyContact ? EMERGENCY_CONTACT_FIELDS.map((f) => f.apiParam) : []),
  ])
  const [modalCountry, setModalCountry] = React.useState(false)
  const [modalMonth, setModalMonth] = React.useState(false)
  const [modalState, setModalState] = React.useState(false)
  const [modalYear, setModalYear] = React.useState(false)
  const [month, setMonth] = React.useState('')
  const [postalCode, setPostalCode] = React.useState('')
  const [state, setState] = React.useState<{ Label: string; Value: string }>({
    Label: '',
    Value: '',
  })
  const [year, setYear] = React.useState('')
  async function onSave(data: APIUserUpdateRequired) {
    try {
      let response = await API.updateUserRequired(data)
      if (response.code == 200) {
        setAction('toast', { text: 'Information updated', type: 'success' })
        onSuccess()
      } else {
        setAction('toast', { text: response.message ?? 'Unable to save updates' })
      }
    } catch (e) {
      logError(e)
      setAction('toast', { text: 'Failed to save updated' })
    } finally {
      cleanAction('activeButton')
    }
  }
  // For AddressRequired only
  React.useEffect(() => {
    setCountry(countries.find((c) => c.Value === countryCode) ?? { Label: '', Value: '' })
  }, [countries, countryCode])
  // For BillingInfo only
  React.useEffect(() => {
    if (
      month === '' ||
      year === '' ||
      moment().isAfter(moment(`${month}/${year}`, 'M/YYYY'), 'month')
    ) {
      setExpirationInvalid(true)
    } else {
      setExpirationInvalid(false)
    }
  }, [month, year])
  return (
    <View style={themeStyle.overlayContainerLevel2}>
      <Header
        leftComponent={
          <TouchableOpacity hitSlop={themeStyle.hitSlop} onPress={onClose}>
            <Icon name="arrow-back" style={themeStyle.headerIcon} />
          </TouchableOpacity>
        }
        title="Info Needed"
      />
      <View style={styles.content}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          ref={(ref) => {
            scrollRef.current = ref
          }}
          scrollToOverflowEnabled={true}
          showsVerticalScrollIndicator={false}>
          {(MissingFields.length > 0 || AddressRequired) && (
            <Text style={[themeStyle.overlaySubTitleText, { marginTop: 0 }]}>
              {`In order to complete your booking, we need the following information submitted.`}
            </Text>
          )}
          {MissingFields.length > 0 &&
            MissingFields.map((field, i) => {
              const { apiParam, fieldType, futureOnly = false, label, pastOnly = true } = field
              const isNextField =
                MissingFields[i + 1] != null &&
                !MissingFields[i + 1].fieldType.toLowerCase().includes('date')
              const isNextSection = AddressRequired || BillingInfo
              if (fieldType.toLowerCase().includes('date')) {
                return (
                  <React.Fragment key={apiParam}>
                    <InputDatePicker
                      borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                      containerStyle={styles.inputContainer}
                      country={countryCode}
                      futureOnly={futureOnly}
                      label={label}
                      labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                      onChange={(value) => {
                        inputFields.current[apiParam] = moment(value.toISOString()).format(
                          'YYYY-MM-DD',
                        )
                        setInvalidFields((prev) =>
                          prev.includes(apiParam) ? prev.filter((p) => p !== apiParam) : prev,
                        )
                      }}
                      pastOnly={pastOnly}
                      textColor={themeStyle.textBlack}
                    />
                  </React.Fragment>
                )
              }
              return (
                <Input
                  autoCapitalize={fieldType === 'email' ? 'none' : undefined}
                  borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                  containerStyle={styles.inputContainer}
                  format={fieldType === 'phone' ? formatPhoneNumber : undefined}
                  getInputRef={(ref) => {
                    missingFieldInputs.current[apiParam] = ref
                  }}
                  key={apiParam}
                  keyboardType={
                    fieldType === 'phone'
                      ? 'phone-pad'
                      : fieldType === 'email'
                        ? 'email-address'
                        : 'default'
                  }
                  label={label}
                  labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                  onChangeText={({ text, setError }) => {
                    inputFields.current[apiParam] =
                      fieldType === 'email' ? text.toLowerCase() : text
                    validateTextOnChange({
                      errorOnChange: true,
                      fieldName: apiParam,
                      setError,
                      setInvalidFields,
                      setState: () => {},
                      text,
                      type: fieldType,
                      validationParams: [countryCode],
                    })
                  }}
                  onFocus={() => {
                    activeInput.current = apiParam
                    scrollRef.current?.scrollTo({
                      x: 0,
                      y: Math.max(fieldPosition.current[apiParam], 0),
                    })
                  }}
                  onLayout={(event) => {
                    const { height, y } = event.nativeEvent.layout
                    fieldPosition.current[apiParam] = y - height * 3
                  }}
                  onSubmitEditing={() => {
                    if (isNextField) {
                      missingFieldInputs.current[MissingFields[i + 1].apiParam]?.focus()
                    } else if (isNextSection) {
                      AddressRequired ? addressRef.current?.focus() : cardNumberRef.current?.focus()
                    }
                  }}
                  returnKeyType={isNextField || isNextSection ? 'next' : 'done'}
                  textColor={themeStyle.textBlack}
                />
              )
            })}
          {AddressRequired && (
            <>
              <Input
                borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                containerStyle={styles.inputContainer}
                getInputRef={(ref) => {
                  addressRef.current = ref
                }}
                key="addressInput"
                label="Address"
                labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                onChangeText={({ text, setError }) => {
                  validateTextOnChange({
                    errorOnChange: true,
                    fieldName: 'Address1',
                    setError,
                    setInvalidFields,
                    setState: (text) => setAddress(text),
                    text,
                    type: 'address',
                    validationParams: [countryCode],
                  })
                }}
                onEndEditing={(text, setError) =>
                  validateTextOnChange({
                    errorOnChange: true,
                    fieldName: 'Address1',
                    setError,
                    setInvalidFields,
                    setState: (text) => setAddress(text),
                    text,
                    type: 'address',
                    validationParams: [countryCode],
                  })
                }
                onFocus={() => {
                  activeInput.current = 'address'
                  scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.address })
                }}
                onLayout={(event) => {
                  const { height, y } = event.nativeEvent.layout
                  fieldPosition.current.address = y - height * 3
                }}
                onSubmitEditing={() => {
                  apartmentRef.current && apartmentRef.current.focus()
                }}
                placeholder="Street Address"
                returnKeyType="next"
                textColor={themeStyle.textBlack}
                textContentType="streetAddressLine1"
              />
              <Input
                borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                containerStyle={styles.inputContainer}
                getInputRef={(ref) => {
                  apartmentRef.current = ref
                }}
                info="Optional"
                key="apartmentInput"
                label="Apt/Unit #"
                labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                onChangeText={({ text }) => setApartment(text)}
                onEndEditing={() => {
                  activeInput.current === 'apartment' && scrollRef.current?.scrollTo({ x: 0, y: 0 })
                }}
                onFocus={() => {
                  activeInput.current = 'apartment'
                  scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.apartment })
                }}
                onLayout={(event) => {
                  const { height, y } = event.nativeEvent.layout
                  fieldPosition.current.apartment = y - height * 3
                }}
                onSubmitEditing={() => {
                  cityRef.current?.focus()
                }}
                placeholder="Apt/Unit #"
                returnKeyType="next"
                textColor={themeStyle.textBlack}
                textContentType="streetAddressLine2"
              />
              <Input
                borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                containerStyle={styles.inputContainer}
                getInputRef={(ref) => {
                  cityRef.current = ref
                }}
                key="cityInput"
                label="City"
                labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                onChangeText={({ text, setError }) =>
                  validateTextOnChange({
                    errorOnChange: true,
                    fieldName: 'City',
                    setError,
                    setInvalidFields,
                    setState: setCity,
                    text,
                    type: 'city',
                    validationParams: [countryCode],
                  })
                }
                onEndEditing={(text, setError) =>
                  validateTextOnChange({
                    errorOnChange: true,
                    fieldName: 'City',
                    setError,
                    setInvalidFields,
                    setState: setCity,
                    text,
                    type: 'city',
                    validationParams: [countryCode],
                  })
                }
                onFocus={() => {
                  activeInput.current = 'city'
                  scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.city })
                }}
                onLayout={(event) => {
                  const { height, y } = event.nativeEvent.layout
                  fieldPosition.current.city = y - height * 3
                }}
                onSubmitEditing={() => {
                  postalRef.current?.focus()
                }}
                placeholder="City"
                returnKeyType="next"
                textColor={themeStyle.textBlack}
                textContentType="addressCity"
              />
              <Input
                autoComplete="postal-code"
                borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                containerStyle={styles.inputContainer}
                getInputRef={(ref) => {
                  postalRef.current = ref
                }}
                key="postalInput"
                label={country.Value === 'AU' ? 'Postcode' : 'Zip / Postal Code'}
                labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                onChangeText={({ text, setError }) =>
                  validateTextOnChange({
                    errorOnChange: true,
                    fieldName: 'Zip',
                    setError,
                    setInvalidFields,
                    setState: setPostalCode,
                    text,
                    type: 'postalCode',
                    validationParams: [countryCode],
                  })
                }
                onEndEditing={(text, setError) => {
                  validateTextOnChange({
                    errorOnChange: true,
                    fieldName: 'Zip',
                    setError,
                    setInvalidFields,
                    setState: setPostalCode,
                    text,
                    type: 'postalCode',
                    validationParams: [countryCode],
                  })
                  activeInput.current === 'postalCode' &&
                    scrollRef.current?.scrollToEnd({ animated: true })
                }}
                onFocus={() => {
                  activeInput.current = 'postalCode'
                  scrollRef.current?.scrollTo({
                    x: 0,
                    y: fieldPosition.current.postal,
                    animated: true,
                  })
                }}
                onLayout={(event) => {
                  const { height, y } = event.nativeEvent.layout
                  fieldPosition.current.postal = y - height * 3
                }}
                placeholder={country.Value === 'AU' ? 'Postcode' : 'Zip / Postal Code'}
                returnKeyType="done"
                textColor={themeStyle.textBlack}
                textContentType="postalCode"
              />
              <InputButton
                borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                containerStyle={styles.inputContainer}
                label="State"
                labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                onPress={() => {
                  Keyboard.dismiss()
                  setModalState(true)
                }}
                textColor={themeStyle.textBlack}
                value={state.Label || 'State'}
              />
              <InputButton
                borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                containerStyle={styles.inputContainer}
                label="Country"
                labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                onPress={() => {
                  Keyboard.dismiss()
                  setModalCountry(true)
                }}
                textColor={themeStyle.textBlack}
                value={country.Label || 'Country'}
              />
            </>
          )}
          {BillingInfo && (
            <>
              <Text
                style={[
                  themeStyle.overlaySubTitleText,
                  !AddressRequired && MissingFields.length === 0 && { marginTop: 0 },
                ]}>
                {`Please place a credit card on file. Your card will only be used if you initiate a purchase or if you late cancel / no show.`}
              </Text>
              <Input
                autoComplete="cc-number"
                borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                containerStyle={styles.inputContainer}
                format={formatCreditCard}
                getInputRef={(ref) => {
                  cardNumberRef.current = ref
                }}
                key="CardNumber"
                keyboardType="number-pad"
                label="Credit Card Number"
                labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                maxLength={23}
                onChangeText={({ text, setError }) => {
                  setCardNumber(text)
                  validateTextOnChange({
                    errorOnChange: true,
                    fieldName: 'CardNumber',
                    setError,
                    setInvalidFields,
                    setState: () => {},
                    text,
                    type: 'creditCard',
                    validationParams: ['US'],
                  })
                }}
                onEndEditing={(text, setError) =>
                  validateTextOnChange({
                    errorOnChange: true,
                    fieldName: 'CardNumber',
                    setError,
                    setInvalidFields,
                    setState: () => {},
                    text,
                    type: 'creditCard',
                    validationParams: ['US'],
                  })
                }
                onFocus={() => {
                  activeInput.current = 'cardNumber'
                  scrollRef.current?.scrollTo({
                    x: 0,
                    y: fieldPosition.current.cardNumber,
                    animated: true,
                  })
                }}
                onLayout={(event) => {
                  const { height, y } = event.nativeEvent.layout
                  fieldPosition.current.cardNumber = y - height * 3
                }}
                placeholder="Enter Card Number"
                returnKeyType="done"
                textColor={themeStyle.textBlack}
                textContentType="creditCardNumber"
              />
              <View style={styles.expiryRow}>
                <InputButton
                  borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                  containerStyle={themeStyle.halfInput}
                  label="Month"
                  labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                  onPress={() => setModalMonth(true)}
                  textColor={themeStyle.textBlack}
                  value={MONTHS.find((m) => m.value === month)?.key ?? 'Exp Month'}
                />
                <InputButton
                  borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                  containerStyle={themeStyle.halfInput}
                  label="Year"
                  labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                  onPress={() => setModalYear(true)}
                  textColor={themeStyle.textBlack}
                  value={YEARS.find((y) => y.value === year)?.key ?? 'Exp Year'}
                />
              </View>
            </>
          )}
          {EmergencyContact && (
            <>
              <Text
                style={[
                  themeStyle.overlaySubTitleText,
                  MissingFields.length === 0 &&
                    !AddressRequired &&
                    !BillingInfo && { marginTop: 0 },
                ]}>
                {`We need your emergency contact's information stored on your account.`}
              </Text>
              {EMERGENCY_CONTACT_FIELDS.map((field, i) => {
                const { apiParam, fieldType, label } = field
                const isNextField = EMERGENCY_CONTACT_FIELDS[i + 1] != null
                return (
                  <Input
                    autoCapitalize={fieldType === 'email' ? 'none' : undefined}
                    borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                    containerStyle={styles.inputContainer}
                    format={fieldType === 'phone' ? formatPhoneNumber : undefined}
                    getInputRef={(ref) => {
                      missingFieldInputs.current[apiParam] = ref
                    }}
                    key={apiParam}
                    keyboardType={
                      fieldType === 'phone'
                        ? 'phone-pad'
                        : fieldType === 'email'
                          ? 'email-address'
                          : 'default'
                    }
                    label={label}
                    labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                    onChangeText={({ text, setError }) => {
                      inputFields.current[apiParam] =
                        fieldType === 'email' ? text.toLowerCase() : text
                      validateTextOnChange({
                        errorOnChange: true,
                        fieldName: apiParam,
                        setError,
                        setInvalidFields,
                        setState: () => {},
                        text,
                        type: fieldType,
                        validationParams: [countryCode],
                      })
                    }}
                    onEndEditing={() => {
                      setTimeout(() => {
                        if (activeInput.current === apiParam) {
                          scrollRef.current?.scrollToEnd()
                        }
                      }, 300)
                    }}
                    onFocus={() => {
                      activeInput.current = apiParam
                      scrollRef.current?.scrollTo({
                        x: 0,
                        y: Math.max(fieldPosition.current[apiParam], 0),
                      })
                    }}
                    onLayout={(event) => {
                      const { height, y } = event.nativeEvent.layout
                      fieldPosition.current[apiParam] = y - height * 3
                    }}
                    onSubmitEditing={() => {
                      if (isNextField) {
                        missingFieldInputs.current[
                          EMERGENCY_CONTACT_FIELDS[i + 1].apiParam
                        ]?.focus()
                      }
                    }}
                    returnKeyType={isNextField ? 'next' : 'done'}
                    textColor={themeStyle.textBlack}
                  />
                )
              })}
            </>
          )}
        </ScrollView>
        <Button
          animated={true}
          disabled={
            invalidFields.length > 0 ||
            (AddressRequired && (country.Value === '' || state.Value === '')) ||
            (BillingInfo && expirationInvalid)
          }
          onPress={() =>
            onSave({
              ...inputFields.current,
              ...(AddressRequired
                ? {
                    AddressLine1: address,
                    AddressLine2: apartment,
                    City: city,
                    Country: country.Value,
                    State: state.Value,
                    PostalCode: postalCode,
                  }
                : {}),
              ...(BillingInfo ? { CardNumber: cardNumber, ExpMonth: month, ExpYear: year } : {}),
              ...User,
            })
          }
          style={styles.saveButton}
          text="Submit"
        />
      </View>
      {modalCountry && (
        <OverlayAddressCountry
          countries={countries}
          onPress={(c) => {
            if (c.Value !== country.Value) {
              setState({ Label: '', Value: '' })
            }
            setCountry(c)
            setModalCountry(false)
          }}
          selectedOption={country.Value}
          setVisible={setModalCountry}
        />
      )}
      {modalState && (
        <OverlayAddressState
          countryCode={countryCode}
          onPress={(c) => {
            setState(c)
            setModalState(false)
          }}
          selectedOption={state.Value}
          setVisible={setModalState}
        />
      )}
      {(modalMonth || modalYear) && (
        <OverlayBillingExpiration
          isYearSelector={modalYear}
          onPress={(v) => {
            if (modalYear) {
              setYear(v)
              setModalYear(false)
            } else {
              setMonth(v)
              setModalMonth(false)
            }
          }}
          selectedOption={modalYear ? year : month}
          setVisible={modalYear ? setModalYear : setModalMonth}
        />
      )}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: {
      backgroundColor: themeStyle.colorWhite,
      flex: 1,
      paddingHorizontal: themeStyle.scale(20),
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: themeStyle.scale(12),
      paddingTop: themeStyle.scale(20),
    },
    titleText: { ...themeStyle.sectionTitleText, flex: 1 },
    inputContainer: { marginTop: themeStyle.scale(24) },
    expiryRow: { ...themeStyle.rowAlignedBetween, marginTop: themeStyle.scale(24) },
    saveButton: {
      alignSelf: 'center' as const,
      marginBottom: themeStyle.edgeInsets.bottom + themeStyle.scale(8),
      marginTop: themeStyle.scale(20),
      width: '100%' as const,
    },
  }
}
