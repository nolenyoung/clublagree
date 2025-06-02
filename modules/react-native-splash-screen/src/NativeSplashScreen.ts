import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  setVisibility(visible: boolean): Promise<void>
}

export default TurboModuleRegistry.getEnforcing<Spec>('SplashScreen')
