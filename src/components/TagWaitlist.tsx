import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  classInfo: BookedClassInfo
  onFetch?: () => Promise<void>
  onFitMetrix: () => void
}

export default function TagWaitlist(props: Props): React.ReactElement {
  const { classInfo, onFetch, onFitMetrix } = props
  const {
    ClientID,
    IsSpotAvailable: available,
    PersonID,
    WaitlistEntryID,
    WaitlistSpot: spot,
  } = classInfo ?? {}
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const onJoinClass = React.useCallback(async () => {
    try {
      setAction('loading', { loading: true })
      let response = await API.updateWaitlistToClass({ ClientID, PersonID, WaitlistEntryID })
      if (response?.Status === 'Success') {
        onFetch && onFetch()
      } else {
        cleanAction('loading')
        setAction('toast', { text: response.message })
      }
    } catch (e: any) {
      logError(e)
      cleanAction('loading')
      setAction('toast', { text: 'Could not join class.' })
    }
  }, [ClientID, onFetch, PersonID, WaitlistEntryID])
  return (
    <TouchableOpacity
      disabled={!available}
      onPress={Brand.UI_FITMETRIX_BOOKING ? onFitMetrix : onJoinClass}
      style={styles.waitlistView}>
      {available ? (
        <Text style={styles.waitlistText}>Add to Class</Text>
      ) : (
        <View style={themeStyle.rowAligned}>
          <Text style={styles.waitlistText}>Waitlisted</Text>
          {Brand.UI_CLASS_WAITLIST_NUMBER && (
            <Text style={styles.waitlistSpotText}>{` #${spot}`}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    waitlistView: {
      ...themeStyle.rowAlignedCenter,
      backgroundColor: themeStyle.fadedGray,
      borderRadius: themeStyle.scale(4),
      height: themeStyle.scale(31),
      marginRight: themeStyle.scale(8),
      paddingHorizontal: themeStyle.scale(8),
      width: 'auto' as const,
    },
    waitlistText: { ...themeStyle.textPrimaryBold12, color: themeStyle.textDarkGray },
    waitlistSpotText: { ...themeStyle.textPrimaryRegular12, color: themeStyle.textDarkGray },
  }
}
