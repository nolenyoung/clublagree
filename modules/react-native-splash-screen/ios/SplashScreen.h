
#ifdef RCT_NEW_ARCH_ENABLED
#import <RNSplashScreenSpec/RNSplashScreenSpec.h>
#import <React/RCTSurfaceHostingProxyRootView.h>

@interface SplashScreen : NSObject <NativeSplashScreenSpec>

#else
#import <React/RCTBridgeModule.h>
#import <React/RCTRootView.h>

@interface SplashScreen : NSObject <RCTBridgeModule>

#endif

#ifdef RCT_NEW_ARCH_ENABLED
+(void)initWithRootView:(RCTSurfaceHostingProxyRootView * _Nullable)rootView loadingView:(UIView * _Nullable)loadingView;
#else
+(void)initWithRootView:(UIView * _Nullable)rootView;
#endif

@end
