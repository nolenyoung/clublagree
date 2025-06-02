import * as React from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'

type Props = {
  onSelect: (arg1: AppointmentPackage | AppointmentPackageOptions | Pricing) => Promise<void> | void
  packageOptions: (AppointmentPackageOptions | Pricing)[]
  packages: AppointmentPackage[]
  scrollEnabled?: boolean
  selectionMode: 'buy' | 'select'
}

type Data<T> = T extends { ID: number }
  ? AppointmentPackage[]
  : (AppointmentPackageOptions | Pricing)[]

export default function AppointmentPackageOptionsList(props: Props): React.ReactElement {
  const { onSelect, packageOptions = [], packages = [], selectionMode } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const data = selectionMode === 'buy' ? packageOptions : packages
  return (
    <FlatList
      bounces={false}
      contentContainerStyle={themeStyle.listContent}
      data={data as Data<typeof data>}
      extraData={selectionMode}
      ItemSeparatorComponent={ItemSeparator}
      keyExtractor={(item) => {
        if ('ID' in item && 'Name' in item && selectionMode !== 'buy') {
          const { ID = 0, Name = '' } = item
          return `Package${ID}${Name}`
        } else {
          const { Name = '', ProductID = '' } = item as AppointmentPackageOptions
          return `Product${ProductID}${Name}`
        }
      }}
      renderItem={({ item }) => {
        const { EyebrowText = '', Highlight, isMembership = false, Price = '' } = item
        const buy = selectionMode === 'buy'
        const titleText = 'Heading' in item ? item.Heading : item.Name
        const detailText = buy ? `${Brand.DEFAULT_CURRENCY}${Price}` : ''
        return (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            style={[
              styles.item,
              (Highlight == 1 || isMembership) && {
                backgroundColor: Brand.COLOR_PACKAGE_HIGHLIGHT,
              },
            ]}>
            <View style={themeStyle.rowAlignedBetween}>
              {Highlight == 1 && <View style={styles.highlightBar} />}
              <View style={styles.itemDetailView}>
                {EyebrowText !== '' && Highlight == 1 && (
                  <Text style={[themeStyle.eyebrowText, { marginBottom: themeStyle.scale(2) }]}>
                    {EyebrowText}
                  </Text>
                )}
                <Text style={themeStyle.itemTitleText}>{titleText}</Text>
                {detailText !== '' && <Text style={themeStyle.itemDetailText}>{detailText}</Text>}
              </View>
              <Icon name="chevron-right" style={styles.rightIcon} />
            </View>
          </TouchableOpacity>
        )
      }}
      showsVerticalScrollIndicator={false}
    />
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    item: { padding: themeStyle.scale(16) },
    highlightBar: {
      backgroundColor: themeStyle.eyebrowText.color,
      borderRadius: themeStyle.scale(2),
      height: '100%' as const,
      marginRight: themeStyle.scale(16),
      width: themeStyle.scale(4),
    },
    itemDetailView: { flex: 1, marginRight: themeStyle.scale(12) },
    rightIcon: { color: themeStyle.gray, fontSize: themeStyle.scale(14) },
  }
}
