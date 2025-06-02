import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'

type Props = {
  backgroundColor?: string
  leftComponent?: React.ReactNode
  leftIcon?: string
  rightComponent?: React.ReactNode
  rightIcon?: string
  rightIconPress?: () => Promise<void> | void
  size?: 'default' | 'tall'
  title?: string
}

export default function HeaderWebView(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const {
    backgroundColor = themeStyle.colorHeader,
    leftComponent,
    rightComponent,
    rightIcon,
    rightIconPress,
    size = 'default',
    title,
  } = props
  return (
    <View
      style={[
        themeStyle.header,
        size === 'tall' && {
          height: themeStyle.headerHeightTall,
          paddingBottom: themeStyle.scale(46),
        },
        { backgroundColor },
      ]}>
      <View style={themeStyle.rowAligned}>
        <View style={themeStyle.flexView}>{leftComponent}</View>
        {title != null && (
          <View style={styles.titleView}>
            <Text style={themeStyle.headerTitleText}>{title}</Text>
          </View>
        )}
        <View style={styles.rightView}>
          {rightIcon != null && (
            <TouchableOpacity
              disabled={rightIconPress == null}
              hitSlop={themeStyle.hitSlop}
              onPress={rightIconPress}>
              <Icon name={rightIcon} style={themeStyle.headerIcon} />
            </TouchableOpacity>
          )}
          {rightComponent}
        </View>
      </View>
    </View>
  )
}

const styles = {
  titleView: { alignItems: 'center' as 'center', flex: 5 },
  rightView: { alignItems: 'flex-end', flex: 1 },
} as const
