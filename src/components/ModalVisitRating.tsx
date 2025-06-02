import moment from 'moment'
import * as React from 'react'
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import Button from './Button'
import ButtonText from './ButtonText'
import Header from './Header'
import Input from './Input'
import Rating from './Rating'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { formatDate, logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import Avatar from './Avatar'
import { cleanAction, setAction } from '../redux/actions'

type Props = { onClose: () => void; ratingInfo: VisitRatingInfo; visible: boolean }

let tipData = [
  { title: '$5', value: '5' },
  { title: '$7', value: '7' },
  { title: '$10', value: '10' },
  { title: 'Custom', value: 'custom' },
] as const

export default function ModalVisitRating(props: Props): React.ReactElement {
  const { onClose, ratingInfo, visible } = props
  const { ClientID, InstructorHeadshot, InstructorName, Name, StartDateTime, VisitRefNo } =
    ratingInfo
  const fieldPositions = React.useRef<{ [key: string]: number }>({})
  const scrollRef = React.useRef<ScrollView | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [comments, setComments] = React.useState('')
  const [rating, setRating] = React.useState(0)
  const [showCustomTip, setShowCustomTip] = React.useState(false)
  const [tip, setTip] = React.useState('')
  const height = themeStyle.window.height
  const translateY = useSharedValue(height)
  //@ts-ignore
  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ translateY: translateY.value }] }
  }, [])
  const onSkip = React.useCallback(async () => {
    try {
      await API.createVisitRating({ Rating: { Declined: 1 }, Visit: { ClientID, VisitRefNo } })
      await logEvent('visit_review_skipped')
      cleanAction('activeButton')
      onClose()
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
      setAction('toast', { text: 'Unable to skip rating.' })
    }
  }, [ClientID, onClose, VisitRefNo])
  const onSubmit = React.useCallback(async () => {
    try {
      await API.createVisitRating({
        Rating: { Comments: comments, Declined: 0, Score: rating },
        Visit: { ClientID, VisitRefNo },
      })
      if (Brand.UI_REVIEW_TIP && tip !== '') {
        await API.createTip({ ClientID, RegistrationID: VisitRefNo, TipAmount: Number(tip) })
      }
      await logEvent('visit_review_completed', { comments, rating, tip: Number(tip) })
      cleanAction('activeButton')
      onClose()
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
    }
  }, [ClientID, comments, onClose, rating, tip, VisitRefNo])
  React.useEffect(() => {
    translateY.value = withTiming(visible ? -height : 0, { duration: 300 })
  }, [height, visible])
  function handleTipClick(val: (typeof tipData)[number]['value']) {
    if (val === 'custom') {
      setShowCustomTip((prev) => !prev)
      if (tip !== '') {
        setTip('')
      }
    } else {
      setShowCustomTip(false)
      setTip((prev) => (prev === val ? '' : val))
    }
  }
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {Brand.IMAGES_REVIEW_HEADER_BACKGROUND == null && (
        <Header title={Brand.STRING_VISIT_RATING_TITLE} />
      )}
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        scrollToOverflowEnabled={true}
        showsVerticalScrollIndicator={false}>
        {Brand.IMAGES_REVIEW_HEADER_BACKGROUND != null && (
          <View style={styles.customHeader}>
            {Brand.IMAGES_REVIEW_HEADER_BACKGROUND != null && (
              <Image
                source={Brand.IMAGES_REVIEW_HEADER_BACKGROUND}
                style={styles.headerBackgroundImage}
              />
            )}
            <Text style={styles.headerTitleText}>{Brand.STRING_VISIT_RATING_TITLE}</Text>
          </View>
        )}
        <Avatar
          border={{ color: themeStyle.colorWhite, width: themeStyle.scale(7) }}
          size={themeStyle.scale(132)}
          source={InstructorHeadshot}
          style={styles.avatar}
        />
        <Text style={styles.timeText}>{InstructorName}</Text>
        <Text style={styles.dateText}>
          {moment(StartDateTime).format(formatDate('dddd, MMMM D [at] h:mma'))}
        </Text>
        <Text style={styles.classNameText}>{Name}</Text>
        <View style={styles.ratingRow}>
          <Rating
            disabled={false}
            onPress={setRating}
            rating={rating}
            size={themeStyle.scale(45)}
          />
        </View>
        {rating !== 0 && (
          <Input
            containerStyle={styles.inputContainer}
            onChangeText={({ text }) => setComments(text)}
            multiline={true}
            onEndEditing={() => {
              scrollRef.current?.scrollTo({ x: 0, y: 0 })
            }}
            onFocus={() => {
              scrollRef.current?.scrollTo({ x: 0, y: fieldPositions.current.feedback })
            }}
            onLayout={(event) => {
              fieldPositions.current.feedback = event.nativeEvent.layout.y - themeStyle.scale(150)
            }}
            placeholder={
              rating === 5
                ? 'Tell us about your experience.'
                : `What could have been done to improve your visit?`
            }
            placeholderTextColor={themeStyle.gray}
            textColor={themeStyle.textBlack}
          />
        )}
        {Brand.UI_REVIEW_TIP && (
          <>
            <Text style={styles.tipIntro}>
              {`We think our staff is pretty great.\nSay thanks with a tip.`}
            </Text>
            <View style={styles.tipRow}>
              {tipData.map((item) => {
                const selected =
                  (showCustomTip && item.value === 'custom') ||
                  (!showCustomTip && tip === item.value)
                return (
                  <Pressable
                    key={item.title}
                    onPress={() => handleTipClick(item.value)}
                    style={[styles.tipContainer, selected && styles.activeTip]}>
                    <Text style={[styles.tipText, selected && styles.activeTipText]}>
                      {item.title}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {showCustomTip && (
              <View
                onLayout={(event) => {
                  fieldPositions.current.tip = event.nativeEvent.layout.y
                }}
                style={styles.tipInputRow}>
                <Text style={themeStyle.textPrimaryBold14}>$</Text>
                <TextInput
                  onChangeText={setTip}
                  onEndEditing={() => scrollRef.current?.scrollTo({ x: 0, y: 0 })}
                  onFocus={() => {
                    scrollRef.current?.scrollTo({
                      x: 0,
                      y:
                        fieldPositions.current.tip - themeStyle.scale(themeStyle.window.height / 3),
                    })
                  }}
                  placeholder={`Enter tip amount`}
                  placeholderTextColor={themeStyle.gray}
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={tip}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
      <View style={styles.bottomButtonView}>
        <Button
          animated={true}
          disabled={rating < 1 || (rating < 4 && comments.trim() === '')}
          onPress={onSubmit}
          text="Submit"
        />
        <ButtonText onPress={onSkip} showSpinner={true} text="Skip" textStyle={styles.skipButton} />
      </View>
    </Animated.View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const inputContainer = {
    borderColor: themeStyle.gray,
    borderRadius: themeStyle.scale(4),
    borderWidth: themeStyle.scale(1),
    height: themeStyle.scale(100),
    paddingHorizontal: themeStyle.scale(8),
  }
  const tipButtonHeight = themeStyle.scale(40)
  return {
    container: {
      backgroundColor: themeStyle.white,
      elevation: 9,
      height: themeStyle.window.height,
      position: 'absolute' as 'absolute',
      top: themeStyle.window.height,
      width: themeStyle.window.width,
      zIndex: 99,
    },
    content: {
      flexGrow: 1,
      justifyContent:
        Brand.IMAGES_REVIEW_HEADER_BACKGROUND != null
          ? ('flex-start' as const)
          : ('center' as const),
      padding: themeStyle.scale(20),
    },
    customHeader: {
      backgroundColor: themeStyle.colorHeader,
      height: themeStyle.scale(183),
      position: 'absolute' as const,
      top: 0,
      width: themeStyle.window.width,
    },
    headerBackgroundImage: {
      bottom: 0,
      height: '100%' as const,
      left: 0,
      position: 'absolute' as const,
      resizeMode: 'cover' as const,
      right: 0,
      top: 0,
      width: '100%' as const,
    },
    headerTitleText: {
      ...themeStyle.headerTitleText,
      marginBottom: themeStyle.scale(18),
      marginTop: themeStyle.scale(64),
      textAlign: 'center' as const,
    },
    avatar: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(8),
      marginTop: Brand.IMAGES_REVIEW_HEADER_BACKGROUND != null ? themeStyle.scale(90) : 0,
    },
    timeText: {
      ...themeStyle.textPrimaryBold16,
      marginBottom: themeStyle.scale(4),
      textAlign: 'center' as 'center',
    },
    dateText: {
      ...themeStyle.textPrimaryMedium14,
      marginBottom: themeStyle.scale(4),
      textAlign: 'center' as 'center',
    },
    classNameText: {
      ...themeStyle.textPrimaryRegular14,
      textAlign: 'center' as 'center',
      textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
    },
    ratingRow: { ...themeStyle.rowAlignedCenter, marginVertical: themeStyle.scale(16) },
    inputContainer,
    tipIntro: {
      ...themeStyle.textPrimaryMedium16,
      marginTop: themeStyle.scale(16),
      textAlign: 'center' as const,
    },
    tipRow: {
      ...themeStyle.rowAlignedBetween,
      marginTop: themeStyle.scale(16),
      width: '100%' as const,
    },
    tipContainer: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.paleGray,
      borderRadius: themeStyle.scale(20),
      height: tipButtonHeight,
      paddingHorizontal: themeStyle.scale(16),
    },
    tipText: {
      color: themeStyle.black,
      fontFamily: themeStyle.fontPrimaryBold,
      fontSize: themeStyle.scale(16),
    },
    activeTip: { backgroundColor: themeStyle.brandPrimary },
    activeTipText: { color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys] },
    tipInputRow: {
      ...themeStyle.rowAligned,
      ...inputContainer,
      height: tipButtonHeight,
      marginTop: themeStyle.scale(8),
    },
    input: { paddingHorizontal: themeStyle.scale(8) },
    bottomButtonView: { paddingHorizontal: themeStyle.scale(20) },
    skipButton: {
      ...themeStyle.textPrimaryBold16,
      color: themeStyle.gray,
      marginBottom: themeStyle.scale(30),
      marginTop: themeStyle.scale(20),
      textTransform: Brand.TRANSFORM_BUTTON_SMALL_TEXT as TextTransform,
    },
  }
}
