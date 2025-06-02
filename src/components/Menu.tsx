import { DrawerContentComponentProps, useDrawerStatus } from '@react-navigation/drawer'
import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button from './Button'
import GlobalHandler from './GlobalHandler'
import Icon from './Icon'
import Brand from '../global/Brand'
import { logEvent, logout } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

export default function Menu(props: DrawerContentComponentProps): React.ReactNode {
  const isDrawerOpen = useDrawerStatus() === 'open'
  const rewardsEnrolled = useSelector((state: ReduxState) => state.rewards.enrolled)
  const user = useSelector((state: ReduxState) => state.user)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { navigation } = props
  const { clientId, firstName, lastName, supportsAppointments } = user
  const loggedIn = clientId != null
  const onHelp = React.useCallback(() => {
    navigation.toggleDrawer()
    setAction('modals', { contactUs: true })
  }, [])
  const onLogout = React.useCallback(() => {
    logout(navigation.navigate)
  }, [])
  React.useEffect(() => {
    if (isDrawerOpen) {
      logEvent('menu_open')
    }
  }, [isDrawerOpen])
  return (
    <View style={styles.menu}>
      <TouchableOpacity
        hitSlop={themeStyle.hitSlop}
        onPress={() => navigation.toggleDrawer()}
        style={styles.closeButton}>
        <Icon name="clear" style={styles.closeIcon} />
      </TouchableOpacity>
      <View style={styles.content}>
        {loggedIn ? (
          <React.Fragment>
            <Text allowFontScaling={false} style={styles.nameText}>
              {`${firstName}\n${lastName}`}
            </Text>
            <Button
              allowFontScaling={false}
              onPress={() => navigation.navigate('Account')}
              small={true}
              style={styles.editButton}
              text="account"
              textColor="textWhite"
            />
            <View style={styles.separator} />
          </React.Fragment>
        ) : (
          <View>
            <Text allowFontScaling={false} style={styles.welcomeText}>
              Welcome!
            </Text>
            <View style={styles.loggedOutButtonRow}>
              <Button
                allowFontScaling={false}
                onPress={() => navigation.navigate('Login')}
                style={styles.logInButton}
                text="Log In"
                textColor="textWhite"
              />
              <Button
                allowFontScaling={false}
                onPress={() => navigation.navigate('Signup')}
                style={styles.signUpButton}
                text="Sign Up"
              />
            </View>
          </View>
        )}
        {supportsAppointments && (
          <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
            <Text allowFontScaling={false} style={styles.primaryLinkText}>
              Appointments
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => navigation.navigate(Brand.UI_SCHEDULE_SCREEN)}>
          <Text allowFontScaling={false} style={styles.primaryLinkText}>
            Schedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Workshops')}>
          <Text
            allowFontScaling={false}
            style={[styles.primaryLinkText, !loggedIn && { marginBottom: 0 }]}>
            Workshops
          </Text>
        </TouchableOpacity>
        {/* {loggedIn && (
          <TouchableOpacity onPress={() => navigation.navigate('Badges')}>
            <Text allowFontScaling={false} style={styles.primaryLinkText}>
              Badges
            </Text>
          </TouchableOpacity>
        )} */}
        {loggedIn && (
          <TouchableOpacity onPress={() => navigation.navigate('ClassList')}>
            <Text
              allowFontScaling={false}
              style={[styles.primaryLinkText, !rewardsEnrolled && { marginBottom: 0 }]}>
              Bookings
            </Text>
          </TouchableOpacity>
        )}
        {loggedIn && rewardsEnrolled && (
          <TouchableOpacity onPress={() => navigation.navigate('Rewards')}>
            <Text allowFontScaling={false} style={[styles.primaryLinkText, { marginBottom: 0 }]}>
              Rewards
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.separator} />
        <TouchableOpacity onPress={() => navigation.navigate('StudioPricing')}>
          <Text allowFontScaling={false} style={styles.secondaryLinkText}>
            Pricing
          </Text>
        </TouchableOpacity>
        {loggedIn && (
          <TouchableOpacity onPress={() => navigation.navigate('Purchases')}>
            <Text allowFontScaling={false} style={styles.secondaryLinkText}>
              Purchases
            </Text>
          </TouchableOpacity>
        )}
        {/* <TouchableOpacity onPress={() => navigation.navigate('FriendInvite')}>
          <Text allowFontScaling={false} style={styles.secondaryLinkText}>
            Share a Trial
          </Text>
        </TouchableOpacity> */}
        {/* {loggedIn && (
          <TouchableOpacity onPress={() => navigation.navigate('PurchaseGiftCard')}>
            <Text allowFontScaling={false} style={styles.secondaryLinkText}>
              Purchase a Gift Card
            </Text>
          </TouchableOpacity>
        )} */}
        <View style={styles.bottomButtons}>
          <View style={styles.bottomButtonsRow}>
            {loggedIn && (
              <TouchableOpacity onPress={onHelp}>
                <Text allowFontScaling={false} style={styles.secondaryLinkText}>
                  Need help?
                </Text>
              </TouchableOpacity>
            )}
            {loggedIn && (
              <TouchableOpacity onPress={onLogout}>
                <Text allowFontScaling={false} style={styles.secondaryLinkText}>
                  Log Out
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <GlobalHandler navigation={navigation} user={user} />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const nameText = {
    color: themeStyle.textWhite,
    fontFamily: themeStyle[themeStyle.fontScreenTitle],
    fontSize: themeStyle.scale(35),
    letterSpacing: themeStyle.scale(0.5),
    textTransform: Brand.TRANSFORM_HEADER_TEXT as TextTransform,
  } as const
  return {
    menu: { flex: 1, backgroundColor: themeStyle.brandSecondary },
    closeButton: {
      alignSelf: 'flex-end' as 'flex-end',
      marginBottom: themeStyle.scale(16),
      marginRight: themeStyle.scale(36),
      marginTop: themeStyle.hasNotch ? themeStyle.scale(54) : themeStyle.scale(44),
    },
    closeIcon: { color: themeStyle.textWhite, fontSize: themeStyle.scale(20) },
    content: { flex: 1, paddingHorizontal: themeStyle.scale(35) },
    nameText,
    editButton: {
      backgroundColor: 'transparent',
      borderColor: themeStyle.colorWhite,
      borderWidth: themeStyle.scale(1),
      marginBottom: themeStyle.scale(5),
      marginTop: themeStyle.scale(16),
      width: '75%' as const,
    },
    welcomeText: { ...nameText, marginBottom: themeStyle.scale(30) },
    memberText: {
      color: themeStyle.textWhite,
      fontFamily: themeStyle.fontPrimaryRegular,
      fontSize: themeStyle.scale(14),
      letterSpacing: themeStyle.scale(0.5),
      textTransform: Brand.TRANSFORM_HEADER_TEXT,
    },
    loggedOutButtonRow: { ...themeStyle.rowAlignedBetween, marginBottom: themeStyle.scale(62) },
    logInButton: {
      backgroundColor: 'transparent',
      borderColor: themeStyle.white,
      borderWidth: themeStyle.scale(1),
      width: '48%' as const,
    },
    signUpButton: { marginLeft: themeStyle.scale(20), width: '48%' as const },
    separator: {
      height: themeStyle.scale(1),
      backgroundColor: themeStyle.gray,
      marginVertical: themeStyle.scale(24),
    },
    primaryLinkText: {
      ...themeStyle.getTextStyle({ color: 'textWhite', font: 'fontPrimaryRegular', size: 22 }),
      marginBottom: themeStyle.scale(20),
    },
    secondaryLinkText: {
      ...themeStyle.getTextStyle({ color: 'textWhite', font: 'fontPrimaryRegular', size: 16 }),
      marginBottom: themeStyle.scale(16),
    },
    bottomButtons: { flex: 1, justifyContent: 'flex-end' as 'flex-end' },
    bottomButtonsRow: {
      ...themeStyle.rowAlignedBetween,
      marginBottom: themeStyle.scale(24),
    },
  }
}
