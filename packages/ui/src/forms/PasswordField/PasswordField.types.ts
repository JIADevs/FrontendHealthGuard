import type { TextFieldProps } from '../TextField/TextField.types';

export interface PasswordFieldProps
  extends Omit<TextFieldProps, 'type' | 'secureTextEntry' | 'autoComplete' | 'textContentType' | 'keyboardType' | 'autoCapitalize' | 'trailing' | 'multiline'> {
  /** `login` autocompleta la contraseña guardada; `new` sugiere una nueva (formularios.md §8). */
  mode: 'login' | 'new';
}
