import * as React from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSelector } from 'react-redux'
import {
  Button,
  ButtonText,
  CachedImage,
  Carousel,
  ClassUpcomingList,
  HomeStudioInfo,
  HomeStudioInfoAlt,
  Icon,
  ModalClientIdentification,
  ModalFamilySelector,
  ModalLiabilityWaiver,
  ModalMembershipAgreement,
  ModalVisitRating,
  RequestSong,
  TabBar,
  TagPointsRemaining,
} from '../components'
import Brand from '../global/Brand'
import { formatName, logEvent, onHandleAppLink } from '../global/Functions'
import {
  useClientIdentifcation,
  useGetHomeData,
  useRefreshOnForeground,
  useTheme,
} from '../global/Hooks'
import { setAction } from '../redux/actions'

export default function Home(props: RootNavigatorScreenProps<'Home'>) {
  const { navigate, toggleDrawer } = props.navigation
  const { enrolled: rewardsEnrolled, pointBalance } = useSelector(
    (state: ReduxState) => state.rewards,
  )
  const { altPersonID, modalID, onToggleModalID } = useClientIdentifcation()
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [modalSwitchAccount, setModalSwitchAccount] = React.useState(false)
  const onCloseSwitchModal = React.useCallback(() => {
    setModalSwitchAccount(false)
  }, [])
  const onMenuPress = React.useCallback(() => {
    toggleDrawer()
  }, [])
  const onPressBanner = React.useCallback(async ({ Link }: { Link: string }) => {
    onHandleAppLink({ navigate, url: Link })
  }, [])
  const {
    banners,
    classes,
    clientId,
    countData,
    family,
    firstName,
    hasFamilyOptions,
    homeLocation,
    lastName,
    liabilityReleased,
    loadingCounts,
    membershipInfo,
    onRefresh,
    personId,
    ratingInfo,
    setClasses,
    setRatingInfo,
  } = useGetHomeData(navigate)
  useRefreshOnForeground(onRefresh)
  return (
    <View style={themeStyle.flexView}>
      <View
        style={[
          styles.headerView,
          banners.length > 0
            ? themeStyle.homeScreen.headerViewBanners
            : themeStyle.homeScreen.headerView,
        ]}>
        {Brand.IMAGES_HOME_HEADER_BACKGROUND != null && (
          <Image source={Brand.IMAGES_HOME_HEADER_BACKGROUND} style={styles.headerBackground} />
        )}
        <Pressable hitSlop={themeStyle.hitSlop} onPress={onMenuPress} style={styles.menuButton}>
          <Icon name="menu" style={themeStyle.headerIcon} />
        </Pressable>
        {Brand.IMAGES_LOGO_HOME != null && (
          <Image source={Brand.IMAGES_LOGO_HOME} style={themeStyle.homeScreen.logo} />
        )}
        {Brand.UI_HOME_REWARDS_BALANCE && rewardsEnrolled && (
          <TagPointsRemaining
            backgroundColor={themeStyle[Brand.COLOR_HOME_REWARDS_BALANCE as ColorKeys]}
            onPress={() => navigate('Rewards')}
            points={pointBalance}
            textColor={themeStyle[Brand.COLOR_HOME_REWARDS_BALANCE_TEXT as ColorKeys]}
          />
        )}
        {Brand.UI_CLIENT_ID_HOME && (
          <Pressable hitSlop={themeStyle.hitSlop} onPress={onToggleModalID} style={styles.idButton}>
            <Icon name="id-card-filled" style={themeStyle.headerIcon} />
          </Pressable>
        )}
        {!Brand.UI_HOME_HIDE_WELCOME && (
          <Text allowFontScaling={false} style={themeStyle.homeScreen.welcomeText}>
            {`${Brand.STRING_HOME_WELCOME},${Brand.UI_HOME_WELCOME_CHAR}${firstName}`}
          </Text>
        )}
        {Brand.UI_HOME_FAMILY_SWITCHING && (
          <Pressable
            disabled={!hasFamilyOptions}
            hitSlop={themeStyle.hitSlop}
            onPress={() => setModalSwitchAccount(true)}
            style={themeStyle.homeScreen.accountButton}>
            <Icon name="instructor-filled" style={themeStyle.homeScreen.accountIconProfile} />
            <Text style={themeStyle.homeScreen.accountText}>{formatName(firstName, lastName)}</Text>
            {hasFamilyOptions && (
              <Icon name="chevron-down" style={themeStyle.homeScreen.accountIconArrow} />
            )}
          </Pressable>
        )}
      </View>
      {!Brand.UI_HOME_HIDE_FLOATING_CARDS && (
        <View style={styles.floatingCardRow}>
          <View style={styles.floatingCard}>
            {loadingCounts ? (
              <ActivityIndicator color={themeStyle.brandPrimary} size="small" />
            ) : (
              <Text style={themeStyle.homeScreen.floatingCardValue}>{countData.totalClasses}</Text>
            )}
            <Text style={styles.floatingCardLabel}>{Brand.STRING_CLASS_TITLE_PLURAL}</Text>
          </View>
          <View style={styles.floatingCard}>
            {loadingCounts ? (
              <ActivityIndicator color={themeStyle.brandPrimary} size="small" />
            ) : (
              <Text style={themeStyle.homeScreen.floatingCardValue}>
                {Brand.STRING_HOME_FLOATING_CARD_REWARDS != null
                  ? pointBalance
                  : Brand.UI_HOME_WEEK_STREAK
                    ? countData.weekStreak
                    : countData.totalLast30Days}
              </Text>
            )}
            <Text style={styles.floatingCardLabel}>
              {Brand.STRING_HOME_FLOATING_CARD_REWARDS
                ? Brand.STRING_HOME_FLOATING_CARD_REWARDS
                : Brand.UI_HOME_WEEK_STREAK
                  ? 'Week Streak'
                  : 'Last 30 Days'}
            </Text>
          </View>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={false} />}
        showsVerticalScrollIndicator={false}>
        {banners.length > 0 ? (
          <Carousel
            data={banners}
            height={themeStyle.scale(130)}
            itemWidth={themeStyle.window.width - themeStyle.scale(40)}
            keyExtractor={(item) => `${item.Title}${item.URL}`}
            renderItem={({ item, marginHorizontal, width }) => {
              return (
                <Pressable
                  disabled={!item.Link || item.Link == null}
                  onPress={() => onPressBanner(item as { Link: string })}>
                  <CachedImage
                    containerStyle={{
                      borderColor: themeStyle.white,
                      borderWidth: themeStyle.scale(2),
                      marginHorizontal,
                    }}
                    height={themeStyle.scale(130)}
                    source={item.URL}
                    width={width}
                  />
                </Pressable>
              )
            }}
          />
        ) : null}
        {Brand.UI_HOME_STUDIO_CONTACT &&
          homeLocation != null &&
          (Brand.UI_HOME_STUDIO_CONTACT_VERSION === 2 ? (
            <HomeStudioInfoAlt data={homeLocation} />
          ) : (
            <HomeStudioInfo data={homeLocation} />
          ))}
        {Brand.UI_HOME_REQUEST_SONG && <RequestSong />}
        {classes.length > 0 ? (
          <>
            <View style={styles.upcomingTitleRow}>
              <Text style={themeStyle.sectionTitleText}>
                {`Upcoming ${Brand.STRING_CLASS_TITLE_PLURAL}`}
              </Text>
              <ButtonText
                color={themeStyle.buttonTextOnMain}
                onPress={() => navigate('ClassList')}
                text="view all"
              />
            </View>
            <View style={themeStyle.separator} />
            <ClassUpcomingList
              classes={classes}
              family={family}
              hideFilters={true}
              onFetch={onRefresh}
              scrollEnabled={false}
              setClasses={setClasses}
            />
          </>
        ) : (
          <>
            <Text style={styles.upcomingSectionTitle}>
              {`Upcoming ${Brand.STRING_CLASS_TITLE_PLURAL}`}
            </Text>
            <View style={themeStyle.separator} />
            <Text style={styles.noBookingsText}>{Brand.STRING_NO_UPCOMING_CLASSES_HOME}</Text>
            <Button
              gradient={Brand.BUTTON_GRADIENT}
              onPress={async () => {
                await logEvent(
                  `home_book_${Brand.UI_HOME_BOOK_APPT ? 'appointment' : Brand.STRING_CLASS_TITLE_LC}`,
                )
                navigate(
                  Brand.UI_HOME_BOOK_APPT
                    ? 'Appointments'
                    : (Brand.UI_SCHEDULE_SCREEN as ScheduleScreenNames),
                )
              }}
              style={styles.bookClassButton}
              text={Brand.STRING_HOME_BUTTON_BOOK}
            />
          </>
        )}
      </ScrollView>
      <TabBar />
      <ModalClientIdentification id={altPersonID} onClose={onToggleModalID} visible={modalID} />
      {modalSwitchAccount && (
        <ModalFamilySelector
          ClientID={clientId}
          navigate={navigate}
          onClose={onCloseSwitchModal}
          onContinueMyself={onCloseSwitchModal}
          onSelect={(member) => {
            const { ClientID, FirstName, LastName, PersonID, profileKey } = member
            setAction('user', {
              clientId: ClientID,
              firstName: FirstName,
              lastName: LastName,
              personId: PersonID,
              profileKey,
            })
          }}
          PersonID={personId}
          selectedMember={{
            ClientID: clientId ?? 0,
            FirstName: firstName,
            LastName: lastName,
            PersonID: personId ?? '',
          }}
        />
      )}
      {liabilityReleased && membershipInfo == null && ratingInfo != null && (
        <ModalVisitRating
          onClose={() => setRatingInfo(null)}
          ratingInfo={ratingInfo}
          visible={ratingInfo != null}
        />
      )}
      {liabilityReleased && membershipInfo != null && (
        <ModalMembershipAgreement {...membershipInfo} />
      )}
      {!liabilityReleased && <ModalLiabilityWaiver />}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const headerHeight = themeStyle.scale(Brand.UI_HOME_HEADER_HEIGHT)
  const floatingCardHeight = themeStyle.scale(80)
  const floatingCardOverhang = Brand.UI_HOME_HIDE_FLOATING_CARDS ? 0 : floatingCardHeight / 2
  const iconButtons = {
    position: 'absolute' as 'absolute',
    top: themeStyle.hasNotch ? themeStyle.scale(55) : themeStyle.scale(45),
  } as const
  return {
    headerView: {
      alignItems: 'center' as 'center',
      backgroundColor: themeStyle.colorHeader,
      height: headerHeight - (Brand.UI_HOME_HIDE_FLOATING_CARDS ? floatingCardHeight / 2 : 0),
      justifyContent: 'flex-end' as const,
      marginBottom:
        floatingCardOverhang + (Brand.UI_HOME_HIDE_FLOATING_CARDS ? 0 : themeStyle.scale(14)),
    },
    headerBackground: {
      ...themeStyle.backgroundImage,
      position: 'absolute' as 'absolute',
    },
    menuButton: { ...iconButtons, left: themeStyle.scale(30) },
    idButton: { ...iconButtons, right: themeStyle.scale(30) },
    floatingCardRow: {
      ...themeStyle.rowAlignedBetween,
      top: headerHeight - floatingCardHeight / 2,
      elevation: 2,
      paddingBottom: themeStyle.scale(2),
      paddingHorizontal: themeStyle.scale(30),
      position: 'absolute' as 'absolute',
      width: '100%' as const,
      zIndex: 2,
    },
    floatingCard: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle[Brand.COLOR_HOME_FLOATING_CARD_BACKGROUND as ColorKeys],
      borderRadius: themeStyle.scale(5),
      elevation: 2,
      height: floatingCardHeight,
      shadowColor: themeStyle.black,
      shadowOffset: { height: themeStyle.scale(2), width: 0 },
      shadowOpacity: 0.16,
      shadowRadius: themeStyle.scale(4),
      width: (themeStyle.window.width - themeStyle.scale(80)) / 2,
    },
    floatingCardLabel: themeStyle.textPrimaryRegular14,
    scrollContent: { flexGrow: 1, paddingBottom: themeStyle.scale(20) },
    upcomingTitleRow: {
      ...themeStyle.rowAlignedBetween,
      marginBottom: themeStyle.scale(16),
      marginHorizontal: themeStyle.scale(20),
      marginTop: themeStyle.scale(28),
    },
    upcomingSectionTitle: {
      ...themeStyle.sectionTitleText,
      marginBottom: themeStyle.scale(16),
      marginTop: themeStyle.scale(28),
      textAlign: 'center' as 'center',
    },
    noBookingsText: {
      ...themeStyle.textPrimaryRegular16,
      marginBottom: themeStyle.scale(20),
      marginTop: themeStyle.scale(35),
      textAlign: 'center' as 'center',
    },
    bookClassButton: {
      alignSelf: 'center' as 'center',
      width: themeStyle.window.width - themeStyle.scale(40),
    },
  }
}
