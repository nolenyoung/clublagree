import * as React from 'react'
import { Text, TextInput } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Provider } from 'react-redux'
import * as Sentry from '@sentry/react-native'
import { reactNavigationIntegration } from './Routes'
import ThemeHandler from './components/ThemeHandler'
import store from './redux/store'
import Config from '../config'

Sentry.init({
  enabled: !__DEV__,
  enableAppHangTracking: false,
  dsn: Config.SENTRY_KEY,
  integrations: [reactNavigationIntegration],
})
if (__DEV__) {
  require('../ReactotronConfig')
}

//@ts-ignore
Text.defaultProps = { ...Text.defaultProps, ellipsizeMode: 'tail', maxFontSizeMultiplier: 1.2 }
//@ts-ignore
TextInput.defaultProps = {
  //@ts-ignore
  ...TextInput.defaultProps,
  autoCapitalize: 'sentences',
  autoCorrect: true,
  ellipsizeMode: 'tail',
  maxFontSizeMultiplier: 1.2,
  returnKeyType: 'done',
}

const rootStyle = { flex: 1 } as const

function App(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={rootStyle}>
        <Provider store={store}>
          <ThemeHandler />
          <ReducedMotionConfig mode={ReduceMotion.Never} />
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}

export default Sentry.wrap(App)
