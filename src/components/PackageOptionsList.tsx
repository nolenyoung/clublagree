import moment from 'moment'
import * as React from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import Brand from '../global/Brand'
import { formatDate } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import Checkbox from './Checkbox'
import ItemSeparator from './ItemSeparator'

type Props = {
  alternateStyling?: boolean
  onSelect: (arg1: Pricing & Package) => Promise<void> | void
  packageOptions: Array<Pricing>
  packages: Array<Package>
  selectedItem?: Package & Pricing
  selectionMode: 'buy' | 'select'
}

export default function PackageOptionsList(props: Props): React.ReactElement {
  const {
    alternateStyling,
    onSelect,
    packageOptions = [],
    packages = [],
    selectedItem,
    selectionMode,
  } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <FlatList
      bounces={false}
      contentContainerStyle={themeStyle.listContent}
      data={(selectionMode === 'buy' ? packageOptions : packages) as (Pricing & Package)[]}
      extraData={[selectedItem, selectionMode]}
      ItemSeparatorComponent={ItemSeparator}
      keyExtractor={(item: Pricing & Package) =>
        selectionMode === 'buy'
          ? `Product${item.ProductID || ''}${item.Heading || ''}`
          : `Package${item.PackageID || ''}${item.PackageName || ''}`
      }
      renderItem={({ item }) => {
        const {
          Expires = '',
          EyebrowText = '',
          Heading = '',
          Highlight,
          isMembership = false,
          PackageName = '',
          Price = '',
          Remaining = '',
        } = item
        const buy = selectionMode === 'buy'
        const titleText = buy ? Heading : PackageName
        const detailText = buy
          ? `${Brand.DEFAULT_CURRENCY}${Price}`
          : `expires ${moment(Expires, 'YYYY-MM-DD').format(
              formatDate('MMMM D, YYYY'),
            )}, ${Remaining} available`
        const selected =
          selectedItem != null &&
          (selectionMode === 'buy'
            ? selectedItem.ProductID === item.ProductID
            : selectedItem.PackageID === item.PackageID)
        return (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            style={[
              styles.item,
              (Highlight == 1 || isMembership) && {
                backgroundColor: Brand.COLOR_PACKAGE_HIGHLIGHT,
              },
            ]}>
            {alternateStyling ? (
              <View style={themeStyle.rowAligned}>
                <Checkbox
                  containerStyle={styles.altStylingCheckbox}
                  disabled={true}
                  fullWidth={false}
                  selected={selected}
                  text={titleText}
                  textStyle={{ flex: 0, fontFamily: themeStyle.fontPrimaryBold }}
                />
                <Text style={themeStyle.itemDetailText}>{`${detailText}`}</Text>
              </View>
            ) : (
              <View style={themeStyle.rowAlignedBetween}>
                {Highlight == 1 && <View style={styles.highlightBar} />}
                <View style={styles.itemDetailView}>
                  {EyebrowText !== '' && Highlight == 1 && (
                    <Text style={[themeStyle.eyebrowText, { marginBottom: themeStyle.scale(2) }]}>
                      {EyebrowText}
                    </Text>
                  )}
                  <Text style={themeStyle.itemTitleText}>{titleText}</Text>
                  <Text style={themeStyle.itemDetailText}>{detailText}</Text>
                </View>
                <Icon name="chevron-right" style={styles.rightIcon} />
              </View>
            )}
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
    altStylingCheckbox: { ...themeStyle.flexView, marginRight: themeStyle.scale(8) },
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
