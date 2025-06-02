import * as React from 'react'
import { FlatList, Keyboard, Modal, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import Checkbox from './Checkbox'
import ModalBanner from './ModalBanner'
import { API } from '../global/API'
import { checkClassSpots, formatName, getPrebookInfo, logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, getState, setAction } from '../redux/actions'
import ItemSeparator from './ItemSeparator'

type Props = {
  alternateStyling?: boolean
  ClientID: number | null | undefined
  navigate: Navigate
  onClose?: () => void
  onContinueMyself?: () => void
  onSelect?: (arg1: FamilyMember) => void
  PersonID: string | null | undefined
  selectedMember: FamilyMember | null | undefined
  title?: string
  visible?: boolean
  workshops?: boolean
}

export default function ModalFamilySelector(props: Props): React.ReactElement {
  const {
    alternateStyling,
    ClientID,
    navigate,
    onClose,
    onContinueMyself,
    onSelect,
    PersonID,
    selectedMember,
    title = 'Who are you booking for?',
    visible = true,
    workshops = false,
  } = props
  const firstName = useSelector((state: ReduxState) => state.user.firstName)
  const lastName = useSelector((state: ReduxState) => state.user.lastName)
  const { themeStyle } = useTheme()
  const [family, setFamily] = React.useState<FamilyMember[]>([])
  const onCloseModal = React.useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      setAction('bookingDetails', { modalFamilySelector: false })
    }
  }, [onClose])
  const onSelectMember = React.useCallback(
    (item: FamilyMember) => {
      if (onSelect) {
        onSelect(item)
      } else {
        const { Class } = getState().bookingDetails
        if (Class != null) {
          getPrebookInfo({ navigate, selectedClass: Class, selectedFamilyMember: item, workshops })
        }
      }
    },
    [onSelect, workshops],
  )
  React.useEffect(() => {
    if (ClientID != null) {
      ;(async function getOptions() {
        const myself: FamilyMember = {
          ClientID,
          FirstName: firstName,
          LastName: lastName,
          PersonID: PersonID ?? '',
        }
        try {
          let response = await API.getUserFamily({ ClientID, PersonID })
          if (Array.isArray(response)) {
            if (response.length === 0) {
              if (onContinueMyself) {
                onContinueMyself()
              } else {
                checkClassSpots(null, navigate, workshops)
              }
            } else {
              const myselfIncluded = response.some(
                (r) => r.ClientID === myself.ClientID && r.PersonID === myself.PersonID,
              )
              setFamily([...(!myselfIncluded ? [myself] : []), ...response])
              cleanAction('loading')
            }
          } else {
            cleanAction('loading')
            setFamily([myself])
          }
        } catch (e: any) {
          setFamily([myself])
          logError(e)
          cleanAction('loading')
          setAction('toast', { text: 'Unable to fetch family members.' })
        }
      })()
    }
  }, [ClientID, firstName, lastName, onContinueMyself, PersonID, workshops])
  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss()
    }
  }, [visible])
  return (
    <Modal
      animationType="slide"
      onRequestClose={onCloseModal}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
      transparent={true}
      visible={visible && family.length > 0}>
      <View style={themeStyle.modal}>
        <TouchableOpacity activeOpacity={1} onPress={onCloseModal} style={themeStyle.flexView} />
        <View style={alternateStyling ? themeStyle.modalContentAlt : themeStyle.modalContent}>
          <ModalBanner alternateStyling={alternateStyling} onClose={onCloseModal} title={title} />
          <FlatList
            bounces={false}
            contentContainerStyle={themeStyle.listContent}
            data={family}
            extraData={[ClientID, PersonID, onSelectMember, selectedMember]}
            keyExtractor={(item) => `${item.ClientID}${item.PersonID}`}
            ItemSeparatorComponent={ItemSeparator}
            renderItem={({ item }) => {
              const selected =
                item.ClientID === selectedMember?.ClientID &&
                item.PersonID === selectedMember?.PersonID
              return (
                <Checkbox
                  containerStyle={themeStyle.item}
                  onPress={() => onSelectMember(item)}
                  selected={selected}
                  text={formatName(item.FirstName, item.LastName)}
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
