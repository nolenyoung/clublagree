import * as React from 'react'
import { Animated, Keyboard, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SvgCss } from 'react-native-svg/css'
import media from '../assets/media'
import Button from './Button'
import Input from './Input'
import InputButton from './InputButton'
import ModalBanner from './ModalBanner'
import OverlayLocationSelector from './OverlayLocationSelector'
import Toast from './Toast'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { formatPhoneNumber, logError, logEvent, validateTextOnChange } from '../global/Functions'
import { useKeyboardListener, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = APIChallengeInfo

export default function ModalChallengeSignup(props: Props): React.ReactElement {
  const { Challenge, Locations = [], User } = props
  const { Id: ChallengeID = 0, Description = '', Name = '' } = Challenge ?? {}
  const { height: keyboardHeight, open: keyboardOpen } = useKeyboardListener()
  const emailRef = React.useRef<InputRef>(undefined)
  const fieldPositions = React.useRef<{ [field: string]: number }>({})
  const firstNameRef = React.useRef<InputRef>(undefined)
  const lastNameRef = React.useRef<InputRef>(undefined)
  const phoneNumberRef = React.useRef<InputRef>(undefined)
  const scrollRef = React.useRef<ScrollView | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [challengeDescription, setChallengeDescription] = React.useState('')
  const [email, setEmail] = React.useState(User.email)
  const [firstName, setFirstName] = React.useState(User.firstName)
  const [invalidFields, setInvalidFields] = React.useState([
    ...(User.firstName === '' ? ['firstName'] : []),
    ...(User.lastName === '' ? ['lastName'] : []),
    ...(User.email === '' ? ['email'] : []),
    ...(User.cellPhone === '' ? ['phoneNumber'] : []),
  ])
  const [isEditStudio, setIsEditStudio] = React.useState(false)
  const [lastName, setLastName] = React.useState(User.lastName)
  const [phoneNumber, setPhoneNumber] = React.useState(formatPhoneNumber(User.cellPhone))
  const [studio, setStudio] = React.useState<Partial<Location>>({})
  const [success, setSuccess] = React.useState(false)
  const onClose = React.useCallback(() => {
    setAction('modals', { challengeSignup: { info: undefined, visible: false } })
  }, [])
  const onOpenStudioModal = React.useCallback(() => {
    setIsEditStudio(true)
  }, [])
  const onSubmit = async () => {
    try {
      let response = await API.createChallengeSignup({
        ChallengeID,
        misc01: challengeDescription,
        misc02: firstName,
        misc03: lastName,
        misc04: email,
        misc05: phoneNumber,
        misc06: studio.ClientID ?? 0,
        misc07: studio.LocationID ?? 0,
      })
      cleanAction('activeButton')
      if (response.code === 200) {
        setSuccess(true)
      } else {
        setAction('toast', { text: response.message })
      }
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
      setAction('toast', { text: 'Unable to sign up for challenge.' })
    }
  }
  const onCloseStudioModal = React.useCallback(
    (loc?: Partial<Location>) => {
      if (isEditStudio || loc != null) {
        if (loc != null) {
          setStudio(loc)
        }
        setIsEditStudio(false)
      } else {
        setStudio({})
      }
    },
    [isEditStudio],
  )
  React.useEffect(() => {
    logEvent('modal_challenge_signup')
  }, [])
  const maxHeight = themeStyle.window.height - themeStyle.scale(100)
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable
          onPress={keyboardOpen ? () => Keyboard.dismiss() : onClose}
          style={themeStyle.flexView}
        />
        <Animated.View
          style={[
            themeStyle.modalContent,
            {
              backgroundColor: themeStyle[Brand.COLOR_SECONDARY_SCREEN_BACKGROUND as ColorKeys],
              marginBottom: keyboardHeight,
              maxHeight,
            },
          ]}>
          <ModalBanner alternateStyling={false} onClose={onClose} title={'Challenge Signup'} />
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            ref={(ref) => {
              scrollRef.current = ref
            }}
            scrollToOverflowEnabled={true}>
            {success ? (
              <View style={styles.inputView}>
                <SvgCss
                  color={themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys]}
                  height={themeStyle.scale(62)}
                  style={styles.successImage}
                  width={themeStyle.scale(62)}
                  xml={media.iconCheckCircle}
                />
                <Text style={styles.completeText}>
                  {`You're in! Enrollment in the selected challenge was completed successfully.`}
                </Text>
                <Button
                  gradient={Brand.BUTTON_GRADIENT}
                  onPress={onClose}
                  style={styles.successButton}
                  text="Done"
                  textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
                />
              </View>
            ) : (
              <View style={styles.inputView}>
                <Text style={styles.titleText}>{Name}</Text>
                <Text style={styles.descriptionText}>{Description}</Text>
                <Input
                  allowFontScaling={false}
                  borderColor="transparent"
                  containerStyle={styles.input}
                  defaultValue={firstName}
                  getInputRef={(ref) => {
                    firstNameRef.current = ref
                  }}
                  onChangeText={({ setError, text }) => {
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setState: setFirstName,
                      setInvalidFields,
                      text,
                      type: 'firstName',
                    })
                  }}
                  onEndEditing={(text, setError) => {
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setState: setFirstName,
                      setInvalidFields,
                      text,
                      type: 'firstName',
                    })
                  }}
                  onFocus={() => {
                    scrollRef.current?.scrollTo({ x: 0, y: 0 })
                  }}
                  onLayout={(event) => {
                    fieldPositions.current.firstName = event.nativeEvent.layout.y
                  }}
                  onSubmitEditing={() => {
                    lastNameRef.current?.focus()
                  }}
                  placeholder="-- First Name --"
                  placeholderTextColor={themeStyle.textPlaceholder}
                  returnKeyType="next"
                  rowStyle={styles.inputRow}
                  style={styles.messageInput}
                  value={firstName}
                />
                <Input
                  allowFontScaling={false}
                  borderColor="transparent"
                  containerStyle={styles.input}
                  defaultValue={lastName}
                  getInputRef={(ref) => {
                    lastNameRef.current = ref
                  }}
                  onChangeText={({ setError, text }) => {
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setState: setLastName,
                      setInvalidFields,
                      text,
                      type: 'lastName',
                    })
                  }}
                  onEndEditing={(text, setError) => {
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setState: setLastName,
                      setInvalidFields,
                      text,
                      type: 'lastName',
                    })
                  }}
                  onFocus={() => {
                    scrollRef.current?.scrollTo({
                      x: 0,
                      y: fieldPositions.current.lastName - fieldPositions.current.firstName,
                    })
                  }}
                  onLayout={(event) => {
                    fieldPositions.current.lastName = event.nativeEvent.layout.y
                  }}
                  onSubmitEditing={() => {
                    emailRef.current?.focus()
                  }}
                  placeholder="-- Last Name --"
                  placeholderTextColor={themeStyle.textPlaceholder}
                  returnKeyType="next"
                  rowStyle={styles.inputRow}
                  style={styles.messageInput}
                  value={lastName}
                />
                <Input
                  allowFontScaling={false}
                  borderColor="transparent"
                  containerStyle={styles.input}
                  defaultValue={email}
                  getInputRef={(ref) => {
                    emailRef.current = ref
                  }}
                  onChangeText={({ setError, text }) => {
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setState: setEmail,
                      setInvalidFields,
                      text,
                      type: 'email',
                    })
                  }}
                  onEndEditing={(text, setError) => {
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setState: setEmail,
                      setInvalidFields,
                      text,
                      type: 'email',
                    })
                  }}
                  onFocus={() => {
                    scrollRef.current?.scrollTo({
                      x: 0,
                      y: fieldPositions.current.email - fieldPositions.current.firstName,
                    })
                  }}
                  onLayout={(event) => {
                    fieldPositions.current.email = event.nativeEvent.layout.y
                  }}
                  onSubmitEditing={() => {
                    phoneNumberRef.current?.focus()
                  }}
                  placeholder="-- Email --"
                  placeholderTextColor={themeStyle.textPlaceholder}
                  returnKeyType="next"
                  rowStyle={styles.inputRow}
                  style={styles.messageInput}
                  value={email}
                />
                <Input
                  allowFontScaling={false}
                  borderColor="transparent"
                  containerStyle={styles.input}
                  defaultValue={phoneNumber}
                  format={formatPhoneNumber}
                  getInputRef={(ref) => {
                    phoneNumberRef.current = ref
                  }}
                  keyboardType="phone-pad"
                  onChangeText={({ setError, text }) => {
                    validateTextOnChange({
                      errorOnChange: false,
                      setError,
                      setState: setPhoneNumber,
                      setInvalidFields,
                      text,
                      type: 'phoneNumber',
                    })
                  }}
                  onEndEditing={(text, setError) => {
                    validateTextOnChange({
                      errorOnChange: true,
                      setError,
                      setState: setPhoneNumber,
                      setInvalidFields,
                      text,
                      type: 'phoneNumber',
                    })
                  }}
                  onFocus={() => {
                    scrollRef.current?.scrollTo({
                      x: 0,
                      y: fieldPositions.current.phoneNumber - fieldPositions.current.firstName,
                    })
                  }}
                  onLayout={(event) => {
                    fieldPositions.current.phoneNumber = event.nativeEvent.layout.y
                  }}
                  onSubmitEditing={() => {
                    scrollRef.current?.scrollTo({ x: 0, y: 0 })
                  }}
                  placeholder="-- Phone Number --"
                  placeholderTextColor={themeStyle.textPlaceholder}
                  returnKeyType="done"
                  rowStyle={styles.inputRow}
                  style={styles.messageInput}
                  value={phoneNumber}
                />
                <InputButton
                  borderColor="transparent"
                  buttonStyle={styles.dropdown}
                  onPress={onOpenStudioModal}
                  textColor={
                    studio.Nickname == null ? themeStyle.textPlaceholder : themeStyle.textWhite
                  }
                  textStyle={styles.messageInput}
                  value={studio.Nickname ?? '-- Home Studio --'}
                />
                <Text style={styles.sectionTitle}>Choose Your Challenge</Text>
                <View style={styles.challengeRow}>
                  <Pressable
                    style={[
                      styles.challengeChoice,
                      {
                        backgroundColor:
                          challengeDescription === '5 classes'
                            ? themeStyle.colorWhite
                            : 'transparent',
                        borderColor:
                          challengeDescription === '5 classes'
                            ? themeStyle.textWhite
                            : themeStyle[Brand.COLOR_SECONDARY_SCREEN_SEPARATOR as ColorKeys],
                      },
                    ]}
                    onPress={() => setChallengeDescription('5 classes')}>
                    <Text
                      style={[
                        styles.challengeChoiceText,
                        {
                          color:
                            challengeDescription === '5 classes'
                              ? themeStyle.textBlack
                              : themeStyle.textWhite,
                        },
                      ]}>
                      {'5 Classes\nin 10 Days'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.challengeChoice,
                      {
                        backgroundColor:
                          challengeDescription === '8 classes'
                            ? themeStyle.colorWhite
                            : 'transparent',
                        borderColor:
                          challengeDescription === '8 classes'
                            ? themeStyle.textWhite
                            : themeStyle[Brand.COLOR_SECONDARY_SCREEN_SEPARATOR as ColorKeys],
                      },
                    ]}
                    onPress={() => setChallengeDescription('8 classes')}>
                    <Text
                      style={[
                        styles.challengeChoiceText,
                        {
                          color:
                            challengeDescription === '8 classes'
                              ? themeStyle.textBlack
                              : themeStyle.textWhite,
                        },
                      ]}>
                      {'8 Classes\nin 10 Days'}
                    </Text>
                  </Pressable>
                </View>
                <Button
                  animated={true}
                  disabled={
                    invalidFields.length > 0 ||
                    challengeDescription === '' ||
                    studio.ClientID == null
                  }
                  gradient={Brand.BUTTON_GRADIENT}
                  onPress={onSubmit}
                  style={styles.submitButton}
                  text="Submit"
                  textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
                />
              </View>
            )}
          </ScrollView>
        </Animated.View>
        <Toast />
        {isEditStudio && (
          <OverlayLocationSelector
            locationId={`${studio.ClientID ?? ''}-${studio.LocationID ?? ''}`}
            locations={Locations}
            maxHeight={maxHeight}
            onClose={() => onCloseStudioModal()}
            onSelect={onCloseStudioModal}
            preventCloseOnSelect={true}
          />
        )}
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const commonFieldStyling = {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: themeStyle.scale(16),
    paddingVertical: themeStyle.scale(12),
  }
  return {
    inputView: {
      paddingBottom: themeStyle.edgeInsets.bottom + themeStyle.scale(8),
      paddingHorizontal: themeStyle.scale(20),
      paddingTop: themeStyle.scale(20),
    },
    titleText: {
      ...themeStyle.textPrimaryBold24,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TITLE as ColorKeys],
      marginBottom: themeStyle.scale(8),
      textAlign: 'center' as const,
      textTransform: Brand.TRANSFORM_SECTION_TITLE_TEXT as TextTransform,
    },
    descriptionText: {
      ...themeStyle.textPrimaryRegular16,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TITLE as ColorKeys],
      marginBottom: themeStyle.scale(16),
      textAlign: 'center' as const,
    },
    sectionTitle: {
      ...themeStyle.textPrimaryBold14,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
      marginVertical: themeStyle.scale(16),
      textAlign: 'center' as const,
      textTransform: Brand.TRANSFORM_SECTION_TITLE_TEXT as TextTransform,
    },
    dropdown: { ...commonFieldStyling, marginBottom: themeStyle.scale(8) },
    input: { marginBottom: themeStyle.scale(16) },
    inputRow: commonFieldStyling,
    messageInput: {
      ...themeStyle.textPrimaryRegular16,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
    },
    challengeRow: { ...themeStyle.rowAlignedEvenly, marginBottom: themeStyle.scale(24) },
    challengeChoice: {
      borderRadius: themeStyle.scale(20),
      borderWidth: themeStyle.scale(1),
      paddingVertical: themeStyle.scale(8),
      width: '45%' as const,
    },
    challengeChoiceText: { ...themeStyle.textPrimaryMedium12, textAlign: 'center' as const },
    submitButton: {
      backgroundColor: themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys],
      width: '100%' as const,
    },
    successImage: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(20),
      marginTop: themeStyle.scale(16),
    },
    completeText: {
      ...themeStyle.textPrimaryRegular16,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
      marginBottom: themeStyle.scale(20),
      textAlign: 'center' as 'center',
    },
    successButton: {
      backgroundColor: themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys],
      marginBottom: themeStyle.scale(10),
      marginTop: themeStyle.scale(24),
      width: '100%' as const,
    },
  }
}
