import * as React from 'react'
import { LayoutAnimation, Text, TouchableOpacity, View } from 'react-native'
import Icon from './Icon'
import { useTheme } from '../global/Hooks'

const create = LayoutAnimation.create(300, 'linear', 'opacity')

type Props = {
  children: React.ReactNode
  containerStyle?: ViewStyleProp
  expanded: boolean
  headerStyle?: ViewStyleProp
  hideToggleIcon?: boolean
  onPress: () => void
  title?: string
  titleComponent?: React.ReactNode
}

export default function Accordian(props: Props): React.ReactElement {
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    children,
    containerStyle,
    expanded,
    headerStyle,
    hideToggleIcon = true,
    onPress,
    title = '',
    titleComponent,
  } = props
  const onToggle = React.useCallback(() => {
    LayoutAnimation.configureNext(create)
    onPress()
  }, [onPress])
  return (
    <View collapsableChildren={false} style={[styles.container, containerStyle]}>
      <TouchableOpacity onPress={onToggle} style={[styles.header, headerStyle]}>
        <View style={themeStyle.rowBetween}>
          <View style={themeStyle.flexView}>
            {title !== '' && <Text style={themeStyle.textPrimaryBold14}>{title}</Text>}
            {titleComponent}
          </View>
          {!hideToggleIcon && <Icon name={expanded ? 'clear' : 'plus'} style={styles.icon} />}
        </View>
      </TouchableOpacity>
      {expanded && children}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    container: { width: '100%' as const },
    header: { paddingVertical: themeStyle.scale(16) },
    icon: {
      color: themeStyle.lightGray,
      fontSize: themeStyle.scale(14),
      marginLeft: themeStyle.scale(12),
    },
    initialAnimatedView: { opacity: 0, position: 'absolute' },
  }
}
