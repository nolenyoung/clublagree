import * as React from 'react'
import { ActivityIndicator, Modal, View } from 'react-native'
import WebView from 'react-native-webview'
import HeaderWebView from './HeaderWebView'
import { useTheme } from '../global/Hooks'
import { logEvent } from '../global/Functions'

type Props = {
  onClose: () => Promise<void> | void
  title: string
  uri: string
}

export default function ModalWebView(props: Props): React.ReactElement {
  const { onClose, title, uri } = props
  const { themeStyle } = useTheme()
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    logEvent(`webview_shown`, { title, uri })
  }, [])
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.flexView}>
        <HeaderWebView rightIcon="clear" rightIconPress={onClose} title={title} />
        <View style={themeStyle.contentWhite}>
          <WebView
            allowsInlineMediaPlayback={true}
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
