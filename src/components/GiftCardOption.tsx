import * as React from 'react'
import { Text, View } from 'react-native'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = { details: GiftCardFormatted }

export default function GiftCardOption(props: Props): React.ReactElement {
  const { details } = props
  const { CardValue, EditableByConsumer, SalePrice } = details
  const { themeStyle } = useTheme()
  const salePriceText = CardValue != SalePrice ? ` for ${Brand.DEFAULT_CURRENCY}${SalePrice}` : ''
  return (
    <View style={themeStyle.rowAligned}>
      <Text style={themeStyle.textPrimaryBold16}>
        {EditableByConsumer && CardValue == 0
          ? 'Custom Amount'
          : `${Brand.DEFAULT_CURRENCY}${CardValue} Gift Card${salePriceText}`}
      </Text>
    </View>
  )
}
