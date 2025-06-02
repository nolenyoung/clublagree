import * as React from 'react'
import { FlatList, Keyboard, Modal, Pressable, View } from 'react-native'
import Checkbox from './Checkbox'
import ModalBanner from './ModalBanner'
import { API } from '../global/API'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'
import ItemSeparator from './ItemSeparator'

type Props = {
  alternateStyling?: boolean
  clientId: number | null | undefined
  gender: string | null | undefined
  onClose: () => void
  onSelect: (arg1: string) => void
  visible: boolean
}

export default function ModalGenderSelector(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const { alternateStyling, clientId, gender, onClose, onSelect, visible } = props
  const [genders, setGenders] = React.useState<string[]>([])
  React.useEffect(() => {
    if (clientId != null) {
      ;(async function getOptions() {
        try {
          let response = await API.getGenderOptions({ ClientID: clientId })
          if (Array.isArray(response)) {
            setGenders(response)
          } else {
            setAction('toast', { text: response.message })
            setGenders([])
          }
        } catch (e: any) {
          setGenders([])
          logError(e)
          setAction('toast', { text: 'Unable to fetch gender options.' })
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
            title="Select Gender"
          />
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={genders}
            extraData={[gender, onClose, onSelect]}
            keyExtractor={(item) => item}
            ItemSeparatorComponent={ItemSeparator}
            renderItem={({ item }) => {
              const selected = item === gender
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
