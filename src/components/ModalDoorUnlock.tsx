import * as React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import ButtonText from './ButtonText'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  classInfo: BookedClassInfo
  onClose: () => void
  visible: boolean
}

type UnlockParams = {
  classInfo: BookedClassInfo
  setDoorUnlocked: (arg1: boolean) => void
}

async function onUnlockDoor({ classInfo, setDoorUnlocked }: UnlockParams) {
  const { ClientID, PersonID, VisitRefNo } = classInfo
  setAction('loading', { loading: true })
  try {
    await API.unlockDoor({ ClientID, PersonID, VisitRefNo: VisitRefNo })
    setDoorUnlocked(true)
    cleanAction('loading')
  } catch (e: any) {
    logError(e)
    cleanAction('loading')
    setAction('toast', { text: 'Unable to request a door unlock.' })
  }
}

export default function ModalDoorUnlock(props: Props): React.ReactElement {
  const { classInfo, onClose, visible } = props
  const { Location, Type } = classInfo ?? {}
  const [doorUnlocked, setDoorUnlocked] = React.useState(false)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const locationName =
    Location?.Nickname ??
    `your ${Type === 'Appointment' ? 'appointment' : Brand.STRING_CLASS_TITLE_LC}`
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <View style={themeStyle.flexViewCentered}>
        <Pressable onPress={onClose} style={themeStyle.modalDismissArea} />
        <View style={themeStyle.modalFadeContent}>
          <View style={styles.content}>
            <Text style={styles.titleText}>Unlock the Door</Text>
            <Text style={styles.questionText}>
              {doorUnlocked
                ? `The door at ${locationName} is unlocked for the next few seconds. Enjoy class!`
                : `Are you ready to open the door at ${locationName}?`}
            </Text>
          </View>
          <ItemSeparator />
          <ButtonText
            color={themeStyle.buttonTextOnMain}
            onPress={doorUnlocked ? onClose : () => onUnlockDoor({ classInfo, setDoorUnlocked })}
            text={doorUnlocked ? 'Close' : 'Yes, unlock the door'}
            textStyle={styles.continueText}
          />
          {!doorUnlocked && (
            <>
              <ItemSeparator />
              <ButtonText
                color={themeStyle.textBlack}
                onPress={onClose}
                text="No, I changed my mind"
                textStyle={styles.cancelText}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { padding: themeStyle.scale(20) },
    titleText: {
      ...themeStyle.textPrimaryBold16,
      marginBottom: themeStyle.scale(16),
      marginTop: themeStyle.scale(8),
      textAlign: 'center' as 'center',
    },
    questionText: {
      ...themeStyle.textPrimaryRegular14,
      marginBottom: themeStyle.scale(8),
      opacity: 0.6,
    },
    continueText: {
      fontFamily: themeStyle.fontPrimaryBold,
      fontSize: themeStyle.scale(14),
      marginVertical: themeStyle.scale(16),
    },
    cancelText: { fontSize: themeStyle.scale(14), marginVertical: themeStyle.scale(16) },
  }
}
