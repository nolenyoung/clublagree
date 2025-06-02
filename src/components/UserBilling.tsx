import * as React from 'react'
import { Image, RefreshControl, ScrollView, Text, View } from 'react-native'
import { getVersion } from 'react-native-device-info'
import InputBilling from './InputBilling'
import { logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import Brand from '../global/Brand'

type Props = {
  billing: UserBilling | undefined
  clientId: number
  onRefresh: () => Promise<void>
  personId: string
}

export default function UserBilling(props: Props): React.ReactElement {
  const { billing, clientId, onRefresh, personId } = props
  const { CardOnFile, CurrentBalance } = billing ?? {}
  const { CardExp, CardImageUrl, CardLast4, CardType } = CardOnFile ?? {}
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={themeStyle.content}>
      <ScrollView
        contentContainerStyle={themeStyle.scrollContentTabScreen}
        refreshControl={
          <RefreshControl
            colors={['transparent']}
            onRefresh={onRefresh}
            refreshing={false}
            tintColor="transparent"
          />
        }
        showsVerticalScrollIndicator={false}>
        {CurrentBalance != undefined && Number(CurrentBalance) !== 0 && (
          <View style={styles.sectionView}>
            <Text style={themeStyle.textPrimaryBold16}>
              {`Account Balance: `}
              <Text
                style={[
                  themeStyle.textPrimaryRegular16,
                  Number(CurrentBalance) < 0 && { color: themeStyle.red },
                ]}>
                {`${Brand.DEFAULT_CURRENCY}${CurrentBalance}`}
              </Text>
            </Text>
          </View>
        )}
        {CardLast4 != undefined && (
          <View style={styles.sectionView}>
            <Text style={styles.sectionTitle}>Card On File</Text>
            <View style={styles.imageRow}>
              <Image source={{ uri: CardImageUrl }} style={styles.cardImage} />
              <View>
                <Text style={themeStyle.textPrimaryBold16}>{CardType}</Text>
                <Text style={themeStyle.textPrimaryRegular12}>
                  {`Card ending in ${CardLast4} (Exp: ${CardExp})`}
                </Text>
              </View>
            </View>
          </View>
        )}
        <View style={[styles.sectionView, { borderBottomWidth: 0 }]}>
          <Text style={styles.sectionTitle}>
            {CardLast4 == undefined ? 'Add Card On File' : `Update Card`}
          </Text>
          <InputBilling
            clientId={clientId}
            personId={personId}
            onUpdated={async () => {
              onRefresh()
              logEvent(
                CardLast4 == undefined ? 'account_billing_add_card' : 'account_billing_update_card',
              )
            }}
          />
        </View>
      </ScrollView>
      <Text style={styles.versionText}>
        {`v${getVersion()} (${clientId ?? 0}-${personId ?? 0})`}
      </Text>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    sectionView: {
      borderBottomWidth: themeStyle.scale(1),
      borderColor: themeStyle.separator.backgroundColor,
      paddingVertical: themeStyle.scale(24),
    },
    sectionTitle: { ...themeStyle.sectionTitleText, marginBottom: themeStyle.scale(16) },
    imageRow: { ...themeStyle.rowAligned },
    cardImage: {
      height: themeStyle.scale(30),
      marginRight: themeStyle.scale(8),
      resizeMode: 'contain' as const,
      width: themeStyle.scale(60),
    },
    versionText: {
      color: themeStyle.lightGray,
      fontSize: themeStyle.scale(10),
      marginVertical: themeStyle.scale(16),
      textAlign: 'center' as 'center',
    },
  }
}
