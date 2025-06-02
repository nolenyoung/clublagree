package com.keepawake

import android.view.WindowManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class KeepAwakeModule internal constructor(context: ReactApplicationContext) :
  KeepAwakeSpec(context) {

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  override fun activate(promise: Promise): Unit {
      val activity = currentActivity
      activity?.runOnUiThread { activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
  }

  @ReactMethod
  override fun deactivate(promise: Promise): Unit {
      val activity = currentActivity
      activity?.runOnUiThread { activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
  }

  companion object {
    const val NAME = "KeepAwake"
  }
}
