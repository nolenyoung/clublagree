import * as React from 'react'
import { ActivityIndicator, Modal, View } from 'react-native'
import WebView from 'react-native-webview'
import Header from './Header'
//@ts-ignore
import { getCustomBookingURL } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { getState } from '../redux/actions'

type Props = {
  onClose: () => void
  selectedClass: ClassInfo | BookedClassInfo
  title: string
  visible: boolean
}

export default function ModalFitMetrixBooking(props: Props): React.ReactElement {
  const { onClose, selectedClass, title, visible } = props
  const { mboSiteID, RegistrationID } = selectedClass
  const { themeStyle } = useTheme()
  const [loading, setLoading] = React.useState(true)
  const uri = getCustomBookingURL({ getState, mboSiteID, RegistrationID })
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <View style={themeStyle.flexView}>
        <Header rightIcon="clear" rightIconPress={onClose} title={title} />
        <View style={themeStyle.contentWhite}>
          <WebView
            // TODO Remove when issue is fixed in react-native-webview
            key={`WebViewLoading${loading}`}
            onLoad={() => setLoading(false)}
            source={{ uri }}
            style={themeStyle.baseWebViewStyle}
          />
          {loading && (
            <View style={styles.loadingView}>
              <ActivityIndicator color={themeStyle.textGray} size="large" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = {
  loadingView: {
    alignItems: 'center' as 'center',
    height: '100%' as const,
    justifyContent: 'center' as 'center',
    position: 'absolute' as 'absolute',
    width: '100%' as const,
  },
} as const
