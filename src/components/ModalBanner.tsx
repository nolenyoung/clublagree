import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'

type Props = {
  alternateStyling?: boolean
  onClose: () => Promise<void> | void
  subTitle?: string
  title: string
}

export default function ModalBanner(props: Props): React.ReactElement {
  const { alternateStyling = false, onClose, subTitle, title } = props
  const { themeStyle } = useTheme()
  return (
    <View style={alternateStyling ? themeStyle.modalBannerRowAlt : themeStyle.modalBannerRow}>
      <View collapsable={false}>
        <Text style={alternateStyling ? themeStyle.modalTitleTextAlt : themeStyle.modalTitleText}>
          {title}
        </Text>
        {subTitle != null && (
          <Text
            style={
              alternateStyling ? themeStyle.modalSubTitleTextAlt : themeStyle.modalSubTitleText
            }>
            {subTitle}
          </Text>
        )}
      </View>
      <Pressable
        hitSlop={themeStyle.hitSlopLarge}
        onPressIn={onClose}
        style={themeStyle.modalCloseButton}>
        <Icon
          name="clear"
          style={alternateStyling ? themeStyle.modalCloseIconAlt : themeStyle.modalCloseIcon}
        />
      </Pressable>
    </View>
  )
}
