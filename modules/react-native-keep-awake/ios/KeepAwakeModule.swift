import UIKit

@objc(KeepAwakeModule)
public class KeepAwakeModule : NSObject {
  @objc static func requiresMainQueueSetup() -> Bool {
      return true
  }
  @objc(activate)
  public func activate() -> Void {
    DispatchQueue.main.async {
      UIApplication.shared.isIdleTimerDisabled = true
    }
  }
  @objc(deactivate)
  public func deactivate() -> Void {
    DispatchQueue.main.async {
      UIApplication.shared.isIdleTimerDisabled = false
    }
  }
}
