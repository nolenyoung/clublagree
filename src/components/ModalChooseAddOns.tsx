import * as React from 'react'
import { FlatList, Keyboard, Modal, Pressable, Text, View } from 'react-native'
import Button from './Button'
import ButtonText from './ButtonText'
import Icon from './Icon'
import ListEmptyComponent from './ListEmptyComponent'
import ModalBanner from './ModalBanner'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'
import ItemSeparator from './ItemSeparator'

type Props = {
  addOns: Array<AddOn>
  onClose: () => void
  onContinue: () => Promise<void> | void
  onSelect: (addOn: AddOn, action: 'add' | 'remove') => void
  onSkip?: () => void
  purchasedAddOns?: Array<AddOn>
  selectedAddOns: Array<AddOn>
  title?: string
  visible: boolean
}

export default function ModalChooseAddOns(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    addOns,
    onClose,
    onContinue,
    onSelect,
    onSkip,
    purchasedAddOns = [],
    selectedAddOns,
    title = 'Choose Add Ons',
    visible,
  } = props
  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss()
    }
  }, [visible])
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <View style={themeStyle.modal}>
        <Pressable onPressIn={onClose} style={themeStyle.flexView} />
        <View style={themeStyle.modalContentAlt}>
          <ModalBanner alternateStyling={true} onClose={onClose} title={title} />
          {purchasedAddOns.length > 0 && (
            <View style={styles.purchasedView}>
              {purchasedAddOns.map((addOn) => {
                const { Count = 0, Heading, ProductID } = addOn
                return (
                  <View key={ProductID} style={styles.purchasedRow}>
                    <View style={themeStyle.rowAligned}>
                      <Icon name="check" style={styles.purchasedCheck} />
                      <Text style={themeStyle.textPrimaryBold16}>{Heading}</Text>
                    </View>
                    {Count > 1 && <Text style={styles.purchasedQty}>Qty: {Count}</Text>}
                  </View>
                )
              })}
            </View>
          )}
          <FlatList
            bounces={false}
            contentContainerStyle={styles.listContent}
            data={addOns}
            extraData={selectedAddOns}
            keyExtractor={(item) => `${item.ProductID}`}
            ListEmptyComponent={
              <ListEmptyComponent
                containerStyle={styles.emptyListView}
                description="No addons are available to purchase."
                title="No addons available"
              />
            }
            ItemSeparatorComponent={ItemSeparator}
            renderItem={({ item }) => {
              const selected = selectedAddOns.some((a) => a.ProductID === item.ProductID)
              return (
                <Pressable
                  onPress={() => onSelect(item, selected ? 'remove' : 'add')}
                  style={themeStyle.item}>
                  <View style={styles.itemContent}>
                    <View style={themeStyle.rowAligned}>
                      <View style={[styles.emptyCheckbox, selected && styles.selectedCheckbox]}>
                        {selected && <Icon name="check" style={styles.checkmark} />}
                      </View>
                      <Text style={themeStyle.textPrimaryBold18}>{item.Heading}</Text>
                    </View>
                    <Text style={themeStyle.textPrimaryRegular14}>
                      {`${Brand.DEFAULT_CURRENCY}${item.Price}`}
                    </Text>
                  </View>
                </Pressable>
              )
            }}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.buttonView}>
            {addOns.length > 0 && (
              <Button
                disabled={selectedAddOns.length === 0}
                onPress={onContinue}
                style={[
                  styles.continueButton,
                  onSkip == null && { marginBottom: themeStyle.scale(40) },
                ]}
                text="Continue"
              />
            )}
            {onSkip != null && (
              <ButtonText
                color={themeStyle.textBlack}
                onPress={onSkip}
                style={styles.noThanksButton}
                text="No Thanks"
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const checkbox = {
    borderColor: themeStyle.brandSecondary,
    borderWidth: themeStyle.scale(1),
    height: themeStyle.scale(20),
    marginRight: themeStyle.scale(16),
    width: themeStyle.scale(20),
  } as const
  return {
    listContent: { paddingVertical: themeStyle.scale(20) },
    purchasedView: {
      borderBottomWidth: themeStyle.scale(1),
      borderColor: themeStyle.lightGray,
      marginHorizontal: themeStyle.scale(20),
    },
    purchasedRow: {
      ...themeStyle.rowAlignedBetween,
      paddingVertical: themeStyle.scale(16),
      width: '100%' as const,
    },
    purchasedCheck: {
      color: themeStyle.brandPrimary,
      fontSize: themeStyle.scale(16),
      marginRight: themeStyle.scale(12),
    },
    purchasedQty: { ...themeStyle.textPrimaryRegular16, marginLeft: themeStyle.scale(8) },
    emptyListView: { marginBottom: themeStyle.scale(40), marginTop: themeStyle.scale(20) },
    itemContent: { ...themeStyle.rowAlignedBetween, width: '100%' } as const,
    emptyCheckbox: {
      ...themeStyle.viewCentered,
      ...checkbox,
      backgroundColor: themeStyle.white,
    },
    selectedCheckbox: {
      ...checkbox,
      backgroundColor: themeStyle[Brand.COLOR_CHECKBOX_SELECTED_BACKGROUND as ColorKeys],
    },
    checkmark: {
      color: themeStyle[Brand.COLOR_CHECKBOX_SELECTED_CHECK as ColorKeys],
      fontSize: themeStyle.scale(9),
    },
    buttonView: { paddingHorizontal: themeStyle.scale(16) },
    continueButton: { marginBottom: themeStyle.scale(20), width: '100%' as const },
    noThanksButton: { alignSelf: 'center' as 'center', marginBottom: themeStyle.scale(40) },
  }
}
