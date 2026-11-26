"use client";
import { ChevronRight } from 'lucide-react';
import { Modal } from '../../containers/Modal/Modal.web';
import { ListRow } from '../ListRow/ListRow.web';
import { radii, spacing } from '../../tokens/tokens';
import type { ActionSheetProps } from './ActionSheet.types';

const group: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: spacing[2], padding: '6px 14px',
  borderRadius: radii.card, border: '1px solid var(--color-border)', borderBottomWidth: 4, background: 'var(--color-surface)',
};

/**
 * Web keeps the «⋮» menu on list cards, so this sheet is rarely shown there; when it is, it opens
 * as a small modal with the same two groups (MASTER §7).
 */
export function ActionSheet({ title, actions, destructive = [], onClose }: ActionSheetProps) {
  const run = (fn: () => void) => {
    onClose();
    fn();
  };
  return (
    <Modal title={title} onClose={onClose} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
        <div style={group}>
          {actions.map((a) => (
            <ListRow key={a.key} title={a.label} meta={a.meta} icon={a.icon} tone="neutral" trailing={<ChevronRight size={18} color="var(--color-text-muted)" />} onPress={() => run(a.onPress)} />
          ))}
        </div>
        {destructive.length > 0 ? (
          <div style={group}>
            {destructive.map((a) => (
              <ListRow key={a.key} title={a.label} meta={a.meta} icon={a.icon} destructive onPress={() => run(a.onPress)} />
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
