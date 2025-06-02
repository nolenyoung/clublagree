import * as React from 'react'
import { useSelector } from 'react-redux'
import ModalConfirmation from './ModalConfirmation'
import Brand from '../global/Brand'
import { cancelReservation, logEvent } from '../global/Functions'
import { cleanAction } from '../redux/actions'

const onClose = async () => {
  cleanAction('classToCancel')
  await logEvent('confirm_cancellation_exit')
}

export default function ModalConfirmationCancel(): React.ReactElement | null {
  const classToCancel = useSelector((state: ReduxState) => state.classToCancel)
  const onContinue = React.useCallback(() => {
    if (classToCancel != null) {
      cancelReservation(classToCancel)
      cleanAction('classToCancel')
    }
  }, [classToCancel])
  if (classToCancel == null) {
    return null
  }
  const { item, type } = classToCancel
  const IsLateCancel = 'IsLateCancel' in item ? item.IsLateCancel : false
  return (
    <ModalConfirmation
      cancelText="No, I changed my mind."
      confirmationText={`Are you sure you want to cancel? ${
        type === 'waitlist'
          ? 'You will lose your spot in line if you change your mind.'
          : IsLateCancel
            ? Brand.STRING_MODAL_CONFIRMATION_CANCEL_LATE
            : Brand.STRING_MODAL_CONFIRMATION_CANCEL
      }`}
      continueText={`Yes, cancel this ${
        type === 'appointment' ? 'appointment' : Brand.STRING_CLASS_TITLE_LC
      }.`}
      onClose={onClose}
      onContinue={onContinue}
      title={type === 'waitlist' ? 'Cancel Your Waitlist' : 'Cancel Your Booking'}
      visible={classToCancel != null}
    />
  )
}
