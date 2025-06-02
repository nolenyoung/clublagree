import * as React from 'react'
import { View } from 'react-native'
import {
  Header,
  HeaderTabs,
  ModalPackageClasses,
  PackagesList,
  PurchasesList,
  TabBar,
} from '../components'
import { API } from '../global/API'
import { logError, logEvent } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

const TABS_PURCHASES = ['ACTIVE', 'HISTORY']

export default function Purchases(): React.ReactElement {
  const { themeStyle } = useTheme()
  const [history, setHistory] = React.useState<Sale[]>([])
  const [loading, setLoading] = React.useState(false)
  const [packagesData, setPackagesData] = React.useState<{
    contracts: Purchase[]
    packages: Purchase[]
  }>({ contracts: [], packages: [] })
  const [selectedItem, setSelectedItem] = React.useState<null | Purchase | Sale>(null)
  const [selectedTab, setSelectedTab] = React.useState(TABS_PURCHASES[0])
  const onFetchHistory = React.useCallback(async () => {
    try {
      let response = await API.getUserPurchaseHistory()
      if (Array.isArray(response)) {
        setHistory(response)
        setLoading(false)
      } else {
        setAction('toast', { text: response.message })
        setLoading(false)
      }
    } catch (e: any) {
      setAction('toast', { text: 'Unable to fetch purchase history.' })
      logError(e)
      setLoading(false)
    }
  }, [])
  const onFetchPackages = React.useCallback(async () => {
    try {
      let response = await API.getUserPurchases()
      const { contracts = [], packages = [] } = response
      if (!Array.isArray(contracts) || !Array.isArray(packages)) {
        setAction('toast', { text: response.message })
      }
      setPackagesData({ contracts, packages })
    } catch (e: any) {
      logError(e)
      cleanAction('loading')
      setAction('toast', { text: 'Unable to fetch your purchases.' })
    }
  }, [])
  React.useEffect(() => {
    onFetchPackages()
    onFetchHistory()
  }, [])
  const { contracts, packages } = packagesData
  const historyTabSelected = selectedTab !== TABS_PURCHASES[0]
  return (
    <View style={themeStyle.flexView}>
      <Header menu={true} size="tall" title="Purchases" />
      <HeaderTabs
        onSelectTab={async (t) => {
          setSelectedTab(t)
          await logEvent(`purchases_tab_${t.toLowerCase()}`)
        }}
        selectedTab={selectedTab}
        tabs={TABS_PURCHASES}
      />
      <View style={themeStyle.screenContentTabs}>
        <View style={{ display: !historyTabSelected ? 'flex' : 'none', flex: 1 }}>
          <PackagesList
            contracts={contracts}
            loading={loading}
            onFetch={onFetchPackages}
            onViewClasses={setSelectedItem}
            packages={packages}
          />
        </View>
        <View style={{ display: historyTabSelected ? 'flex' : 'none', flex: 1 }}>
          <PurchasesList
            loading={loading}
            onFetch={onFetchHistory}
            onViewClasses={setSelectedItem}
            purchases={history}
          />
        </View>
      </View>
      <TabBar />
      {selectedItem != null && (
        <ModalPackageClasses data={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </View>
  )
}
