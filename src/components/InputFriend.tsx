import moment from 'moment'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button from './Button'
import Input from './Input'
import InputButton from './InputButton'
import ModalDateTimePicker from './ModalDateTimePicker'
import Brand from '../global/Brand'
import { formatDateBirthday, formatPhoneNumber, validateTextOnChange } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = {
  buttonAnimation?: boolean
  defaultValues?: {
    Email?: string
    FirstName?: string
    LastName?: string
    PhoneNumber?: string
  }
  scrollRef: React.MutableRefObject<ScrollView | null>
  onSubmit: (arg1: FriendInfo) => Promise<void> | void
  showBirthDate?: boolean
  visible: boolean
}

export default function InputFriend(props: Props): React.ReactElement {
  const {
    buttonAnimation = true,
    defaultValues = {},
    scrollRef,
    onSubmit,
    showBirthDate = false,
    visible,
  } = props
  const activeInput = React.useRef('')
  const emailRef = React.useRef<InputRef>(undefined)
  const fieldPositions = React.useRef<{ [field: string]: number }>({})
  const firstNameRef = React.useRef<InputRef>(undefined)
  const lastNameRef = React.useRef<InputRef>(undefined)
  const phoneNumberRef = React.useRef<InputRef>(undefined)
  const initialEmail = defaultValues.Email ?? ''
  const initialFirstName = defaultValues.FirstName ?? ''
  const initialLastName = defaultValues.LastName ?? ''
  const initialPhoneNumber = defaultValues.PhoneNumber ?? ''
  const country = useSelector((state: ReduxState) => state.user.Country)
  const [birthDate, setBirthDate] = React.useState<Date | null>(null)
  const [email, setEmail] = React.useState(initialEmail)
  const [firstName, setFirstName] = React.useState(initialFirstName)
  const [invalidFields, setInvalidFields] = React.useState(
    [
      initialEmail !== '' ? '' : 'email',
      initialFirstName !== '' ? '' : 'firstName',
      initialLastName !== '' ? '' : 'lastName',
      initialPhoneNumber !== '' ? '' : 'phoneNumber',
    ].filter((i) => i !== ''),
  )
  const [lastName, setLastName] = React.useState(initialLastName)
  const [phoneNumber, setPhoneNumber] = React.useState(initialPhoneNumber)
  const [showDatePicker, setShowDatePicker] = React.useState(false)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const onPressSubmit = () => {
    const friendInfo = {
      ...(birthDate != null
        ? { BirthDate: moment(birthDate.toISOString()).format('YYYY-MM-DD') }
        : {}),
      CellPhone: phoneNumber.replace(/\D/g, ''),
      Email: email,
      FirstName: firstName,
      LastName: lastName,
    } as const
    onSubmit(friendInfo)
  }
  React.useEffect(() => {
    if (!visible) {
      emailRef.current?.onResetInput()
      firstNameRef.current?.onResetInput()
      lastNameRef.current?.onResetInput()
      phoneNumberRef.current?.onResetInput()
      setBirthDate(null)
      setEmail('')
      setFirstName('')
      setInvalidFields(['email', 'firstName', 'lastName', 'phoneNumber'])
      setLastName('')
      setPhoneNumber('')
    }
  }, [visible])
  return (
    <>
      <View
        onLayout={(e) => {
          fieldPositions.current.firstName = e.nativeEvent.layout.y
        }}
        style={[themeStyle.rowAlignedBetween, styles.inputContainer]}>
        <Input
          allowFontScaling={false}
          containerStyle={{ width: '48%' }}
          defaultValue={defaultValues.FirstName ?? ''}
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
            activeInput.current === 'firstName' && scrollRef.current?.scrollToEnd()
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
          textColor={themeStyle.textGray}
        />
        <Input
          allowFontScaling={false}
          containerStyle={{ width: '48%' }}
          defaultValue={defaultValues.LastName ?? ''}
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
            activeInput.current === 'lastName' && scrollRef.current?.scrollToEnd()
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
          textColor={themeStyle.textGray}
        />
      </View>
      <Input
        allowFontScaling={false}
        autoComplete="tel"
        containerStyle={styles.inputContainer}
        defaultValue={defaultValues.PhoneNumber ?? ''}
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
        onEndEditing={(text, setError) => {
          validateTextOnChange({
            errorOnChange: true,
            setError,
            setInvalidFields,
            setState: setPhoneNumber,
            text,
            type: 'phoneNumber',
            validationParams: [country ?? Brand.DEFAULT_COUNTRY],
          })
          activeInput.current === 'phoneNumber' && scrollRef.current?.scrollToEnd()
        }}
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
        onSubmitEditing={() => {
          emailRef.current?.focus()
        }}
        placeholder="Mobile Phone"
        placeholderTextColor={themeStyle.textGray}
        returnKeyType="done"
        rowStyle={styles.inputRow}
        style={styles.input}
        textColor={themeStyle.textGray}
        textContentType="telephoneNumber"
      />
      <Input
        allowFontScaling={false}
        autoCapitalize="none"
        containerStyle={styles.inputContainer}
        defaultValue={defaultValues.Email ?? ''}
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
          activeInput.current === 'email' && scrollRef.current?.scrollToEnd()
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
        textColor={themeStyle.textGray}
      />
      {showBirthDate && (
        <InputButton
          onPress={() => setShowDatePicker(true)}
          buttonStyle={styles.inputRow}
          textColor={themeStyle.textGray}
          textStyle={styles.input}
          value={formatDateBirthday(birthDate)}
        />
      )}
      <Button
        animated={buttonAnimation}
        disabled={invalidFields.length > 0 || (showBirthDate && birthDate == null)}
        gradient={Brand.BUTTON_GRADIENT}
        onPress={onPressSubmit}
        style={styles.submitButton}
        text="Submit"
      />
      <ModalDateTimePicker
        maximumDate={new Date()}
        mode="date"
        display="default"
        onSelect={setBirthDate}
        onClose={() => setShowDatePicker(false)}
        value={birthDate != null ? birthDate : new Date()}
        visible={showDatePicker}
      />
    </>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    inputContainer: { marginBottom: themeStyle.scale(12) },
    inputRow: {
      backgroundColor: themeStyle.fadedGray,
      borderBottomWidth: 0,
      minHeight: themeStyle.scale(42),
      paddingHorizontal: themeStyle.scale(16),
    },
    input: { color: themeStyle.textGray, fontSize: themeStyle.scale(14), paddingVertical: 0 },
    submitButton: { marginTop: themeStyle.scale(16), width: '100%' as const },
  }
}
