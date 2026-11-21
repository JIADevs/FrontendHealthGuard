import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { spacing } from '../../tokens/tokens';
import { useAppTheme } from '../../tokens/ThemeProvider';
import { fieldBox, FieldLabel, FieldErrorText, fieldTextStyle } from '../fieldKit.native';
import type { TextFieldProps } from './TextField.types';

/**
 * Campo de texto v2 (formularios.md §2–3). Lo opcional se marca en la etiqueta con
 * «(opcional)»; `required` ya no dibuja asterisco y solo se conserva por compatibilidad.
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  multiline,
  numberOfLines = 4,
  type,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoFocus,
  returnKeyType,
  accessibilityLabel,
  leadingIcon,
  unit,
  helper,
  trailing,
  secureTextEntry,
  autoComplete,
  textContentType,
  onBlur,
  onSubmitEditing,
  inputRef,
}: TextFieldProps) {
  const t = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      {label ? <FieldLabel t={t} label={label} /> : null}

      <View
        style={[
          fieldBox(t, { focused, error: !!error, disabled }),
          {
            flexDirection: 'row',
            alignItems: multiline ? 'flex-start' : 'center',
            gap: 10,
            paddingVertical: multiline ? spacing[3] : 0,
            minHeight: multiline ? 84 : 48,
          },
        ]}
      >
        {leadingIcon}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={t.text.muted}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error}
          secureTextEntry={secureTextEntry ?? type === 'password'}
          autoComplete={autoComplete as TextInputProps['autoComplete']}
          textContentType={textContentType}
          onSubmitEditing={onSubmitEditing}
          submitBehavior={onSubmitEditing && returnKeyType === 'next' ? 'submit' : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          style={[
            fieldTextStyle(t, true),
            { flex: 1, paddingVertical: multiline ? 0 : spacing[3] },
            multiline && { minHeight: 60, textAlignVertical: 'top' },
          ]}
        />
        {unit ? <Text style={fieldTextStyle(t, false)}>{unit}</Text> : null}
        {trailing}
      </View>

      {error ? (
        <FieldErrorText t={t} message={error} />
      ) : helper ? (
        <Text style={[fieldTextStyle(t, false), { fontSize: 13, color: t.text.secondary }]}>{helper}</Text>
      ) : null}
    </View>
  );
}
