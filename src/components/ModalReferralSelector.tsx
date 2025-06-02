import * as React from 'react'
import { FlatList, Keyboard, Modal, Pressable, View } from 'react-native'
import Checkbox from './Checkbox'
import ModalBanner from './ModalBanner'
import { useTheme } from '../global/Hooks'
import { logError } from '../global/Functions'
import { setAction } from '../redux/actions'
import { API } from '../global/API'
import ItemSeparator from './ItemSeparator'

type Props = {
  alternateStyling?: boolean
  clientId: number | null | undefined
  onClose: () => void
  onSelect: (arg1: string) => void
  referral: string | null | undefined
  visible: boolean
}

export default function ModalReferralSelector(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const { alternateStyling, clientId, onClose, onSelect, referral, visible } = props
  const [sources, setSources] = React.useState<string[]>([])
  React.useEffect(() => {
    if (clientId != null) {
      ;(async function getSources() {
        try {
          let response = await API.getReferralSources({ ClientID: clientId })
          if (Array.isArray(response)) {
            setSources(response)
          } else {
            setSources([])
          }
        } catch (e: any) {
          setSources([])
          logError(e)
          setAction('toast', { text: 'Unable to fetch referral sources.' })
        }
      })()
    }
  }, [clientId])
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
        <View style={alternateStyling ? themeStyle.modalContentAlt : themeStyle.modalContent}>
          <ModalBanner
            alternateStyling={alternateStyling}
            onClose={onClose}
            title="Select Referral Source"
          />
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={sources}
            extraData={[onClose, onSelect, referral]}
            keyExtractor={(item) => item}
            ItemSeparatorComponent={ItemSeparator}
            renderItem={({ item }) => {
              const selected = item === referral
              return (
                <Checkbox
                  containerStyle={themeStyle.item}
                  onPress={() => {
                    onSelect(item)
                    onClose()
                  }}
                  selected={selected}
                  text={item}
                />
              )
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  )
}
