import moment from 'moment'
import * as React from 'react'
import { Pressable, Text, TouchableOpacity, View } from 'react-native'
import Avatar from './Avatar'
import Button from './Button'
import Icon from './Icon'
import ModalClassDescription from './ModalClassDescription'
import ModalCoachBio from './ModalCoachBio'
import ModalConfirmation from './ModalConfirmation'
import TagSpotsRemaining from './TagSpotsRemaining'
import Brand from '../global/Brand'
import { formatCoachName, formatDate, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = {
  details: ClassInfo
  hideInfo?: boolean
  onPress: () => Promise<void> | void
  showCancel: boolean | undefined
  showClassDate?: boolean
}

export default function ClassScheduleItem(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { details, hideInfo, onPress, showCancel, showClassDate } = props
  const {
    Available,
    Capacity,
    Coach,
    Description,
    displayFullMessage = false,
    EndDateTime,
    Location,
    Name,
    onlineBookingAvailable,
    ResourceName,
    ShowSpotsAvailable,
    StartDateTime,
    Substitute,
    UserStatus,
  } = details
  const [modalClassDescription, setModalClassDescription] = React.useState(false)
  const [modalCoachBio, setModalCoachBio] = React.useState(false)
  const [modalWaitlistPrompt, setModalWaitlistPrompt] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState<ClassInfo | null>(null)
  const coachBioExists = Coach?.Biography != null && Coach.Biography.trim() !== ''
  const userOnWaitlist = UserStatus?.isUserOnWaitlist
  const bookButtonText = showCancel
    ? userOnWaitlist
      ? Brand.STRING_BUTTON_CANCEL_WAITLIST
      : 'Cancel'
    : !onlineBookingAvailable && displayFullMessage
      ? 'Full'
      : Available == 0
        ? 'Waitlist'
        : `Book`
  return (
    <View style={styles.content}>
      <Pressable
        disabled={!coachBioExists}
        onPress={async () => {
          setModalCoachBio(true)
          await logEvent('schedule_coach_bio')
        }}>
        <Avatar size={themeStyle.scale(50)} source={Coach?.Headshot} />
      </Pressable>
      <View style={styles.infoView}>
        {showClassDate && (
          <Text style={styles.startTimeText}>
            {moment(StartDateTime).format(formatDate('dddd, MMMM D'))}
          </Text>
        )}
        <Text style={styles.startTimeText}>
          {`${moment(StartDateTime).format('h:mma')} - ${moment(EndDateTime).format('h:mma')}`}
        </Text>
        <Text style={styles.classTitle}>{Name}</Text>
        <Text style={styles.classLocationText}>{Location?.Nickname}</Text>
        {Brand.UI_SCHEDULE_RESOURCE_NAME && ResourceName !== '' && ResourceName != null && (
          <Text style={styles.classSubTitle}>{ResourceName}</Text>
        )}
        {!Brand.UI_COACH_HIDE_SCHEDULE && (
          <Pressable
            disabled={!coachBioExists}
            onPress={async () => {
              setModalCoachBio(true)
              await logEvent('schedule_coach_bio')
            }}>
            <Text
              style={[styles.classSubTitle, coachBioExists && { textDecorationLine: 'underline' }]}>
              {formatCoachName({ addWith: true, coach: Coach })}
            </Text>
          </Pressable>
        )}
        {Substitute && <Text style={styles.classSubTitle}>SUBSTITUTE</Text>}
        {!Brand.UI_COACH_HIDE_SCHEDULE &&
          Coach?.Title != null &&
          typeof Coach?.Title === 'string' && (
            <Text style={styles.classSubTitle}>{Coach.Title?.toLowerCase()}</Text>
          )}
        {(Available === 1 || Available === 2) && !(showCancel && userOnWaitlist) && (
          <TagSpotsRemaining spotsLeft={Available} />
        )}
      </View>
      <View collapsable={false}>
        <View style={styles.buttonRow}>
          {!hideInfo && Description !== '' && Description != null && (
            <TouchableOpacity
              hitSlop={themeStyle.hitSlopLarge}
              onPress={async () => {
                setSelectedClass(details)
                setModalClassDescription(true)
                await logEvent(`schedule_${Brand.STRING_CLASS_TITLE_LC}_info`)
              }}>
              <Icon name="info" style={styles.infoIcon} />
            </TouchableOpacity>
          )}
          {(showCancel ||
            onlineBookingAvailable ||
            (!onlineBookingAvailable && displayFullMessage)) && (
            <Button
              color={
                themeStyle[
                  showCancel
                    ? (Brand.COLOR_BUTTON_CANCEL as ColorKeys)
                    : Available == 0
                      ? (Brand.COLOR_BUTTON_WAITLIST as ColorKeys)
                      : (Brand.COLOR_BUTTON_BOOK as ColorKeys)
                ]
              }
              disabledStyling={false}
              onPress={async () => {
                if (bookButtonText === 'Waitlist' && Brand.UI_CLASS_WAITLIST_DISCLAIMER) {
                  setModalWaitlistPrompt(true)
                } else {
                  onPress()
                  await logEvent(
                    `schedule_${Brand.STRING_CLASS_TITLE_LC}_${bookButtonText.toLowerCase()}`,
                  )
                }
              }}
              small={true}
              style={[
                themeStyle.buttonClassItem,
                !showCancel && !onlineBookingAvailable && displayFullMessage && { opacity: 0.5 },
              ]}
              text={bookButtonText}
              textColor={
                showCancel
                  ? (Brand.COLOR_BUTTON_CANCEL_TEXT as ColorKeys)
                  : Available == 0
                    ? 'textBlack'
                    : undefined
              }
            />
          )}
        </View>
        {ShowSpotsAvailable && onlineBookingAvailable && (
          <Text style={styles.openSpotsText}>{`${Available} of ${Capacity} open`}</Text>
        )}
      </View>
      {selectedClass != null && modalClassDescription && (
        <ModalClassDescription
          details={selectedClass}
          onClose={() => setModalClassDescription(false)}
          visible={modalClassDescription}
        />
      )}
      {modalCoachBio && (
        <ModalCoachBio
          bio={Coach?.Biography ?? ''}
          name={formatCoachName({ coach: Coach })}
          onClose={() => setModalCoachBio(false)}
          photo={Coach?.Headshot}
          visible={modalCoachBio}
        />
      )}
      {modalWaitlistPrompt && (
        <ModalConfirmation
          cancelText="Cancel"
          confirmationText={Brand.STRING_CLASS_WAITLIST_DISCLAIMER_TEXT}
          continueText="Continue"
          onClose={() => setModalWaitlistPrompt(false)}
          onContinue={() => {
            onPress()
            setModalWaitlistPrompt(false)
          }}
          title="Waitlist Disclaimer"
          visible={true}
        />
      )}
    </View>
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
      paddingLeft: themeStyle.scale(16),
      paddingRight: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(12),
    },
    startTimeText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryMedium', size: 14 }),
      marginBottom: themeStyle.scale(3),
    },
    infoView: { flex: 1, marginLeft: themeStyle.scale(14), marginRight: themeStyle.scale(8) },
    classTitle: themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 16 }),
    classLocationText: classSubTitle,
    substitute: {
      ...classSubTitle,
      color: themeStyle.brandSecondary,
      marginTop: themeStyle.scale(2),
    },
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
  }
}
