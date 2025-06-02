import * as React from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import Button from './Button'
import ExpirationSelector from './ExpirationSelector'
import Input from './Input'
import InputButton from './InputButton'
import ModalMonthSelector from './ModalMonthSelector'
import ModalYearSelector from './ModalYearSelector'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { MONTHS, YEARS } from '../global/Constants'
import {
  formatCreditCard,
  logError,
  validateExpiry,
  validateTextOnChange,
} from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  clientId?: number
  personId?: string
  modalSelection?: boolean
  onRefresh?: () => Promise<void>
  onUpdated?: () => Promise<void> | void
}

export default function InputBilling(props: Props): React.ReactElement {
  const { clientId, modalSelection = true, onRefresh, personId, onUpdated } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [cardNumber, setCardNumber] = React.useState('')
  const [expiryError, setExpiryError] = React.useState(false)
  const [invalidFields, setInvalidFields] = React.useState(['cardNumber'])
  const [modalMonthSelector, setModalMonthSelector] = React.useState(false)
  const [modalYearSelector, setModalYearSelector] = React.useState(false)
  const [month, setMonth] = React.useState('')
  const [year, setYear] = React.useState('')
  const onToggleMonthModal = React.useCallback(() => {
    setModalMonthSelector((prev) => !prev)
  }, [])
  const onToggleYearModal = React.useCallback(() => {
    setModalYearSelector((prev) => !prev)
  }, [])
  const onUpdate = React.useCallback(async () => {
    try {
      await API.updateBilling({
        ...(clientId != null && personId != null ? { ClientID: clientId, PersonID: personId } : {}),
        CardNumber: cardNumber.replace(/\s/g, ''),
        ExpMonth: month,
        ExpYear: year,
      })
      cleanAction('activeButton')
      setAction('toast', { text: 'Billing info updated.', type: 'success' })
      onUpdated && onUpdated()
    } catch (e: any) {
      logError(e)
      cleanAction('activeButton')
      setAction('toast', { text: 'Unable to update billing info.' })
    }
  }, [cardNumber, clientId, month, onUpdated, personId, year])
  React.useEffect(() => {
    if (month !== '' && year !== '') {
      const { invalid } = validateExpiry(month, year)
      setExpiryError(invalid)
      if (invalid) {
        setAction('toast', { text: 'Expiration date must be in the future.' })
      }
    }
  }, [month, year])
  const hideUI = !modalSelection && (modalMonthSelector || modalYearSelector)
  return (
    <>
      <ScrollView
        bounces={onRefresh != null}
        contentContainerStyle={themeStyle.scrollContentTabScreen}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={false} />}
        scrollToOverflowEnabled={true}
        showsVerticalScrollIndicator={false}
        style={{
          display: hideUI ? 'none' : 'flex',
        }}>
        <Input
          autoComplete="cc-number"
          borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          containerStyle={themeStyle.inputView}
          format={formatCreditCard}
          key="cardNumberInput"
          keyboardType="number-pad"
          label="Credit Card Number"
          labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
          maxLength={19}
          onChangeText={({ text, setError }) =>
            validateTextOnChange({
              errorOnChange: false,
              setError,
              setInvalidFields,
              setState: setCardNumber,
              text,
              type: 'cardNumber',
            })
          }
          onEndEditing={(text, setError) =>
            validateTextOnChange({
              errorOnChange: true,
              setError,
              setInvalidFields,
              setState: setCardNumber,
              text,
              type: 'cardNumber',
            })
          }
          placeholder="Enter Card Number"
          placeholderTextColor={themeStyle.textGray}
          returnKeyType="done"
          textColor={themeStyle.textBlack}
          textContentType="creditCardNumber"
        />
        <View style={themeStyle.rowAlignedBetween}>
          <InputButton
            borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            containerStyle={themeStyle.halfInput}
            error={expiryError}
            label="Month"
            labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            onPress={onToggleMonthModal}
            textColor={month === '' ? themeStyle.textGray : themeStyle.textBlack}
            value={month || 'Exp Month'}
          />
          <InputButton
            borderColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            containerStyle={themeStyle.halfInput}
            error={expiryError}
            label="Year"
            labelColor={themeStyle[Brand.COLOR_ACCOUNT_INPUT_LABEL as ColorKeys]}
            onPress={onToggleYearModal}
            textColor={year === '' ? themeStyle.textGray : themeStyle.textBlack}
            value={year || 'Exp Year'}
          />
        </View>
      </ScrollView>
      {!hideUI && (
        <Button
          animated={true}
          disabled={invalidFields.length > 0 || expiryError}
          gradient={Brand.BUTTON_GRADIENT}
          onPress={onUpdate}
          style={styles.updateButton}
          text="Update"
        />
      )}
      {modalMonthSelector &&
        (!modalSelection ? (
          <ExpirationSelector
            containerStyle={themeStyle.expirationModalList}
            data={MONTHS}
            onClose={onToggleMonthModal}
            onSelect={setMonth}
            selectedItem={month}
            visible={modalMonthSelector}
          />
        ) : (
          <ModalMonthSelector
            alternateStyling={true}
            onClose={onToggleMonthModal}
            onSelect={setMonth}
            selectedMonth={month}
            visible={modalMonthSelector}
          />
        ))}
      {modalYearSelector &&
        (!modalSelection ? (
          <ExpirationSelector
            containerStyle={themeStyle.expirationModalList}
            data={YEARS}
            onClose={onToggleYearModal}
            onSelect={setYear}
            selectedItem={year}
            visible={modalYearSelector}
          />
        ) : (
          <ModalYearSelector
            alternateStyling={true}
            onClose={onToggleYearModal}
            onSelect={setYear}
            selectedYear={year}
            visible={modalYearSelector}
          />
        ))}
    </>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return { updateButton: { marginBottom: themeStyle.scale(28), width: '100%' as const } }
}
