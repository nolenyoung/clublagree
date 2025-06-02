import { Alert, Platform } from 'react-native'
import { Asset, CameraOptions, launchCamera, launchImageLibrary } from 'react-native-image-picker'
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions'

type Data = Partial<CameraOptions> & {
  height?: number
  intro?: string
  multiple?: boolean
  title?: string
  width?: number
}

type SelectedImage = Asset & { filename: string; name: string }

export const selectGallery = async (
  data?: Data,
): Promise<SelectedImage[] | SelectedImage | null> => {
  const { height = 512, mediaType = 'photo', multiple = false, width = 512 } = data ?? {}
  const config = {
    ...data,
    maxHeight: height,
    maxWidth: width,
    mediaType,
    selectionLimit: multiple ? 0 : 1,
  } as CameraOptions
  const result: string =
    Platform.OS === 'android' && Number(Platform.constants.Release) >= 13
      ? RESULTS.GRANTED // Uses the permissionless OS picker
      : await request(
          Platform.OS === 'android'
            ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
            : PERMISSIONS.IOS.PHOTO_LIBRARY,
        )
  if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
    try {
      let { assets: images } = await launchImageLibrary(config)
      if (images != null) {
        let selectedImages: SelectedImage[] = []
        for (let image of images) {
          selectedImages.push({ ...image, filename: image.fileName ?? '', name: 'media.png' })
        }
        return selectedImages.length > 1 ? selectedImages : selectedImages[0]
      }
      return null
    } catch {
      return null
    }
  } else {
    return null
  }
}

export const selectCamera = async (data?: Data): Promise<SelectedImage | null> => {
  const { height = 512, mediaType = 'photo', width = 512 } = data ?? {}
  const config = {
    ...data,
    maxHeight: height,
    maxWidth: width,
    mediaType,
  } as CameraOptions
  const result: string = await request(
    Platform.OS === 'android' ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA,
  )
  if (result === RESULTS.GRANTED) {
    try {
      let { assets } = await launchCamera(config)
      if (assets != null && assets[0] != null) {
        return { ...assets[0], filename: assets[0].fileName ?? '', name: 'media.png' }
      }
      return null
    } catch {
      return null
    }
  } else {
    return null
  }
}

export default function ImageSelector(
  data?: Data,
): Promise<SelectedImage[] | SelectedImage | null> {
  const { intro, title } = data || {}
  return new Promise<SelectedImage[] | SelectedImage | null>((resolve) => {
    Alert.alert(
      title ? title : 'Select Photos',
      intro
        ? intro
        : 'Select photos from your photo library or use the camera to take a new photo.',
      [
        { text: 'Select From Gallery', onPress: () => resolve(selectGallery(data)) },
        { text: 'Use Camera', onPress: () => resolve(selectCamera(data)) },
        { text: 'Cancel' },
      ],
      { cancelable: false },
    )
  })
}
