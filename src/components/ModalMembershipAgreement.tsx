import * as React from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'
import { SvgCss } from 'react-native-svg/css'
import media from '../assets/media'
import Button from './Button'
import ContractSigning from './ContractSigning'
import ModalBanner from './ModalBanner'
import Toast from './Toast'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { ANIMATION_DURATIONS } from '../global/Constants'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = {
  alternateStyling?: boolean
  ClientContractID: number
  ClientID: number
  PersonID: string
}

const onClose = () => setAction('user', { membershipInfo: undefined })

// Conditionally render this modal so that state resets whenever it is closed

export default function ModalMembershipAgreement(props: Props): React.ReactElement {
  const { alternateStyling, ClientID, ClientContractID, PersonID } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [contract, setContract] = React.useState<MembershipContract | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [success, setSuccess] = React.useState(false)
  const onAgreementSigned = async (image: string) => {
    try {
      setLoading(true)
      let response = await API.updateMembershipContract({
        ClientID,
        ClientContractID,
        Contract: image,
        PersonID,
      })
      setLoading(false)
      if (response.code === 200) {
        setSuccess(true)
      } else {
        setAction('toast', { text: 'Unable to submit membership agreement' })
      }
    } catch (e: any) {
      logError(e)
      setLoading(false)
      setAction('toast', { text: 'We were unable to submit membership agreement' })
    }
  }
  React.useEffect(() => {
    ; (async function getWaiver() {
      try {
        let response = await API.getMembershipContract({ ClientID, PersonID })
        if ('Contract' in response) {
          setContract(response.Contract)
          setLoading(false)
        } else {
          setAction('toast', { text: response?.message ?? 'Unable to get agreement' })
          setLoading(false)
        }
      } catch (e: any) {
        logError(e)
        setAction('toast', { text: 'Unable to fetch the agreement' })
        onClose()
      }
    })()
  }, [ClientID, PersonID])
  const maxHeight = themeStyle.window.height - themeStyle.scale(250)
  return (
    <Animated.View
      entering={FadeIn.duration(ANIMATION_DURATIONS.overlayBackdropFade)}
      exiting={FadeOut.duration(ANIMATION_DURATIONS.overlayBackdropFade).delay(
        ANIMATION_DURATIONS.overlayContentTranslation,
      )}
      style={themeStyle.overlayContainerLevel2}>
      <Pressable onPressIn={onClose} style={themeStyle.flexView} />
      <Animated.View
        entering={SlideInDown.duration(ANIMATION_DURATIONS.overlayContentTranslation).delay(
          ANIMATION_DURATIONS.overlayBackdropFade,
        )}
        exiting={SlideOutDown.duration(ANIMATION_DURATIONS.overlayContentTranslation)}
        style={[themeStyle.modalContent, !success && { height: maxHeight, maxHeight }]}>
        <ModalBanner
          alternateStyling={alternateStyling}
          onClose={onClose}
          title={'Membership Agreement'}
        />
        {success ? (
          <View style={styles.content}>
            <SvgCss
              color={themeStyle.buttonTextOnMain}
              height={themeStyle.scale(62)}
              style={styles.successImage}
              width={themeStyle.scale(62)}
              xml={media.iconCheckCircle}
            />
            <Text style={styles.completeText}>{`You're all set!`}</Text>
            <Button
              gradient={Brand.BUTTON_GRADIENT}
              onPress={onClose}
              style={styles.submitButton}
              text="Done"
            />
          </View>
        ) : (
          <View style={[styles.content, themeStyle.flexView]}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" />
              </View>
            )}
            <Text style={styles.introText}>
              {`Please sign your membership agreement in order to continue booking.`}
            </Text>
            {contract?.AgreementTerms != null && (
              <ContractSigning
                agreement={contract.AgreementTerms}
                onClose={onClose}
                onContinue={onAgreementSigned}
              />
            )}
          </View>
        )}
      </Animated.View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { padding: themeStyle.scale(20) },
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
    successImage: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(20),
      marginTop: themeStyle.scale(16),
    },
    completeText: {
      ...themeStyle.textPrimaryBold16,
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
