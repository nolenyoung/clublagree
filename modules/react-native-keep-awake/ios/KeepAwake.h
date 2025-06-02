
#ifdef RCT_NEW_ARCH_ENABLED
#import <RNKeepAwakeSpec/RNKeepAwakeSpec.h>

@interface KeepAwake : NSObject <NativeKeepAwakeSpec>
#else
#import <React/RCTBridgeModule.h>

@interface KeepAwake : NSObject <RCTBridgeModule>
#endif

@end
