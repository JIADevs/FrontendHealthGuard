import { useState } from 'react';
import { Pressable } from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { useAppTheme } from '../../tokens/ThemeProvider';
import { TextField } from '../TextField/TextField.native';
import type { PasswordFieldProps } from './PasswordField.types';

export type { PasswordFieldProps };

/**
 * Contraseña v2 (componentes.md · PasswordField): `TextField` + mostrar u ocultar + autocompletar.
 * El ojo usa `text.secondary` (#64748B): `#94A3B8` no llega a 3:1 sobre el campo (MASTER §3).
 */
export function PasswordField({ mode, leadingIcon, ...rest }: PasswordFieldProps) {
  const t = useAppTheme();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...rest}
      leadingIcon={leadingIcon ?? <Lock size={18} color={t.text.secondary} />}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
      textContentType={mode === 'login' ? 'password' : 'newPassword'}
      trailing={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          hitSlop={12}
          style={{ width: 32, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -6 }}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Icon size={18} color={t.text.secondary} />
        </Pressable>
      }
    />
  );
}
