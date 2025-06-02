package com.splashscreen

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise

abstract class SplashScreenSpec internal constructor(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {
  abstract fun setVisibility(show: Boolean)
}
