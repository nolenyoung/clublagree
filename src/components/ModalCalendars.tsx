import * as React from 'react'
import { Keyboard, Modal, Pressable, SectionList, Text, TouchableOpacity, View } from 'react-native'
import { Calendar, CalendarEventReadable } from 'react-native-calendar-events'
import { useSelector } from 'react-redux'
import Brand from '../global/Brand'
import {
  checkForExistingCalendarEntries,
  getPhoneCalendars,
  logEvent,
  saveToCalendar,
} from '../global/Functions'
import { useTheme } from '../global/Hooks'
import Button from './Button'
import ItemSeparator from './ItemSeparator'
import Toast from './Toast'
import { setAction } from '../redux/actions'

export default function ModalCalendars(): React.ReactElement | null {
  const calendarEvents = React.useRef<CalendarEventReadable[]>([])
  const listRef = React.useRef<SectionList | null>(null)
  const deviceCalendars = useSelector((state: ReduxState) => state.deviceCalendars)
  const { autoAdd, buttonPressed, calendarId, events, listVisible: visible } = deviceCalendars
  const [calendars, setCalendars] = React.useState<
    { data: Calendar[]; key: string; title: string }[]
  >([])
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const onClose = () => {
    setAction('deviceCalendars', {
      ...(!autoAdd ? { calendarId: '' } : {}),
      buttonPressed: false,
      events: [],
      listVisible: false,
    })
    calendarEvents.current = []
  }
  async function onSaveEvents(id: string) {
    let results = await Promise.all(
      events.map(async (event) => {
        const existingEntries = await checkForExistingCalendarEntries(event)
        calendarEvents.current = existingEntries != null ? existingEntries : []
        if (calendarEvents.current.length > 0 && id === calendarEvents.current[0].calendar?.id) {
          return 'exists'
        } else {
          const success = await saveToCalendar(event, id)
          return success ? 'success' : 'fail'
        }
      }),
    )
    let existsCounts = 0,
      failCount = 0,
      successCount = 0
    for (const res of results) {
      if (res === 'exists') {
        existsCounts += 1
      } else if (res === 'fail') {
        failCount += 1
      } else {
        successCount += 1
      }
    }
    // Only show a toast if there were events processed, because same logic is used for selecting a default calendar in Settings
    if (existsCounts + failCount + successCount > 0) {
      setAction('toast', {
        text:
          failCount > 0
            ? `Failed to add ${failCount < results.length ? 'some' : ''} calendar entries`
            : existsCounts > 0
              ? 'Some entries were not added because they already exist'
              : 'Calendar entries added successfully',
      })
    }
    onClose()
  }
  const onFetchCalendars = async () => {
    const calendarList = await getPhoneCalendars()
    if (calendarList.length === 0) {
      setAction('toast', { text: `You have no available calendars.`, type: 'info' })
      setCalendars([])
      onClose()
    } else {
      // Need to check and see if auto add calendar still exists
      let calendarIndex = -1
      if (calendarId !== '') {
        calendarIndex = calendarList.findIndex((c) => c.id === calendarId)
        // If it doesn't exist reset state
        if (calendarIndex === -1) {
          setAction('deviceCalendars', { autoAdd: undefined, calendarId: '' })
        }
      }
      if (autoAdd && !buttonPressed && calendarIndex !== -1) {
        onSaveEvents(calendarId)
      } else if (calendarList.length === 1) {
        setAction('deviceCalendars', { calendarId: calendarList[0].id })
        if (autoAdd != null) {
          onSaveEvents(calendarList[0].id)
        }
      } else {
        let sources: { [source: string]: Calendar[] } = {}
        for (const cal of calendarList) {
          const { source } = cal
          if (Array.isArray(sources[source])) {
            sources[source].push(cal)
          } else {
            sources[source] = [cal]
          }
        }
        const sections = Object.keys(sources).map((s) => ({ data: sources[s], key: s, title: s }))
        setCalendars(sections)
      }
    }
  }
  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss()
      onFetchCalendars()
    } else {
      setCalendars([])
    }
  }, [visible])
  const autoAddPrompt = calendarId !== '' && autoAdd == undefined
  const maxHeight = themeStyle.window.height - themeStyle.scale(250)
  if (!visible || (calendars.length === 0 && !autoAddPrompt)) {
    return null
  }
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={[themeStyle.modalContentAlt, { maxHeight }]}>
          <View style={themeStyle.modalBannerRowAlt}>
            <Text style={themeStyle.modalTitleTextAlt}>
              {autoAddPrompt ? 'Add to Calendar Automatically' : `Select a Calendar`}
            </Text>
          </View>
          {autoAddPrompt ? (
            <View style={styles.autoAddView}>
              <View style={styles.questionView}>
                <Text style={styles.questionText}>
                  {`Would you like to automatically add future ${Brand.STRING_CLASS_TITLE_PLURAL_LC} to your calendar?`}
                </Text>
              </View>
              <View style={styles.buttonRow}>
                <Button
                  color="transparent"
                  onPress={() => {
                    setAction('deviceCalendars', { autoAdd: false, listVisible: false })
                    onSaveEvents(calendarId)
                  }}
                  style={styles.noButton}
                  text="No"
                  textColor="textBlack"
                />
                <Button
                  onPress={() => {
                    setAction('deviceCalendars', { autoAdd: true, listVisible: false })
                    onSaveEvents(calendarId)
                  }}
                  style={styles.yesButton}
                  text="Yes"
                />
              </View>
            </View>
          ) : (
            <SectionList
              bounces={false}
              contentContainerStyle={themeStyle.listContent}
              getItemLayout={themeStyle.getItemLayout}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={ItemSeparator}
              ref={listRef}
              renderItem={({ item }) => {
                const { color, id, title } = item
                return (
                  <TouchableOpacity
                    onPress={async () => {
                      setAction('deviceCalendars', { calendarId: id })
                      if (autoAdd != undefined) {
                        onSaveEvents(id)
                      }
                      await logEvent('calendar_list_selected')
                    }}
                    style={themeStyle.item}>
                    <View style={themeStyle.rowAligned}>
                      <View style={[styles.calendarDot, { backgroundColor: color }]} />
                      <Text style={themeStyle.textPrimaryRegular16}>{title}</Text>
                    </View>
                  </TouchableOpacity>
                )
              }}
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                  <Text style={themeStyle.textPrimaryBold20}>{section.title}</Text>
                </View>
              )}
              sections={calendars}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
      <Toast />
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const dotSize = themeStyle.scale(16)
  return {
    sectionHeader: {
      ...themeStyle.item,
      backgroundColor: themeStyle.fadedGray,
      paddingVertical: themeStyle.scale(14),
    },
    calendarDot: {
      borderRadius: dotSize / 2,
      height: dotSize,
      marginRight: themeStyle.scale(8),
      width: dotSize,
    },
    autoAddView: { backgroundColor: themeStyle.fadedGray, paddingBottom: themeStyle.scale(40) },
    questionView: { padding: themeStyle.scale(20) },
    questionText: { ...themeStyle.textPrimaryRegular14, opacity: 0.6 },
    buttonRow: { ...themeStyle.rowAlignedEvenly, marginTop: themeStyle.scale(4) },
    noButton: {
      borderColor:
        themeStyle[Brand.BUTTON_LARGE_BORDER_COLOR as ColorKeys] ?? themeStyle.brandPrimary,
      borderWidth: themeStyle.scale(1),
      width: '40%' as const,
    },
    yesButton: { ...themeStyle.halfInput, width: '40%' as const },
  }
}
