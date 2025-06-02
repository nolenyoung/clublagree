package com.contactuploader

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap

abstract class ContactUploaderSpec internal constructor(context: ReactApplicationContext) :
  NativeContactUploaderSpec(context) {
    override abstract fun upload(data: ReadableMap, promise: Promise)
}
