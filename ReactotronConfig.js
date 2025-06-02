import Reactotron, { networking } from 'reactotron-react-native'
import { reactotronRedux } from 'reactotron-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'

Reactotron.clear()
const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure() // controls connection & communication settings
  .useReactNative() // add all built-in react native plugins
  .use(reactotronRedux())
  .use(networking({ ignoreUrls: /generate_204|\/(logs|symbolicate)$/ }))
  .connect() // let's connect!
export default reactotron
