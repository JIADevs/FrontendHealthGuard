import { View, StyleSheet } from 'react-native';
import { Typography } from '../../primitives/Typography/Typography.native';
import { spacing } from '../../tokens/tokens';
import type { EmptyStateProps } from './EmptyState.types';

export type { EmptyStateProps };

export function EmptyState({ icon, message, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Typography variant="body" color="secondary" align="center">
        {message}
      </Typography>
      {description && (
        <Typography variant="bodySm" color="secondary" align="center">
          {description}
        </Typography>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    padding: spacing[6],
  },
  icon: {
    marginBottom: spacing[1],
  },
  action: {
    marginTop: spacing[2],
  },
});
