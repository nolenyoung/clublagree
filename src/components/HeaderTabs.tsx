import * as React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useTheme } from '../global/Hooks'

type Props = {
  containerStyle?: ViewStyleProp
  counts?: Array<{ count: number; tab: string }>
  onSelectTab: (arg1: string) => void
  selectedTab: string
  tabs: Array<string>
}

export default function HeaderTabs(props: Props): React.ReactElement {
  const { containerStyle, counts, onSelectTab, selectedTab, tabs } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={[styles.tabsRow, containerStyle]}>
      {tabs.map((tab, index) => {
        const selected = tab === selectedTab
        let count = null
        if (counts != null) {
          count = counts.find((c) => c.tab === tab)?.count
        }
        return (
          <Pressable
            key={tab}
            onPress={() => onSelectTab(tab)}
            style={[
              styles.tab,
              index === 0 && styles.firstTab,
              index === tabs.length - 1 && styles.lastTab,
              tabs.length === 2 && { width: (themeStyle.window.width - themeStyle.scale(40)) / 2 },
              selected && styles.selectedTab,
            ]}>
            <View style={themeStyle.rowAligned}>
              <Text style={[styles.text, selected && styles.selectedText]}>{tab}</Text>
              {count != null && count !== 0 && (
                <View style={styles.countView}>
                  <Text style={styles.countText}>{count}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  const tabHeight = themeStyle.scale(42)
  const tabRadius = Math.round(themeStyle.scale(3))
  return {
    tabsRow: {
      ...themeStyle.rowAlignedCenter,
      elevation: 2,
      position: 'absolute' as 'absolute',
      top: themeStyle.headerHeightTall - tabHeight / 2,
      width: themeStyle.window.width,
      zIndex: 2,
    },
    tab: {
      ...themeStyle.viewCentered,
      ...themeStyle.rowAligned,
      backgroundColor: themeStyle.backgroundHeaderTab,
      height: themeStyle.scale(42),
      paddingHorizontal: themeStyle.scale(20),
    },
    firstTab: { borderBottomLeftRadius: tabRadius, borderTopLeftRadius: tabRadius },
    lastTab: { borderBottomRightRadius: tabRadius, borderTopRightRadius: tabRadius },
    selectedTab: { backgroundColor: themeStyle.white },
    text: {
      ...themeStyle.textPrimaryBold14,
      color: themeStyle.colorHeaderTabText,
      letterSpacing: 0,
      opacity: 0.6,
      textAlign: 'center' as 'center',
    },
    selectedText: { color: themeStyle.colorHeaderTabTextSelected, opacity: 1 },
    countView: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.brandPrimary,
      borderRadius: themeStyle.scale(8.5),
      height: themeStyle.scale(17),
      marginLeft: themeStyle.scale(4),
      minWidth: themeStyle.scale(17),
      overflow: 'hidden' as 'hidden',
    },
    countText: {
      ...themeStyle.getTextStyle({ color: 'textWhite', font: 'fontPrimaryBold', size: 10 }),
      textAlign: 'center' as 'center',
    },
  }
}
