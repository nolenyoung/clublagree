import * as React from 'react'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import {
  Header,
  HeaderTabs,
  ModalFamilySelector,
  TabBar,
  UserBilling,
  UserProfile,
  UserSettings,
} from '../components'
import { API } from '../global/API'
import Brand from '../global/Brand'
import { logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

const tabs = ['PROFILE', 'BILLING', 'SETTINGS']

export default function Account(props: RootNavigatorScreenProps<'Account'>) {
  const { navigate } = props.navigation
  const { themeStyle } = useTheme()
  const { clientId, firstName, hasFamilyOptions, lastName, personId, profileKey } = useSelector(
    (state: ReduxState) => state.user,
  )
  const [billing, setBilling] = React.useState<UserBilling | undefined>(undefined)
  const [profile, setProfile] = React.useState<UsersProfile | undefined>(undefined)
  const [familyMember, setFamilyMember] = React.useState<any>(null)
  const [selectedTab, setSelectedTab] = React.useState('PROFILE')
  const [modalFamilySelector, setModalFamilySelector] = React.useState(false)
  const onSelectFamilyMember = React.useCallback((item: FamilyMember) => {
    setFamilyMember(item)
    setModalFamilySelector(false)
  }, [])
  const onFetchProfile = React.useCallback(async () => {
    try {
      setAction('loading', { loading: true })
      const [profileResponse, billingResponse] = await Promise.allSettled([
        API.getUserProfile(
          familyMember != null
            ? { ClientID: familyMember.ClientID, PersonID: familyMember.PersonID }
            : undefined,
        )
          .then((res) => res)
          .catch((e: Error) => e),
        API.getUserBilling(
          familyMember != null
            ? { ClientID: familyMember.ClientID, PersonID: familyMember.PersonID }
            : undefined,
        )
          .then((res) => res)
          .catch((e: Error) => e),
      ])
      if (profileResponse.status === 'fulfilled') {
        if ('clientID' in profileResponse.value) {
          const { clientID } = profileResponse.value
          let marketResponse = await API.getMarketStudios({
            ClientID: familyMember?.ClientID ?? clientID ?? 0,
          })
          let marketArray: Array<{
            ClientID: number
            Country: string
            LocationID: number
            Nickname: string
          }> = []
          if (Array.isArray(marketResponse)) {
            if (marketResponse.length === 1) {
              marketArray = [
                {
                  ClientID: marketResponse[0].ClientID,
                  Country: marketResponse[0].Country,
                  LocationID: marketResponse[0].LocationID,
                  Nickname: marketResponse[0].Nickname,
                },
              ]
            } else {
              for (let i = 1; i <= marketResponse.length; i++) {
                marketArray.push({
                  ClientID: marketResponse[i - 1].ClientID,
                  Country: marketResponse[i - 1].Country,
                  LocationID: marketResponse[i - 1].LocationID,
                  Nickname: marketResponse[i - 1].Nickname,
                })
              }
            }
          } else {
            setAction('toast', { text: 'Unable to get studios' })
          }
          setProfile(profileResponse.value)
        } else {
          setAction('toast', {
            text:
              'message' in profileResponse.value
                ? profileResponse.value.message
                : 'Unable to get profile information',
          })
        }
      } else {
        setAction('toast', { text: profileResponse.reason })
      }
      if (billingResponse.status === 'fulfilled') {
        if ('CurrentBalance' in billingResponse.value) {
          setBilling(billingResponse.value)
        } else {
          setAction('toast', {
            text: billingResponse.value.message ?? 'Unable to get current billing information',
          })
        }
      } else {
        setAction('toast', { text: billingResponse.reason })
      }
    } catch (e: any) {
      logError(e)
    } finally {
      cleanAction('loading')
    }
  }, [clientId, familyMember, personId])
  React.useEffect(() => {
    onFetchProfile()
  }, [clientId, familyMember, personId])
  return (
    <View style={themeStyle.flexView}>
      <Header
        {...(Brand.UI_FAMILY_BOOKING && hasFamilyOptions
          ? { rightIcon: 'instructor', rightIconPress: () => setModalFamilySelector(true) }
          : {})}
        menu={true}
        size="tall"
        title={Brand.STRING_SCREEN_TITLE_ACCOUNT}
      />
      <HeaderTabs
        onSelectTab={async (t) => {
          setSelectedTab(t)
          await logEvent(`account_tab_${t.toLowerCase()}`)
        }}
        selectedTab={selectedTab}
        tabs={tabs}
      />
      <View style={themeStyle.screenContentTabs}>
        <View style={{ flex: 1, display: selectedTab === 'PROFILE' ? 'flex' : 'none' }}>
          <UserProfile
            clientId={familyMember?.ClientID ?? clientId ?? 0}
            isLoggedInUser={
              familyMember == null ||
              (familyMember.ClientID === clientId && familyMember.PersonID === personId)
            }
            onRefresh={onFetchProfile}
            personId={familyMember?.PersonID ?? personId ?? ''}
            profile={profile}
            profileKey={profileKey}
          />
        </View>
        <View style={{ flex: 1, display: selectedTab === 'BILLING' ? 'flex' : 'none' }}>
          <UserBilling
            billing={billing}
            clientId={clientId ?? 0}
            onRefresh={onFetchProfile}
            personId={personId ?? ''}
          />
        </View>
        <View style={{ flex: 1, display: selectedTab === 'SETTINGS' ? 'flex' : 'none' }}>
          <UserSettings clientId={clientId ?? 0} personId={personId ?? ''} />
        </View>
      </View>
      <TabBar />
      {Brand.UI_FAMILY_BOOKING && hasFamilyOptions && modalFamilySelector && (
        <ModalFamilySelector
          ClientID={clientId ?? 0}
          navigate={navigate}
          onClose={() => setModalFamilySelector(false)}
          onContinueMyself={() => {
            setModalFamilySelector(false)
          }}
          onSelect={onSelectFamilyMember}
          PersonID={personId}
          selectedMember={
            familyMember ?? {
              ClientID: clientId ?? 0,
              FirstName: firstName,
              LastName: lastName,
              PersonID: personId ?? '',
            }
          }
          title="Select Family Member"
        />
      )}
    </View>
  )
}
