/**
 * @format
 */

import 'react-native-gesture-handler'
import 'react-native-get-random-values'
import 'node-libs-react-native/globals'
import notifee, { AndroidImportance } from '@notifee/react-native'
import messaging from '@react-native-firebase/messaging'
import { AppRegistry, Platform } from 'react-native'
import App from './src/App'
import { name as appName } from './app.json'
import Brand from './src/global/Brand'

if (Platform.OS === 'android') {
  notifee
    .createChannel({
      description: Brand.PUSH_CHANNEL_DESCRIPTION,
      id: Brand.PUSH_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      name: Brand.PUSH_CHANNEL_NAME,
      sound: 'default',
      vibration: true,
    })
    .catch(() => {})
}

AppRegistry.registerComponent(appName, () => App)
