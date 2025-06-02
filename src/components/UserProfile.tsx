import moment from 'moment'
import * as React from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import Avatar from './Avatar'
import Button from './Button'
import ButtonText from './ButtonText'
import Input from './Input'
import InputButton from './InputButton'
import ModalDateTimePicker from './ModalDateTimePicker'
import ModalGenderSelector from './ModalGenderSelector'
import ModalImageActions from './ModalImageActions'
import ModalSelector from './ModalSelector'
import { API } from '../global/API'
import Brand from '../global/Brand'
import {
  formatDateBirthday,
  formatPhoneNumber,
  logError,
  logEvent,
  validateTextOnChange,
} from '../global/Functions'
import { useListCountries, useListStates, useTheme } from '../global/Hooks'
import { selectCamera, selectGallery } from '../global/ImageSelector'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  clientId: number
  isLoggedInUser: boolean
  onRefresh: () => Promise<void>
  personId: string
  profile: UsersProfile | undefined
  profileKey: string | null | undefined
}

export default function UserProfile(props: Props): React.ReactElement {
  const { clientId, isLoggedInUser, onRefresh, personId, profile, profileKey } = props
  const activeInput = React.useRef<string>('')
  const addressRef = React.useRef<InputRef>(undefined)
  const apartmentRef = React.useRef<InputRef>(undefined)
  const cityRef = React.useRef<InputRef>(undefined)
  const customerIdRef = React.useRef<InputRef>(undefined)
  const emailRef = React.useRef<InputRef>(undefined)
  const emergencyEmailRef = React.useRef<InputRef>(undefined)
  const emergencyNameRef = React.useRef<InputRef>(undefined)
  const emergencyPhoneRef = React.useRef<InputRef>(undefined)
  const emergencyRelationshipRef = React.useRef<InputRef>(undefined)
  const fieldPosition = React.useRef<{ [key: string]: number }>({})
  const firstNameRef = React.useRef<InputRef>(undefined)
  const lastNameRef = React.useRef<InputRef>(undefined)
  const phoneRef = React.useRef<InputRef>(undefined)
  const postalRef = React.useRef<InputRef>(undefined)
  const scrollRef = React.useRef<ScrollView | null>(null)
  const { country, countries, selectedCountry, setCountry } = useListCountries()
  const { selectedState, setState, state, states } = useListStates(country)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [address, setAddress] = React.useState('')
  const [apartment, setApartment] = React.useState('')
  const [city, setCity] = React.useState('')
  const [date, setDate] = React.useState<any>(null)
  const [email, setEmail] = React.useState('')
  const [emergencyEmail, setEmergencyEmail] = React.useState('')
  const [emergencyName, setEmergencyName] = React.useState('')
  const [emergencyPhone, setEmergencyPhone] = React.useState('')
  const [emergencyRelationship, setEmergencyRelationship] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [gender, setGender] = React.useState<any>(null)
  const [invalidFields, setInvalidFields] = React.useState<string[]>([])
  const [lastName, setLastName] = React.useState('')
  const [modalCountry, setModalCountry] = React.useState(false)
  const [modalImage, setModalImage] = React.useState(false)
  const [modalGender, setModalGender] = React.useState(false)
  const [modalState, setModalState] = React.useState(false)
  const [phone, setPhone] = React.useState('')
  const [photo, setPhoto] = React.useState<string | undefined>('')
  const [showDatePicker, setShowDatePicker] = React.useState(false)
  const [zipcode, setZipcode] = React.useState('')
  const onSelectImage = React.useCallback(async (action: string) => {
    // if (action === 'remove') {
    //   try {
    //     let response = await API.deleteUserPhoto()
    //     if ('PhotoUrl' in response) {
    //       const { PhotoUrl: image } = response ?? {}
    //       if (image != null) {
    //         setAction('user', { photoUrl: image })
    //         setPhoto(image)
    //         await logEvent('profile_remove_photo')
    //       }
    //     } else {
    //       setAction('toast', { text: response.message, type: 'error' })
    //     }
    //   } catch (e: any) {
    //     logError(e)
    //     setAction('toast', { text: 'Unable to remove your profile photo.' })
    //   }
    // } else {
    let photo = null
    if (action === 'take') {
      photo = await selectCamera({ includeBase64: true, multiple: false })
      await logEvent('profile_take_photo')
    } else {
      photo = await selectGallery({ includeBase64: true, multiple: false })
      await logEvent('profile_choose_photo')
    }
    if (!Array.isArray(photo) && photo?.uri != null) {
      try {
        setAction('loading', { loading: true })
        let response = await API.uploadUserPhoto({
          Photo: 'data:image/jpeg;base64,' + photo.base64,
        })
        if ('PhotoUrl' in response) {
          setAction('user', { photoUrl: response.PhotoUrl })
          setPhoto(response.PhotoUrl)
        } else {
          setAction('toast', { text: response.message, type: 'error' })
        }
      } catch (e: any) {
        logError(e)
        setAction('toast', { text: 'Update picture failed.' })
      } finally {
        setModalImage(false)
        cleanAction('loading')
      }
    }
    // }
  }, [])
  const onToggleCountryModal = React.useCallback(() => {
    setModalCountry((prev) => !prev)
  }, [])
  const onToggleGenderModal = React.useCallback(() => {
    setModalGender((prev) => !prev)
  }, [])
  const onToggleStateModal = React.useCallback(() => {
    setModalState((prev) => !prev)
  }, [])
  const onUpdate = async () => {
    try {
      const data = {
        ...(Brand.UI_EMERGENCY_CONTACT_INFO
          ? {
              EmergencyContactInfoEmail: emergencyEmail,
              EmergencyContactInfoName: emergencyName,
              EmergencyContactInfoPhone: emergencyPhone,
              EmergencyContactInfoRelationship: emergencyRelationship,
            }
          : {}),
        AddressLine1: address,
        AddressLine2: apartment,
        BirthDate: date != null ? moment(date).format('YYYY-MM-DD') : '',
        City: city,
        Country: country,
        Email: email,
        FirstName: firstName,
        Gender: gender ?? '',
        LastName: lastName,
        MobilePhone: phone,
        PostalCode: zipcode,
        State: state,
      }
      await API.updateUser(data, { ClientID: clientId, PersonID: personId })
      await logEvent('account_profile_updated')
      cleanAction('activeButton')
      if (isLoggedInUser) {
        setAction('user', { ...data, email, firstName, lastName })
      }
      setAction('toast', { text: 'Profile updated.', type: 'success' })
    } catch (e: any) {
      cleanAction('activeButton')
      logError(e)
      setAction('toast', { text: 'Profile update failed.' })
    }
  }
  React.useEffect(() => {
    const {
      AddressLine1 = '',
      AddressLine2 = '',
      altPersonID = '',
      City = '',
      dob = '',
      email: Email = '',
      EmergencyContactInfoEmail = '',
      EmergencyContactInfoName = '',
      EmergencyContactInfoPhone = '',
      EmergencyContactInfoRelationship = '',
      firstName: FirstName = '',
      Gender,
      lastName: LastName = '',
      MobilePhone = '',
      PhotoUrl,
      State = '',
      Zip: zip = '',
    } = profile ?? {}
    addressRef.current?.onTextChanged(AddressLine1)
    apartmentRef.current?.onTextChanged(
      AddressLine2 != null && AddressLine2 !== 'null' ? AddressLine2 : '',
    )
    cityRef.current?.onTextChanged(City)
    if (altPersonID != null) {
      customerIdRef.current?.onTextChanged(String(altPersonID))
    }
    emailRef.current?.onTextChanged(Email)
    emergencyEmailRef.current?.onTextChanged(EmergencyContactInfoEmail)
    emergencyNameRef.current?.onTextChanged(EmergencyContactInfoName)
    emergencyPhoneRef.current?.onTextChanged(formatPhoneNumber(EmergencyContactInfoPhone))
    emergencyRelationshipRef.current?.onTextChanged(EmergencyContactInfoRelationship)
    firstNameRef.current?.onTextChanged(FirstName)
    lastNameRef.current?.onTextChanged(LastName)
    phoneRef.current?.onTextChanged(formatPhoneNumber(MobilePhone))
    postalRef.current?.onTextChanged(zip)
    setAddress(AddressLine1)
    setApartment(AddressLine2 != null && AddressLine2 !== 'null' ? AddressLine2 : '')
    setCity(City)
    if (dob != null && dob !== '') {
      setDate(() => moment(dob, 'YYYY-MM-DD').toDate())
    }
    setEmail(Email)
    setEmergencyEmail(EmergencyContactInfoEmail)
    setEmergencyName(EmergencyContactInfoName)
    setEmergencyPhone(EmergencyContactInfoPhone)
    setEmergencyRelationship(EmergencyContactInfoRelationship)
    setFirstName(FirstName)
    setGender(Gender)
    setLastName(LastName)
    setPhone(formatPhoneNumber(MobilePhone))
    setPhoto(PhotoUrl)
    setState(State)
    setZipcode(zip)
    cleanAction('loading')
  }, [profile])
  return (
    <View style={themeStyle.content}>
      <ScrollView
        contentContainerStyle={themeStyle.scrollContentTabScreen}
        ref={scrollRef}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={false} />}
        scrollToOverflowEnabled={true}
        showsVerticalScrollIndicator={false}>
        {Brand.UI_PROFILE_PHOTO_UPLOAD && (
          <Pressable
            onPress={async () => {
              setModalImage(true)
              await logEvent('friends_edit_photo')
            }}
            style={styles.editPhotoButton}>
            <View style={themeStyle.viewCentered}>
              <Avatar size={themeStyle.scale(130)} source={photo} />
              <Text style={styles.editPhotoText}>edit photo</Text>
            </View>
          </Pressable>
        )}
        <Input
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          containerStyle={themeStyle.inputView}
          getInputRef={(ref) => {
            firstNameRef.current = ref
          }}
          key="firstNameInput"
          label="First Name"
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
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
            scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true })
          }}
          onSubmitEditing={() => {
            lastNameRef.current && lastNameRef.current.focus()
          }}
          placeholder="First Name"
          returnKeyType="next"
          textColor={themeStyle.textBlack}
          textContentType="givenName"
        />
        <Input
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          containerStyle={themeStyle.inputView}
          getInputRef={(ref) => {
            lastNameRef.current = ref
          }}
          key="lastNameInput"
          label="Last Name"
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
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
            scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true })
          }}
          onSubmitEditing={() => {
            emailRef.current && emailRef.current.focus()
          }}
          placeholder="Last Name"
          returnKeyType="next"
          textColor={themeStyle.textBlack}
          textContentType="familyName"
        />
        <Input
          autoComplete="email"
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          containerStyle={themeStyle.inputView}
          getInputRef={(ref) => {
            emailRef.current = ref
          }}
          key="emailInput"
          keyboardType="email-address"
          label="Email Address"
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
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
            activeInput.current === 'email' && scrollRef.current?.scrollTo({ x: 0, y: 0 })
          }}
          onFocus={() => {
            activeInput.current = 'email'
            scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.email })
          }}
          onLayout={(event) => {
            fieldPosition.current.email = event.nativeEvent.layout.y - themeStyle.scale(150)
          }}
          placeholder="Email Address"
          returnKeyType="next"
          textColor={themeStyle.textBlack}
          textContentType="emailAddress"
        />
        <View style={themeStyle.rowAlignedBetween}>
          <InputButton
            borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            containerStyle={themeStyle.halfInput}
            label="Date of Birth"
            labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            onPress={() => setShowDatePicker(true)}
            textColor={themeStyle.textBlack}
            value={formatDateBirthday(date)}
          />
          <InputButton
            borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            containerStyle={themeStyle.halfInput}
            label="Gender"
            labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            onPress={() => setModalGender(true)}
            textColor={themeStyle.textBlack}
            value={gender ?? ''}
          />
        </View>
        <Input
          autoComplete="street-address"
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          containerStyle={themeStyle.inputView}
          getInputRef={(ref) => {
            addressRef.current = ref
          }}
          key="addressInput"
          label="Street Address"
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          onChangeText={({ text, setError }) =>
            validateTextOnChange({
              errorOnChange: false,
              setError,
              setInvalidFields,
              setState: setAddress,
              text,
              type: 'address',
            })
          }
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
            scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.address })
          }}
          onLayout={(event) => {
            fieldPosition.current.address = event.nativeEvent.layout.y - themeStyle.scale(200)
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
          containerStyle={themeStyle.inputView}
          getInputRef={(ref) => {
            apartmentRef.current = ref
          }}
          key="apartmentInput"
          label="Apartment / #"
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          onChangeText={({ text }) => setApartment(text)}
          onEndEditing={() => {
            activeInput.current === 'apartment' &&
              scrollRef.current?.scrollToEnd({ animated: true })
          }}
          onFocus={() => {
            activeInput.current = 'apartment'
            scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.apartment })
          }}
          onLayout={(event) => {
            fieldPosition.current.apartment = event.nativeEvent.layout.y - themeStyle.scale(200)
          }}
          onSubmitEditing={() => {
            cityRef.current?.focus()
          }}
          returnKeyType="next"
          textColor={themeStyle.textBlack}
          textContentType="streetAddressLine2"
        />
        <Input
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          containerStyle={themeStyle.inputView}
          getInputRef={(ref) => {
            cityRef.current = ref
          }}
          key="cityInput"
          label="City"
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
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
            scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.city })
          }}
          onLayout={(event) => {
            fieldPosition.current.city = event.nativeEvent.layout.y - themeStyle.scale(200)
          }}
          placeholder="City"
          returnKeyType="done"
          textColor={themeStyle.textBlack}
          textContentType="addressCity"
        />
        <InputButton
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          label="State"
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          onPress={onToggleStateModal}
          textColor={themeStyle.textBlack}
          value={selectedState.Label || 'State'}
        />
        <Input
          autoComplete="postal-code"
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          containerStyle={themeStyle.inputView}
          getInputRef={(ref) => {
            postalRef.current = ref
          }}
          key="postalInput"
          label={country === 'AU' ? 'Postcode' : 'Zip / Postal Code'}
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
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
              y: fieldPosition.current.postal,
              animated: true,
            })
          }}
          onLayout={(event) => {
            fieldPosition.current.postal = event.nativeEvent.layout.y - themeStyle.scale(200)
          }}
          placeholder={country === 'AU' ? 'Postcode' : 'Zip / Postal Code'}
          returnKeyType="next"
          textColor={themeStyle.textBlack}
          textContentType="postalCode"
        />
        <InputButton
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          label="Country"
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          onPress={onToggleCountryModal}
          textColor={themeStyle.textBlack}
          value={selectedCountry.Label || 'Country'}
        />
        <Input
          autoComplete="tel"
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          containerStyle={themeStyle.inputView}
          format={(n) => formatPhoneNumber(n, country)}
          getInputRef={(ref) => {
            phoneRef.current = ref
          }}
          key="phoneInput"
          keyboardType="phone-pad"
          label={country === 'AU' ? 'Mobile Phone' : 'Cell Phone'}
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          onChangeText={({ text, setError }) =>
            validateTextOnChange({
              errorOnChange: false,
              setError,
              setInvalidFields,
              setState: setPhone,
              text,
              type: 'mobile',
              validationParams: [country],
            })
          }
          onEndEditing={(text, setError) => {
            validateTextOnChange({
              errorOnChange: true,
              setError,
              setInvalidFields,
              setState: setPhone,
              text,
              type: 'mobile',
              validationParams: [country],
            })
            activeInput.current === 'phone' && scrollRef.current?.scrollToEnd({ animated: true })
          }}
          onFocus={() => {
            activeInput.current = 'phone'
            scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.phone })
          }}
          onLayout={(event) => {
            fieldPosition.current.phone = event.nativeEvent.layout.y - themeStyle.scale(200)
          }}
          placeholder={country === 'AU' ? 'Mobile Phone' : 'Cell Phone'}
          returnKeyType="done"
          textColor={themeStyle.textBlack}
          textContentType="telephoneNumber"
        />
        {Brand.UI_ACCOUNT_CUSTOMER_ID && (
          <Input
            borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            containerStyle={themeStyle.inputView}
            editable={false}
            getInputRef={(ref) => {
              customerIdRef.current = ref
            }}
            key="customerId"
            label="Customer ID"
            labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            placeholder="Customer ID"
            returnKeyType="done"
            textColor={themeStyle.textBlack}
          />
        )}
        {Brand.UI_EMERGENCY_CONTACT_INFO && (
          <>
            <Input
              borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
              containerStyle={themeStyle.inputView}
              getInputRef={(ref) => {
                emergencyNameRef.current = ref
              }}
              key="emergencyNameInput"
              label="Emergency Contact Name"
              labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
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
                scrollRef.current?.scrollTo({
                  x: 0,
                  y: fieldPosition.current.emergencyName,
                  animated: true,
                })
              }}
              onLayout={(event) => {
                fieldPosition.current.emergencyName =
                  event.nativeEvent.layout.y - themeStyle.scale(125)
              }}
              onSubmitEditing={() => {
                emergencyEmailRef.current?.focus()
              }}
              placeholder="Name"
              returnKeyType="next"
              textColor={themeStyle.textBlack}
              textContentType="name"
            />
            <Input
              autoComplete="email"
              borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
              containerStyle={themeStyle.inputView}
              getInputRef={(ref) => {
                emergencyEmailRef.current = ref
              }}
              key="emergencyEmailInput"
              keyboardType="email-address"
              label="Emergency Contact Email"
              labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
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
                activeInput.current === 'emergencyEmail' &&
                  scrollRef.current?.scrollTo({ x: 0, y: 0 })
              }}
              onFocus={() => {
                activeInput.current = 'emergencyEmail'
                scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.emergencyEmail })
              }}
              onLayout={(event) => {
                fieldPosition.current.emergencyEmail =
                  event.nativeEvent.layout.y - themeStyle.scale(125)
              }}
              placeholder="Email Address"
              returnKeyType="next"
              textColor={themeStyle.textBlack}
              textContentType="emailAddress"
            />
            <Input
              autoComplete="tel"
              borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
              containerStyle={themeStyle.inputView}
              format={(n) => formatPhoneNumber(n, country)}
              getInputRef={(ref) => {
                emergencyPhoneRef.current = ref
              }}
              key="phoneInput"
              keyboardType="phone-pad"
              label={country === 'AU' ? 'Emergency Contact Mobile' : 'Emergency Contact Phone'}
              labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
              onChangeText={({ text, setError }) =>
                validateTextOnChange({
                  errorOnChange: false,
                  setError,
                  setInvalidFields,
                  setState: setEmergencyPhone,
                  text,
                  type: 'emergencyPhone',
                  validationParams: [country],
                })
              }
              onEndEditing={(text, setError) => {
                validateTextOnChange({
                  errorOnChange: true,
                  setError,
                  setInvalidFields,
                  setState: setEmergencyPhone,
                  text,
                  type: 'emergencyPhone',
                  validationParams: [country],
                })
                activeInput.current === 'emergencyPhone' &&
                  scrollRef.current?.scrollToEnd({ animated: true })
              }}
              onFocus={() => {
                activeInput.current = 'emergencyPhone'
                scrollRef.current?.scrollTo({ x: 0, y: fieldPosition.current.emergencyPhone })
              }}
              onLayout={(event) => {
                fieldPosition.current.emergencyPhone =
                  event.nativeEvent.layout.y - themeStyle.scale(125)
              }}
              placeholder={country === 'AU' ? 'Mobile Phone' : 'Cell Phone'}
              returnKeyType="done"
              textColor={themeStyle.textBlack}
              textContentType="telephoneNumber"
            />
            <Input
              borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
              containerStyle={themeStyle.inputView}
              getInputRef={(ref) => {
                emergencyRelationshipRef.current = ref
              }}
              key="emergencyRelationshipInput"
              label="Emergency Relationship"
              labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
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
                activeInput.current === 'emergencyRelationship' &&
                  scrollRef.current?.scrollToEnd({ animated: true })
              }}
              onFocus={() => {
                activeInput.current = 'emergencyRelationship'
                scrollRef.current?.scrollTo({
                  x: 0,
                  y: fieldPosition.current.emergencyRelationship,
                })
              }}
              onLayout={(event) => {
                fieldPosition.current.emergencyRelationship =
                  event.nativeEvent.layout.y - themeStyle.scale(125)
              }}
              placeholder="Relationship"
              returnKeyType="done"
              textColor={themeStyle.textBlack}
            />
          </>
        )}
        {profileKey != null && (
          <ButtonText
            color={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            onPress={async () => {
              setAction('modals', {
                webView: { title: 'Delete Your Account', uri: `https://axle.ws/d${profileKey}` },
              })
              await logEvent('account_delete')
            }}
            text="Delete Account"
            textStyle={styles.deleteButton}
          />
        )}
      </ScrollView>
      <Button
        animated={true}
        disabled={invalidFields.length > 0 || moment(date).isSame(moment(), 'day')}
        gradient={Brand.BUTTON_GRADIENT}
        onPress={onUpdate}
        style={styles.updateButton}
        text="Update"
      />
      <ModalSelector
        alternateStyling={true}
        data={countries}
        onClose={onToggleCountryModal}
        onSelect={setCountry}
        title="Select Country"
        value={country}
        visible={modalCountry}
      />
      <ModalSelector
        alternateStyling={true}
        data={states}
        onClose={onToggleStateModal}
        onSelect={setState}
        title="Select State"
        value={state}
        visible={modalState}
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
      <ModalGenderSelector
        clientId={clientId}
        gender={gender}
        onClose={onToggleGenderModal}
        onSelect={setGender}
        visible={modalGender}
      />
      <ModalImageActions
        hideRemove={true}
        onClose={() => setModalImage(false)}
        onSelect={onSelectImage}
        visible={modalImage}
      />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    editPhotoButton: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(28),
      marginTop: themeStyle.scale(22),
    },
    editPhotoText: {
      ...themeStyle.textPrimaryRegular16,
      color: themeStyle.textGray,
      marginTop: themeStyle.scale(14),
      textAlign: 'center' as 'center',
    },
    labelText: themeStyle.getTextStyle({
      color: 'textPlaceholderAlt',
      font: 'fontPrimaryMedium',
      size: 14,
    }),
    pickerButton: {
      justifyContent: 'center' as 'center',
      borderBottomColor: themeStyle.textWhite,
      borderBottomWidth: themeStyle.scale(1),
      marginBottom: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(8),
      width: '100%' as const,
    },
    dateText: themeStyle.getTextStyle({
      color: 'textWhite',
      font: 'fontPrimaryRegular',
      size: 16,
    }),
    deleteButton: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(20),
      textDecorationLine: 'underline' as 'underline',
    },
    updateButton: {
      marginBottom: themeStyle.scale(28),
      marginTop: themeStyle.scale(20),
      width: '100%' as const,
    },
  }
}
