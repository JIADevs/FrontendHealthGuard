import type { ReactNode, Ref } from 'react';

export interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'tel';
  error?: string;
  disabled?: boolean;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'number-pad' | 'numbers-and-punctuation' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  id?: string;
  autoFocus?: boolean;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  accessibilityLabel?: string;
  /** v2 (formularios.md §2): ícono de 18 px dentro del campo, a la izquierda. Solo native por ahora. */
  leadingIcon?: ReactNode;
  /** v2: ayuda persistente bajo el campo; el error la reemplaza. Solo native por ahora. */
  helper?: string;
  /** v2: unidad al final del campo («min», «mg»). Solo native por ahora. */
  unit?: string;
  /** v2: acción al final del campo (mostrar contraseña, limpiar). Área táctil ≥ 44 px. Solo native por ahora. */
  trailing?: ReactNode;
  /** Oculta el texto sin depender de `type` (lo usa `PasswordField` para mostrar u ocultar). */
  secureTextEntry?: boolean;
  /** iOS: tipo de contenido para el autocompletado (formularios.md §8). Solo native. */
  textContentType?: 'emailAddress' | 'password' | 'newPassword' | 'name' | 'telephoneNumber' | 'URL' | 'none';
  /** Validar al salir del campo (formularios.md §6). */
  onBlur?: () => void;
  /** Tecla de retorno: pasar al siguiente campo o enviar. */
  onSubmitEditing?: () => void;
  /** Ref al input nativo, para pasar el foco al primer campo con error. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputRef?: Ref<any>;
}
