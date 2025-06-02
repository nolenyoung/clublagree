import { useNavigation } from '@react-navigation/native'
import moment from 'moment'
import * as React from 'react'
import { FlatList, Pressable, Text, TouchableOpacity, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Avatar from './Avatar'
import Button from './Button'
import Icon from './Icon'
import Brand from '../global/Brand'
import { formatCoachName, formatDate } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'
import ItemSeparator from './ItemSeparator'

type Props = { timeSlots: AppointmentTimeSlot[] }

export default function AppointmentScheduleSummary(props: Props): React.ReactElement {
  const { timeSlots } = props
  const { navigate } =
    useNavigation<AppointmentStackScreenProps<'AppointmentSchedule'>['navigation']>()
  const { themeStyle } = useTheme()
  const baseHeight = themeStyle.tabBarHeight + themeStyle.scale(3)
  const dynamicHeight =
    timeSlots.length * themeStyle.scale(116) +
    themeStyle.edgeInsets.bottom +
    themeStyle.scale(73) + // height of button + button top margin
    baseHeight
  const maxHeight = themeStyle.window.height * 0.8
  const fullHeight = dynamicHeight < maxHeight ? dynamicHeight : maxHeight
  const timeSlotCount = timeSlots.length
  const styles = getStyles(themeStyle)
  const [expanded, setExpanded] = React.useState(false)
  const height = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => {
    return { height: height.value }
  })
  const panGesture = Gesture.Pan()
    .activeOffsetY([-5, 5])
    .failOffsetX([-5, 5])
    .onUpdate((e) => {
      const yOffset = e.translationY
      if (yOffset <= 0 && expanded) return
      if (yOffset >= 0 && !expanded) return
      height.value = (expanded ? fullHeight : baseHeight) - yOffset
    })
    .onEnd((e) => {
      const yOffset = e.translationY
      if (yOffset >= 150 && expanded) {
        height.value = withTiming(baseHeight, { duration: 250 })
        runOnJS(setExpanded)(false)
      } else if (yOffset <= -150 && !expanded) {
        height.value = withTiming(fullHeight, { duration: 250 })
        runOnJS(setExpanded)(true)
      } else if (yOffset > 0 && yOffset < 150 && expanded) {
        height.value = withTiming(fullHeight, { duration: 250 })
        runOnJS(setExpanded)(true)
      } else if (yOffset > -150 && yOffset < 0 && !expanded) {
        height.value = withTiming(baseHeight, { duration: 250 })
        runOnJS(setExpanded)(false)
      }
    })
  React.useEffect(() => {
    if (timeSlots.length === 0) {
      height.value = withTiming(0, { duration: 250 })
    } else if (height.value === 0) {
      height.value = withTiming(baseHeight, { duration: 250 })
    }
  }, [baseHeight, timeSlotCount])
  React.useEffect(() => {
    if (expanded) {
      height.value = withTiming(fullHeight, { duration: 250 })
    }
  }, [expanded, fullHeight])
  return (
    <Animated.View style={[styles.content, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <View>
          <View style={styles.swipeHandleVertical} />
          <Text style={styles.titleText}>
            {`${timeSlotCount} Session${timeSlotCount > 1 ? 's' : ''} Selected`}
          </Text>
        </View>
      </GestureDetector>
      <View style={themeStyle.flexView}>
        <FlatList
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          data={timeSlots}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) => `${item.AppointmentID}${item.StartDateTime}`}
          renderItem={({ item }) => {
            const { AppointmentID, Coach, EndDateTime, Location, StartDateTime } = item
            return (
              <TouchableOpacity
                onPress={() => {
                  const updatedTimeSlots = timeSlots.filter(
                    (ts) =>
                      ts.AppointmentID !== AppointmentID || ts.StartDateTime !== StartDateTime,
                  )
                  setAction('appointmentBooking', {
                    multiple: updatedTimeSlots.length > 0,
                    timeSlots: updatedTimeSlots,
                  })
                }}
                style={themeStyle.appointments.scheduleSummary.item}>
                {Brand.UI_APPOINTMENT_RESULTS_PHOTO && (
                  <View style={themeStyle.appointments.scheduleSummary.avatar}>
                    <Avatar size={themeStyle.scale(50)} source={Coach?.Headshot} />
                  </View>
                )}
                <View style={themeStyle.appointments.scheduleSummary.infoView}>
                  <Text
                    allowFontScaling={false}
                    style={themeStyle.appointments.scheduleSummary.itemTitleText}>
                    {`${moment(StartDateTime).format(formatDate('dddd, MMMM D'))}`}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={themeStyle.appointments.scheduleSummary.itemTimeText}>
                    {`${moment(StartDateTime).format('h:mma')} - ${moment(EndDateTime).format('h:mma')}`}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={themeStyle.appointments.scheduleSummary.itemSubTitle}>
                    {Location?.Nickname}
                  </Text>
                  {!Brand.UI_COACH_HIDE_SCHEDULE && (
                    <Text
                      allowFontScaling={false}
                      style={themeStyle.appointments.scheduleSummary.itemSubTitle}>
                      {formatCoachName({ addWith: true, coach: Coach })}
                    </Text>
                  )}
                </View>
                <View collapsable={false}>
                  <View style={themeStyle.appointments.scheduleSummary.buttonRow}>
                    <Icon name="trash" style={themeStyle.appointments.scheduleSummary.rightIcon} />
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
          showsVerticalScrollIndicator={false}
        />
        <Button
          onPress={() => navigate('AppointmentDetailsMultiple')}
          style={styles.button}
          text="Continue"
        />
      </View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: {
      backgroundColor: themeStyle.white,
      borderColor: themeStyle.separator.backgroundColor,
      borderWidth: themeStyle.scale(2),
      borderBottomWidth: 0,
      borderTopLeftRadius: themeStyle.scale(20),
      borderTopRightRadius: themeStyle.scale(20),
      bottom: 0,
      paddingHorizontal: themeStyle.scale(20),
      position: 'absolute' as const,
      width: themeStyle.window.width,
      zIndex: 2,
    },
    swipeHandleVertical: {
      alignSelf: 'center' as const,
      backgroundColor: themeStyle.gray,
      borderRadius: themeStyle.scale(5),
      height: themeStyle.scale(3),
      marginBottom: themeStyle.scale(12),
      marginTop: themeStyle.scale(16),
      width: themeStyle.scale(30),
    },
    titleText: {
      ...themeStyle.textPrimaryBold20,
      marginBottom: themeStyle.scale(24),
      textAlign: 'center' as const,
    },
    scrollContent: { flexGrow: 1 },
    button: {
      marginBottom: themeStyle.edgeInsets.bottom + themeStyle.scale(8),
      marginTop: themeStyle.scale(12),
    },
  }
}
