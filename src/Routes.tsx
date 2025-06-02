import analytics from '@react-native-firebase/analytics'
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerScreenProps,
} from '@react-navigation/drawer'
import {
  CompositeScreenProps,
  NavigationContainer,
  NavigatorScreenParams,
} from '@react-navigation/native'
import {
  createStackNavigator,
  StackNavigationOptions,
  StackScreenProps,
} from '@react-navigation/stack'
import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import Menu from './components/Menu'
import { useBackHandler, useTheme } from './global/Hooks'
import Account from './screens/Account'
import AppointmentDetails from './screens/AppointmentDetails'
import AppointmentDetailsMultiple from './screens/AppointmentDetailsMultiple'
import AppointmentFilters from './screens/AppointmentFilters'
import AppointmentSchedule from './screens/AppointmentSchedule'
import AppointmentSearch from './screens/AppointmentSearch'
import Auth from './screens/Auth'
import BadgeDetail from './screens/BadgeDetail'
import BadgeList from './screens/BadgeList'
import ClassBooking from './screens/ClassBooking'
import ClassBookingMultiple from './screens/ClassBookingMultiple'
import ClassBookingSpot from './screens/ClassBookingSpot'
import ClassFilters from './screens/ClassFilters'
import ClassList from './screens/ClassList'
import ClassSchedule from './screens/ClassSchedule'
import CoachSchedule from './screens/CoachSchedule'
import Faq from './screens/Faq'
import FriendInvite from './screens/FriendInvite'
import Friends from './screens/Friends'
import Home from './screens/Home'
import Internet from './screens/Internet'
import Login from './screens/Login'
import PrivacyPolicy from './screens/PrivacyPolicy'
import PurchaseGiftCard from './screens/PurchaseGiftCard'
import Purchases from './screens/Purchases'
import RefundPolicy from './screens/RefundPolicy'
import Rewards from './screens/Rewards'
import Signup from './screens/Signup'
import Splash from './screens/Splash'
import StudioPricing from './screens/StudioPricing'
import Terms from './screens/Terms'
import UpdateApp from './screens/UpdateApp'
import UserWorkoutCalendar from './screens/UserWorkoutCalendar'
import Workshops from './screens/Workshops'
import { setAction } from './redux/actions'

export const reactNavigationIntegration = Sentry.reactNavigationIntegration()

function getActiveRouteName(state: RouteState): string {
  if (state != null) {
    const route = state.routes[state.index]
    if (route.state) {
      // Dive into nested navigators
      return getActiveRouteName(route.state)
    }
    return route.name
  }
  return ''
}

const Drawer = createDrawerNavigator<RootNavigatorParamList>()
const AppointmentStackNav = createStackNavigator<AppointmentStackParamList>()
const BadgeStackNav = createStackNavigator<BadgeStackParamList>()
const ScheduleStackNav = createStackNavigator<ScheduleStackParamList>()
const WorkshopStackNav = createStackNavigator<WorkshopStackParamList>()

const stackConfig = {
  animation: 'slide_from_right',
  cardOverlayEnabled: false,
  headerShown: false,
  presentation: 'transparentModal',
} as StackNavigationOptions

function AppointmentStack() {
  return (
    <AppointmentStackNav.Navigator initialRouteName="AppointmentSearch" screenOptions={stackConfig}>
      <AppointmentStackNav.Screen component={AppointmentDetails} name="AppointmentDetails" />
      <AppointmentStackNav.Screen
        component={AppointmentDetailsMultiple}
        name="AppointmentDetailsMultiple"
      />
      <AppointmentStackNav.Screen component={AppointmentFilters} name="AppointmentFilters" />
      <AppointmentStackNav.Screen component={AppointmentSchedule} name="AppointmentSchedule" />
      <AppointmentStackNav.Screen component={AppointmentSearch} name="AppointmentSearch" />
    </AppointmentStackNav.Navigator>
  )
}

function BadgeStack() {
  return (
    <BadgeStackNav.Navigator screenOptions={stackConfig}>
      <BadgeStackNav.Screen component={BadgeList} name="BadgeList" />
      <BadgeStackNav.Screen component={BadgeDetail} name="BadgeDetail" />
    </BadgeStackNav.Navigator>
  )
}

function ScheduleStack() {
  return (
    <ScheduleStackNav.Navigator screenOptions={stackConfig}>
      <ScheduleStackNav.Screen component={ClassSchedule} name="ClassScheduleBase" />
      <ScheduleStackNav.Screen component={ClassBooking} name="ClassBooking" />
      <ScheduleStackNav.Screen component={ClassBookingMultiple} name="ClassBookingMultiple" />
      <ScheduleStackNav.Screen component={ClassBookingSpot} name="ClassBookingSpot" />
      <ScheduleStackNav.Screen component={ClassFilters} name="ClassFilters" />
    </ScheduleStackNav.Navigator>
  )
}

function WorkshopStack() {
  return (
    <WorkshopStackNav.Navigator screenOptions={stackConfig}>
      <WorkshopStackNav.Screen component={Workshops} name="WorkshopsBase" />
      <WorkshopStackNav.Screen component={ClassBooking} name="ClassBooking" />
      <WorkshopStackNav.Screen component={ClassBookingMultiple} name="ClassBookingMultiple" />
      <WorkshopStackNav.Screen component={ClassBookingSpot} name="WorkshopsBookingSpot" />
      <WorkshopStackNav.Screen component={ClassFilters} name="WorkshopsFilters" />
    </WorkshopStackNav.Navigator>
  )
}

export default function Routes(): React.ReactElement {
  useBackHandler()
  const navigation = React.useRef(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const routeNameRef = React.useRef<string>('')
  return (
    <NavigationContainer
      onReady={() => {
        reactNavigationIntegration.registerNavigationContainer(navigation)
      }}
      onStateChange={async (state) => {
        const previousScreen: string = routeNameRef.current ?? ''
        const currentScreen: string = getActiveRouteName(state)
        if (previousScreen !== currentScreen) {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.log(currentScreen)
          } else {
            await analytics().logEvent(`screenVisit_${currentScreen}`)
            await analytics().logScreenView({
              screen_class: currentScreen,
              screen_name: currentScreen,
            })
          }
          setAction('screens', { currentScreen, previousScreen })
        }
        routeNameRef.current = currentScreen
      }}
      ref={navigation}>
      <Drawer.Navigator
        backBehavior="history"
        detachInactiveScreens={false}
        drawerContent={Menu}
        initialRouteName="Splash"
        screenLayout={({ children }) => (
          <>{(children.props as any).navigation.isFocused() ? children : null}</>
        )}
        screenOptions={{
          drawerPosition: 'left',
          drawerStyle: styles.drawer,
          drawerType: 'front',
          headerShown: false,
          popToTopOnBlur: true,
          sceneStyle: { backgroundColor: themeStyle.white },
          swipeEnabled: false,
        }}>
        <Drawer.Screen component={Account} name="Account" />
        <Drawer.Screen component={AppointmentStack} name="Appointments" />
        <Drawer.Screen component={Auth} name="Auth" />
        <Drawer.Screen component={BadgeStack} name="Badges" />
        <Drawer.Screen component={ClassBookingSpot} name="ClassBookingSpotEdit" />
        <Drawer.Screen component={ClassFilters} name="ClassFilters" />
        <Drawer.Screen component={CoachSchedule} name="CoachSchedule" />
        <Drawer.Screen component={ScheduleStack} name="ClassSchedule" />
        <Drawer.Screen component={ClassList} name="ClassList" />
        <Drawer.Screen component={Faq} name="Faq" />
        <Drawer.Screen component={FriendInvite} name="FriendInvite" />
        <Drawer.Screen component={Friends} name="Friends" />
        <Drawer.Screen component={Home} name="Home" />
        <Drawer.Screen component={Internet} name="Internet" />
        <Drawer.Screen component={Login} name="Login" />
        <Drawer.Screen component={PrivacyPolicy} name="PrivacyPolicy" />
        <Drawer.Screen component={PurchaseGiftCard} name="PurchaseGiftCard" />
        <Drawer.Screen component={Purchases} name="Purchases" />
        <Drawer.Screen component={RefundPolicy} name="RefundPolicy" />
        <Drawer.Screen component={Rewards} name="Rewards" />
        <Drawer.Screen component={Signup} name="Signup" />
        <Drawer.Screen component={Splash} name="Splash" />
        <Drawer.Screen component={StudioPricing} name="StudioPricing" />
        <Drawer.Screen component={Terms} name="Terms" />
        <Drawer.Screen component={UpdateApp} name="UpdateApp" />
        <Drawer.Screen component={UserWorkoutCalendar} name="UserWorkoutCalendar" />
        <Drawer.Screen component={WorkshopStack} name="Workshops" />
      </Drawer.Navigator>
    </NavigationContainer>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const width = Math.round(themeStyle.window.width * 0.8)
  return { drawer: { width } }
}

type RouteState =
  | Readonly<{
      key: string
      index: number
      routeNames: string[]
      history?: unknown[] | undefined
      routes: any[]
      type: string
      stale: false
    }>
  | undefined
type AppointmentStackParamList = {
  AppointmentDetails: undefined
  AppointmentDetailsMultiple: undefined
  AppointmentFilters: { customWorkflow: string | undefined } | undefined
  AppointmentSchedule: { customWorkflow: string | undefined } | undefined
  AppointmentSearch: undefined
}
type BadgeStackParamList = {
  BadgeList: undefined
  BadgeDetail: { badge: Badge }
}
type ScheduleStackParamList = {
  ClassBooking: undefined
  ClassBookingMultiple: { PackageID: number } | undefined
  ClassBookingSpot: undefined
  ClassScheduleBase: { date: string } | undefined
  ClassFilters: { workshops: boolean } | undefined
}
type WorkshopStackParamList = {
  ClassBooking: undefined
  ClassBookingMultiple: { PackageID: number } | undefined
  WorkshopsBase:
    | { customFilters?: Partial<CurrentFilterState>; date?: string; hideFilters?: boolean }
    | undefined
  WorkshopsBookingSpot: undefined
  WorkshopsFilters: { workshops: boolean } | undefined
}
type RootNavigatorParamList = {
  Account: undefined
  Appointments: undefined
  Auth: undefined
  Badges: undefined | NavigatorScreenParams<BadgeStackParamList>
  ClassBookingSpotEdit: undefined
  ClassFilters: { workshops: boolean } | undefined
  ClassList: undefined
  ClassSchedule:
    | { params: { date: string }; screen: string }
    | undefined
    | NavigatorScreenParams<ScheduleStackParamList>
  CoachSchedule: { ClientID: string; CoachID: string }
  Faq: undefined
  FriendInvite: undefined
  Friends: undefined
  Home: undefined
  Internet: undefined
  Login: undefined
  PrivacyPolicy: undefined
  PurchaseGiftCard: undefined
  Purchases: undefined
  RefundPolicy: undefined
  Rewards: undefined
  Signup: undefined
  Splash: undefined
  StudioPricing: undefined
  Terms: undefined
  UpdateApp: undefined
  UserWorkoutCalendar: undefined
  Workshops:
    | {
        params: {
          customFilters?: Partial<CurrentFilterState>
          date?: string
          hideFilters?: boolean
        }
        screen: string
      }
    | undefined
    | NavigatorScreenParams<WorkshopStackParamList>
}
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootNavigatorParamList {}
  }
  type AppointmentStackScreenProps<T extends keyof AppointmentStackParamList> =
    CompositeScreenProps<
      StackScreenProps<AppointmentStackParamList, T>,
      RootNavigatorScreenProps<keyof RootNavigatorParamList>
    >
  type BadgeStackScreenProps<T extends keyof BadgeStackParamList> = CompositeScreenProps<
    StackScreenProps<BadgeStackParamList, T>,
    RootNavigatorScreenProps<keyof RootNavigatorParamList>
  >
  type ScheduleStackScreenProps<T extends keyof ScheduleStackParamList> = CompositeScreenProps<
    StackScreenProps<ScheduleStackParamList, T>,
    RootNavigatorScreenProps<keyof RootNavigatorParamList>
  >
  type WorkshopStackScreenProps<T extends keyof WorkshopStackParamList> = CompositeScreenProps<
    StackScreenProps<WorkshopStackParamList, T>,
    RootNavigatorScreenProps<keyof RootNavigatorParamList>
  >
  type Navigate = RootNavigatorScreenProps<'Home'>['navigation']['navigate']
  type RootNavigation = DrawerContentComponentProps['navigation']
  type RootNavigatorScreenProps<T extends keyof RootNavigatorParamList> = DrawerScreenProps<
    RootNavigatorParamList,
    T
  >
  type ScreenNames = keyof RootNavigatorParamList
}
