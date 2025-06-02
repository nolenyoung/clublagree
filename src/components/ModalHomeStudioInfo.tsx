import moment from 'moment'
import * as React from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import ModalBanner from './ModalBanner'
import Toast from './Toast'
import { useTheme } from '../global/Hooks'

type Props = {
  data: Location
  info: BusinessInformation | null | undefined
  onClose: () => void
}

export default function ModalHomeStudioInfo(props: Props): React.ReactElement {
  const { data, info, onClose } = props
  const { Nickname = '' } = data
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const { Address = '', AdditionalInfo, City = '', Hours, State = '', Zip = '' } = info ?? {}
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={themeStyle.modalContent}>
          <ModalBanner alternateStyling={false} onClose={onClose} title={`Studio Information`} />
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.nameText}>{Nickname}</Text>
            <Text style={styles.locationText}>{`${Address}\n${City}, ${State} ${Zip}`}</Text>
            {Array.isArray(Hours) && Hours.length > 0 && (
              <View style={styles.hoursView}>
                {Hours.map((item) => {
                  const { close, day, open } = item
                  if (day == null || day === '' || open == null || close == null) {
                    return
                  }
                  const end = moment(close, 'HH:mm').format('h:mma')
                  const start = moment(open, 'HH:mm').format('h:mma')
                  return (
                    <View key={day} style={styles.hoursRow}>
                      <Text style={styles.dayText}>{day}:</Text>
                      <Text style={styles.hoursText}>{`${start} - ${end}`}</Text>
                    </View>
                  )
                })}
              </View>
            )}
            {AdditionalInfo != null && AdditionalInfo !== '' && (
              <View style={styles.additionalInfoView}>
                <Text style={styles.additionalInfoText}>{`${AdditionalInfo}`}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      <Toast />
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    scrollContent: { ...themeStyle.scrollViewContent, paddingBottom: themeStyle.scale(40) },
    nameText: {
      ...themeStyle.textPrimaryBold20,
      marginTop: themeStyle.scale(20),
      textAlign: 'center' as 'center',
    },
    locationText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryRegular', size: 13 }),
      textAlign: 'center' as 'center',
    },
    hoursView: {
      alignSelf: 'center' as 'center',
      marginTop: themeStyle.scale(20),
      width: '75%' as const,
    },
    hoursRow: { ...themeStyle.rowAligned, marginBottom: themeStyle.scale(8) },
    dayText: { ...themeStyle.textPrimaryRegular14, flex: 1 },
    hoursText: { ...themeStyle.textPrimaryRegular14, flex: 1 },
    additionalInfoView: {
      marginTop: themeStyle.scale(20),
      paddingHorizontal: themeStyle.scale(20),
    },
    additionalInfoLabel: themeStyle.textPrimaryBold12,
    additionalInfoText: { ...themeStyle.textPrimaryRegular12, textAlign: 'center' as 'center' },
  }
}
