import { useIsFocused } from '@react-navigation/native'
import moment from 'moment'
import * as React from 'react'
import { RefreshControl, SectionList, Text, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import {
  ClassScheduleItem,
  Header,
  Icon,
  ItemSeparator,
  ListEmptyComponent,
  ModalConfirmationCancel,
  ModalFitMetrixBooking,
  ModalUserProfiles,
  TabBar,
} from '../components'
import Brand from '../global/Brand'
import { fetchClasses, getPrebookInfo, logError } from '../global/Functions'
import { useRefreshOnForeground, useTheme } from '../global/Hooks'
import { cleanAction, setAction } from '../redux/actions'
import { cleanFilters } from '../redux/reducers'

const onSignIn = () => setAction('toast', { text: 'Please sign in.' })

export default function Workshops(props: WorkshopStackScreenProps<'WorkshopsBase'>) {
  const { navigate } = props.navigation
  const { customFilters, hideFilters = false } = props.route.params ?? {}
  const isFocused = useIsFocused()
  const currentFilter = useSelector((state: ReduxState) => state.currentFilter)
  const { clientId, numAccounts = 1, personId } = useSelector((state: ReduxState) => state.user)
  const { themeStyle } = useTheme()
  const styles = getStyles(themeStyle)
  const [classes, setClasses] = React.useState<Array<{ key: string; data: ClassInfo[] }>>([])
  const [modalFitMetrixBooking, setModalFitMetrixBooking] = React.useState(false)
  const [modalSwitchAccount, setModalSwitchAccount] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState<any>(null)
  const filterApplied = React.useMemo(() => {
    return Object.keys(cleanFilters).some((key) => {
      if (
        Array.isArray(cleanFilters[key as keyof typeof cleanFilters]) &&
        Array.isArray(currentFilter[key as keyof typeof currentFilter])
      ) {
        return (
          (currentFilter[key as keyof typeof currentFilter] as number[] | string[]).length !== 0
        )
      }
      return (
        cleanFilters[key as keyof typeof cleanFilters] !==
        currentFilter[key as keyof typeof currentFilter]
      )
    })
  }, [currentFilter])
  const signedIn = clientId != null && personId != null
  const onBook = React.useCallback(async (item: ClassInfo) => {
    getPrebookInfo({
      navigate,
      selectedClass: item,
      setModalFitMetrixBooking,
      setSelectedClass,
      workshops: true,
    })
  }, [])
  const onCloseSwitchModal = React.useCallback(() => {
    setModalSwitchAccount(false)
  }, [])
  const onFetchClasses = async () => {
    try {
      let response = await fetchClasses({
        ...(customFilters != null ? customFilters : currentFilter),
        endDate: moment().add(1, 'year').format('YYYY-MM-DD'),
        FutureOnly: true,
        startDate: moment().format('YYYY-MM-DD'),
        workshops: true,
      })
      if (response != null && Array.isArray(response)) {
        let sectionsByDate: {
          [key: string]: Array<ClassInfo>
        } = {}
        for (const classInfo of response) {
          const { StartDateTime } = classInfo
          const startDate = moment(StartDateTime).format('dddd, MMMM D')
          if (sectionsByDate[startDate] != null) {
            sectionsByDate[startDate].push(classInfo)
          } else {
            sectionsByDate[startDate] = [classInfo]
          }
        }
        setClasses(Object.keys(sectionsByDate).map((key) => ({ key, data: sectionsByDate[key] })))
      }
    } catch (e: any) {
      logError(e)
    }
  }
  const onRefresh = React.useCallback((item: BookedClassInfo | ClassInfo) => {
    setClasses((prev) => {
      let newSections = [...prev]
      const sectionIndex = newSections.findIndex(
        (section) => section.key === moment(item.StartDateTime).format('dddd, MMMM D'),
      )
      if (sectionIndex !== -1) {
        let sectionClasses = [...newSections[sectionIndex].data]
        const classIndex = sectionClasses.findIndex(
          (c) => c.RegistrationID === item.RegistrationID && c.ClientID === item.ClientID,
        )
        if (classIndex !== -1) {
          sectionClasses[classIndex] = {
            ...sectionClasses[classIndex],
            UserStatus: {
              ...sectionClasses[classIndex].UserStatus,
              isUserInClass: false,
              isUserOnWaitlist: false,
            },
          }
          newSections[sectionIndex] = { ...newSections[sectionIndex], data: sectionClasses }
        }
      }
      return newSections
    })
    cleanAction('loading')
    setAction('toast', { text: 'Reservation cancelled.', type: 'success' })
  }, [])
  React.useEffect(() => {
    if (isFocused) {
      onFetchClasses()
      cleanAction('bookingDetails')
    }
  }, [currentFilter, customFilters, isFocused])
  useRefreshOnForeground(onFetchClasses)
  return (
    <View style={themeStyle.flexView}>
      <Header
        menu={true}
        {...(Brand.UI_ACCOUNT_SWITCHING && numAccounts > 1
          ? {
              rightIcon: Brand.UI_ACCOUNT_SWITCHING_ICON,
              rightIconPress: () => setModalSwitchAccount(true),
            }
          : {})}
        title={Brand.STRING_SCREEN_TITLE_WORKSHOPS}
      />
      <View style={styles.headerRow}>
        {!hideFilters && (
          <TouchableOpacity
            onPress={() => navigate('ClassFilters', { workshops: true })}
            style={filterApplied ? styles.filterButtonApplied : undefined}>
            <View style={themeStyle.rowAligned}>
              <Icon
                name="sliders"
                style={[
                  styles.filterIcon,
                  filterApplied && { color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys] },
                ]}
              />
              <Text
                style={[
                  themeStyle.textPrimaryRegular14,
                  filterApplied && { color: themeStyle[Brand.BUTTON_TEXT_COLOR as ColorKeys] },
                ]}>
                filters
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
      <SectionList
        contentContainerStyle={themeStyle.listContent}
        // Following props added to address blank/skipping list
        decelerationRate="fast"
        directionalLockEnabled={true}
        disableVirtualization={true}
        extraData={[signedIn, customFilters]}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={(item) =>
          `${item.RegistrationID}${item.Name}${item.Location?.Nickname}${item.ClientID}`
        }
        ListEmptyComponent={
          <ListEmptyComponent
            description="Tweak the 'filter' criteria"
            title={`No ${Brand.STRING_CLASS_TITLE_PLURAL_LC} available.`}
          />
        }
        refreshControl={<RefreshControl onRefresh={onFetchClasses} refreshing={false} />}
        renderItem={({ item }) => {
          const userInClass = item.UserStatus?.isUserInClass
          const userOnWaitlist = item.UserStatus?.isUserOnWaitlist
          return (
            <ClassScheduleItem
              details={item}
              onPress={
                !signedIn
                  ? onSignIn
                  : userInClass && (!Brand.UI_FAMILY_BOOKING || !item.allowFamilyBooking)
                    ? () => setAction('classToCancel', { item, onRefresh, type: 'class' })
                    : userOnWaitlist && (!Brand.UI_FAMILY_BOOKING || !item.allowFamilyBooking)
                      ? () => setAction('classToCancel', { item, onRefresh, type: 'waitlist' })
                      : () => onBook(item)
              }
              showCancel={
                (userInClass || userOnWaitlist) &&
                (!Brand.UI_FAMILY_BOOKING || !item.allowFamilyBooking)
              }
            />
          )
        }}
        renderSectionHeader={({ section }) => (
          <View style={styles.headerView}>
            <Text style={styles.nameText}>{section.key}</Text>
          </View>
        )}
        sections={classes}
        showsVerticalScrollIndicator={false}
        // Following prop added to address blank/skipping list
        windowSize={41}
      />
      <TabBar />
      <ModalConfirmationCancel />
      {Brand.UI_FITMETRIX_BOOKING && selectedClass != null && (
        <ModalFitMetrixBooking
          onClose={() => {
            setSelectedClass(null)
            setModalFitMetrixBooking(false)
            onFetchClasses()
          }}
          selectedClass={selectedClass}
          title={`Book a ${Brand.STRING_CLASS_TITLE}`}
          visible={modalFitMetrixBooking}
        />
      )}
      {modalSwitchAccount && <ModalUserProfiles onClose={onCloseSwitchModal} />}
    </View>
  )
}

function getStyles(themeStyle: ThemeStyle) {
  return {
    headerRow: {
      ...themeStyle.rowAlignedEnd,
      marginVertical: themeStyle.scale(16),
      paddingHorizontal: themeStyle.scale(22),
    },
    filterButtonApplied: {
      backgroundColor: themeStyle.brandPrimary,
      borderRadius: themeStyle.scale(4),
      paddingHorizontal: themeStyle.scale(8),
      paddingVertical: themeStyle.scale(2),
    },
    filterIcon: {
      color: themeStyle.textBlack,
      fontSize: themeStyle.scale(16),
      marginRight: themeStyle.scale(8),
    },
    headerView: {
      ...themeStyle.viewCentered,
      backgroundColor: themeStyle.fadedGray,
      minHeight: themeStyle.scale(40),
    },
    nameText: {
      ...themeStyle.sectionTitleText,
      fontSize: themeStyle.scale(20),
      textAlign: 'center' as 'center',
    },
  }
}
