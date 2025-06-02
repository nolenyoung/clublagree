const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { withSentryConfig } = require('@sentry/react-native/metro')

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: require('node-libs-react-native'),
  },
  transformer: {
    getTransformOptions: async () => ({
      resolver: { assetExts: ['json'] },
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
}

module.exports = mergeConfig(withSentryConfig(getDefaultConfig(__dirname)), config)
