#import "SplashScreen.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfaceHostingProxyRootView.h>

static RCTSurfaceHostingProxyRootView *_rootView = nil;
static UIView *_loadingView = nil;

#else
#import <React/RCTRootView.h>

static UIView *_rootView = nil;
#endif

@implementation SplashScreen
RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

#ifdef RCT_NEW_ARCH_ENABLED
+ (void)initWithRootView:(RCTSurfaceHostingProxyRootView * _Nullable)rootView loadingView:(UIView * _Nullable)loadingView {
  _loadingView = loadingView;
  _rootView = rootView;
}
#else
+ (void)initWithRootView:(UIView * _Nullable)rootView {
  _rootView = rootView;
}
#endif


RCT_EXPORT_METHOD(setVisibility:(BOOL)visible
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  #ifdef RCT_NEW_ARCH_ENABLED
    [_rootView disableActivityIndicatorAutoHide:NO];
    dispatch_async(dispatch_get_main_queue(), ^{
      [UIView transitionWithView:_rootView
        duration:0.50
        options:UIViewAnimationOptionTransitionCrossDissolve
        animations:^{
          _loadingView.hidden = YES;
        }
        completion:^(__unused BOOL finished) {
          [_loadingView removeFromSuperview];
          _loadingView = nil;
        }];
    });
  #endif
}

// Don't compile this code when we build for the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeSplashScreenSpecJSI>(params);
}
#endif

@end
