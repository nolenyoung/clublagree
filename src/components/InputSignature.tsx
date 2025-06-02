import * as React from 'react'
import { Pressable, View } from 'react-native'
import Signature, { SignatureViewRef } from 'react-native-signature-canvas'
import Button from './Button'
import ButtonText from './ButtonText'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

type Props = {
  hideClose?: boolean
  onBegin?: () => void
  onClose?: () => void
  onContinue: (arg1: string) => Promise<void> | void
  onEnd?: () => void
  padContainer?: ViewStyleProp
}

export default function InputSignature(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    hideClose,
    onBegin = () => { },
    onClose = () => { },
    onContinue,
    onEnd = () => { },
    padContainer,
  } = props
  const signatureRef = React.useRef<SignatureViewRef | null>(null)
  const [key, setKey] = React.useState('loadingPad')
  const onEmpty = () => {
    setAction('toast', { text: 'A signature is required.' })
  }
  const onGetSignature = () => {
    signatureRef.current?.readSignature() //triggers onSave or onEmpty
  }
  const onClear = () => {
    signatureRef.current?.clearSignature()
  }
  return (
    <>
      <View style={styles.topButtonRow}>
        <ButtonText color={themeStyle.darkGray} onPress={onClear} text="Clear" />
        {!hideClose && (
          <Pressable hitSlop={themeStyle.hitSlop} onPress={onClose}>
            <Icon name="clear" style={styles.closeIcon} />
          </Pressable>
        )}
      </View>
      <View onResponderTerminationRequest={() => false} style={[styles.pad, padContainer]}>
        <Signature
          descriptionText="Sign"
          onBegin={onBegin}
          onEmpty={onEmpty}
          onEnd={onEnd}
          // Changing the key once after load fixes an issue where signature is not recorded
          key={key}
          onLoadEnd={() => setKey('padLoaded')}
          onOK={onContinue}
          ref={(ref) => {
            signatureRef.current = ref
          }}
          webStyle={webStyle}
        />
      </View>
      <Button onPress={onGetSignature} style={styles.saveButton} text="Save" />
    </>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    topButtonRow: { ...themeStyle.rowAlignedBetween, marginBottom: themeStyle.scale(8) },
    closeIcon: { color: themeStyle.textDarkGray, fontSize: themeStyle.scale(16) },
    pad: { width: '100%' as const },
    saveButton: { marginTop: themeStyle.scale(20) },
  }
}

const webStyle = `
.m-signature-pad { height: 100%; width: 100%; }
.m-signature-pad--body { bottom: 0px; left: 0px; right: 0px; top: 0px; }
.m-signature-pad--footer { display: none; }
.m-signature-pad--footer
    .description { display: none; }
    .save { display: none; }
    .clear { display: none; }
`
