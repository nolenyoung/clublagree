import * as React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import Video, { ResizeMode } from 'react-native-video'
import media from '../assets/media'
import { Button, Icon } from '../components'
import { useTheme } from '../global/Hooks'

export default function Auth(props: RootNavigatorScreenProps<'Auth'>) {
  const { navigate, toggleDrawer } = props.navigation
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const onToggleMenu = React.useCallback(() => {
    toggleDrawer()
  }, [])
  return (
    <View style={themeStyle.flexView}>
      <Video
        source={media.backgroundAuthVideo}
        rate={1.0}
        volume={1.0}
        muted={false}
        resizeMode={ResizeMode.COVER}
        repeat={true}
        style={styles.video}
      />
      <View style={themeStyle.content}>
        <TouchableOpacity
          hitSlop={themeStyle.hitSlop}
          onPress={onToggleMenu}
          style={styles.menuButton}>
          <Icon name="menu" style={styles.menuIcon} />
        </TouchableOpacity>
        <View style={themeStyle.bottomButtonView}>
          <Image source={media.logo} style={styles.image} />
          <View style={styles.buttonRow}>
            <Button onPress={() => navigate('Login')} style={styles.logInButton} text="Log In" />
            <Button onPress={() => navigate('Signup')} style={styles.signUpButton} text="Sign Up" />
          </View>
        </View>
      </View>
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    video: { position: 'absolute' as 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
    menuButton: {
      marginLeft: themeStyle.scale(10),
      marginTop: themeStyle.hasNotch ? themeStyle.scale(54) : themeStyle.scale(44),
    },
    menuIcon: { color: themeStyle.textWhite, fontSize: themeStyle.scale(18) },
    image: {
      height: themeStyle.scale(72),
      marginBottom: themeStyle.scale(69),
      resizeMode: 'contain' as 'contain',
      width: themeStyle.scale(72),
    },
    buttonRow: { ...themeStyle.rowAligned, marginBottom: themeStyle.scale(75) },
    signUpButton: { marginLeft: themeStyle.scale(20), width: '40%' as const },
    logInButton: {
      backgroundColor: 'transparent',
      borderColor: themeStyle.white,
      borderWidth: themeStyle.scale(1),
      width: '40%' as const,
    },
  }
}
