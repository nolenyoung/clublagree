import * as React from 'react'
import HTMLContent from './HTMLContent'
import InputSignature from './InputSignature'
import { useTheme } from '../global/Hooks'

type Props = {
  agreement?: string | null | undefined
  onClose: () => void
  onContinue: (arg1: string) => Promise<void> | void
}

export default function ContractSigning(props: Props): React.ReactElement {
  const { agreement, onClose, onContinue } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const formattedAgreement = React.useMemo(
    () => agreement?.replace(/<p>&nbsp;<\/p>/g, ''),
    [agreement],
  )
  return agreement != null ? (
    <HTMLContent
      footer={(setScrollEnabled) => (
        <InputSignature
          hideClose={true}
          onBegin={() => setScrollEnabled(false)}
          onContinue={onContinue}
          onEnd={() => setScrollEnabled(true)}
          padContainer={styles.padLimited}
        />
      )}
      html={formattedAgreement}
    />
  ) : (
    <InputSignature onClose={onClose} onContinue={onContinue} padContainer={themeStyle.flexView} />
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return { padLimited: { height: themeStyle.scale(200) } }
}
