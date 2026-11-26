import { createContext, useCallback, useContext, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import type { SwipeRowGroupHandle, SwipeRowGroupProps } from './SwipeRow.types';

type Closer = () => void;
interface GroupApi {
  /** A row started opening: close the others */
  opened: (id: string) => void;
  /** A row went back to rest */
  closed: (id: string) => void;
  closeAll: () => void;
  register: (id: string, close: Closer) => () => void;
}

const GroupContext = createContext<GroupApi | null>(null);
/** The row that is open (or being swiped), if any. Its own context so `GroupApi` stays stable. */
const OpenRowContext = createContext<string | null>(null);

/**
 * Only one `SwipeRow` open at a time (movimiento-interacciones.md §4b «Una a la vez»): opening
 * another row, scrolling (`closeAll` from `onScrollBeginDrag`) or tapping any other row closes it.
 */
export function SwipeRowGroup({ children, onRowOpen, ref }: SwipeRowGroupProps & { ref?: Ref<SwipeRowGroupHandle> }) {
  const rows = useRef(new Map<string, Closer>());
  const openId = useRef<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const onRowOpenRef = useRef(onRowOpen);
  onRowOpenRef.current = onRowOpen;

  const closeAll = useCallback(() => {
    if (openId.current) rows.current.get(openId.current)?.();
    openId.current = null;
    setOpenRow(null);
  }, []);

  const api = useMemo<GroupApi>(() => ({
    opened: (id) => {
      if (openId.current && openId.current !== id) rows.current.get(openId.current)?.();
      openId.current = id;
      setOpenRow(id);
      onRowOpenRef.current?.();
    },
    closed: (id) => {
      if (openId.current !== id) return;
      openId.current = null;
      setOpenRow(null);
    },
    closeAll,
    register: (id, close) => {
      rows.current.set(id, close);
      return () => {
        rows.current.delete(id);
        if (openId.current === id) {
          openId.current = null;
          setOpenRow(null);
        }
      };
    },
  }), [closeAll]);

  useImperativeHandle(ref, () => ({ closeAll }), [closeAll]);

  return (
    <GroupContext.Provider value={api}>
      <OpenRowContext.Provider value={openRow}>{children}</OpenRowContext.Provider>
    </GroupContext.Provider>
  );
}

export const useSwipeRowGroup = () => useContext(GroupContext);
export const useOpenSwipeRow = () => useContext(OpenRowContext);
