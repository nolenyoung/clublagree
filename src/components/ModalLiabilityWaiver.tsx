import * as React from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'
import { SvgCss } from 'react-native-svg/css'
import media from '../assets/media'
import Button from './Button'
import ContractSigning from './ContractSigning'
import ModalBanner from './ModalBanner'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { ANIMATION_DURATIONS } from '../global/Constants'
import { logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = { alternateStyling?: boolean }

const onClose = async () => {
  await logEvent('liability_form_exit')
  setAction('user', { liabilityReleased: true })
}

// Conditionally render this modal so that state resets whenever it is closed

export default function ModalLiabilityWaiver(props: Props): React.ReactElement {
  const { alternateStyling } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [agreementTerms, setAgreementTerms] = React.useState<string | null | undefined>(null)
  const [loading, setLoading] = React.useState(true)
  const [success, setSuccess] = React.useState(false)
  const onAgreementSigned = React.useCallback(async (image: string) => {
    try {
      setLoading(true)
      let response = await API.updateLiabilityRelease({ Waiver: image })
      setLoading(false)
      if (response.code === 200 && response.message === 'Success') {
        setSuccess(true)
        await logEvent('liability_form_submit', { timestamp: Date.now() })
      } else {
        setAction('toast', { text: 'Unable to submit waiver' })
      }
    } catch (e: any) {
      logError(e)
      setLoading(false)
      setAction('toast', { text: 'We were unable to submit signature' })
    }
  }, [])
  React.useEffect(() => {
    ;(async function getWaiver() {
      try {
        await logEvent('liability_form_start')
        let response = await API.getLiabilityWaiver()
        const { LiabilityRelease } = response
        if (typeof LiabilityRelease === 'string' && LiabilityRelease !== '') {
          setAgreementTerms(LiabilityRelease)
          setLoading(false)
        } else {
          setAction('toast', { text: response?.message ?? 'Unable to get waiver' })
          setLoading(false)
          onClose()
        }
      } catch (e: any) {
        logError(e)
        setAction('toast', { text: 'Unable to fetch the waiver' })
        onClose()
      }
    })()
  }, [])
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
          title={'Release of Liability'}
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
              {`Please review and sign the liability waiver below.`}
            </Text>
            <ContractSigning
              agreement={agreementTerms}
              onClose={onClose}
              onContinue={onAgreementSigned}
            />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { padding: themeStyle.scale(20), paddingBottom: themeStyle.scale(40) },
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
