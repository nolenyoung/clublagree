import TableRenderer, { tableModel } from '@native-html/table-plugin'
import * as React from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import HTML, { CSSPropertyNameList, MixedStyleDeclaration } from 'react-native-render-html'
import WebView from 'react-native-webview'
import Accordian from './Accordian'
import ItemSeparator from './ItemSeparator'
import { API } from '../global/API'
import { logError, renderHTMLLinks } from '../global/Functions'
import { useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'

type Props = {
  footer?: (arg1: (arg1: boolean) => void) => React.ReactElement
  html?: string
  label?: ContentLabel
  scrollEnabled?: boolean
}

const customHTMLElementModels = { table: tableModel } as const
const ignoredStyles = ['fontFamily', 'fontSize']

export default function HTMLContent(props: Props): React.ReactElement {
  const { footer, html, label, scrollEnabled = true } = props
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [active, setActive] = React.useState<number | null>(null)
  const [content, setContent] = React.useState<any>(null)
  const [selfScrollEnabled, setSelfScrollEnabled] = React.useState(true)
  React.useEffect(() => {
    if (label != null) {
      ;(async function getContent() {
        setAction('loading', { loading: true })
        try {
          let res = await API.getContent({ Label: label })
          setContent(res?.Content ?? [])
          cleanAction('loading')
        } catch (e: any) {
          logError(e)
          setContent([])
          cleanAction('loading')
        }
      })()
    }
  }, [label])
  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={[
        styles.scrollContent,
        footer == null && { padding: themeStyle.scale(20) },
      ]}
      nestedScrollEnabled={true}
      onMoveShouldSetResponderCapture={() => false}
      onStartShouldSetResponderCapture={() => false}
      scrollEnabled={scrollEnabled && selfScrollEnabled}
      showsVerticalScrollIndicator={false}>
      {content == null && html == null && (
        <View style={themeStyle.flexViewCentered}>
          <ActivityIndicator color={themeStyle.textGray} size="large" />
        </View>
      )}
      {(content != null || html != null) &&
        (typeof content === 'string' || typeof html === 'string' ? (
          <HTML
            baseStyle={themeStyle.htmlStyles.p as MixedStyleDeclaration}
            contentWidth={themeStyle.window.width - themeStyle.scale(40)}
            customHTMLElementModels={customHTMLElementModels}
            ignoredStyles={ignoredStyles as CSSPropertyNameList}
            renderers={{ a: renderHTMLLinks, table: TableRenderer }}
            source={{ html: html != null ? html : content }}
            systemFonts={themeStyle.systemFonts}
            tagsStyles={themeStyle.htmlStyles as Record<string, MixedStyleDeclaration>}
            WebView={WebView}
          />
        ) : (
          Array.isArray(content) &&
          content.length > 0 &&
          content.map((section, index) => {
            const expanded = index === active
            return (
              <>
                <Accordian
                  expanded={expanded}
                  key={section.Title}
                  onPress={() => setActive((prevActive) => (index !== prevActive ? index : null))}
                  titleComponent={
                    <HTML
                      baseFontStyle={{
                        ...styles.tags,
                        color:
                          active != null && !expanded ? themeStyle.textGray : themeStyle.textBlack,
                      }}
                      containerStyle={themeStyle.flexView}
                      contentWidth={themeStyle.window.width - themeStyle.scale(72)}
                      source={{ html: section.Title }}
                      tagsStyles={{
                        ...styles.tags,
                        //@ts-ignore
                        color:
                          active != null && !expanded ? themeStyle.textGray : themeStyle.textBlack,
                      }}
                    />
                  }>
                  <HTML
                    baseStyle={themeStyle.htmlStyles.p as MixedStyleDeclaration}
                    contentWidth={themeStyle.window.width - themeStyle.scale(72)}
                    customHTMLElementModels={customHTMLElementModels}
                    ignoredStyles={ignoredStyles as CSSPropertyNameList}
                    renderers={{ a: renderHTMLLinks, table: TableRenderer }}
                    source={{ html: section.Text }}
                    systemFonts={themeStyle.systemFonts}
                    tagsStyles={themeStyle.htmlStyles as Record<string, MixedStyleDeclaration>}
                    WebView={WebView}
                  />
                </Accordian>
                <ItemSeparator />
              </>
            )
          })
        ))}
      {footer && footer(setSelfScrollEnabled)}
    </ScrollView>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    scrollContent: { backgroundColor: themeStyle.white, flexGrow: 1 },
    tags: {
      color: themeStyle.textBlack,
      fontSize: themeStyle.scale(16),
      fontFamily: themeStyle.fontPrimaryBold,
    },
  }
}
