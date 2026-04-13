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
}
