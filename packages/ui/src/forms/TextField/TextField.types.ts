import type { ReactNode } from 'react';

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
}
