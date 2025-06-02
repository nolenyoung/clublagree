import * as React from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import Avatar from './Avatar'
import HTMLContent from './HTMLContent'
import ModalBanner from './ModalBanner'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = {
  bio: string
  name: string
  onClose: () => void
  photo: string | null | undefined
  visible: boolean
}

export default function ModalCoachBio(props: Props): React.ReactElement {
  const { bio = '', name = '', onClose, photo, visible } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={themeStyle.modalContent}>
          <ModalBanner
            alternateStyling={false}
            onClose={onClose}
            title={`${Brand.COACH_TITLE} Bio`}
          />
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <Avatar size={themeStyle.scale(150)} source={photo} style={styles.avatar} />
            <Text style={styles.nameText}>{name}</Text>
            <HTMLContent html={bio} scrollEnabled={false} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    scrollContent: { ...themeStyle.scrollViewContent, paddingBottom: 0 },
    avatar: {
      alignSelf: 'center' as 'center',
      marginBottom: themeStyle.scale(8),
      marginTop: themeStyle.scale(20),
    },
    nameText: { ...themeStyle.textPrimaryBold20, textAlign: 'center' as 'center' },
  }
}
