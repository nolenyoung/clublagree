/* eslint-disable no-useless-escape */
import child_process from 'child_process'
import fs from 'fs-extra'
// const glob = require('glob')
// import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'
import util from 'util'
import appList from './localCopyAppList.js'
const exec = util.promisify(child_process.exec)

const copyDependencyFiles = false
const copyIcons = true

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appsPath = path.resolve(__dirname, '../')
const templateApp = 'ClubLagree'

function getAppPaths(app) {
  const rootPath = appsPath + `/${app}`
  const dir_src = rootPath + '/src'
  return {
    rootPath,
    dir_android_app: rootPath + '/android/app',
    dir_android_debug_java: rootPath + '/android/app/src/debug/java/',
    dir_android_debug_res: rootPath + '/android/app/src/debug/res/',
    dir_android_main: rootPath + '/android/app/src/main/java/',
    dir_android_release: rootPath + '/android/app/src/release/java/',
    dir_hiddenBundle: rootPath + '/.bundle',
    dir_components: dir_src + '/components',
    dir_flowTyped: rootPath + '/flow-typed',
    dir_global: dir_src + '/global',
    dir_gradleWrapper: rootPath + '/android/gradle/wrapper',
    dir_husky: rootPath + '/.husky',
    dir_ios: rootPath + '/ios',
    dir_media: dir_src + '/assets/media',
    dir_modules: rootPath + '/modules',
    dir_redux: dir_src + '/redux',
    dir_screens: dir_src + '/screens',
    dir_src,
    dir_tests: rootPath + '/__tests__',
    dir_yarn_patches: rootPath + '/.yarn/patches',
    dir_yarn_plugins: rootPath + '/.yarn/plugins',
    dir_yarn_releases: rootPath + '/.yarn/releases',
    file_androidManifestDebug: rootPath + '/android/app/src/debug/AndroidManifest.xml',
    file_androidManifestMain: rootPath + '/android/app/src/main/AndroidManifest.xml',
    file_androidResValuesStyles: rootPath + '/android/app/src/main/res/values/styles.xml',
    file_androidResXMLFilepaths: rootPath + '/android/app/src/main/res/xml/filepaths.xml',
    file_androidRNEditTextMaterial:
      rootPath + '/android/app/src/main/res/drawable/rn_edit_text_material.xml',
    file_androidSentryProperties: rootPath + '/android/sentry.properties',
    file_app: dir_src + '/App.tsx',
    file_app_config: rootPath + '/config.js',
    file_babel_config: rootPath + '/babel.config.js',
    file_bitrise_yml: rootPath + '/bitrise.yml',
    file_buildGradle: rootPath + '/android/build.gradle',
    file_buildGradleApp: rootPath + '/android/app/build.gradle',
    file_copy_script: rootPath + '/localCopy.js',
    file_deploy: rootPath + '/deploy.js',
    file_eslintConfig: rootPath + '/eslint.config.mjs',
    file_firebaseJSON: rootPath + '/firebase.json',
    file_gemfile: rootPath + '/Gemfile',
    file_gemfile_lock: rootPath + '/Gemfile.lock',
    file_gitignore: rootPath + '/.gitignore',
    file_globalTypes: rootPath + '/global.d.ts',
    file_gradle_properties: rootPath + '/android/gradle.properties',
    file_gradle_settings: rootPath + '/android/settings.gradle',
    file_gradlew: rootPath + '/android/gradlew',
    file_gradlewbat: rootPath + '/android/gradlew.bat',
    file_flow: rootPath + '/.flowconfig',
    file_fontFitness_android: rootPath + '/android/app/src/main/assets/fonts/fitness.ttf',
    file_fontFitness_assets: dir_src + '/assets/fonts/fitness.ttf',
    file_index: rootPath + '/index.js',
    file_iosSentryProperties: rootPath + '/ios/sentry.properties',
    file_jest_config: rootPath + '/jest.config.js',
    file_metro_config: rootPath + '/metro.config.js',
    file_package_json: rootPath + '/package.json',
    file_podfile: rootPath + '/ios/Podfile',
    file_prettierrc: rootPath + '/.prettierrc.js',
    file_reactnativeconfig: rootPath + '/react-native.config.js',
    file_reactotronconfig: rootPath + '/ReactotronConfig.js',
    file_readme: rootPath + '/README.md',
    file_routes: dir_src + '/Routes.tsx',
    file_ruby_version: rootPath + '/.ruby-version',
    file_tsconfig: rootPath + '/tsconfig.json',
    file_xcode_env: rootPath + '/ios/.xcode.env',
    file_yarn_lock: rootPath + '/yarn.lock',
    file_yarn_yml: rootPath + '/.yarnrc.yml',
  }
}

;(async function copyFiles() {
  const templatePaths = getAppPaths(templateApp)
  const template_package_json = await fs.readJson(templatePaths.file_package_json)
  const templateIOSDir = await fs.readdir(templatePaths.dir_ios)
  let templateIOSProjectName = null
  for (const item of templateIOSDir) {
    if (item.endsWith('.xcodeproj')) {
      templateIOSProjectName = item.replace('.xcodeproj', '')
      break
    }
  }
  const templateAppBuildGradleContent = await fs.readFile(
    templatePaths.file_buildGradleApp,
    'utf-8',
  )
  const templateAppBuildGradleMatches =
    templateAppBuildGradleContent.match(/(applicationId ".*[^\s]")/gim)
  const templatePackageCom = templateAppBuildGradleMatches[0].replace(/(applicationId |")/gi, '')
  const templateComPath = templatePackageCom.split('.').join('/')
  const templateAndroidSentryPropertiesContent = await fs.readFile(
    templatePaths.file_androidSentryProperties,
    'utf-8',
  )
  const templateIOSSentryPropertiesContent = await fs.readFile(
    templatePaths.file_iosSentryProperties,
    'utf-8',
  )
  const templateAndroidSentryPropertiesMatches = templateAndroidSentryPropertiesContent.match(
    /(defaults.project=.*[^\s])/gim,
  )
  const templateSentryProjectName = templateAndroidSentryPropertiesMatches[0].replace(
    /(defaults.project=)/gim,
    '',
  )
  try {
    for (const app of appList) {
      if (app === templateApp) {
        continue
      }
      // eslint-disable-next-line no-console
      console.log(`Now copying to ${app}`)
      const paths = getAppPaths(app)
      const EXCLUDED_COMPONENTS = ['Menu.tsx']
      const EXCLUDED_GLOBAL = ['Brand.tsx']
      let excludedScreens = ['Auth.tsx', 'Splash.tsx'] // Splash screen updates are performed at end of script. Leave in excluded list to prevent overwrite of UI logic
      await fs.copy(templatePaths.file_copy_script, paths.file_copy_script)
      await fs.copy(templatePaths.dir_hiddenBundle, paths.dir_hiddenBundle)
      await fs.copy(templatePaths.dir_gradleWrapper, paths.dir_gradleWrapper)
      await fs.copy(templatePaths.dir_husky, paths.dir_husky)
      await fs.emptyDir(paths.dir_modules)
      await fs.copy(templatePaths.dir_modules, paths.dir_modules)
      await fs.emptyDir(paths.dir_tests)
      await fs.copy(templatePaths.dir_tests, paths.dir_tests)
      await fs.emptyDir(paths.dir_yarn_patches)
      await fs.copy(templatePaths.dir_yarn_patches, paths.dir_yarn_patches)
      await fs.emptyDir(paths.dir_yarn_releases)
      await fs.copy(templatePaths.dir_yarn_releases, paths.dir_yarn_releases)
      await fs.emptyDir(paths.dir_yarn_plugins)
      await fs.copy(templatePaths.dir_yarn_plugins, paths.dir_yarn_plugins)
      await fs.copy(templatePaths.file_androidManifestDebug, paths.file_androidManifestDebug)
      const package_json = await fs.readJson(paths.file_package_json)
      await fs.outputJSON(
        paths.file_package_json,
        {
          ...template_package_json,
          name: package_json.name,
          version: package_json.version,
        },
        { spaces: 2 },
      )
      const originalAndroidSentryProperties = await fs.readFile(
        paths.file_androidSentryProperties,
        'utf-8',
      )
      const originalAndroidSentryPropertiesMatches = originalAndroidSentryProperties.match(
        /(defaults.project=.*[^\s])/gim,
      )
      const sentryProjectName = originalAndroidSentryPropertiesMatches[0].replace(
        /(defaults.project=)/gim,
        '',
      )
      await fs.writeFile(
        paths.file_androidSentryProperties,
        templateAndroidSentryPropertiesContent.replace(
          templateSentryProjectName,
          sentryProjectName,
        ),
        'utf-8',
      )
      const originalMainAndroidManifestContent = await fs.readFile(
        paths.file_androidManifestMain,
        'utf-8',
      )
      const originalMainAndroidManifestMatches = originalMainAndroidManifestContent.match(
        /(<data android:scheme="(?!mailto)(\w|-)+" \/>|android:value="(\w|-)+-notifications")/gi,
      )
      await fs.copy(templatePaths.file_androidManifestMain, paths.file_androidManifestMain)
      const mainAndroidManifestContent = await fs.readFile(paths.file_androidManifestMain, 'utf-8')
      await fs.writeFile(
        paths.file_androidManifestMain,
        mainAndroidManifestContent
          .replace(
            /<data android:scheme="(?!mailto)(\w|-)+" \/>/gi,
            originalMainAndroidManifestMatches[0],
          )
          .replace(
            /android:value="(\w|-)+-notifications"/gi,
            originalMainAndroidManifestMatches[1],
          ),
        'utf-8',
      )
      await fs.copy(templatePaths.file_androidResValuesStyles, paths.file_androidResValuesStyles)
      await fs.copy(templatePaths.file_androidResXMLFilepaths, paths.file_androidResXMLFilepaths)
      await fs.copy(
        templatePaths.file_androidRNEditTextMaterial,
        paths.file_androidRNEditTextMaterial,
      )
      const originalAppBuildGradleContent = await fs.readFile(paths.file_buildGradleApp, 'utf-8')
      const originalAppBuildGradleMatches = originalAppBuildGradleContent.match(
        /(applicationId ".*[^\s]"|versionCode \d*[^\s]|versionName ".*[^\s]"|signingConfigs \{\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*)/gim,
      )
      const iosDir = await fs.readdir(paths.dir_ios)
      let iosProjectName = null
      for (const item of iosDir) {
        if (item.endsWith('.xcodeproj')) {
          iosProjectName = item.replace('.xcodeproj', '')
          break
        }
      }
      const originalIOSProjectContent = await fs.readFile(
        `${paths.dir_ios}/${iosProjectName}.xcodeproj/project.pbxproj`,
        'utf-8',
      )
      const iosResourcesPattern1 = originalIOSProjectContent.match(
        /.*\.(ttf|otf|jpg|png) in Resources \*\/ \= \{isa.*/gim,
      )
      const iosResourcesPattern2 = originalIOSProjectContent.match(
        /.*\.(ttf|otf|jpg|png) in Resources \*\/,.*/gim,
      )
      const iosResourcesPattern3 = originalIOSProjectContent.match(
        /.*\.(ttf|otf|jpg|png) \*\/ \= \{isa.*/gim,
      )
      const iosResourcesPattern4 = originalIOSProjectContent.match(
        /.*\/\* .*\.(ttf|otf) \*\/,.*/gim,
      )
      const iosMediaPattern1 = originalIOSProjectContent.match(/.*\/\* .*\.(jpg|png) \*\/,.*/gim)
      const iosBundleIdMatch = originalIOSProjectContent.match(
        /PRODUCT_BUNDLE_IDENTIFIER = ((?!\.HomeWidget)(?!\.reactjs).)*\s/gim,
      )
      const iosProvisioningMatch = originalIOSProjectContent.match(
        /PROVISIONING_PROFILE_SPECIFIER = ".+";/gi,
      )
      const iosCurrentProjectVersionMatch = originalIOSProjectContent.match(
        /CURRENT_PROJECT_VERSION = \d+/gi,
      )
      const iosDevelopmentTeamMatch = originalIOSProjectContent.match(
        /DEVELOPMENT_TEAM = [^"\n]+;/gi,
      )
      const iosDevelopmentTeam =
        iosDevelopmentTeamMatch?.[0]?.split('=')?.[1]?.replace(';', '')?.trim() ?? 'QU559TLH5Z'
      const iosMarketingVersionMatch = originalIOSProjectContent.match(
        /MARKETING_VERSION = (\d|.)+/gi,
      )
      await fs.copy(
        `${templatePaths.dir_ios}/${templateIOSProjectName}.xcodeproj/project.pbxproj`,
        `${paths.dir_ios}/${iosProjectName}.xcodeproj/project.pbxproj`,
      )
      const iosProjectContent = await fs.readFile(
        `${templatePaths.dir_ios}/${templateIOSProjectName}.xcodeproj/project.pbxproj`,
        'utf-8',
      )
      await fs.writeFile(
        `${paths.dir_ios}/${iosProjectName}.xcodeproj/project.pbxproj`,
        iosProjectContent
          .replace(
            /PROVISIONING_PROFILE_SPECIFIER = ".+";/gi,
            iosProvisioningMatch?.[0] ?? 'PROVISIONING_PROFILE_SPECIFIER = "";',
          )
          .replace(new RegExp(templateIOSProjectName, 'g'), iosProjectName)
          .replace(
            /PRODUCT_BUNDLE_IDENTIFIER = ((?!\.HomeWidget)(?!\.reactjs).)*\s/gim,
            iosBundleIdMatch[0],
          )
          .replace(/DevelopmentTeam = [^"\n]+;/gi, `DevelopmentTeam = ${iosDevelopmentTeam};`)
          .replace(/DEVELOPMENT_TEAM = [^"\n]+;/gi, `DEVELOPMENT_TEAM = ${iosDevelopmentTeam};`)
          .replace(
            /\"DEVELOPMENT_TEAM\[sdk\=iphoneos\*\]\" [^"\n]+;/gi,
            `"DEVELOPMENT_TEAM[sdk=iphoneos*]" = ${iosDevelopmentTeam};`,
          )
          .replace(
            /MARKETING_VERSION = (\d|.)+/gi,
            iosMarketingVersionMatch?.[0] ?? `MARKETING_VERSION = ${package_json.version};`,
          )
          .replace(
            /CURRENT_PROJECT_VERSION = \d+/gi,
            iosCurrentProjectVersionMatch?.[0] ??
              `CURRENT_PROJECT_VERSION = ${originalAppBuildGradleMatches[1]
                .replace('versionCode ', '')
                .trim()}`,
          )
          //
          .replace(/^\s+(.(?!fitness))*\.(ttf|otf|jpg|png) in Resources \*\/ \= \{isa.*\s?/gim, '')
          .replace(
            /^\s+.*fitness\.ttf in Resources \*\/ \= \{isa.*/gim,
            iosResourcesPattern1.join('\n'),
          )
          //
          .replace(/^\s+(.(?!fitness))*\.(ttf|otf|jpg|png) in Resources \*\/,.*\s?/gim, '')
          .replace(/^\s+.*fitness\.ttf in Resources \*\/,.*/gim, iosResourcesPattern2.join('\n'))
          //
          .replace(/^\s+(.(?!fitness))*\.(ttf|otf|jpg|png) \*\/ \= \{isa.*\s?/gim, '')
          .replace(/^\s+.*fitness\.ttf \*\/ \= \{isa.*/gim, iosResourcesPattern3.join('\n'))
          //
          .replace(/^\s+(.(?!fitness))*\.(ttf|otf) \*\/,.*\s?/gim, '')
          .replace(/^\s+.*\/\* fitness\.ttf \*\/,.*/gim, iosResourcesPattern4.join('\n'))
          .replace(/.*\/\* .*\.(jpg|png) \*\/,.*/gim, iosMediaPattern1.join('\n')),
      )
      await fs.copy(
        `${templatePaths.dir_ios}/${templateIOSProjectName}/AppDelegate.h`,
        `${paths.dir_ios}/${iosProjectName}/AppDelegate.h`,
      )
      await fs.copy(
        `${templatePaths.dir_ios}/${templateIOSProjectName}/AppDelegate.mm`,
        `${paths.dir_ios}/${iosProjectName}/AppDelegate.mm`,
      )
      const iosAppDelegateContent = await fs.readFile(
        `${paths.dir_ios}/${iosProjectName}/AppDelegate.mm`,
        'utf-8',
      )
      await fs.writeFile(
        `${paths.dir_ios}/${iosProjectName}/AppDelegate.mm`,
        iosAppDelegateContent.replace(new RegExp(templateIOSProjectName, 'g'), iosProjectName),
      )
      const iosPlistContent = await fs.readFile(
        `${paths.dir_ios}/${iosProjectName}/Info.plist`,
        'utf-8',
      )
      const templateIOSPlistContent = await fs.readFile(
        `${templatePaths.dir_ios}/${templateIOSProjectName}/Info.plist`,
        'utf-8',
      )
      const templateMatch = templateIOSPlistContent.match(
        /<key>NSAppTransportSecurity<\/key>(.|\n)*<key>UIAppFonts<\/key>/gim,
      )
      await fs.writeFile(
        `${paths.dir_ios}/${iosProjectName}/Info.plist`,
        iosPlistContent.replace(
          /<key>NSAppTransportSecurity<\/key>(.|\n)*<key>UIAppFonts<\/key>/gim,
          templateMatch[0],
        ),
      )
      await fs.copy(
        `${templatePaths.dir_ios}/${templateIOSProjectName}/PrivacyInfo.xcprivacy`,
        `${paths.dir_ios}/${iosProjectName}/PrivacyInfo.xcprivacy`,
      )
      await fs.writeFile(
        paths.file_iosSentryProperties,
        templateIOSSentryPropertiesContent.replace(templateSentryProjectName, sentryProjectName),
        'utf-8',
      )
      await fs.remove(`${paths.dir_ios}/${iosProjectName}/ContactUploader.m`)
      await fs.remove(`${paths.dir_ios}/${iosProjectName}/ContactUploader.swift`)
      await fs.remove(`${paths.dir_ios}/${iosProjectName}/KeepAwake.m`)
      await fs.remove(`${paths.dir_ios}/${iosProjectName}/KeepAwake.swift`)
      const comname = originalAppBuildGradleMatches[0].replace(/(applicationId |")/gi, '')
      const comPath = comname.split('.').join('/')
      await fs.remove(`${paths.dir_android_main}${comPath}/newarchitecture`)
      await fs.remove(`${paths.dir_android_main}${comPath}/jni`)
      await fs.remove(`${paths.dir_android_main}../jni`)
      await fs.remove(`${paths.dir_android_debug_java}`)
      await fs.remove(`${paths.dir_android_debug_res}`)
      await fs.remove(`${paths.dir_android_release}`)
      await fs.copy(templatePaths.file_buildGradleApp, paths.file_buildGradleApp)
      const appBuildGradleContent = await fs.readFile(paths.file_buildGradleApp, 'utf-8')
      await fs.writeFile(
        paths.file_buildGradleApp,
        appBuildGradleContent
          .replace(new RegExp(templatePackageCom, 'g'), comname)
          .replace(/versionCode \d+[^\s]/gi, originalAppBuildGradleMatches[1])
          .replace(/versionName .*[^\s]/gi, originalAppBuildGradleMatches[2])
          .replace(
            /signingConfigs \{\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*\s.*/gim,
            originalAppBuildGradleMatches[3],
          ),
        'utf-8',
      )
      // MainActivity
      let androidActivityName = ''
      try {
        const activityContent = await fs.readFile(
          `${paths.dir_android_main}${comPath}/MainActivity.kt`,
          'utf-8',
        )
        const activityMatches = activityContent.match(
          /override fun getMainComponentName\(\)\: String = .*/gim,
        )
        androidActivityName = activityMatches[0].replace(
          /override fun getMainComponentName\(\)\: String = /gim,
          '',
        )
      } catch {
        const activityContent = await fs.readFile(
          `${paths.dir_android_main}${comPath}/MainActivity.java`,
          'utf-8',
        )
        const activityMatches = activityContent.match(
          /protected String getMainComponentName\(\) \{\s.*/gim,
        )
        androidActivityName = activityMatches[0]
          .replace(/protected String getMainComponentName\(\) \{\s.*return/gim, '')
          .trim()
      }
      await fs.copy(
        `${templatePaths.dir_android_main}${templateComPath}/MainActivity.kt`,
        `${paths.dir_android_main}${comPath}/MainActivity.kt`,
      )
      const appMainActivityContent = await fs.readFile(
        `${paths.dir_android_main}${comPath}/MainActivity.kt`,
        'utf-8',
      )
      await fs.writeFile(
        `${paths.dir_android_main}${comPath}/MainActivity.kt`,
        appMainActivityContent
          .replace(new RegExp(templatePackageCom, 'g'), comname)
          .replace(
            /override fun getMainComponentName\(\)\: String = .*/gim,
            `override fun getMainComponentName(): String = ${androidActivityName}`,
          ),
        'utf-8',
      )
      // MainApplication
      await fs.copy(
        `${templatePaths.dir_android_main}${templateComPath}/MainApplication.kt`,
        `${paths.dir_android_main}${comPath}/MainApplication.kt`,
      )
      const appMainApplicationContent = await fs.readFile(
        `${paths.dir_android_main}${comPath}/MainApplication.kt`,
        'utf-8',
      )
      await fs.writeFile(
        `${paths.dir_android_main}${comPath}/MainApplication.kt`,
        appMainApplicationContent.replace(new RegExp(templatePackageCom, 'g'), comname),
        'utf-8',
      )
      await fs.remove(`${paths.dir_android_main}${comPath}/ContactUploader.kt`)
      await fs.remove(`${paths.dir_android_main}${comPath}/CustomPackages.kt`)
      await fs.remove(`${paths.dir_android_main}${comPath}/KeepAwake.kt`)
      await fs.remove(`${paths.dir_android_main}${comPath}/MainActivity.java`)
      await fs.remove(`${paths.dir_android_main}${comPath}/MainApplication.java`)
      await fs.remove(`${paths.dir_android_main}${comPath}/SplashScreen.kt`)
      const originalBitriseYmlContent = await fs.readFile(paths.file_bitrise_yml, 'utf-8')
      const bitriseContentMatches =
        /((?<packageName>package_name: .*)[\s\S]*(?<teamId>team_id: .*)[\s\S]*(?<iosProjectPath>BITRISE_PROJECT_PATH: .*)[\s\S]*(?<iosScheme>BITRISE_SCHEME: .*)[\s\S]*(?<keystorePath>KEYSTORE_PATH: .*))/gim.exec(
          originalBitriseYmlContent,
        ).groups
      const bitriseYmlContent = await fs.readFile(templatePaths.file_bitrise_yml, 'utf-8')
      await fs.copy(templatePaths.file_bitrise_yml, paths.file_bitrise_yml)
      await fs.writeFile(
        paths.file_bitrise_yml,
        bitriseYmlContent
          .replace(/package_name: .*/gi, bitriseContentMatches.packageName)
          .replace(/team_id: .*/gi, bitriseContentMatches.teamId)
          .replace(/BITRISE_PROJECT_PATH: .*/gi, bitriseContentMatches.iosProjectPath)
          .replace(/BITRISE_SCHEME: .*/gi, bitriseContentMatches.iosScheme)
          .replace(/KEYSTORE_PATH: .*/gi, bitriseContentMatches.keystorePath),
        'utf-8',
      )
      await fs.copy(templatePaths.file_babel_config, paths.file_babel_config)
      await fs.copy(templatePaths.file_buildGradle, paths.file_buildGradle)
      await fs.copy(templatePaths.file_gemfile, paths.file_gemfile)
      await fs.copy(templatePaths.file_gemfile_lock, paths.file_gemfile_lock)
      await fs.copy(templatePaths.file_gitignore, paths.file_gitignore)
      await fs.copy(templatePaths.file_globalTypes, paths.file_globalTypes)
      await fs.copy(templatePaths.file_gradle_properties, paths.file_gradle_properties)
      await fs.copy(templatePaths.file_gradle_settings, paths.file_gradle_settings)
      const settingsGradleContent = await fs.readFile(templatePaths.file_gradle_settings, 'utf-8')
      await fs.writeFile(
        paths.file_gradle_settings,
        settingsGradleContent.replace(templateApp, androidActivityName.replace(/\W/g, '')),
        'utf-8',
      )
      await fs.copy(templatePaths.file_gradlew, paths.file_gradlew)
      await fs.copy(templatePaths.file_gradlewbat, paths.file_gradlewbat)
      await fs.copy(templatePaths.file_jest_config, paths.file_jest_config)
      await fs.copy(templatePaths.file_metro_config, paths.file_metro_config)
      await fs.copy(templatePaths.file_podfile, paths.file_podfile)
      const PodfileContent = await fs.readFile(paths.file_podfile, 'utf-8')
      await fs.writeFile(
        paths.file_podfile,
        PodfileContent.replace(new RegExp(templateApp, 'g'), iosProjectName),
        'utf-8',
      )
      if (copyDependencyFiles) {
        await exec('yarn', {
          cwd: paths.rootPath,
          env: { NODE_ENV: 'development', PATH: process.env.PATH },
          shell: '/bin/zsh',
        })
        await exec('yarn run install-pods-local', {
          cwd: paths.rootPath,
          env: { NODE_ENV: 'development', PATH: process.env.PATH },
          shell: '/bin/zsh',
        })
      }
      if (copyIcons) {
        await fs.copy(templatePaths.file_fontFitness_android, paths.file_fontFitness_android)
        await fs.copy(templatePaths.file_fontFitness_assets, paths.file_fontFitness_assets)
      }
      await fs.copy(templatePaths.dir_components, paths.dir_components, {
        filter: function (file) {
          return !EXCLUDED_COMPONENTS.some((f) => file.endsWith(f))
        },
      })
      await fs.copy(templatePaths.dir_global, paths.dir_global, {
        filter: function (file) {
          return !EXCLUDED_GLOBAL.some((f) => file.endsWith(f))
        },
      })
      await fs.copy(templatePaths.dir_media, paths.dir_media, {
        filter: function (file) {
          return (
            file.endsWith(templatePaths.dir_media) ||
            file.startsWith(`${templatePaths.dir_media}/icon`)
          )
        },
      })
      await fs.copy(templatePaths.dir_redux, paths.dir_redux)
      await fs.copy(templatePaths.dir_screens, paths.dir_screens, {
        filter: function (file) {
          return !excludedScreens.some((f) => file.endsWith(f))
        },
      })
      await fs.copy(templatePaths.file_app, paths.file_app)
      await fs.copy(templatePaths.file_deploy, paths.file_deploy)
      await fs.copy(templatePaths.file_eslintConfig, paths.file_eslintConfig)
      await fs.copy(templatePaths.file_firebaseJSON, paths.file_firebaseJSON)
      await fs.copy(templatePaths.file_index, paths.file_index)
      await fs.copy(templatePaths.file_prettierrc, paths.file_prettierrc)
      await fs.copy(templatePaths.file_reactotronconfig, paths.file_reactotronconfig)
      await fs.copy(templatePaths.file_readme, paths.file_readme)
      const readmeContent = await fs.readFile(paths.file_readme, 'utf-8')
      await fs.writeFile(
        paths.file_readme,
        readmeContent.replace(new RegExp(templateApp, 'g'), app),
        'utf-8',
      )
      await fs.copy(templatePaths.file_routes, paths.file_routes)
      await fs.copy(templatePaths.file_ruby_version, paths.file_ruby_version)
      await fs.copy(templatePaths.file_tsconfig, paths.file_tsconfig)
      await fs.copy(templatePaths.file_xcode_env, paths.file_xcode_env)
      await fs.copy(templatePaths.file_yarn_lock, paths.file_yarn_lock)
      await fs.copy(templatePaths.file_yarn_yml, paths.file_yarn_yml)
      await fs.remove(paths.dir_components + '/AppointmentBooking.tsx')
      await fs.remove(paths.dir_components + '/AppointmentBookingMultiple.tsx')
      await fs.remove(paths.dir_components + '/AppointmentCategories.tsx')
      await fs.remove(paths.dir_components + '/AppointmentCategoryItem.tsx')
      await fs.remove(paths.dir_components + '/AppointmentConfirmation.tsx')
      await fs.remove(paths.dir_components + '/AppointmentDateItem.tsx')
      await fs.remove(paths.dir_components + '/AppointmentDates.tsx')
      await fs.remove(paths.dir_components + '/AppointmentServiceItem.tsx')
      await fs.remove(paths.dir_components + '/AppointmentServices.tsx')
      await fs.remove(paths.dir_components + '/AppointmentSessions.tsx')
      await fs.remove(paths.dir_components + '/AppointmentSessionsAlt.tsx')
      await fs.remove(paths.dir_components + '/AppointmentSessionsMultiple.tsx')
      await fs.remove(paths.dir_components + '/AppointmentTime.tsx')
      await fs.remove(paths.dir_components + '/AppointmentTimeSection.tsx')
      await fs.remove(paths.dir_components + '/ModalLocationSelector.tsx')
      await fs.remove(paths.dir_global + '/Icons.json.flow')
      await fs.remove(paths.dir_global + '/KeepAwake.tsx')
      await fs.remove(paths.dir_global + '/StyleBase.tsx')
      await fs.remove(paths.dir_screens + '/AppointmentBooking.tsx')
      await fs.remove(paths.dir_screens + '/Appointments.tsx')
      await fs.remove(paths.dir_screens + '/ForgotPassword.tsx')
      await fs.remove(paths.rootPath + '/.buckconfig')
      await fs.remove(paths.rootPath + '/.flowconfig')
      await fs.remove(paths.rootPath + '/.node-version')
      await fs.remove(paths.rootPath + '/.prettierrc')
      await fs.remove(paths.rootPath + '/flow-typed')
      await fs.remove(paths.rootPath + '/local_copy.js')
      await fs.remove(paths.rootPath + '/patches')
      await fs.remove(paths.rootPath + '/.eslintrc.js')
      await fs.remove(paths.file_reactnativeconfig)
      await fs.remove(paths.dir_android_app + '/_BUCK')
      await fs.remove(paths.dir_android_app + '/build_defs.bzl')
      await fs.remove(paths.dir_ios + `/${iosProjectName}Tests`)
      const templateSplashContent = await fs.readFile(
        `${templatePaths.dir_screens}/Splash.tsx`,
        'utf-8',
      )
      const appSplashContent = await fs.readFile(`${paths.dir_screens}/Splash.tsx`, 'utf-8')
      const componentReturnString = '  return ('
      const templateSplashStrings = templateSplashContent.split(componentReturnString)
      const appSplashStrings = appSplashContent.split(componentReturnString)
      await fs.writeFile(
        `${paths.dir_screens}/Splash.tsx`,
        `${templateSplashStrings[0]}${componentReturnString}${appSplashStrings[1]}`,
        'utf-8',
      )

      // // Upload new signing certs for Apple
      // let { default: appConfig } = await import(paths.file_app_config)
      // const devCert = await fs.readFile(
      //   `${path.resolve(appsPath, '../../')}/AXLECertDev - 2025.p12`,
      // )
      // const prodCert = await fs.readFile(`${path.resolve(appsPath, '../../')}/AXLECert - 2025.p12`)

      // //Dev Cert Upload
      // const devPresignData = await fetch(
      //   `https://api.bitrise.io/v0.1/apps/${appConfig.BITRISE_APP_SLUG}/build-certificates`,
      //   {
      //     body: JSON.stringify({
      //       upload_file_name: 'Apple Development: Geisler Young (QU559TLH5Z)',
      //       upload_file_size: 3300,
      //     }),
      //     headers: {
      //       Authorization: `${process.env.BITRISE_PERSONAL_TOKEN}`,
      //       'Content-Type': 'application/x-www-form-urlencoded',
      //     },
      //     method: 'POST',
      //   },
      // ).then((res) => res.json())
      // const { slug: devSlug, upload_url: devUrl } = devPresignData.data
      // await fetch(devUrl, { body: devCert, method: 'PUT' })
      // await fetch(
      //   `https://api.bitrise.io/v0.1/apps/${appConfig.BITRISE_APP_SLUG}/build-certificates/${devSlug}/uploaded`,
      //   {
      //     headers: {
      //       Authorization: `${process.env.BITRISE_PERSONAL_TOKEN}`,
      //       'Content-Type': 'application/x-www-form-urlencoded',
      //     },
      //     method: 'POST',
      //   },
      // )
      // await fetch(
      //   `https://api.bitrise.io/v0.1/apps/${appConfig.BITRISE_APP_SLUG}/build-certificates/${devSlug}`,
      //   {
      //     body: JSON.stringify({ certificate_password: 'AXLEmobile123!' }),
      //     headers: {
      //       Authorization: `${process.env.BITRISE_PERSONAL_TOKEN}`,
      //       'Content-Type': 'application/x-www-form-urlencoded',
      //     },
      //     method: 'PATCH',
      //   },
      // )

      // // Prod cert upload
      // const prodPresignData = await fetch(
      //   `https://api.bitrise.io/v0.1/apps/${appConfig.BITRISE_APP_SLUG}/build-certificates`,
      //   {
      //     body: JSON.stringify({
      //       upload_file_name: 'Apple Distribution: Geisler Young (QU559TLH5Z)',
      //       upload_file_size: 3237,
      //     }),
      //     headers: {
      //       Authorization: `${process.env.BITRISE_PERSONAL_TOKEN}`,
      //       'Content-Type': 'application/x-www-form-urlencoded',
      //     },
      //     method: 'POST',
      //   },
      // ).then((res) => res.json())
      // const { slug: prodSlug, upload_url: prodUrl } = prodPresignData.data
      // await fetch(prodUrl, { body: prodCert, method: 'PUT' })
      // await fetch(
      //   `https://api.bitrise.io/v0.1/apps/${appConfig.BITRISE_APP_SLUG}/build-certificates/${prodSlug}/uploaded`,
      //   {
      //     headers: {
      //       Authorization: `${process.env.BITRISE_PERSONAL_TOKEN}`,
      //       'Content-Type': 'application/x-www-form-urlencoded',
      //     },
      //     method: 'POST',
      //   },
      // )
      // await fetch(
      //   `https://api.bitrise.io/v0.1/apps/${appConfig.BITRISE_APP_SLUG}/build-certificates/${prodSlug}`,
      //   {
      //     body: JSON.stringify({ certificate_password: 'AXLEmobile123!' }),
      //     headers: {
      //       Authorization: `${process.env.BITRISE_PERSONAL_TOKEN}`,
      //       'Content-Type': 'application/x-www-form-urlencoded',
      //     },
      //     method: 'PATCH',
      //   },
      // )
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
  }
})()
