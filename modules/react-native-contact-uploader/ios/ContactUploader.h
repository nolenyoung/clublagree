
#ifdef RCT_NEW_ARCH_ENABLED
#import <RNContactUploaderSpec/RNContactUploaderSpec.h>

@interface ContactUploader : NSObject <NativeContactUploaderSpec>
#else
#import <React/RCTBridgeModule.h>

@interface ContactUploader : NSObject <RCTBridgeModule>
#endif

@end
