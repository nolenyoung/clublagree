import * as React from 'react'
import { FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { CachedImage, Header, ListEmptyComponent, TabBar } from '../components'
import { API } from '../global/API'
import { logError } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { setAction } from '../redux/actions'

export default function BadgeList(props: BadgeStackScreenProps<'BadgeList'>) {
  const { push } = props.navigation
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [badgeSections, setBadgeSections] = React.useState<
    (BadgeGroup & {
      data: Array<Badge>
    })[]
  >([])
  const [loading, setLoading] = React.useState(true)
  const onFetchBadges = async () => {
    try {
      let response = await API.getContentBadges()
      if (Array.isArray(response.Badges) && Array.isArray(response.Groups)) {
        let sections: Array<
          BadgeGroup & {
            data: Array<Badge>
          }
        > = response.Groups.map((group) => ({ ...group, data: [] }))
        for (const badge of response.Badges) {
          const { categoryID } = badge
          const sectionID = sections.findIndex((section) => section.categoryID === categoryID)
          if (sectionID !== -1) {
            sections[sectionID] = {
              ...sections[sectionID],
              data: [...sections[sectionID].data, badge],
            }
          }
        }
        for (const section of sections) {
          section.data?.sort((a: Badge, b: Badge) => a.sortOrder - b.sortOrder)
        }
        sections.sort((a, b) => a.sortOrder - b.sortOrder)
        setBadgeSections(sections)
      } else {
        setAction('toast', { text: response.message ?? 'List of badges could not be fetched' })
      }
    } catch (e: any) {
      logError(e)
      setAction('toast', { text: 'Unable to fetch badges' })
    } finally {
      setLoading(false)
    }
  }
  React.useEffect(() => {
    onFetchBadges()
  }, [])
  return (
    <View style={themeStyle.screen}>
      <Header menu={true} title="Badges" />
      <ScrollView
        refreshControl={<RefreshControl onRefresh={() => onFetchBadges()} refreshing={loading} />}
        showsVerticalScrollIndicator={false}>
        {badgeSections.length > 0 ? (
          badgeSections.map((section, index) => {
            const { categoryName, data } = section
            return (
              <View
                key={categoryName}
                style={[
                  styles.sectionView,
                  index === badgeSections.length - 1 && { borderBottomWidth: 0 },
                ]}>
                <Text style={styles.titleText}>{categoryName}</Text>
                <FlatList
                  bounces={false}
                  data={data}
                  horizontal={true}
                  renderItem={({ item }) => {
                    const { badgeName, badgeStatus, imgOnURL } = item
                    return (
                      <TouchableOpacity
                        disabled={badgeStatus === 0}
                        onPress={() => push?.('BadgeDetail', { badge: item })}
                        style={styles.badgeItem}>
                        <View style={[styles.badgeView, badgeStatus === 0 && { opacity: 0.5 }]}>
                          <Text style={styles.badgeText}>{badgeName}</Text>
                          <CachedImage
                            height={themeStyle.scale(85)}
                            resizeMode="contain"
                            source={imgOnURL}
                            width={themeStyle.scale(73)}
                          />
                        </View>
                      </TouchableOpacity>
                    )
                  }}
                />
              </View>
            )
          })
        ) : (
          <ListEmptyComponent
            description="There are currently no badges to display"
            title="No Badges"
          />
        )}
      </ScrollView>
      <TabBar />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    sectionView: {
      borderBottomWidth: themeStyle.scale(1),
      borderColor: themeStyle.paleGray,
      padding: themeStyle.scale(20),
    },
    titleText: { ...themeStyle.textPrimaryBold20, marginBottom: themeStyle.scale(8) },
    badgeItem: {
      ...themeStyle.viewCentered,
      width: (themeStyle.window.width - themeStyle.scale(40)) / 3,
    },
    badgeView: {
      alignItems: 'center' as 'center',
      height: themeStyle.scale(121),
      justifyContent: 'flex-end' as 'flex-end',
      width: themeStyle.scale(100),
    },
    badgeText: { ...themeStyle.textPrimaryBold12, textAlign: 'center' as 'center' },
  }
}
