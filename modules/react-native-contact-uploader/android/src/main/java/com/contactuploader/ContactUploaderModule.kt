package com.contactuploader

import android.database.Cursor
import android.net.Uri
import android.provider.ContactsContract
import android.provider.ContactsContract.CommonDataKinds.*
import android.text.TextUtils
//import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.Locale
import okhttp3.*
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.MediaType.Companion.toMediaType

class ContactUploaderModule internal constructor(context: ReactApplicationContext) :
  ContactUploaderSpec(context) {

  override fun getName(): String {
    return NAME
  }

  private val idForProfileContact = -1
  private val dataKeys: ArrayList<String> = arrayListOf(
      ContactsContract.Data._ID,
      ContactsContract.Data.CONTACT_ID,
      ContactsContract.Data.RAW_CONTACT_ID,
      ContactsContract.Data.LOOKUP_KEY,
      ContactsContract.Data.STARRED,
      ContactsContract.Contacts.Data.MIMETYPE,
      ContactsContract.Profile.DISPLAY_NAME,
//    Contactables.PHOTO_URI,
      StructuredName.DISPLAY_NAME,
      StructuredName.GIVEN_NAME,
      StructuredName.MIDDLE_NAME,
      StructuredName.FAMILY_NAME,
      StructuredName.PREFIX,
      StructuredName.SUFFIX,
      Phone.NUMBER,
      Phone.NORMALIZED_NUMBER,
      Phone.TYPE,
      Phone.LABEL,
      Email.DATA,
      Email.ADDRESS,
      Email.TYPE,
      Email.LABEL,
//    Organization.COMPANY,
//    Organization.TITLE,
//    Organization.DEPARTMENT,
//    StructuredPostal.FORMATTED_ADDRESS,
//    StructuredPostal.TYPE,
//    StructuredPostal.LABEL,
//    StructuredPostal.STREET,
//    StructuredPostal.POBOX,
//    StructuredPostal.NEIGHBORHOOD,
//    StructuredPostal.CITY,
//    StructuredPostal.REGION,
//    StructuredPostal.POSTCODE,
//    StructuredPostal.COUNTRY,
//    Note.NOTE,
//    Website.URL,
//    Im.DATA,
//    Event.START_DATE,
//    Event.TYPE
  )

  private fun cursorMoveToNext(cursor: Cursor): Boolean {
      return try {
          cursor.moveToNext()
      } catch (error: RuntimeException) {
          false
      }
  }

  private fun loadContactsFrom(cursor: Cursor?): Map<String, Contact> {
      val map: MutableMap<String, Contact> = LinkedHashMap()

      while (cursor != null && cursorMoveToNext(cursor)) {
          val columnIndexContactId = cursor.getColumnIndex(ContactsContract.Data.CONTACT_ID)
//            val columnIndexId = cursor.getColumnIndex(ContactsContract.Data._ID)
          val columnIndexRawContactId = cursor.getColumnIndex(ContactsContract.Data.RAW_CONTACT_ID)
          val contactId = if (columnIndexContactId != -1) cursor.getString(columnIndexContactId) ?: "" else idForProfileContact.toString()
//            val id = if (columnIndexId != -1) cursor.getString(columnIndexId) ?: "" else idForProfileContact.toString()
          val rawContactId = if (columnIndexRawContactId != -1) cursor.getString(columnIndexRawContactId) ?: "" else idForProfileContact.toString()

          if (!map.containsKey(contactId)) {
              map[contactId] = Contact(/*contactId*/)
          }

          val contact = map[contactId]
          val mimeColIndex = cursor.getColumnIndex(ContactsContract.Data.MIMETYPE)
          val mimeType = if (mimeColIndex != -1) cursor.getString(mimeColIndex) ?: "" else ""
          val nameColIndex = cursor.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME)
          val name = if (nameColIndex != -1) cursor.getString(nameColIndex) ?: "" else ""
//            val starColIndex = cursor.getColumnIndex(ContactsContract.Data.STARRED)
//            val isStarred = if (starColIndex != -1) cursor.getInt(starColIndex) == 1 else false
          contact!!.rawContactId = rawContactId
          if (!TextUtils.isEmpty(name) && TextUtils.isEmpty(contact.displayName)) {
              contact.displayName = name
          }
//            contact.isStarred = isStarred

//            if (TextUtils.isEmpty(contact.photoUri)) {
//                val photoColIndex = cursor.getColumnIndex(Contactables.PHOTO_URI)
//                val rawPhotoURI = if (photoColIndex != -1) cursor.getString(photoColIndex) ?: "" else ""
//                if (!TextUtils.isEmpty(rawPhotoURI)) {
//                    contact.photoUri = rawPhotoURI
//                    contact.hasPhoto = true
//                }
//            }

          when (mimeType) {
              StructuredName.CONTENT_ITEM_TYPE -> {
                  val givenColIndex = cursor.getColumnIndex(StructuredName.GIVEN_NAME)
                  contact.givenName = if (givenColIndex != -1) cursor.getString(givenColIndex) ?: "" else ""
//                    val middleColIndex = cursor.getColumnIndex(StructuredName.MIDDLE_NAME)
//                    contact.middleName = if (middleColIndex != -1) cursor.getString(middleColIndex) ?: "" else ""
                  val familyColIndex = cursor.getColumnIndex(StructuredName.FAMILY_NAME)
                  contact.familyName = if (familyColIndex != -1) cursor.getString(familyColIndex) ?: "" else ""
//                    val prefixColIndex = cursor.getColumnIndex(StructuredName.PREFIX)
//                    contact.prefix = if (prefixColIndex != -1) cursor.getString(prefixColIndex) ?: "" else ""
//                    val suffixColIndex = cursor.getColumnIndex(StructuredName.SUFFIX)
//                    contact.suffix = if (suffixColIndex != -1) cursor.getString(suffixColIndex) ?: "" else ""
              }

              Phone.CONTENT_ITEM_TYPE -> {
                  val phoneColIndex = cursor.getColumnIndex(Phone.NUMBER)
                  val phoneNumber = if (phoneColIndex != -1) cursor.getString(phoneColIndex) ?: "" else ""
                  val phoneTypeColIndex = cursor.getColumnIndex(Phone.TYPE)
                  val phoneType = if (phoneTypeColIndex != -1) cursor.getInt(phoneTypeColIndex) else 0

                  if (!TextUtils.isEmpty(phoneNumber)) {
                      val label = when (phoneType) {
                          Phone.TYPE_HOME -> "home"
                          Phone.TYPE_WORK -> "work"
                          Phone.TYPE_MOBILE -> "mobile"
                          Phone.TYPE_OTHER -> "other"
                          else -> "other"
                      }
                      contact.phones.add(Contact.Item(label, phoneNumber/*, id*/))
                  }
              }

              Email.CONTENT_ITEM_TYPE -> {
                  val emailColIndex = cursor.getColumnIndex(Email.ADDRESS)
                  val emailLabelColIndex = cursor.getColumnIndex(Email.LABEL)
                  val emailTypeColIndex = cursor.getColumnIndex(Email.TYPE)
                  val email = if (emailColIndex != -1) cursor.getString(emailColIndex) ?: "" else ""
                  val emailType = if (emailTypeColIndex != -1) cursor.getInt(emailTypeColIndex) else "other"
                  if (!TextUtils.isEmpty(email)) {
                      val label = when (emailType) {
                          Email.TYPE_HOME -> "home"
                          Email.TYPE_WORK -> "work"
                          Email.TYPE_MOBILE -> "mobile"
                          Email.TYPE_OTHER -> "other"
                          Email.TYPE_CUSTOM -> if (emailLabelColIndex != -1) cursor.getString(emailLabelColIndex)?.lowercase(Locale.getDefault()) ?: "" else ""
                          else -> "other"
                      }
                      contact.emails.add(Contact.Item(label, email/*, id*/))
                  }
              }

//                Website.CONTENT_ITEM_TYPE -> {
//                    val urlColIndex = cursor.getColumnIndex(Website.URL)
//                    val webLabelColIndex = cursor.getColumnIndex(Website.LABEL)
//                    val webTypeColIndex = cursor.getColumnIndex(Website.TYPE)
//                    val url = if (urlColIndex != -1) cursor.getString(urlColIndex) ?: "" else ""
//                    val websiteType =
//                        if (webTypeColIndex != -1) cursor.getInt(webTypeColIndex) ?: "" else ""
//                    if (!TextUtils.isEmpty(url)) {
//                        val label = when (websiteType) {
//                            Website.TYPE_HOMEPAGE -> "homepage"
//                            Website.TYPE_BLOG -> "blog"
//                            Website.TYPE_PROFILE -> "profile"
//                            Website.TYPE_HOME -> "home"
//                            Website.TYPE_WORK -> "work"
//                            Website.TYPE_FTP -> "ftp"
//                            Website.TYPE_CUSTOM -> if (webLabelColIndex != -1) cursor.getString(
//                                webLabelColIndex
//                            ) ?: "" else ""
//
//                            else -> "other"
//                        }
//                        contact.urls.add(Contact.Item(label, url, id))
//                    }
//                }

//                Organization.CONTENT_ITEM_TYPE -> {
//                    val orgCompanyColIndex = cursor.getColumnIndex(Organization.COMPANY)
//                    val orgDeptColIndex = cursor.getColumnIndex(Organization.DEPARTMENT)
//                    val orgTitleColIndex = cursor.getColumnIndex(Organization.TITLE)
//                    contact.company = if (orgCompanyColIndex != -1) cursor.getString(orgCompanyColIndex) ?: "" else ""
//                    contact.jobTitle = if (orgTitleColIndex != -1) cursor.getString(orgTitleColIndex) ?: "" else ""
//                    contact.department = if (orgDeptColIndex != -1) cursor.getString(orgDeptColIndex) ?: "" else ""
//                }
//
//                StructuredPostal.CONTENT_ITEM_TYPE -> contact.postalAddresses.add(
//                    Contact.PostalAddressItem(cursor)
//                )
//
//                Event.CONTENT_ITEM_TYPE -> {
//                    val eventTypeColIndex = cursor.getColumnIndex(Event.TYPE)
//                    val eventType = if (eventTypeColIndex != -1) cursor.getInt(eventTypeColIndex) else -1
//                    if (eventType == Event.TYPE_BIRTHDAY) {
//                        try {
//                            val bdayStartColIndex = cursor.getColumnIndex(Event.START_DATE)
//                            val birthday = if (bdayStartColIndex != -1) cursor.getString(bdayStartColIndex)?.replace("--", "") ?: "" else ""
//                            val yearMonthDay =
//                                birthday.split("-".toRegex()).dropLastWhile { it.isEmpty() }
//                                    .toTypedArray()
//                            val yearMonthDayList = listOf(*yearMonthDay)
//
//                            if (yearMonthDayList.size == 2) {
//                                // birthday is formatted "12-31"
//                                val month = yearMonthDayList[0].toInt()
//                                val day = yearMonthDayList[1].toInt()
//                                if (month in 1..12 && day >= 1 && day <= 31) {
//                                    contact.birthday = Contact.Birthday(month, day)
//                                }
//                            } else if (yearMonthDayList.size == 3) {
//                                // birthday is formatted "1986-12-31"
//                                val year = yearMonthDayList[0].toInt()
//                                val month = yearMonthDayList[1].toInt()
//                                val day = yearMonthDayList[2].toInt()
//                                if (year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
//                                    contact.birthday = Contact.Birthday(year, month, day)
//                                }
//                            }
//                        } catch (e: NumberFormatException) {
//                            // whoops, birthday isn't in the format we expect
//                            Log.w("ContactsProvider", e.toString())
//                        } catch (e: ArrayIndexOutOfBoundsException) {
//                            Log.w("ContactsProvider", e.toString())
//                        } catch (e: NullPointerException) {
//                            Log.w("ContactsProvider", e.toString())
//                        }
//                    }
//                }
//
//                Note.CONTENT_ITEM_TYPE -> {
//                    val noteColIndex = cursor.getColumnIndex(Note.NOTE)
//                    contact.note = if (noteColIndex != -1) cursor.getString(noteColIndex) ?: "" else ""
//                }
          }
      }

      return map
  }

  @ReactMethod
  override fun upload(data: ReadableMap, promise: Promise) {
      val contentResolver = reactApplicationContext.contentResolver
      CoroutineScope(Dispatchers.IO).launch {
          val everyoneElse: Map<String, Contact>
          val justMe: Map<String, Contact>
          val justMeCursor = contentResolver.query(Uri.withAppendedPath(ContactsContract.Profile.CONTENT_URI, ContactsContract.Contacts.Data.CONTENT_DIRECTORY),
              dataKeys.toTypedArray(),null,null,null)
          justMeCursor.use { cursor ->
              justMe = loadContactsFrom(cursor)
          }
          val everyoneElseCursor = contentResolver.query(ContactsContract.Data.CONTENT_URI,
              dataKeys.toTypedArray(),
              ContactsContract.Data.MIMETYPE + "=? OR "
                      + ContactsContract.Data.MIMETYPE + "=? OR "
                      + ContactsContract.Data.MIMETYPE + "=? OR "
                      + ContactsContract.Data.MIMETYPE + "=? OR "
                      + ContactsContract.Data.MIMETYPE + "=? OR "
                      + ContactsContract.Data.MIMETYPE + "=? OR "
                      + ContactsContract.Data.MIMETYPE + "=? OR "
                      + ContactsContract.Data.MIMETYPE + "=? OR "
                      + ContactsContract.Data.MIMETYPE + "=?",
              arrayOf(
                  Email.CONTENT_ITEM_TYPE,
                  Phone.CONTENT_ITEM_TYPE,
                  StructuredName.CONTENT_ITEM_TYPE,
                  Organization.CONTENT_ITEM_TYPE,
                  StructuredPostal.CONTENT_ITEM_TYPE,
                  Note.CONTENT_ITEM_TYPE,
                  Website.CONTENT_ITEM_TYPE,
                  Im.CONTENT_ITEM_TYPE,
                  Event.CONTENT_ITEM_TYPE,
              ),
              null)
          everyoneElseCursor.use { cursor ->
              everyoneElse = loadContactsFrom(cursor)
          }
          val contacts = Arguments.createArray()
          for (contact in justMe.values) {
              contacts.pushMap(contact.toMap())
          }
          for (contact in everyoneElse.values) {
              contacts.pushMap(contact.toMap())
          }
          val client = OkHttpClient()

          val body = Arguments.createMap()
          body.putArray("Contacts", contacts)
          body.putMap("User", data.getMap("user"))
          val headers = data.getMap("headers")
          val postBody = body.toString()
          val request = Request.Builder()
              .url(data.getString("url")!!)
              .post(postBody.toRequestBody(MEDIA_TYPE_JSON))
          if (headers != null) {
              val iter = headers.keySetIterator()
              while (iter.hasNextKey()) {
                  val key = iter.nextKey()
                  headers.getString(key)?.let { request.header(key, it) }
              }
          }
          client.newCall(request.build()).enqueue(object : Callback {
              override fun onFailure(call: Call, e: java.io.IOException) {
                  val res = Arguments.createMap()
                  res.putBoolean("error", true)
                  res.putString("message",e.message)
                  promise.resolve(res)
              }

              override fun onResponse(call: Call, response: Response) {
                  // Handle success
                  val result = response.body?.string() ?: ""
                  val res = Arguments.createMap()
                  res.putBoolean("error", false)
                  res.putString("response",result)
                  promise.resolve(res)
              }
          })
      }
  }

  class Contact(/*private val contactId: String*/) {
      internal var rawContactId: String? = null
      var displayName: String? = null
      var givenName = ""
//        var middleName = ""
      var familyName = ""
//        var prefix = ""
//        var suffix = ""
//        var company = ""
//        var jobTitle = ""
//        var department = ""
//        var note = ""
//        val urls: ArrayList<Item> = ArrayList()
//        var hasPhoto = false
//        var isStarred = false
//        var photoUri: String? = null
      val emails: ArrayList<Item> = ArrayList()
      val phones: ArrayList<Item> = ArrayList()
//        val postalAddresses: ArrayList<PostalAddressItem> = ArrayList()
//        var birthday: Birthday? = null


      fun toMap(): WritableMap {
          val contact = Arguments.createMap()
//            contact.putString("recordID", contactId)
//            contact.putString("rawContactId", rawContactId)
          contact.putString(
              "FirstName",
              if (TextUtils.isEmpty(givenName)) displayName else givenName
          )
//            contact.putString("displayName", displayName)
//            contact.putString("middleName", middleName)
          contact.putString("LastName", familyName)
//            contact.putString("prefix", prefix)
//            contact.putString("suffix", suffix)
//            contact.putString("company", company)
//            contact.putString("jobTitle", jobTitle)
//            contact.putString("department", department)
//            contact.putString("note", note)
//            contact.putBoolean("hasThumbnail", this.hasPhoto)
//            contact.putString("thumbnailPath", photoUri ?: "")
//            contact.putBoolean("isStarred", this.isStarred)

          val phoneNumbers = Arguments.createArray()
          for (item in phones) {
              val map = Arguments.createMap()
              map.putString("Number", item.value)
              map.putString("Type", item.label)
//                map.putString("id", item.id)
              phoneNumbers.pushMap(map)
          }
          contact.putArray("PhoneNumbers", phoneNumbers)

//            val urlAddresses = Arguments.createArray()
//            for (item in urls) {
//                val map = Arguments.createMap()
//                map.putString("url", item.value)
//                map.putString("id", item.id)
//                urlAddresses.pushMap(map)
//            }
//            contact.putArray("urlAddresses", urlAddresses)

          val emailAddresses = Arguments.createArray()
          // Need only an array of email addresses not types/id/etc
          for (item in emails) {
//                val map = Arguments.createMap()
              emailAddresses.pushString(item.value)
//                map.putString("email", item.value)
//                map.putString("label", item.label)
//                map.putString("id", item.id)
//                emailAddresses.pushMap(map)
          }
          contact.putArray("Emails", emailAddresses)

//            val postalAddresses = Arguments.createArray()
//            for (item in this.postalAddresses) {
//                postalAddresses.pushMap(item.map)
//            }
//            contact.putArray("postalAddresses", postalAddresses)
//
//            val birthdayMap = Arguments.createMap()
//            if (birthday != null) {
//                if ((birthday?.year ?: 0) > 0) {
//                    birthdayMap.putInt("year", birthday?.year ?: 0)
//                }
//                birthdayMap.putInt("month", birthday?.month ?: 0)
//                birthdayMap.putInt("day", birthday?.day ?: 0)
//                contact.putMap("birthday", birthdayMap)
//            }
          return contact
      }

      class Item(var label: String, var value: String/*, var id: String?*/)

//        class Birthday {
//            var year: Int = 0
//            var month: Int = 0
//            var day: Int = 0
//
//            constructor(year: Int, month: Int, day: Int) {
//                this.year = year
//                this.month = month
//                this.day = day
//            }
//
//            constructor(month: Int, day: Int) {
//                this.month = month
//                this.day = day
//            }
//        }
//
//        class PostalAddressItem(cursor: Cursor) {
//            val map: WritableMap = Arguments.createMap()
//
//            init {
//                map.putString("label", getLabel(cursor))
//                putString(cursor, "formattedAddress", StructuredPostal.FORMATTED_ADDRESS)
//                putString(cursor, "street", StructuredPostal.STREET)
//                putString(cursor, "pobox", StructuredPostal.POBOX)
//                putString(cursor, "neighborhood", StructuredPostal.NEIGHBORHOOD)
//                putString(cursor, "city", StructuredPostal.CITY)
//                putString(cursor, "region", StructuredPostal.REGION)
//                putString(cursor, "state", StructuredPostal.REGION)
//                putString(cursor, "postCode", StructuredPostal.POSTCODE)
//                putString(cursor, "country", StructuredPostal.COUNTRY)
//            }
//
//            private fun putString(cursor: Cursor, key: String, androidKey: String) {
//                val columnIndex = cursor.getColumnIndex(androidKey)
//                if (columnIndex >= 0) {
//                    val value = cursor.getString(columnIndex)
//                    if (!TextUtils.isEmpty(value)) map.putString(key, value)
//                }
//            }
//
//            companion object {
//                fun getLabel(cursor: Cursor): String {
//                    val columnIndex = cursor.getColumnIndex(StructuredPostal.TYPE)
//                    if (columnIndex >= 0) {
//                        when (cursor.getInt(columnIndex)) {
//                            StructuredPostal.TYPE_HOME -> return "home"
//                            StructuredPostal.TYPE_WORK -> return "work"
//                            StructuredPostal.TYPE_CUSTOM -> {
//                                val colIndex = cursor.getColumnIndex(StructuredPostal.LABEL)
//                                if (colIndex >= 0) {
//                                    return cursor.getString(colIndex) ?: ""
//                                }
//                                return ""
//                            }
//                        }
//                    }
//                    return "other"
//                }
//            }
//        }
  }
  
  companion object {
      val MEDIA_TYPE_JSON = "application/json; charset=utf-8".toMediaType()
      const val NAME = "ContactUploader"
  }
}
