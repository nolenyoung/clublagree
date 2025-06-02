#import "AppDelegate.h"

#import <Firebase.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <UserNotifications/UserNotifications.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTSurfaceHostingView.h>
#import "SplashScreen.h"

static RCTSurfaceHostingProxyRootView *_rootView = nil;
#else
#import <React/RCTRootView.h>

static UIView *_rootView = nil;
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  center.delegate = self;
  [FIRApp configure];
  
  self.moduleName = @"ClubLagree";
  self.dependencyProvider = [RCTAppDependencyProvider new];
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
    
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

-(void)customizeRootView:(RCTRootView *)rootView {
  [super customizeRootView:rootView];
  RCTSurfaceHostingProxyRootView *_rootView = (RCTSurfaceHostingProxyRootView *)rootView;
  UIStoryboard *storyboard = [UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil];
  UIView *loadingView = [[storyboard instantiateInitialViewController] view];
  loadingView.autoresizesSubviews = NO;
  loadingView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  loadingView.frame = _rootView.bounds;
  loadingView.center = (CGPoint){CGRectGetMidX(_rootView.bounds), CGRectGetMidY(_rootView.bounds)};
  [_rootView setLoadingView:loadingView];
  _rootView.loadingViewFadeDelay = 0.50;
  _rootView.loadingViewFadeDuration = 0.50;
  #ifdef RCT_NEW_ARCH_ENABLED
    [_rootView disableActivityIndicatorAutoHide:YES];
    [SplashScreen initWithRootView:_rootView loadingView:loadingView ];
  #endif
}

//Called when a notification is delivered to a foreground app.
-(void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  completionHandler(UNNotificationPresentationOptionSound | UNNotificationPresentationOptionList | UNNotificationPresentationOptionBanner | UNNotificationPresentationOptionBadge);
}

-(void)applicationDidBecomeActive:(UIApplication *)application{
  application.applicationIconBadgeNumber = 0;
}

- (BOOL)application:(UIApplication *)app
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  if ([RCTLinkingManager application:app openURL:url options:options]) {
    return YES;
  }

  return NO;
}
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
