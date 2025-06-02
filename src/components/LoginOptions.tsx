import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import Button from './Button'
import ButtonText from './ButtonText'
import Icon from './Icon'
import Brand from '../global/Brand'
import { logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'

type Props = {
  onSendVerification: () => Promise<void>
  options: Array<LoginOption>
  setStep: (arg1: number) => void
  setType: (arg1: string) => void
  type: string
}

export default function LoginOptions(props: Props): React.ReactElement {
  const { onSendVerification, options, setStep, setType, type } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={themeStyle.content}>
      <View style={themeStyle.flexView}>
        <Text style={styles.titleText}>{`Verify It's You`}</Text>
        <Text style={styles.descriptionText}>
          {`Please select an option below\nto receive a sign-in code.`}
        </Text>
        {options.map((option) => {
          const { CellPhone, Email, Type } = option
          const onPress = () => setType(Type)
          const selected = Type === type
          return (
            <View key={Type} style={styles.optionView}>
              <Pressable
                accessible={true}
                accessibilityLabel="Checkbox"
                accessibilityRole="checkbox"
                onPress={onPress}>
                <View style={styles.optionRow}>
                  <View style={styles.emptyCheckbox}>
                    {selected && <Icon name="check" style={styles.checkmark} />}
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionText}>
                      {`Send Me ${Type === 'Text' ? 'a' : 'an'} ${Type}`}
                    </Text>
                    <Text style={styles.optionDescriptionText}>
                      {Type === 'Text' ? CellPhone : Email}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          )
        })}
      </View>
      <ButtonText
        color={themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys]}
        onPress={async () => {
          await logEvent('login_email_code_existing')
          setStep(2)
        }}
        text="I already have a code"
        textStyle={{ textDecorationLine: 'underline' }}
      />
      <Button
        animated={true}
        color={themeStyle[Brand.COLOR_BUTTON_ALT as ColorKeys]}
        disabled={type === ''}
        onPress={async () => {
          await logEvent('login_email_verify')
          onSendVerification()
        }}
        style={styles.continueButton}
        text="Continue"
        textColor={Brand.BUTTON_TEXT_COLOR_ALT as ColorKeys}
      />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const size = themeStyle.scale(32)
  const checkbox = { borderRadius: size / 2, height: size, width: size } as const
  return {
    titleText: {
      ...themeStyle.sectionTitleText,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
      marginBottom: themeStyle.scale(16),
      marginTop: themeStyle.scale(48),
      textAlign: 'center' as 'center',
    },
    descriptionText: {
      ...themeStyle.textPrimaryRegular16,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
      marginBottom: themeStyle.scale(48),
      textAlign: 'center' as 'center',
    },
    optionView: { marginBottom: themeStyle.scale(32) },
    optionRow: { flexDirection: 'row', width: '100%' } as const,
    emptyCheckbox: {
      ...themeStyle.viewCentered,
      ...checkbox,
      backgroundColor: themeStyle.paleGray,
    },
    checkmark: {
      color: themeStyle[Brand.COLOR_CHECKBOX_SELECTED_CHECK_ALT as ColorKeys],
      fontSize: themeStyle.scale(9),
    },
    optionInfo: { flex: 1, marginLeft: themeStyle.scale(16) },
    optionText: {
      ...themeStyle.textPrimaryBold20,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
    },
    optionDescriptionText: {
      ...themeStyle.textPrimaryRegular14,
      color: themeStyle[Brand.COLOR_SECONDARY_SCREEN_TEXT as ColorKeys],
      marginTop: themeStyle.scale(4),
    },
    continueButton: {
      marginBottom: themeStyle.edgeInsets.bottom + themeStyle.scale(8),
      marginTop: themeStyle.scale(24),
      width: '100%' as const,
    },
  }
}
