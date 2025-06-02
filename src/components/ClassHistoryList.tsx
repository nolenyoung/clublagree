import moment from 'moment'
import * as React from 'react'
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native'
import FitMetrixSummary from './FitMetrixSummary'
import Icon from './Icon'
import ItemSeparator from './ItemSeparator'
import ListEmptyComponent from './ListEmptyComponent'
import ListItem from './ListItem'
import ModalFilterSelector from './ModalFilterSelector'
import ModalFitMetrixDetails from './ModalFitMetrixDetails'
import TagFamilyMember from './TagFamilyMember'
import Brand from '../global/Brand'
import {
  formatCoachName,
  formatDateHistory,
  formatName,
  getFamilyMemberKey,
} from '../global/Functions'
import { useFamilyClassFiltering, useTheme } from '../global/Hooks'

type Props = {
  classes: Array<BookedClassInfo>
  family: Array<Partial<FamilyMember>>
  onFetch: () => Promise<void>
}

export default function ClassHistoryList(props: Props): React.ReactElement {
  const { classes, family, onFetch } = props
  const { themeStyle } = useTheme()
  const {
    filterApplied,
    filteredClasses,
    modalFilterFamily,
    onSelectFamilyMember,
    onToggleFilterModal,
    selectedFamily,
    showFamilyTag,
  } = useFamilyClassFiltering(classes, family)
  const [selectedClass, setSelectedClass] = React.useState<BookedClassInfo | null>(null)
  return (
    <>
      {selectedClass?.FitMetrixData != null && (
        <ModalFitMetrixDetails classInfo={selectedClass} onClose={() => setSelectedClass(null)} />
      )}
      <FlatList
        contentContainerStyle={themeStyle.scrollContentTabScreen}
        extraData={[family, showFamilyTag]}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={(item) => `${item.RegistrationID}${item.VisitRefNo}`}
        ListEmptyComponent={
          <ListEmptyComponent
            description={`You have no completed ${Brand.STRING_CLASS_TITLE_PLURAL_LC}.`}
            title={`No ${Brand.STRING_CLASS_TITLE_PLURAL_LC}.`}
          />
        }
        ListHeaderComponent={
          family.length > 1 ? (
            <TouchableOpacity onPress={onToggleFilterModal} style={themeStyle.filterButton}>
              <View style={themeStyle.rowAligned}>
                <Icon
                  name="sliders"
                  style={[
                    themeStyle.filterIcon,
                    filterApplied && { color: themeStyle.brandPrimary },
                  ]}
                />
                <Text
                  style={[
                    themeStyle.textPrimaryRegular14,
                    filterApplied && { color: themeStyle.brandPrimary },
                  ]}>
                  filters
                </Text>
              </View>
            </TouchableOpacity>
          ) : null
        }
        data={filterApplied ? filteredClasses : classes}
        refreshControl={<RefreshControl onRefresh={onFetch} refreshing={false} />}
        renderItem={({ item }) => {
          const {
            Coach,
            FirstName,
            FitMetrixData,
            LastName,
            Location: { Nickname },
            Name,
            PersonID,
            StartDateTime,
          } = item
          const member = { FirstName, LastName, PersonID } as const
          return (
            <>
              <ListItem
                description={`${Nickname}${
                  Brand.UI_COACH_HIDE_PAST
                    ? ''
                    : ' ' +
                      formatCoachName({
                        addWith: true,
                        coach: Coach,
                      })
                }`}
                rightText={moment(StartDateTime).format('h:mma')}
                tag={
                  Brand.UI_FAMILY_BOOKING && showFamilyTag && <TagFamilyMember member={member} />
                }
                title={Name}
                value={moment(StartDateTime).calendar(null, formatDateHistory)}
              />
              {Brand.UI_FITMETRIX_STATS && FitMetrixData != null && (
                <FitMetrixSummary data={FitMetrixData} onMore={() => setSelectedClass(item)} />
              )}
            </>
          )
        }}
        showsVerticalScrollIndicator={false}
      />
      {family.length > 1 && (
        <ModalFilterSelector
          getItem={(item) => {
            return {
              selected: selectedFamily.some((m) => m === getFamilyMemberKey(item)),
              text: formatName(item.FirstName, item.LastName),
            }
          }}
          hideSearch={true}
          items={family}
          keyExtractor={getFamilyMemberKey}
          onClose={onToggleFilterModal}
          onSearch={(text) =>
            family.filter((item) =>
              formatName(item.FirstName, item.LastName).toLowerCase().includes(text.toLowerCase()),
            )
          }
          onSelect={onSelectFamilyMember}
          selectedItems={selectedFamily}
          title={`Select Family Members`}
          visible={modalFilterFamily}
        />
      )}
    </>
  )
}
