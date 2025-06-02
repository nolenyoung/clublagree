package com.splashscreen

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

abstract class SplashScreenSpec internal constructor(context: ReactApplicationContext?) :
  NativeSplashScreenSpec(context) {
  override abstract fun setVisibility(show: Boolean, promise: Promise)
}
