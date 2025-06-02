import { useNavigation } from '@react-navigation/native'
import moment from 'moment'
import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import Avatar from './Avatar'
import Button from './Button'
import Icon from './Icon'
import ModalCoachBio from './ModalCoachBio'
import Brand from '../global/Brand'
import {
  formatCoachName,
  getAppointmentPrebookInfo,
  logEvent,
  sortAppointmentTimeSlots,
} from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'
import Checkbox from './Checkbox'

type Props = {
  allowFamilyBooking: boolean
  item: AppointmentTimeSlot
  multiple: boolean
  selectedFamilyMember: AppointmentBookingState['selectedFamilyMember']
  timeSlots: AppointmentTimeSlot[]
}

export default function AppointmentScheduleItem(props: Props): React.ReactElement {
  const { allowFamilyBooking, item, multiple, selectedFamilyMember, timeSlots } = props
  const { AppointmentID, Coach, EndDateTime, Location, StartDateTime } = item
  const { navigate } =
    useNavigation<AppointmentStackScreenProps<'AppointmentSchedule'>['navigation']>()
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [modalCoachBio, setModalCoachBio] = React.useState(false)
  const coachBioExists = Coach?.Biography != null && Coach.Biography.trim() !== ''
  const selected = timeSlots.some(
    (ts) => ts.AppointmentID === AppointmentID && ts.StartDateTime === StartDateTime,
  )
  const showCancel = false
  const userOnWaitlist = false
  const bookButtonText = showCancel
    ? userOnWaitlist
      ? Brand.STRING_BUTTON_CANCEL_WAITLIST
      : 'Cancel'
    : `Book`
  const onPress = async () => {
    if (multiple) {
      setAction('appointmentBooking', {
        timeSlots: selected
          ? timeSlots.filter(
              (ts) => ts.AppointmentID !== AppointmentID || ts.StartDateTime !== StartDateTime,
            )
          : [...timeSlots, item].sort(sortAppointmentTimeSlots),
      })
    } else {
      if (allowFamilyBooking) {
        setAction('appointmentBooking', { modalFamilySelector: true, tempScheduleItem: item })
      } else {
        await logEvent(`appt_prebook`)
        let bookingData = await getAppointmentPrebookInfo(item, false, selectedFamilyMember)
        if (bookingData != null) {
          navigate('AppointmentDetails')
        }
      }
    }
  }
  return (
    <Pressable
      disabled={Brand.UI_APPOINTMENT_RESULTS_BUTTON_TYPE === 'button' && !multiple}
      onPress={onPress}
      style={styles.content}>
      {Brand.UI_APPOINTMENT_RESULTS_PHOTO && (
        <Pressable
          disabled={!coachBioExists}
          onPress={async () => {
            setModalCoachBio(true)
            await logEvent('appt_schedule_coach_bio')
          }}
          style={styles.avatar}>
          <Avatar size={themeStyle.scale(50)} source={Coach?.Headshot} />
        </Pressable>
      )}
      <View style={styles.infoView}>
        <Text style={styles.classTitle}>
          {`${moment(StartDateTime).format('h:mma')} - ${moment(EndDateTime).format('h:mma')}`}
        </Text>
        <Text style={styles.classLocationText}>{Location?.Nickname}</Text>
        {!Brand.UI_COACH_HIDE_SCHEDULE && (
          <Pressable
            disabled={!coachBioExists}
            onPress={async () => {
              setModalCoachBio(true)
              await logEvent('appt_schedule_coach_bio')
            }}>
            <Text
              style={[styles.classSubTitle, coachBioExists && { textDecorationLine: 'underline' }]}>
              {formatCoachName({ addWith: true, coach: Coach })}
            </Text>
          </Pressable>
        )}
      </View>
      <View collapsable={false}>
        <View style={styles.buttonRow}>
          {multiple ? (
            <Checkbox disabled={true} onPress={() => {}} selected={selected} />
          ) : Brand.UI_APPOINTMENT_RESULTS_BUTTON_TYPE === 'arrow' ? (
            <Icon name="chevron-right" style={styles.rightIcon} />
          ) : (
            <Button
              color={
                themeStyle[
                  showCancel
                    ? (Brand.COLOR_BUTTON_CANCEL as ColorKeys)
                    : (Brand.COLOR_BUTTON_BOOK as ColorKeys)
                ]
              }
              disabledStyling={false}
              onPress={onPress}
              small={true}
              style={[themeStyle.buttonClassItem]}
              text={bookButtonText}
              textColor={showCancel ? (Brand.COLOR_BUTTON_CANCEL_TEXT as ColorKeys) : undefined}
            />
          )}
        </View>
      </View>
      {modalCoachBio && (
        <ModalCoachBio
          bio={Coach?.Biography ?? ''}
          name={formatCoachName({ coach: Coach })}
          onClose={() => setModalCoachBio(false)}
          photo={Coach?.Headshot}
          visible={modalCoachBio}
        />
      )}
    </Pressable>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const classSubTitle = {
    ...themeStyle.getTextStyle({ color: 'textGray', font: 'fontPrimaryRegular', size: 13 }),
    marginTop: themeStyle.scale(7),
  } as const
  return {
    content: {
      ...themeStyle.rowAligned,
      paddingLeft: themeStyle.scale(20),
      paddingRight: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(12),
    },
    startTimeText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryMedium', size: 14 }),
      marginBottom: themeStyle.scale(3),
    },
    avatar: { marginRight: themeStyle.scale(12) },
    infoView: { flex: 1, marginRight: themeStyle.scale(8) },
    classTitle: themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 16 }),
    classLocationText: classSubTitle,
    classSubTitle: { ...classSubTitle, marginTop: themeStyle.scale(2) },
    buttonRow: { ...themeStyle.rowAligned, alignSelf: 'flex-end' as 'flex-end' },
    infoIcon: {
      color: themeStyle.textGray,
      fontSize: themeStyle.scale(14),
      marginRight: themeStyle.scale(16),
    },
    openSpotsText: {
      ...themeStyle.getTextStyle({ color: 'textGray', font: 'fontPrimaryRegular', size: 12 }),
      marginTop: themeStyle.scale(8),
      textAlign: 'right' as 'right',
    },
    rightIcon: { color: themeStyle.buttonTextOnMain, fontSize: themeStyle.scale(16) },
  }
}
