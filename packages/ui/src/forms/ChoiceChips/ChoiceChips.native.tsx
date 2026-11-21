import { View } from 'react-native';
import { Chip } from '../../primitives/Chip/Chip.native';
import { spacing } from '../../tokens/tokens';
import type { ChoiceChipsProps } from './ChoiceChips.types';

export function ChoiceChips(props: ChoiceChipsProps) {
  const { options } = props;

  return (
    <View
      accessibilityRole={props.multiple ? 'none' : 'radiogroup'}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}
    >
      {options.map((option) => {
        const selected = props.multiple
          ? props.value.includes(option.value)
          : props.value === option.value;
        return (
          <Chip
            key={option.value}
            label={option.label}
            icon={option.icon}
            variant="option"
            selectionMode={props.multiple ? 'multiple' : 'single'}
            selected={selected}
            onPress={() => {
              if (props.multiple) {
                const next = selected
                  ? props.value.filter((item) => item !== option.value)
                  : [...props.value, option.value];
                props.onChange(next);
                return;
              }
              props.onChange(option.value);
            }}
          />
        );
      })}
    </View>
  );
}
