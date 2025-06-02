package com.splashscreen

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod

class SplashScreenModule(context: ReactApplicationContext?) :
  SplashScreenSpec(context) {

  override fun getName(): String {
    return NAME
  }

  fun getVisibility(): Boolean {
      return splashVisible
  }

  @ReactMethod
  override fun setVisibility(show: Boolean, promise: Promise) {
      splashVisible = show
  }

  companion object {
    const val NAME = "SplashScreen"
    var splashVisible: Boolean = true;
  }
}
