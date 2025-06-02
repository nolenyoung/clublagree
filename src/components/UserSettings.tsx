import * as React from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { getVersion } from 'react-native-device-info'
import { openSettings } from 'react-native-permissions'
import { useSelector } from 'react-redux'
import Button from './Button'
import InputButton from './InputButton'
import Switch from './Switch'
import Brand from '../global/Brand'
import { addToCalendar, logEvent } from '../global/Functions'
import { useSettings, useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = { clientId: number; personId: string }

export default function UserSettings(props: Props): React.ReactElement {
  const { clientId, personId } = props
  const {
    calendarList,
    loadingCalendars,
    permissionCalendars,
    permissionNotifications,
    requestCalendarPermission,
    requestPushNotificationPermission,
  } = useSettings()
  const deviceCalendars = useSelector((state: ReduxState) => state.deviceCalendars)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { autoAdd, calendarId } = deviceCalendars
  const defaultCalendar = calendarId !== '' ? calendarList.find((c) => c.id === calendarId) : null
  const calendarTitle =
    defaultCalendar != null ? `${defaultCalendar.source} - ${defaultCalendar.title}` : ''
  return (
    <View style={themeStyle.content}>
      <ScrollView bounces={false} contentContainerStyle={themeStyle.scrollContentTabScreen}>
        <Text style={themeStyle.sectionTitleText}>Calendar</Text>
        {loadingCalendars ? (
          <ActivityIndicator
            color={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            size="large"
            style={styles.sectionLoadingIndicator}
          />
        ) : !permissionCalendars ? (
          <>
            {/* <Text style={styles.sectionDescriptionText}>{`Permission has not been granted.`}</Text> */}
            <Button
              onPress={
                permissionCalendars == undefined
                  ? async () => {
                      requestCalendarPermission()
                      await logEvent('account_settings_calendar_permission')
                    }
                  : async () => {
                      await logEvent('account_settings_calendar_settings')
                      await openSettings().catch(() =>
                        setAction('toast', { text: 'Unable to open phone settings' }),
                      )
                    }
              }
              small={true}
              style={styles.requestPermissionButton}
              text={permissionCalendars == undefined ? 'Grant Access' : 'Open Settings'}
            />
          </>
        ) : (
          <>
            <View style={styles.item}>
              <View style={styles.itemDetailView}>
                <Text style={styles.itemDetailTitle}>Auto Add to Calendar</Text>
                <Text style={themeStyle.textPrimaryRegular14}>
                  {`With this setting enabled, new bookings will be automatically added to your default calendar`}
                </Text>
              </View>
              <Switch
                onPress={async () => {
                  setAction('deviceCalendars', {
                    ...(autoAdd ? { calendarId: '' } : {}),
                    autoAdd: !(autoAdd ?? false),
                  })
                  await logEvent('account_settings_calendar_toggle')
                }}
                selected={autoAdd ?? false}
              />
            </View>
            {autoAdd && (
              <View style={styles.inputItem}>
                <Text style={styles.itemDetailTitle}>Default Calendar</Text>
                <InputButton
                  borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
                  buttonStyle={[styles.inputButton, { marginBottom: 0 }]}
                  onPress={async () => {
                    addToCalendar([], true)
                    await logEvent('account_settings_calendar_list')
                  }}
                  textColor={themeStyle.textBlack}
                  value={calendarId === '' ? 'Select' : calendarTitle}
                />
              </View>
            )}
          </>
        )}
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        {permissionNotifications && (
          <Text style={styles.sectionDescriptionText}>{`Permission granted.`}</Text>
        )}
        {!permissionNotifications && (
          <Button
            onPress={
              permissionNotifications == undefined
                ? async () => {
                    requestPushNotificationPermission()
                    await logEvent('account_settings_notification_permission')
                  }
                : async () => {
                    await openSettings()
                    await logEvent('account_settings_notification_settings')
                  }
            }
            small={true}
            style={styles.requestPermissionButton}
            text={permissionNotifications == undefined ? 'Grant Access' : 'Open Settings'}
          />
        )}
      </ScrollView>
      <Text style={styles.versionText}>
        {`v${getVersion()} (${clientId ?? 0}-${personId ?? 0})`}
      </Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    sectionTitle: { ...themeStyle.sectionTitleText, marginTop: themeStyle.scale(24) },
    sectionLoadingIndicator: { alignSelf: 'center' as const, marginTop: themeStyle.scale(24) },
    sectionDescriptionText: { ...themeStyle.textPrimaryRegular14, marginTop: themeStyle.scale(8) },
    requestPermissionButton: { marginTop: themeStyle.scale(24) },
    inputItem: { marginTop: themeStyle.scale(24) },
    inputButton: {
      ...themeStyle.viewCentered,
      borderRadius: themeStyle.scale(4),
      borderWidth: themeStyle.scale(1),
      minHeight: themeStyle.scale(40),
    },
    item: { ...themeStyle.rowAlignedBetween, marginTop: themeStyle.scale(24) },
    itemDetailView: { flex: 1, marginRight: themeStyle.scale(16) },
    itemDetailTitle: { ...themeStyle.textPrimaryBold14, marginBottom: themeStyle.scale(4) },
    versionText: {
      color: themeStyle.lightGray,
      fontSize: themeStyle.scale(10),
      marginVertical: themeStyle.scale(16),
      textAlign: 'center' as 'center',
    },
  }
}
