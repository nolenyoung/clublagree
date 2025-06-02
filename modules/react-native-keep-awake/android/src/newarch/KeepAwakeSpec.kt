package com.keepawake

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

abstract class KeepAwakeSpec internal constructor(context: ReactApplicationContext) :
  NativeKeepAwakeSpec(context) {
  override abstract fun activate(promise: Promise)
  override abstract fun deactivate(promise: Promise)
}
