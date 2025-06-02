import * as React from 'react'
import {
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useTheme } from '../global/Hooks'

type Props = {
  display: 'default'
  maximumDate?: Date
  minimumDate?: Date
  mode?: string
  onClose: () => any
  onSelect: (arg1: Date) => any
  value: Date
  visible: boolean
}

export default function ModalDateTimePicker(props: Props): React.ReactElement {
  const { mode = 'date', onClose, onSelect, visible, ...rest } = props
  const onChange = React.useCallback(
    (e: DateTimePickerEvent, date: Date | undefined) => {
      if (Platform.OS === 'android') {
        onClose()
      }
      if (date != null) {
        onSelect(date)
      }
    },
    [onClose, onSelect],
  )
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  if (Platform.OS === 'android' && visible) {
    //@ts-ignore
    return <DateTimePicker {...rest} mode={mode} onChange={onChange} />
  }
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      transparent={true}
      visible={visible}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modal}>
          <View style={styles.content}>
            <View style={styles.buttonView}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              {...rest}
              display="spinner"
              //@ts-ignore
              mode={mode}
              onChange={onChange}
              textColor={themeStyle.textBlack}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    modal: { flex: 1, justifyContent: 'flex-end' as 'flex-end' },
    content: { backgroundColor: themeStyle.white, width: themeStyle.window.width },
    buttonView: {
      alignItems: 'flex-end' as 'flex-end',
      backgroundColor: '#E6E6E6',
      height: themeStyle.scale(30),
      justifyContent: 'center' as 'center',
      paddingHorizontal: themeStyle.scale(20),
    },
    buttonText: themeStyle.getTextStyle({
      color: 'textBrandSecondary',
      font: 'fontPrimaryBold',
      size: 16,
    }),
  }
}
