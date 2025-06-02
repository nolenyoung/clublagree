import * as React from 'react'
import { Animated, FlexAlignType, Keyboard, Pressable, ScrollView, Text, View } from 'react-native'
import { SvgCss } from 'react-native-svg/css'
import { useSelector } from 'react-redux'
import media from '../assets/media'
import Button from './Button'
import InputFriend from './InputFriend'
import ModalBanner from './ModalBanner'
import Toast from './Toast'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { formatName, logError } from '../global/Functions'
import { useKeyboardListener, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

const onClose = () => setAction('modals', { addFamilyMember: false })

export default function ModalAddFamilyMember(): React.ReactElement | null {
  const { height: keyboardHeight, open: keyboardOpen } = useKeyboardListener()
  const scrollRef = React.useRef<ScrollView | null>(null)
  const visible = useSelector((state: ReduxState) => state.modals.addFamilyMember)
  const user = useSelector((state: ReduxState) => state.user)
  const { clientId, email, locationId } = user
  const homeStudio = `${clientId ?? ''}-${locationId ?? ''}`
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [addSuccess, setAddSuccess] = React.useState(false)
  const [savedFamilyMember, setSavedFamilyMember] = React.useState<any>(null)
  const onSubmit = React.useCallback(
    async (memberInfo: FriendInfo) => {
      const { CellPhone, ...rest } = memberInfo
      try {
        let response = await API.createFamilyMember({
          ...rest,
          HomeStudio: homeStudio,
          MobilePhone: CellPhone,
        })
        cleanAction('activeButton')
        if (response?.data != null) {
          setSavedFamilyMember(memberInfo)
          setAddSuccess(true)
        } else {
          setAction('toast', { text: response.message })
        }
      } catch (e: any) {
        logError(e)
        cleanAction('activeButton')
        setAction('toast', { text: 'Unable to add family member.' })
      }
    },
    [homeStudio],
  )
  React.useEffect(() => {
    if (!visible) {
      setAddSuccess(false)
      setSavedFamilyMember(null)
    }
  }, [visible])
  if (!visible) {
    return null
  }
  return (
    <View style={styles.content}>
      <Pressable
        onPress={keyboardOpen ? () => Keyboard.dismiss() : onClose}
        style={themeStyle.flexView}
      />
      <Animated.View style={[themeStyle.modalContent, { marginBottom: keyboardHeight }]}>
        <ModalBanner
          alternateStyling={false}
          onClose={onClose}
          title={addSuccess ? 'Family Member Added' : 'Add Family Member'}
        />
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" ref={scrollRef}>
          {addSuccess ? (
            <View style={styles.inputView}>
              <SvgCss
                color={themeStyle.brandPrimary}
                height={themeStyle.scale(62)}
                style={styles.successImage}
                width={themeStyle.scale(62)}
                xml={media.iconCheckCircle}
              />
              <Text style={styles.completeText}>
                {`Your family member `}
                <Text style={themeStyle.textPrimaryBold16}>
                  {formatName(savedFamilyMember?.FirstName, savedFamilyMember?.LastName)}
                </Text>
                {`\nhas been added.`}
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
              <Text style={styles.introText}>
                {`Please enter your family member's information below. Their profile will be created and linked to your profile.`}
              </Text>
              <InputFriend
                defaultValues={{ Email: email }}
                scrollRef={scrollRef}
                onSubmit={onSubmit}
                showBirthDate={true}
                visible={true}
              />
            </View>
          )}
        </ScrollView>
      </Animated.View>
      <Toast />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: {
      bottom: 0,
      height: themeStyle.window.height,
      left: 0,
      position: 'absolute' as 'absolute',
      right: 0,
      top: 0,
      width: themeStyle.window.width,
      zIndex: 2,
    },
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
    introText: {
      ...themeStyle.textPrimaryRegular14,
      marginBottom: themeStyle.scale(20),
      textAlign: 'center' as 'center',
    },
    inputView: { padding: themeStyle.scale(20) },
    successImage: {
      alignSelf: 'center' as FlexAlignType,
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
