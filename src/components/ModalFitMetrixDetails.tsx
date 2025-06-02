import moment from 'moment'
import * as React from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import Avatar from './Avatar'
import FitMetrixChart from './FitMetrixChart'
import FitMetrixSummary from './FitMetrixSummary'
import Icon from './Icon'
import ModalBanner from './ModalBanner'
import Brand from '../global/Brand'
import { formatCoachName, formatDate, getFitMetrixChartType } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = { classInfo: BookedClassInfo; onClose: () => void }

export default function ModalFitMetrixDetails(props: Props): JSX.Element | null {
  const { classInfo, onClose } = props
  const { Coach, FitMetrixData, Name = '', StartDateTime } = classInfo ?? {}
  const { FirstName = '', Headshot } = Coach ?? {}
  const { Rank = '', TotalRank = '' } = FitMetrixData ?? {}
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  if (FitMetrixData == null) {
    return null
  }
  const chartType = getFitMetrixChartType(FitMetrixData)
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={true}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={styles.modalContent}>
          <ModalBanner
            alternateStyling={false}
            onClose={onClose}
            title={`${Brand.STRING_CLASS_TITLE} Statistics`}
          />
          <ScrollView
            bounces={false}
            contentContainerStyle={themeStyle.scrollViewContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.infoCard}>
              <Avatar
                size={themeStyle.scale(68)}
                source={Headshot}
                text={FirstName?.substring(0, 1) ?? ''}
              />
              <View style={themeStyle.itemInfoView}>
                <Text style={themeStyle.itemTitleText}>{Name}</Text>
                <Text style={styles.coachName}>{formatCoachName({ coach: Coach })}</Text>
                <View style={themeStyle.rowAligned}>
                  <Icon name="clock-filled" style={styles.clockIcon} />
                  <Text style={styles.detailText}>
                    {`${moment(StartDateTime).format(formatDate('MM/DD/YY'))} at ${moment(
                      StartDateTime,
                    ).format(formatDate('h:mma'))} | `}
                  </Text>
                  <Icon name="star" style={styles.clockIcon} />
                  <Text style={styles.detailText}>{`#${Rank} of ${TotalRank}`}</Text>
                </View>
              </View>
            </View>
            <View style={styles.separator} />
            <FitMetrixSummary data={FitMetrixData} hideMore={true} />
            <View style={styles.separator} />
            {chartType != null && <FitMetrixChart data={classInfo} type={chartType} />}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const detailText = themeStyle.getTextStyle({
    color: 'textGray',
    font: 'fontPrimaryRegular',
    size: 13,
  })
  return {
    modalContent: {
      ...themeStyle.modalContent,
      maxHeight: themeStyle.window.height - themeStyle.scale(80),
    },
    infoCard: {
      flexDirection: 'row' as 'row',
      paddingHorizontal: themeStyle.scale(20),
      paddingVertical: themeStyle.scale(16),
    },
    separator: { ...themeStyle.separator, marginBottom: themeStyle.scale(16) },
    detailText,
    coachName: { ...detailText, marginVertical: themeStyle.scale(2) },
    clockIcon: {
      color: themeStyle.brandPrimary,
      fontSize: themeStyle.scale(14),
      marginRight: themeStyle.scale(4),
    },
  }
}
