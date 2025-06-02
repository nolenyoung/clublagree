import moment from 'moment'
import * as React from 'react'
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native'
import Button from './Button'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import Brand from '../global/Brand'
import { formatDate } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = {
  contracts: Array<Purchase>
  loading: boolean
  onFetch: () => Promise<void>
  onViewClasses: (arg: Purchase) => void
  packages: Array<Purchase>
}

const formatItemDate = (date: string) => {
  return moment(date, 'YYYY-MM-DD').format(formatDate('MMM D, YYYY'))
}

export default function PackagesList(props: Props): React.ReactElement {
  const { contracts, loading, onFetch, onViewClasses, packages } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={themeStyle.screen}>
      <ScrollView
        contentContainerStyle={themeStyle.scrollViewContent}
        refreshControl={<RefreshControl onRefresh={onFetch} refreshing={loading} />}
        showsVerticalScrollIndicator={false}>
        {packages.length > 0 && <Text style={styles.sectionTitle}>Active Packages</Text>}
        {((packages.length === 0 && contracts.length === 0) || packages.length > 0) && (
          <FlatList
            data={packages}
            ItemSeparatorComponent={ItemSeparator}
            keyExtractor={(item) => `${item.PackageID}${item.Name}`}
            ListEmptyComponent={
              <ListEmptyComponent
                description={`You don't have any active packages.`}
                title="No packages available."
              />
            }
            renderItem={({ item }: { item: Purchase }) => {
              const { ActiveDate, ExpDate, MarketName, Name, Purchased, Unbooked } = item
              const active = formatItemDate(ActiveDate)
              const expire = formatItemDate(ExpDate)
              const notUnlimited = Number(Unbooked) <= 200 && Number(Purchased) <= 200
              return (
                <View style={styles.item}>
                  <Text style={styles.itemTitleText}>{Name}</Text>
                  {notUnlimited && (
                    <Text style={styles.itemDescriptionText}>
                      {Unbooked} of {Purchased} remaining
                    </Text>
                  )}
                  <Text style={styles.itemPurchasedText}>
                    {`Purchased ${active} / Expires ${expire}`}
                  </Text>
                  <Text style={styles.itemPurchasedText}>{MarketName}</Text>
                  {Brand.UI_PACKAGE_CLASSES && notUnlimited && (
                    <Button
                      onPress={() => onViewClasses(item)}
                      small={true}
                      style={styles.viewClassesButton}
                      text={`View Bookings`}
                    />
                  )}
                </View>
              )
            }}
            scrollEnabled={false}
          />
        )}
        {contracts.length > 0 && (
          <React.Fragment>
            {packages.length > 0 && <View style={styles.separator} />}
            <Text
              style={[
                styles.sectionTitle,
                packages.length > 0 && { marginTop: themeStyle.scale(40) },
              ]}>
              Active Contracts
            </Text>
            <FlatList
              data={contracts}
              ItemSeparatorComponent={ItemSeparator}
              keyExtractor={(item) => `${item.PackageID}${item.Name}`}
              renderItem={({ item }: { item: Purchase }) => {
                const { ActiveDate, ExpDate, MarketName, Name, Purchased, Unbooked } = item
                const active = formatItemDate(ActiveDate)
                const expire = formatItemDate(ExpDate)
                const notUnlimited = Number(Unbooked) <= 200 && Number(Purchased) <= 200
                return (
                  <View style={styles.item}>
                    <Text style={styles.itemTitleText}>{Name}</Text>
                    {notUnlimited && (
                      <Text style={styles.itemDescriptionText}>
                        {Unbooked} of {Purchased} remaining
                      </Text>
                    )}
                    <Text style={styles.itemPurchasedText}>
                      {`Purchased ${active} / Expires ${expire}`}
                    </Text>
                    <Text style={styles.itemPurchasedText}>{MarketName}</Text>
                    {Brand.UI_PACKAGE_CLASSES && notUnlimited && (
                      <Button
                        onPress={() => onViewClasses(item)}
                        small={true}
                        style={styles.viewClassesButton}
                        text={`View Bookings`}
                      />
                    )}
                  </View>
                )
              }}
              scrollEnabled={false}
            />
          </React.Fragment>
        )}
      </ScrollView>
      <Text style={styles.disclaimerText}>{Brand.STRING_PACKAGE_LIST_DISCLAIMER}</Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    sectionTitle: {
      ...themeStyle.largeTitleText,
      color: themeStyle.textBrandSecondary,
      marginBottom: themeStyle.scale(8),
      marginHorizontal: themeStyle.scale(27),
    },
    item: { padding: themeStyle.scale(20) },
    itemTitleText: {
      ...themeStyle.getTextStyle({ color: 'textBlack', font: 'fontPrimaryBold', size: 22 }),
      marginBottom: themeStyle.scale(2),
      textTransform: Brand.TRANSFORM_ITEM_TITLE_TEXT as TextTransform,
    },
    itemDescriptionText: { ...themeStyle.textPrimaryRegular16, marginBottom: themeStyle.scale(2) },
    itemPurchasedText: {
      ...themeStyle.getTextStyle({ color: 'textGray', font: 'fontPrimaryRegular', size: 13 }),
      marginBottom: themeStyle.scale(2),
    },
    viewClassesButton: { marginTop: themeStyle.scale(14) },
    separator: { ...themeStyle.separator, marginVertical: themeStyle.scale(50) },
    disclaimerText: {
      ...themeStyle.textPrimaryRegular12,
      marginBottom: themeStyle.scale(32),
      paddingHorizontal: themeStyle.scale(27),
      textAlign: 'center' as 'center',
    },
  }
}
