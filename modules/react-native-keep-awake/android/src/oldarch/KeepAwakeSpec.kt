package com.keepawake

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.Promise

abstract class KeepAwakeSpec internal constructor(context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {
  abstract fun activate()
  abstract fun deactivate()
}
