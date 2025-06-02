import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import Brand from '../global/Brand'
import { useTheme } from '../global/Hooks'

type Props = {
  backgroundColor?: string
  leftComponent?: React.ReactNode
  menu?: boolean
  rightComponent?: React.ReactNode
  rightIcon?: string
  rightIconPress?: () => Promise<void> | void
  size?: 'default' | 'tall'
  style?: ViewStyleProp
  title?: string
  titleComponent?: React.ReactNode
}

export default function Header(props: Props): React.ReactElement {
  const { toggleDrawer } = useNavigation<RootNavigation>()
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    backgroundColor = themeStyle.colorHeader,
    leftComponent,
    menu,
    rightComponent,
    rightIcon,
    rightIconPress,
    size = 'default',
    style,
    title,
    titleComponent,
  } = props
  const onMenuPress = React.useCallback(() => {
    toggleDrawer()
  }, [])
  return (
    <View
      style={[
        themeStyle.header,
        size === 'tall' && {
          height: themeStyle.headerHeightTall,
          paddingBottom: themeStyle.scale(46),
        },
        { backgroundColor },
        style,
      ]}>
      {Brand.IMAGES_HEADER_BACKGROUND != null && (
        <Image
          source={Brand.IMAGES_HEADER_BACKGROUND}
          style={[
            styles.image,
            size === 'tall' && {
              height: themeStyle.headerHeightTall,
            },
          ]}
        />
      )}
      <View style={themeStyle.rowAligned}>
        <View style={themeStyle.flexView}>
          {menu && (
            <TouchableOpacity hitSlop={themeStyle.hitSlop} onPress={onMenuPress}>
              <Icon name="menu" style={themeStyle.headerIcon} />
            </TouchableOpacity>
          )}
          {leftComponent}
        </View>
        {titleComponent}
        {title != null && (
          <View style={styles.titleView}>
            <Text allowFontScaling={false} style={themeStyle.headerTitleText}>
              {title}
            </Text>
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

function getStyles(themeStyle: ThemeStyle) {
  return {
    image: {
      bottom: 0,
      height: themeStyle.header.height,
      left: 0,
      position: 'absolute' as const,
      resizeMode: 'cover' as const,
      right: 0,
      top: 0,
    },
    titleView: { alignItems: 'center', flex: 4 } as const,
    rightView: { alignItems: 'flex-end', flex: 1 } as const,
  }
}
