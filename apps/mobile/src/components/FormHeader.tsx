import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useAppTheme, spacing, colors } from '@helu/ui';

interface FormHeaderProps {
  title: string;
  onSave: () => void;
  saveButtonText?: string;
  showSaveButton?: boolean;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  onSave,
  saveButtonText = 'Guardar',
  showSaveButton = true,
}) => {
  const navigation = useNavigation();
  const t = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.surface.bgCard, borderBottomColor: t.border.light }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <ArrowLeft size={24} color={t.text.primary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: t.text.primary }]}>{title}</Text>

      {showSaveButton ? (
        <TouchableOpacity onPress={onSave} style={styles.saveButton}>
          <Text style={[styles.saveButtonText, { color: colors.primary[500] }]}>{saveButtonText}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing[2],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: spacing[2],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
});
