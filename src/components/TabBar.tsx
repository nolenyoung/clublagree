import { useNavigation, useRoute } from '@react-navigation/native'
import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { SvgCss } from 'react-native-svg/css'
import media from '../assets/media'
import Icon from './Icon'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'
import { logEvent } from '../global/Functions'
import { setAction } from '../redux/actions'

export default function TabBar(): React.ReactElement | null {
  const { navigate, popToTop } = useNavigation<any>()
  const { name } = useRoute()
  const clientId = useSelector((state: ReduxState) => state.user.clientId)
  const supportsAppointments = useSelector((state: ReduxState) => state.user.supportsAppointments)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  if (clientId == null) {
    return null
  }
  const apptSelected = name.includes('Appointment')
  const bookSelected =
    name.includes('Booking') || name.includes('Schedule') || name.includes('Workshops')
  const homeSelected = name.includes('Home')
  const buySelected = name.includes('StudioPricing')
  const classesSelected = name.includes('ClassList')
  const friendsSelected = name.includes(
    Brand.UI_BADGES
      ? 'Badge'
      : Brand.UI_FRIENDS
        ? 'Friends'
        : Brand.UI_TAB_VOD
          ? 'VOD'
          : Brand.UI_REWARDS
            ? 'Rewards'
            : 'Account',
  )
  const lastButtonText = Brand.UI_BADGES
    ? 'Badges'
    : Brand.UI_FRIENDS
      ? 'Friends'
      : Brand.UI_TAB_VOD
        ? Brand.STRING_VOD_TAB_TITLE
        : Brand.UI_REWARDS
          ? 'Rewards'
          : 'Account'
  return (
    <View style={styles.content}>
      <Pressable
        onPress={async () => {
          await logEvent('footer_nav_home')
          navigate('Home')
        }}
        style={themeStyle.flexView}>
        <View style={themeStyle.viewCentered}>
          <SvgCss
            color={
              homeSelected
                ? themeStyle[Brand.COLOR_TAB_BAR_ICON_SELECTED as ColorKeys]
                : themeStyle[Brand.COLOR_TAB_BAR_TEXT as ColorKeys]
            }
            opacity={homeSelected ? 1 : 0.5}
            style={styles.icon}
            xml={media.iconHome}
          />
          <Text allowFontScaling={false} style={[styles.text, homeSelected && styles.selectedTab]}>
            Home
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={async () => {
          await logEvent(`footer_nav_buy`)
          navigate('StudioPricing')
        }}
        style={themeStyle.flexView}>
        <View style={themeStyle.viewCentered}>
          <SvgCss
            color={
              buySelected
                ? themeStyle[Brand.COLOR_TAB_BAR_ICON_SELECTED as ColorKeys]
                : themeStyle[Brand.COLOR_TAB_BAR_TEXT as ColorKeys]
            }
            opacity={buySelected ? 1 : 0.5}
            style={styles.icon}
            xml={media.iconShoppingCart}
          />
          <Text allowFontScaling={false} style={[styles.text, buySelected && styles.selectedTab]}>
            Buy
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={async () => {
          await logEvent(`footer_nav_${Brand.STRING_TAB_BAR_BOOK.toLowerCase()}`)
          Brand.UI_TAB_BOOK_APPT && supportsAppointments
            ? apptSelected
              ? popToTop()
              : navigate('Appointments')
            : bookSelected
              ? popToTop()
              : navigate(Brand.UI_SCHEDULE_SCREEN as ScheduleScreenNames)
        }}
        style={styles.centerButton}>
        <View style={themeStyle.viewCentered}>
          <Icon name="plus" style={styles.iconPlus} />
          <Text allowFontScaling={false} style={styles.centerButtonText}>
            {Brand.STRING_TAB_BAR_BOOK}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={async () => {
          await logEvent(`footer_nav_${Brand.STRING_TAB_BAR_CLASSES.toLowerCase()}`)
          navigate('ClassList')
        }}
        style={themeStyle.flexView}>
        <View style={themeStyle.viewCentered}>
          <SvgCss
            color={
              classesSelected
                ? themeStyle[Brand.COLOR_TAB_BAR_ICON_SELECTED as ColorKeys]
                : themeStyle[Brand.COLOR_TAB_BAR_TEXT as ColorKeys]
            }
            opacity={classesSelected ? 1 : 0.5}
            style={styles.icon}
            xml={media.iconCalendar}
          />
          <Text
            allowFontScaling={false}
            style={[styles.text, classesSelected && styles.selectedTab]}>
            {Brand.STRING_TAB_BAR_CLASSES}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={async () => {
          await logEvent(`footer_nav_${lastButtonText.toLowerCase().replace(/\s/g, '')}`)
          if (Brand.UI_TAB_VOD) {
            setAction('modals', {
              webView: { title: Brand.STRING_VOD_MODAL_TITLE, uri: Brand.LINKS.vod },
            })
          } else {
            navigate(
              Brand.UI_BADGES
                ? 'Badges'
                : Brand.UI_FRIENDS
                  ? 'Friends'
                  : Brand.UI_REWARDS
                    ? 'Rewards'
                    : 'Account',
            )
          }
        }}
        style={themeStyle.flexView}>
        <View style={themeStyle.viewCentered}>
          <SvgCss
            color={
              friendsSelected
                ? themeStyle[Brand.COLOR_TAB_BAR_ICON_SELECTED as ColorKeys]
                : themeStyle[Brand.COLOR_TAB_BAR_TEXT as ColorKeys]
            }
            opacity={friendsSelected ? 1 : 0.5}
            style={styles.icon}
            xml={
              Brand.UI_BADGES
                ? media.iconTrophy
                : Brand.UI_FRIENDS
                  ? media.iconFriends
                  : Brand.UI_TAB_VOD
                    ? media.iconPlay
                    : Brand.UI_REWARDS
                      ? media.iconRewards
                      : media.iconAccount
            }
          />
          <Text
            allowFontScaling={false}
            style={[styles.text, friendsSelected && styles.selectedTab]}>
            {lastButtonText}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const centerButtonSize = Math.min(themeStyle.window.width / 5, themeStyle.scale(70))
  const centerButtonText = {
    fontFamily: themeStyle.fontPrimaryRegular,
    fontSize: themeStyle.scale(10),
    letterSpacing: 0,
    textAlign: 'center' as 'center',
    textTransform: 'uppercase' as const,
  }
  return {
    content: {
      ...themeStyle.rowAligned,
      backgroundColor: themeStyle[Brand.COLOR_TAB_BAR as ColorKeys],
      paddingBottom: themeStyle.scale(20),
      paddingTop: themeStyle.scale(12),
    },
    centerButton: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle[Brand.COLOR_TAB_BAR_BOOK_BACKGROUND as ColorKeys],
      borderRadius: centerButtonSize / 2,
      height: centerButtonSize,
      width: centerButtonSize,
    },
    centerButtonText: {
      ...centerButtonText,
      color: themeStyle[Brand.COLOR_TAB_BAR_BOOK_TEXT as ColorKeys],
      marginTop: themeStyle.scale(8),
    },
    icon: { height: themeStyle.scale(19), marginBottom: themeStyle.scale(8) },
    iconPlus: {
      color: themeStyle[Brand.COLOR_TAB_BAR_BOOK_ICON as ColorKeys],
      fontSize: themeStyle.scale(18),
    },
    text: { ...centerButtonText, color: themeStyle[Brand.COLOR_TAB_BAR_TEXT as ColorKeys] },
    selectedTab: { fontFamily: themeStyle.fontPrimaryBold },
  }
}
