"use client";
import { Typography } from '../../primitives/Typography/Typography.web';
import type { EmptyStateProps } from './EmptyState.types';

export type { EmptyStateProps };

export function EmptyState({ icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon}
      <Typography variant="bodySm" color="secondary">{message}</Typography>
      {description && (
        <Typography variant="bodySm" color="secondary">{description}</Typography>
      )}
      {action}
    </div>
  );
}
