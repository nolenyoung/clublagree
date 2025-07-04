import { Platform } from 'react-native'
import { Dirs, FileSystem } from 'react-native-file-access'
import Brand from './Brand'
import { cleanAction, setAction } from '../redux/actions'

const FILE_PREFIX = Platform.OS === 'ios' ? '' : 'file://'
const BASE_DIR = Dirs.CacheDir + '/' + Brand.IMAGE_CACHE_DIRECTORY
let fetchQueue: { [source: string]: true } = {}

function rotate_left(n: number, s: number) {
  let t4 = (n << s) | (n >>> (32 - s))
  return t4
}

function cvt_hex(val: number) {
  let str = ''
  let i
  let v
  for (i = 7; i >= 0; i--) {
    v = (val >>> (i * 4)) & 0x0f
    str += v.toString(16)
  }
  return str
}

function Utf8Encode(string: string) {
  string = string.replace(/\r\n/g, '\n')
  let utftext = ''
  for (let n = 0; n < string.length; n++) {
    let c = string.charCodeAt(n)
    if (c < 128) {
      utftext += String.fromCharCode(c)
    } else if (c > 127 && c < 2048) {
      utftext += String.fromCharCode((c >> 6) | 192)
      utftext += String.fromCharCode((c & 63) | 128)
    } else {
      utftext += String.fromCharCode((c >> 12) | 224)
      utftext += String.fromCharCode(((c >> 6) & 63) | 128)
      utftext += String.fromCharCode((c & 63) | 128)
    }
  }
  return utftext
}

export const sha1 = (msg: string): string => {
  let blockstart
  let i, j
  let W = new Array(80)
  let H0 = 0x67452301
  let H1 = 0xefcdab89
  let H2 = 0x98badcfe
  let H3 = 0x10325476
  let H4 = 0xc3d2e1f0
  let A, B, C, D, E
  let temp
  msg = Utf8Encode(msg)
  let msg_len = msg.length
  let word_array: Array<number> = []
  for (i = 0; i < msg_len - 3; i += 4) {
    j =
      (msg.charCodeAt(i) << 24) |
      (msg.charCodeAt(i + 1) << 16) |
      (msg.charCodeAt(i + 2) << 8) |
      msg.charCodeAt(i + 3)
    word_array.push(j)
  }
  switch (msg_len % 4) {
    case 0:
      i = 0x080000000
      break
    case 1:
      i = (msg.charCodeAt(msg_len - 1) << 24) | 0x0800000
      break
    case 2:
      i = (msg.charCodeAt(msg_len - 2) << 24) | (msg.charCodeAt(msg_len - 1) << 16) | 0x08000
      break
    case 3:
      i =
        (msg.charCodeAt(msg_len - 3) << 24) |
        (msg.charCodeAt(msg_len - 2) << 16) |
        (msg.charCodeAt(msg_len - 1) << 8) |
        0x80
      break
  }

  word_array.push(i)
  while (word_array.length % 16 != 14) word_array.push(0)
  word_array.push(msg_len >>> 29)
  word_array.push((msg_len << 3) & 0x0ffffffff)
  for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
    for (i = 0; i < 16; i++) W[i] = word_array[blockstart + i]
    for (i = 16; i <= 79; i++) W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1)
    A = H0
    B = H1
    C = H2
    D = H3
    E = H4
    for (i = 0; i <= 19; i++) {
      temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5a827999) & 0x0ffffffff
      E = D
      D = C
      C = rotate_left(B, 30)
      B = A
      A = temp
    }
    for (i = 20; i <= 39; i++) {
      temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ed9eba1) & 0x0ffffffff
      E = D
      D = C
      C = rotate_left(B, 30)
      B = A
      A = temp
    }

    for (i = 40; i <= 59; i++) {
      temp =
        (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8f1bbcdc) & 0x0ffffffff
      E = D
      D = C
      C = rotate_left(B, 30)
      B = A
      A = temp
    }

    for (i = 60; i <= 79; i++) {
      temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xca62c1d6) & 0x0ffffffff
      E = D
      D = C
      C = rotate_left(B, 30)
      B = A
      A = temp
    }
    H0 = (H0 + A) & 0x0ffffffff
    H1 = (H1 + B) & 0x0ffffffff
    H2 = (H2 + C) & 0x0ffffffff
    H3 = (H3 + D) & 0x0ffffffff
    H4 = (H4 + E) & 0x0ffffffff
  }
  let newString = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4)
  return newString.toLowerCase()
}

const getPath = (uri: string) => {
  let path = uri.substring(uri.lastIndexOf('/'))
  path = path.indexOf('?') === -1 ? path : path.substring(path.lastIndexOf('.'), path.indexOf('?'))
  const ext = path.indexOf('.') === -1 ? '.jpg' : path.substring(path.indexOf('.'))
  return BASE_DIR + '/' + sha1(uri) + ext
}

export const fetchImage = async ({ source }: { source: string }) => {
  const path = getPath(source)
  try {
    if (!source.includes('http')) {
      setAction('images', { [source]: FILE_PREFIX + source })
    } else {
      if (fetchQueue[source] == null) {
        fetchQueue[source] = true
        let response = await FileSystem.fetch(source, { method: 'GET', path })
        if (response.ok) {
          setAction('images', { [source]: FILE_PREFIX + path })
        } else {
          delete fetchQueue[source]
          // eslint-disable-next-line no-console
          __DEV__ && console.log(response)
        }
        delete fetchQueue[source]
      }
    }
  } catch {
    delete fetchQueue[source]
    try {
      const exists = await FileSystem.exists(BASE_DIR)
      if (exists) {
        await FileSystem.unlink(path)
      }
    } catch {
      return
    }
    setAction('images', { [source]: '' })
  }
}

export const cleanImageCache = async () => {
  try {
    const exists = await FileSystem.exists(BASE_DIR)
    if (exists) {
      await FileSystem.unlink(BASE_DIR)
      await FileSystem.mkdir(BASE_DIR)
    } else {
      await FileSystem.mkdir(BASE_DIR)
    }
    fetchQueue = {}
    cleanAction('images')
  } catch {
    return
  }
}
