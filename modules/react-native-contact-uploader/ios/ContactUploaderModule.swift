import Foundation
import Contacts

@objc(ContactUploaderModule)
public class ContactUploaderModule : NSObject {
  
  func contactToDictionary(_ person: CNContact) -> Dictionary<String, Any> {
    var output: Dictionary<String, Any> = [:]
    
//    output["recordID"] = person.identifier
    output["FirstName"] = person.givenName
    output["LastName"] = person.familyName
//    output["middleName"] = person.middleName
//    output["company"] = person.organizationName
//    output["jobTitle"] = person.jobTitle
//    output["note"] = person.note
//    
//    if let birthday = person.birthday {
//      if (birthday.month != NSDateComponentUndefined && birthday.day != NSDateComponentUndefined) {
//          //months are indexed to 0 in JavaScript (0 = January) so we subtract 1 from NSDateComponents.month
//          if (birthday.year != NSDateComponentUndefined) {
//            output["birthday"] = [ "year": birthday.year, "month": birthday.month, "day": birthday.day ]
//          } else {
//            output["birthday"] = [ "month": birthday.month, "day": birthday.day ]
//          }
//      }
//    }

    //handle phone numbers
    
    var phoneNumbers: [Dictionary<String, Any>] = []

    for labeledValue in person.phoneNumbers {
      var phone: Dictionary<String, Any> = [:]
      var label = labeledValue.label
      let value = labeledValue.value

      if (label == nil) {
          label = "other"
      }
      phone["Number"] = value.stringValue.replacingOccurrences( of:"[^0-9]", with: "", options: .regularExpression)
      phone["Type"] = label
      phoneNumbers.append(phone)
    }

    output["PhoneNumbers"] = phoneNumbers
    
    //end phone numbers

    //handle urls
    
//    var urlAddresses: [Dictionary<String, Any>] = []
//
//    for labeledValue in person.urlAddresses {
//      var url: Dictionary<String, Any> = [:]
//      var label = labeledValue.label
//      let value = labeledValue.value
//
//      if (value != "") {
//        if(label == nil) {
//            label = "home"
//        }
//        url["url"] = value
//        url["label"] = label
//        urlAddresses.append(url)
//      } else {
//          NSLog("ignoring blank url");
//      }
//    }
//
//    output["urlAddresses"] = urlAddresses

    //end urls

    //handle emails
    
//    var emailAddreses: [Dictionary<String, Any>] = []
    var emailAddreses: [NSString] = []

    for labeledValue in person.emailAddresses {
//        var email: Dictionary<String, Any> = [:]
        var label = labeledValue.label
        let value = labeledValue.value

        if (value != "") {
          if (label == nil) {
              label = "other"
          }
//          email["email"] = value
//          email["label"] = label
          emailAddreses.append(value) //currently only need email address and not label
        } else {
            NSLog("ignoring blank email");
        }
    }

    output["Emails"] = emailAddreses
    
    //end emails

    //handle postal addresses
//    var postalAddresses: [Dictionary<String, Any>] = []
//    
//    for labeledValue in person.postalAddresses {
//      var postalAddress = labeledValue.value
//      var address: Dictionary<String, Any> = [:]
//      address["street"] = postalAddress.street
//      address["city"] = postalAddress.city
//      address["state"] = postalAddress.state
//      address["region"] = postalAddress.state
//      address["postalCode"] = postalAddress.postalCode
//      address["country"] = postalAddress.country
//      postalAddresses.append(address)
//    }
//
//    output["postalAddresses"] = postalAddresses
    
    //end postal addresses
    
    //handle instant message addresses
    
//    var imAddresses: [Dictionary<String, Any>] = []
//
//    for labeledValue in person.instantMessageAddresses {
//        var imAddress: Dictionary<String, Any> = [:]
//        let imAddressData = labeledValue.value
//        var service = imAddressData.service
//        let username = imAddressData.username
//
//        if (username != "") {
//          imAddress["service"] = service
//          imAddress["username"] = username
//          imAddresses.append(imAddress)
//        } else {
//            NSLog("ignoring blank instant message address");
//        }
//    }
//
//    output["imAddresses"] = imAddresses
//    
    //end instant message addresses

    return output;
  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
      return false
  }
  
  @objc(upload:withResolver:withRejecter:)
  public func upload(_ data: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    Task.detached(priority: TaskPriority.background) {
      let contactStore = CNContactStore()
      var contacts: [Dictionary<String, Any>] = []
      let keysToFetch = [
        CNContactEmailAddressesKey,
        CNContactPhoneNumbersKey,
        CNContactFamilyNameKey,
        CNContactGivenNameKey,
//        CNContactMiddleNameKey,
//        CNContactPostalAddressesKey,
//        CNContactOrganizationNameKey,
//        CNContactJobTitleKey,
//        CNContactImageDataAvailableKey,
//        CNContactUrlAddressesKey,
//        CNContactBirthdayKey,
//        CNContactInstantMessageAddressesKey
      ]
      let fetchRequest = CNContactFetchRequest(keysToFetch: keysToFetch as [CNKeyDescriptor])
      do {
        let success: () = try contactStore.enumerateContacts(with: fetchRequest) { contact, stop in
          let contactDict = self.contactToDictionary(contact)
          contacts.append(contactDict)
        }
        if let endpoint = data["url"] as? String {
          let url = URL(string: endpoint)!
          var request = URLRequest(url: url)
          request.httpMethod = "POST"
          let jsonData = try? JSONSerialization.data(withJSONObject: ["Contacts": contacts, "User": data["user"]])
          request.httpBody = jsonData
          request.allHTTPHeaderFields = (data["headers"] ?? []) as? [String: String]
          let apiCall = URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data, error == nil else {
              resolve(["error": true, "message": error?.localizedDescription ?? "No data"])
              return
            }
            let responseJSON = try? JSONSerialization.jsonObject(with: data, options: [])
            if let responseJSON = responseJSON as? [String: Any] {
              resolve(["error": false, "response": responseJSON])
            }
          }
          apiCall.resume()
        }
      } catch {
        resolve(["error": true, "message": error.localizedDescription])
      }
    }
  }
}
