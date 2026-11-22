export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  /** The results for the current text are on their way: shows the system spinner instead of «✕» (v2.13). */
  loading?: boolean;
}
