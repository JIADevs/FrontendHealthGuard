import { ReactNode } from 'react';

export type CardGridVariant = 'grid' | 'list';

export interface CardGridProps {
  variant?: CardGridVariant;
  children?: ReactNode;
}
