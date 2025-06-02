import * as React from 'react'
import { FlatList, View } from 'react-native'
import { useTheme } from '../global/Hooks'

type Props = {
  containerStyle?: ViewStyleProp
  containerWidth?: number
  data: Array<{ [key: string]: any }>
  dotViewStyle?: ViewStyleProp
  emptyListComponent?: React.ReactNode
  height: number
  itemWidth: number
  keyExtractor: (arg1: { [key: string]: any }) => string
  onChange?: (arg1: number) => void
  renderItem: (arg1: {
    index: number
    item: { [key: string]: any }
    marginHorizontal: number
    width: number
  }) => React.ReactElement
  showDots?: boolean
  spacing?: number //space between data
}

type SizeParamsType = { itemWidth: number; spacing: number }

const getItemLayout = (
  data: ArrayLike<any> | null | undefined,
  index: number,
  sizeParams: SizeParamsType,
) => {
  const { itemWidth, spacing } = sizeParams
  return {
    length: itemWidth + spacing * 2,
    offset: (itemWidth + spacing * 2) * index,
    index,
  }
}

export default function Carousel(props: Props): JSX.Element {
  const listRef = React.useRef<FlatList | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const {
    containerStyle,
    containerWidth = themeStyle.window.width,
    data = [],
    dotViewStyle,
    emptyListComponent,
    height,
    itemWidth,
    keyExtractor,
    onChange,
    renderItem,
    showDots = true,
    spacing = themeStyle.scale(20),
  } = props
  const [currentIndex, setCurrentIndex] = React.useState(0)
  React.useEffect(() => {
    setCurrentIndex(0)
    if (data.length > 0) {
      listRef.current?.scrollToIndex({ index: 0, viewPosition: 0 })
    }
  }, [data])
  const dots = React.useMemo(() => {
    if (data.length === 0) {
      return null
    }
    return data.map(
      (
        item: {
          [key: string]: any
        },
        index,
      ) => {
        const key = `${keyExtractor(item)}Dot`
        return (
          <View key={key} style={index === currentIndex ? styles.activeDot : styles.emptyDot} />
        )
      },
    )
  }, [currentIndex, data, keyExtractor, styles.activeDot, styles.emptyDot])
  return (
    <View style={[styles.container, { width: containerWidth }, containerStyle]}>
      <FlatList
        bounces={false}
        contentContainerStyle={{ paddingHorizontal: -spacing }}
        data={data}
        decelerationRate="fast"
        disableIntervalMomentum={true}
        extraData={[spacing, itemWidth]}
        getItemLayout={(d, index) => getItemLayout(d, index, { itemWidth, spacing })}
        horizontal={true}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          <View style={[styles.emptyListView, { height, width: containerWidth }]}>
            {emptyListComponent}
          </View>
        }
        onScroll={(event) => {
          const { contentOffset } = event.nativeEvent
          if (contentOffset != null) {
            const i = Math.round(contentOffset.x / (itemWidth + spacing))
            if (i !== currentIndex) {
              setCurrentIndex(i)
              onChange && onChange(i)
            }
          }
        }}
        ref={listRef}
        renderItem={({
          item,
          index,
        }: {
          index: number
          item: {
            [key: string]: any
          }
        }) => renderItem({ index, item, marginHorizontal: spacing, width: itemWidth })}
        scrollEnabled={data.length > 1}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={containerWidth}
      />
      {showDots && data.length > 1 && <View style={[styles.dotsView, dotViewStyle]}>{dots}</View>}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    container: { width: '100%' as const },
    emptyListView: { ...themeStyle.viewCentered, backgroundColor: themeStyle.white },
    dotsView: {
      ...themeStyle.rowAligned,
      alignSelf: 'center' as 'center',
      marginTop: themeStyle.scale(8),
    },
    activeDot: {
      backgroundColor: themeStyle.brandSecondary,
      borderRadius: themeStyle.scale(4),
      height: themeStyle.scale(8),
      marginHorizontal: themeStyle.scale(4),
      width: themeStyle.scale(8),
    },
    emptyDot: {
      backgroundColor: themeStyle.paleGray,
      borderRadius: themeStyle.scale(4),
      height: themeStyle.scale(8),
      marginHorizontal: themeStyle.scale(4),
      width: themeStyle.scale(8),
    },
  }
}
