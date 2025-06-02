import * as React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { FileSystem } from 'react-native-file-access'
import ViewShot from 'react-native-view-shot'
import Share from 'react-native-share'
import { Button, CachedImage, Header, Icon, TabBar } from '../components'
import { useTheme } from '../global/Hooks'

async function onShare(badge: Badge, screenRef: any) {
  const { badgeName, shareText } = badge
  try {
    let uri = await screenRef.current?.capture?.()
    let res = await FileSystem.readFile(uri, 'base64')
    let url = 'data:image/jpeg;base64,' + res
    const options = {
      message: shareText,
      title: badgeName,
      type: 'image/jpeg',
      url,
    } as const
    await Share.open(options)
  } catch {
    return
  }
}

export default function BadgeDetail(props: BadgeStackScreenProps<'BadgeDetail'>) {
  const { goBack } = props.navigation
  const { badge } = props.route.params ?? {}
  const { badgeDescription = '', badgeName = '', imgLargeURL } = badge ?? {}
  const screenRef = React.useRef<ViewShot | null>(null)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  return (
    <View style={themeStyle.screen}>
      <Header
        leftComponent={
          <TouchableOpacity hitSlop={themeStyle.hitSlop} onPress={() => goBack()}>
            <Icon name="arrow-back" style={themeStyle.headerIcon} />
          </TouchableOpacity>
        }
        title="Badges"
      />
      <View style={styles.content}>
        <ViewShot
          options={{ format: 'jpg', quality: 0.9 }}
          ref={(ref) => {
            screenRef.current = ref
          }}>
          <CachedImage
            height={themeStyle.scale(379)}
            resizeMode="contain"
            source={imgLargeURL}
            width={themeStyle.window.width - themeStyle.scale(60)}
          />
        </ViewShot>
        <Text style={styles.titleText}>{badgeName}</Text>
        <Text style={styles.descriptionText}>{badgeDescription}</Text>
        <Button
          leftIcon="share"
          onPress={() => {
            onShare(badge, screenRef)
          }}
          style={styles.button}
          text="Share This"
        />
      </View>
      <TabBar />
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    content: { ...themeStyle.content, alignItems: 'center' as 'center' },
    titleText: {
      ...themeStyle.textPrimaryBold20,
      marginBottom: themeStyle.scale(8),
      marginTop: themeStyle.scale(18),
      textAlign: 'center' as 'center',
    },
    descriptionText: { ...themeStyle.textPrimaryRegular14, textAlign: 'center' as 'center' },
    button: {
      height: themeStyle.scale(48),
      marginTop: themeStyle.scale(24),
      width: themeStyle.window.width / 2,
    },
  }
}
