import * as React from 'react'
import { Image, Modal, Text, View } from 'react-native'
import Button from './Button'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = {
  onClose: () => Promise<void>
  visible: boolean
}

export default function ModalPermissionLocation(props: Props): React.ReactElement {
  const { onClose, visible } = props
  const { themeStyle } = useTheme()
  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <View style={themeStyle.signUpScreen.content}>
        <View style={themeStyle.content}>
          <Image source={Brand.IMAGES_LOGO_LOGIN} style={themeStyle.loginScreen.logo} />
          <Text style={themeStyle.updateScreen.headerText}>Location Permission</Text>
          <Text style={themeStyle.updateScreen.bodyText}>
            {`Granting access to your location while using the app enables our self check-in functionality. Location information will be used to check your proximity to the upcoming ${Brand.STRING_CLASS_TITLE_LC} location and will not be saved.`}
          </Text>
        </View>
        <Button
          gradient={Brand.BUTTON_GRADIENT}
          onPress={onClose}
          style={themeStyle.signUpScreen.continueButton}
          text="Continue"
          textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
          width={themeStyle.window.width - themeStyle.scale(40)}
        />
      </View>
    </Modal>
  )
}
