#import "ContactUploader.h"

#if __has_include("react_native_contact_uploader-Swift.h")
#import "react_native_contact_uploader-Swift.h"
#else
#import "react_native_contact_uploader/react_native_contact_uploader-Swift.h"
#endif

static ContactUploaderModule *impl = [[ContactUploaderModule alloc] init];

@implementation ContactUploader

RCT_EXPORT_MODULE()

#ifdef RCT_NEW_ARCH_ENABLED
RCT_EXPORT_METHOD(upload:(JS::NativeContactUploader::UploadOptions &)data resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSMutableDictionary *formattedData = [NSMutableDictionary new];
    if (data.headers()) { [formattedData setObject:data.headers() forKey:@"headers"]; }
    if (data.method()) { [formattedData setValue:data.method() forKey:@"method"]; }
    if (data.url()) { [formattedData setValue:data.url() forKey:@"url"]; }
    NSMutableDictionary *formattedUser = [NSMutableDictionary new];
    if (data.user().ClientID()) { [formattedUser setValue:data.user().ClientID() forKey:@"ClientID"]; }
    if (data.user().PersonID()) { [formattedUser setValue:data.user().PersonID() forKey:@"PersonID"]; }
    [formattedData setObject:formattedUser forKey:@"user"];
    [impl upload:formattedData withResolver:resolve withRejecter:reject];
}
#else
RCT_EXPORT_METHOD(upload:(nonnull NSDictionary*)data resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    [impl upload:data withResolver:resolve withRejecter:reject];
#endif
// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeContactUploaderSpecJSI>(params);
}
#endif

@end
