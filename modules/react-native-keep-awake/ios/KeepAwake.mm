#import "KeepAwake.h"

#if __has_include("react_native_keep_awake-Swift.h")
#import "react_native_keep_awake-Swift.h"
#else
#import "react_native_keep_awake/react_native_keep_awake-Swift.h"
#endif

static KeepAwakeModule *impl = [[KeepAwakeModule alloc] init];

@implementation KeepAwake

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(activate:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [impl activate];
}

RCT_EXPORT_METHOD(deactivate:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [impl deactivate];
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeKeepAwakeSpecJSI>(params);
}
#endif

@end
