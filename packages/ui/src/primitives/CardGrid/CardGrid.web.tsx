import { CardGridProps } from './CardGrid.types';
import { spacing } from '../../tokens/tokens';

export function CardGrid({ variant = 'list', children }: CardGridProps) {
  const style =
    variant === 'grid'
      ? ({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: spacing[4],
        } as const)
      : ({
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        } as const);

  return <div style={style}>{children}</div>;
}
