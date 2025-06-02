import moment from 'moment'
import * as React from 'react'
import { ScrollView, Text, TouchableOpacity, View, Alert } from 'react-native'
import { useSelector } from 'react-redux'
import {
  Button,
  CardConsent,
  Icon,
  Input,
  InputButton,
  ModalDateTimePicker,
  ModalGenderSelector,
  OverlayLocationSelector,
  ModalReferralSelector,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import {
  formatDateBirthday,
  formatPhoneNumber,
  logError,
  logEvent,
  logUserContext,
  onHandleAppLink,
  validateEmail,
  validateMobile,
  validateTextOnChange,
  validateTextRequired,
} from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

const next = async (params: any) => {
  const {
    date,
    email,
    emergencyEmail,
    emergencyName,
    emergencyPhone,
    emergencyRelationship,
    firstName,
    gender,
    initialUrl,
    lastName,
    navigate,
    optIn,
    phone,
    referral,
    studio,
  } = params
  const { invalid: emailInvalid } = validateEmail(email)
  const { invalid: firstNameInvalid } = validateTextRequired(firstName)
  const { invalid: lastNameInvalid } = validateTextRequired(lastName)
  const { invalid: phoneInvalid } =
    phone === '' ? { invalid: false } : validateMobile(phone, studio.Country)
  if (emailInvalid || firstNameInvalid || lastNameInvalid || phoneInvalid) {
    setAction('toast', { text: 'Check entries for accuracy.' })
    return
  }
  if (Brand.UI_EMERGENCY_CONTACT_INFO) {
    const { invalid: emergencyEmailInvalid } = validateEmail(emergencyEmail)
    const { invalid: emergencyNameInvalid } = validateTextRequired(emergencyName)
    const { invalid: emergencyPhoneInvalid } =
      emergencyPhone === '' ? { invalid: false } : validateMobile(emergencyPhone, studio.Country)
    const { invalid: emergencyRelationshipInvalid } = validateTextRequired(emergencyRelationship)
    if (
      emergencyEmailInvalid ||
      emergencyNameInvalid ||
      emergencyPhoneInvalid ||
      emergencyRelationshipInvalid
    ) {
      setAction('toast', { text: 'Check entries for accuracy.' })
      return
    }
  }
  setAction('loading', { loading: true })
  const data = {
    ...(Brand.UI_EMERGENCY_CONTACT_INFO
      ? {
          EmergencyContactInfoEmail: emergencyEmail,
          EmergencyContactInfoName: emergencyName,
          EmergencyContactInfoPhone: emergencyPhone,
          EmergencyContactInfoRelationship: emergencyRelationship,
        }
      : {}),
    BirthDate: date != null ? moment(date.toISOString()).format('YYYY-MM-DD') : '',
    Email: email,
    FirstName: firstName,
    Gender: gender,
    HomeStudio: `${studio.ClientID}-${studio.LocationID}`,
    LastName: lastName,
    MobilePhone: phone,
    OptInText: optIn,
    ReferredBy: referral ?? '',
  } as const
  try {
    let response = await API.createUser(data)
    const { code, data: client, message } = response
    if (code == 598 || code == 504 || client == null) {
      cleanAction('loading')
      Alert.alert('Oops!', message)
    } else {
      const userInfo = {
        ...client,
        clientId: client.clientID,
        Country: studio.Country,
        locationId: client.locationID,
        marketId: client.siteID,
        personId: client.personID,
      } as const
      logUserContext({ clientId: client.clientID, personId: client.personID })
      await logEvent('signup_completed', {
        clientId: client.clientID,
        country: studio.Country,
        locationId: client.locationID,
        marketId: client.siteID,
        personId: client.personID,
        referredBy: data.ReferredBy,
        timestamp: Date.now(),
      })
      setAction('user', userInfo)
      cleanAction('loading')
      if (initialUrl != null) {
        onHandleAppLink({ navigate, url: initialUrl })
      } else {
        navigate('Home')
      }
    }
  } catch (e: any) {
    logError(e)
    Alert.alert('Oops!', 'Something went wrong.')
    cleanAction('loading')
  }
}

export default function Signup(props: RootNavigatorScreenProps<'Signup'>) {
  const { goBack, navigate } = props.navigation
  const activeInput = React.useRef('')
  const fieldPosition = React.useRef({} as { [key: string]: any })
  const emailRef = React.useRef<InputRef>(undefined)
  const emergencyEmailRef = React.useRef<InputRef>(undefined)
  const emergencyNameRef = React.useRef<InputRef>(undefined)
  const emergencyPhoneRef = React.useRef<InputRef>(undefined)
  const emergencyRelationshipRef = React.useRef<InputRef>(undefined)
  const firstNameRef = React.useRef<InputRef>(undefined)
  const lastNameRef = React.useRef<InputRef>(undefined)
  const phoneRef = React.useRef<InputRef>(undefined)
  const scrollRef = React.useRef<ScrollView | null>(null)
  const initialUrl = useSelector((state: ReduxState) => state.appLink.url)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [date, setDate] = React.useState<any>(null)
  const [email, setEmail] = React.useState('')
  const [emergencyEmail, setEmergencyEmail] = React.useState('')
  const [emergencyName, setEmergencyName] = React.useState('')
  const [emergencyPhone, setEmergencyPhone] = React.useState('')
  const [emergencyRelationship, setEmergencyRelationship] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [gender, setGender] = React.useState<any>(null)
  const [invalidFields, setInvalidFields] = React.useState([
    ...(Brand.UI_EMERGENCY_CONTACT_INFO
      ? ['emergencyEmail', 'emergencyName', 'emergencyPhone', 'emergencyRelationship']
      : []),
    'email',
    'firstName',
    'lastName',
  ])
  const [lastName, setLastName] = React.useState('')
  const [modalGender, setModalGender] = React.useState(false)
  const [modalReferral, setModalReferral] = React.useState(false)
  const [modalStudio, setModalStudio] = React.useState(false)
  const [optIn, setOptIn] = React.useState(false)
  const [phone, setPhone] = React.useState('')
  const [referral, setReferral] = React.useState<any>(null)
  const [showDatePicker, setShowDatePicker] = React.useState(false)
  const [studio, setStudio] = React.useState<Partial<Location>>({
    ClientID: undefined,
    Country: Brand.DEFAULT_COUNTRY,
    LocationID: undefined,
    Nickname: 'Select a Primary Location',
  })
  const [studios, setStudios] = React.useState<Location[]>([])
  const onFetchStudios = React.useCallback(
    async (loc?: { Latitude: number; Longitude: number }) => {
      setAction('loading', { loading: true })
      try {
        let response = await API.getStudios(loc)
        // Check that response is an array
        if (Array.isArray(response)) {
          // If there is only one studio, set it as the studio and the studios array
          if (response.length === 1) {
            setStudio(response[0])
            setStudios(response)
          } else {
            // If there are multiple studios, sort them by distance if a location is provided
            if (response.length > 0 && 'Distance_Mi' in response[0]) {
              setStudios(
                response.sort((a, b) => {
                  if (Brand.DEFAULT_COUNTRY === 'US') {
                    return Number(a.Distance_Mi) - Number(b.Distance_Mi)
                  }
                  return Number(a.Distance_Km) - Number(b.Distance_Km)
                }),
              )
            } else {
              setStudios(response)
            }
          }
        } else {
          setAction('toast', { text: response.message })
        }
        cleanAction('loading')
      } catch (e: any) {
        logError(e)
        setAction('toast', { text: 'Unable to fetch the studio list.' })
        cleanAction('loading')
      } finally {
        cleanAction('loading')
      }
    },
    [],
  )
  const onNext = () => {
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true })
    next({
      date,
      email,
      emergencyEmail,
      emergencyName,
      emergencyPhone,
      emergencyRelationship,
      firstName,
      gender,
      initialUrl,
      lastName,
      navigate,
      optIn,
      phone,
      referral,
      setInvalidFields,
      studio,
    })
  }
  const onToggleGenderModal = React.useCallback(() => {
    setModalGender((prev) => !prev)
  }, [])
  const onToggleReferralModal = React.useCallback(() => {
    setModalReferral((prev) => !prev)
  }, [])
  React.useEffect(() => {
    onFetchStudios()
  }, [])
  const disabled =
    invalidFields.length > 0 ||
    (!Brand.UI_SIGNUP_HIDE_FIELDS.includes('gender') && gender == null) ||
    (!Brand.UI_SIGNUP_HIDE_FIELDS.includes('dob') &&
      (date == null || moment(date).isSame(moment(), 'day'))) ||
    (!Brand.UI_SIGNUP_HIDE_FIELDS.includes('referral') && referral == null) ||
    studio.ClientID == null
  return (
    <View style={themeStyle.signUpScreen.content}>
      <TouchableOpacity
        hitSlop={themeStyle.hitSlop}
        onPress={() => goBack()}
        style={styles.closeButton}>
        <Icon
          name="clear"
          style={[
            themeStyle.closeIcon,
            { color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys] },
          ]}
        />
      </TouchableOpacity>
      <View style={styles.titleRow}>
        <Text style={themeStyle.signUpScreen.titleText}>Sign Up</Text>
      </View>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        onLayout={(event) => (fieldPosition.current.scrollView = event.nativeEvent.layout.y)}
        ref={scrollRef}
        scrollToOverflowEnabled={true}
        showsVerticalScrollIndicator={false}>
        {studios.length > 1 && (
          <TouchableOpacity
            onPress={async () => {
              await logEvent('signup_location_list')
              setModalStudio(true)
            }}
            style={[
              themeStyle.inputButton,
              {
                borderBottomColor:
                  themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys],
              },
            ]}>
            <Text
              style={[
                themeStyle.inputButtonText,
                {
                  color:
                    studio.Nickname === 'Select a Primary Location'
                      ? themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                      : themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
                },
              ]}>
              {studio.Nickname}
            </Text>
          </TouchableOpacity>
        )}
        {studio.ClientID != null && (
          <React.Fragment>
            <Input
              borderColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]}
              containerStyle={themeStyle.inputView}
              getInputRef={(ref) => {
                firstNameRef.current = ref
              }}
              key="firstNameInput"
              labelColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]}
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
              onEndEditing={(text, setError) =>
                validateTextOnChange({
                  errorOnChange: true,
                  setError,
                  setInvalidFields,
                  setState: setFirstName,
                  text,
                  type: 'firstName',
                })
              }
              onFocus={() => {
                activeInput.current = 'firstName'
                setTimeout(() => scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true }), 250)
              }}
              onSubmitEditing={() => {
                lastNameRef.current?.focus()
              }}
              placeholder="First Name"
              placeholderTextColor={
                themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
              }
              returnKeyType="next"
              textColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]}
              textContentType="givenName"
            />
            <Input
              borderColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]}
              containerStyle={themeStyle.inputView}
              getInputRef={(ref) => {
                lastNameRef.current = ref
              }}
              key="lastNameInput"
              labelColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]}
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
              onEndEditing={(text, setError) =>
                validateTextOnChange({
                  errorOnChange: true,
                  setError,
                  setInvalidFields,
                  setState: setLastName,
                  text,
                  type: 'lastName',
                })
              }
              onFocus={() => {
                activeInput.current = 'lastName'
                setTimeout(() => scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true }), 250)
              }}
              onSubmitEditing={() => {
                emailRef.current && emailRef.current.focus()
              }}
              placeholder="Last Name"
              placeholderTextColor={
                themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
              }
              returnKeyType="next"
              textColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]}
              textContentType="familyName"
            />
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              borderColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]}
              containerStyle={themeStyle.inputView}
              getInputRef={(ref) => {
                emailRef.current = ref
              }}
              key="emailInput"
              keyboardType="email-address"
              labelColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]}
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
              onEndEditing={(text, setError) =>
                validateTextOnChange({
                  errorOnChange: true,
                  setError,
                  setInvalidFields,
                  setState: setEmail,
                  text,
                  type: 'email',
                })
              }
              onFocus={() => {
                activeInput.current = 'email'
                setTimeout(
                  () => scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.email }),
                  250,
                )
              }}
              onLayout={(event) => {
                fieldPosition.current.email = event.nativeEvent.layout.y
              }}
              placeholder="Email Address"
              placeholderTextColor={
                themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
              }
              returnKeyType="next"
              textColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]}
              textContentType="emailAddress"
            />
            {!Brand.UI_SIGNUP_HIDE_FIELDS.includes('dob') &&
              !Brand.UI_SIGNUP_HIDE_FIELDS.includes('gender') && (
                <View style={themeStyle.rowAlignedBetween}>
                  <InputButton
                    borderColor={
                      themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                    }
                    containerStyle={themeStyle.halfInput}
                    labelColor={
                      themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                    }
                    onPress={() => setShowDatePicker(true)}
                    textColor={
                      date == null
                        ? themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                        : themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]
                    }
                    value={formatDateBirthday(date)}
                  />
                  <InputButton
                    borderColor={
                      themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                    }
                    containerStyle={themeStyle.halfInput}
                    labelColor={
                      themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                    }
                    onPress={onToggleGenderModal}
                    textColor={
                      gender == null
                        ? themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                        : themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]
                    }
                    value={gender ?? 'Gender'}
                  />
                  <ModalDateTimePicker
                    maximumDate={new Date()}
                    mode="date"
                    display="default"
                    onSelect={setDate}
                    onClose={() => setShowDatePicker(false)}
                    value={date != null ? date : new Date()}
                    visible={showDatePicker}
                  />
                </View>
              )}
            {!Brand.UI_SIGNUP_HIDE_FIELDS.includes('referral') && (
              <TouchableOpacity
                onPress={onToggleReferralModal}
                style={[
                  themeStyle.inputButton,
                  {
                    borderBottomColor:
                      themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys],
                  },
                ]}>
                <Text
                  style={[
                    themeStyle.inputButtonText,
                    {
                      color:
                        referral == null
                          ? themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                          : themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
                    },
                  ]}>
                  {referral ?? 'How did you hear about us?'}
                </Text>
              </TouchableOpacity>
            )}
            <Input
              autoComplete="tel"
              borderColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]}
              containerStyle={themeStyle.inputView}
              format={(n) => formatPhoneNumber(n, studio.Country)}
              getInputRef={(ref) => {
                phoneRef.current = ref
              }}
              info="Optional"
              key="phoneInput"
              keyboardType="phone-pad"
              labelColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]}
              onChangeText={({ text, setError }) =>
                validateTextOnChange({
                  errorOnChange: false,
                  setError,
                  setInvalidFields,
                  setState: setPhone,
                  text,
                  type: 'mobile',
                  validationParams: [studio.Country ?? ''],
                })
              }
              onEndEditing={(text, setError) => {
                if (text === '' || text === '+') {
                  if (text === '+') {
                    phoneRef.current?.onTextChanged('')
                  }
                  setError('')
                  setInvalidFields((prev) => prev.filter((p) => p !== 'mobile'))
                  setPhone('')
                } else {
                  validateTextOnChange({
                    errorOnChange: true,
                    setError,
                    setInvalidFields,
                    setState: setPhone,
                    text,
                    type: 'mobile',
                    validationParams: [studio.Country ?? ''],
                  })
                }
                !Brand.UI_EMERGENCY_CONTACT_INFO &&
                  setTimeout(() => scrollRef.current?.scrollToEnd(), 300)
              }}
              onFocus={() => {
                activeInput.current = 'phone'
                setTimeout(
                  () => scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.phone }),
                  250,
                )
              }}
              onLayout={(event) => {
                fieldPosition.current.phone = event.nativeEvent.layout.y
              }}
              placeholder="Mobile Phone"
              placeholderTextColor={
                themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
              }
              returnKeyType="done"
              textColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]}
              textContentType="telephoneNumber"
            />
            {Brand.UI_EMERGENCY_CONTACT_INFO && (
              <>
                <Text style={themeStyle.signUpScreen.billingSectionText}>Emergency Contact</Text>
                <Input
                  borderColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  containerStyle={themeStyle.inputView}
                  getInputRef={(ref) => {
                    emergencyNameRef.current = ref
                  }}
                  key="emergencyNameInput"
                  labelColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  onChangeText={({ text, setError }) =>
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setInvalidFields,
                      setState: setEmergencyName,
                      text,
                      type: 'emergencyName',
                    })
                  }
                  onEndEditing={(text, setError) =>
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setInvalidFields,
                      setState: setEmergencyName,
                      text,
                      type: 'emergencyName',
                    })
                  }
                  onFocus={() => {
                    activeInput.current = 'emergencyName'
                    setTimeout(
                      () =>
                        scrollRef.current?.scrollTo({
                          x: 0,
                          y: fieldPosition.current.emergencyName,
                        }),
                      250,
                    )
                  }}
                  onLayout={(event) => {
                    fieldPosition.current.emergencyName =
                      event.nativeEvent.layout.y - themeStyle.scale(60)
                  }}
                  onSubmitEditing={() => {
                    emergencyEmailRef.current?.focus()
                  }}
                  placeholder="Contact Name"
                  placeholderTextColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  returnKeyType="next"
                  textColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]}
                  textContentType="name"
                />
                <Input
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  borderColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  containerStyle={themeStyle.inputView}
                  getInputRef={(ref) => {
                    emergencyEmailRef.current = ref
                  }}
                  key="emergencyEmailInput"
                  keyboardType="email-address"
                  labelColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  onChangeText={({ text, setError }) =>
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setInvalidFields,
                      setState: setEmergencyEmail,
                      text,
                      type: 'emergencyEmail',
                    })
                  }
                  onEndEditing={(text, setError) => {
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setInvalidFields,
                      setState: setEmergencyEmail,
                      text,
                      type: 'emergencyEmail',
                    })
                    setTimeout(
                      () =>
                        activeInput.current === 'emergencyEmail' &&
                        scrollRef.current?.scrollToEnd(),
                      300,
                    )
                  }}
                  onFocus={() => {
                    activeInput.current = 'emergencyEmail'
                    setTimeout(
                      () =>
                        scrollRef.current?.scrollTo({
                          x: 0,
                          y: fieldPosition.current.emergencyEmail,
                        }),
                      250,
                    )
                  }}
                  onLayout={(event) => {
                    fieldPosition.current.emergencyEmail =
                      event.nativeEvent.layout.y - themeStyle.scale(60)
                  }}
                  onSubmitEditing={() => {
                    emergencyPhoneRef.current && emergencyPhoneRef.current.focus()
                  }}
                  placeholder="Contact Email"
                  placeholderTextColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  returnKeyType="next"
                  textColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]}
                  textContentType="emailAddress"
                />
                <Input
                  autoComplete="tel"
                  borderColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  containerStyle={themeStyle.inputView}
                  format={(n) => formatPhoneNumber(n, studio.Country)}
                  getInputRef={(ref) => {
                    emergencyPhoneRef.current = ref
                  }}
                  key="emergencyPhoneInput"
                  keyboardType="phone-pad"
                  labelColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  onChangeText={({ text, setError }) =>
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setInvalidFields,
                      setState: setEmergencyPhone,
                      text,
                      type: 'emergencyPhone',
                      validationParams: [studio.Country ?? ''],
                    })
                  }
                  onEndEditing={(text, setError) => {
                    if (text === '' || text === '+') {
                      if (text === '+') {
                        emergencyPhoneRef.current?.onTextChanged('')
                      }
                      setError('')
                      setInvalidFields((prev) => prev.filter((p) => p !== 'emergencyPhone'))
                      setPhone('')
                    } else {
                      validateTextOnChange({
                        errorOnChange: true,
                        setError,
                        setInvalidFields,
                        setState: setEmergencyPhone,
                        text,
                        type: 'emergencyPhone',
                        validationParams: [studio.Country ?? ''],
                      })
                    }
                    setTimeout(
                      () =>
                        activeInput.current === 'emergencyPhone' &&
                        scrollRef.current?.scrollToEnd(),
                      300,
                    )
                  }}
                  onFocus={() => {
                    activeInput.current = 'emergencyPhone'
                    setTimeout(
                      () =>
                        scrollRef.current?.scrollTo({
                          x: 0,
                          y: fieldPosition.current.emergencyPhone,
                        }),
                      250,
                    )
                  }}
                  onLayout={(event) => {
                    fieldPosition.current.emergencyPhone =
                      event.nativeEvent.layout.y - themeStyle.scale(60)
                  }}
                  onSubmitEditing={() => {
                    emergencyRelationshipRef.current && emergencyRelationshipRef.current.focus()
                  }}
                  placeholder="Contact Phone"
                  placeholderTextColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  returnKeyType="next"
                  textColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]}
                  textContentType="telephoneNumber"
                />
                <Input
                  borderColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  containerStyle={themeStyle.inputView}
                  getInputRef={(ref) => {
                    emergencyRelationshipRef.current = ref
                  }}
                  key="emergencyRelationshipInput"
                  labelColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  onChangeText={({ text, setError }) =>
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setInvalidFields,
                      setState: setEmergencyRelationship,
                      text,
                      type: 'emergencyRelationship',
                    })
                  }
                  onEndEditing={(text, setError) => {
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setInvalidFields,
                      setState: setEmergencyRelationship,
                      text,
                      type: 'emergencyRelationship',
                    })
                    setTimeout(
                      () =>
                        activeInput.current === 'emergencyRelationship' &&
                        scrollRef.current?.scrollToEnd(),
                      300,
                    )
                  }}
                  onFocus={() => {
                    activeInput.current = 'emergencyRelationship'
                    setTimeout(
                      () =>
                        scrollRef.current?.scrollTo({
                          x: 0,
                          y: fieldPosition.current.emergencyRelationship,
                          animated: true,
                        }),
                      250,
                    )
                  }}
                  onLayout={(event) => {
                    fieldPosition.current.emergencyRelationship =
                      event.nativeEvent.layout.y - themeStyle.scale(60)
                  }}
                  onSubmitEditing={() => {
                    setTimeout(() => scrollRef.current?.scrollToEnd(), 300)
                  }}
                  placeholder="Contact Relationship"
                  placeholderTextColor={
                    themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT_PLACEHOLDER as ColorKeys]
                  }
                  returnKeyType="done"
                  textColor={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]}
                />
              </>
            )}
            {Brand.STRING_SIGN_UP_AGREEMENT != null && (
              <React.Fragment>
                <Text style={themeStyle.signUpScreen.billingSectionText}>Stay Informed</Text>
                <CardConsent
                  disclaimer={Brand.STRING_SIGN_UP_AGREEMENT}
                  setTerms={setOptIn}
                  terms={optIn}
                  text="Keep me informed"
                />
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </ScrollView>
      {studio.ClientID != null && (
        <Button
          color={themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys]}
          disabled={disabled}
          gradient={Brand.BUTTON_GRADIENT}
          onPress={onNext}
          rightIcon="check"
          style={themeStyle.signUpScreen.continueButton}
          text="Complete Signup"
          textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
          width={themeStyle.window.width - themeStyle.scale(76)}
        />
      )}
      <ModalGenderSelector
        alternateStyling={true}
        clientId={studio.ClientID}
        gender={gender}
        onClose={onToggleGenderModal}
        onSelect={setGender}
        visible={modalGender}
      />
      {modalStudio && (
        <OverlayLocationSelector
          alternateStyling={true}
          height={themeStyle.window.height * 0.85}
          locationId={`${studio.ClientID ?? ''}-${studio.LocationID ?? ''}`}
          locations={studios}
          onClose={() => setModalStudio(false)}
          onFetchLocations={onFetchStudios}
          onSelect={async (s) => {
            await logEvent('signup_location_selected', s)
            setStudio(s)
          }}
          showSortTabs={true}
        />
      )}
      <ModalReferralSelector
        alternateStyling={true}
        clientId={studio.ClientID}
        onClose={onToggleReferralModal}
        onSelect={setReferral}
        referral={referral}
        visible={modalReferral}
      />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const paddingHorizontal = themeStyle.scale(38)
  return {
    closeButton: { ...themeStyle.buttonClose, marginRight: paddingHorizontal },
    scrollContent: { flexGrow: 1, paddingHorizontal },
    titleRow: {
      ...themeStyle.rowAlignedBetween,
      marginBottom: themeStyle.scale(48),
      marginTop: themeStyle.scale(20),
      paddingHorizontal,
    },
  }
}
