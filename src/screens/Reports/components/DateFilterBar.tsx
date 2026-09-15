import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AppColors, AppShadows } from '../../theme/AppColors';
import { DateFilterType } from '../../../services/ReportsService';

interface DateFilterBarProps {
  selectedFilter: DateFilterType;
  onSelectFilter: (filter: DateFilterType, customStart?: Date, customEnd?: Date) => void;
  customStart?: Date;
  customEnd?: Date;
}

const FILTERS: DateFilterType[] = [
  'Today',
  'Yesterday',
  'This Week',
  'This Month',
  'Last Month',
  'This Year',
  'Custom',
];

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  selectedFilter,
  onSelectFilter,
  customStart,
  customEnd,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [startDate, setStartDate] = useState<Date>(customStart || new Date());
  const [endDate, setEndDate] = useState<Date>(customEnd || new Date());
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  const handlePillPress = (f: DateFilterType) => {
    if (f === 'Custom') {
      setShowCustomModal(true);
    } else {
      onSelectFilter(f);
    }
  };

  const handleApplyCustom = () => {
    setShowCustomModal(false);
    onSelectFilter('Custom', startDate, endDate);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((filter) => {
          const isActive = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => handlePillPress(filter)}
              activeOpacity={0.8}
              style={[
                styles.pill,
                isActive ? styles.pillActive : styles.pillInactive,
              ]}
            >
              {filter === 'Custom' && (
                <Icon
                  name="date-range"
                  size={14}
                  color={isActive ? '#FFFFFF' : AppColors.textSecondary}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[
                  styles.pillText,
                  isActive ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Custom Date Range Modal */}
      <Modal
        visible={showCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Icon name="date-range" size={20} color={AppColors.primary} />
                <Text style={styles.modalTitle}>Select Custom Range</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCustomModal(false)}
                style={styles.closeBtn}
              >
                <Icon name="close" size={20} color={AppColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity
                  onPress={() => setPickerTarget('start')}
                  style={styles.dateSelector}
                >
                  <Icon name="calendar-today" size={16} color={AppColors.primary} />
                  <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity
                  onPress={() => setPickerTarget('end')}
                  style={styles.dateSelector}
                >
                  <Icon name="event" size={16} color={AppColors.primary} />
                  <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {pickerTarget && (
              <DateTimePicker
                value={pickerTarget === 'start' ? startDate : endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setPickerTarget(null);
                  if (selectedDate) {
                    if (pickerTarget === 'start') {
                      setStartDate(selectedDate);
                      if (selectedDate > endDate) {
                        setEndDate(selectedDate);
                      }
                    } else {
                      setEndDate(selectedDate);
                    }
                  }
                }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowCustomModal(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplyCustom}
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    ...AppShadows.glow,
  },
  pillInactive: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pillTextInactive: {
    color: AppColors.textSecondary,
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 20,
    ...AppShadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 6,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },
  dateValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  applyBtn: {
    backgroundColor: AppColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
