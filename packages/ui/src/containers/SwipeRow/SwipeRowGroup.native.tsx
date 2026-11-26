import { createContext, useCallback, useContext, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import type { SwipeRowGroupHandle, SwipeRowGroupProps } from './SwipeRow.types';

type Closer = () => void;
interface GroupApi {
  /** A row opened: close the others */
  opened: (id: string) => void;
  register: (id: string, close: Closer) => () => void;
}

const GroupContext = createContext<GroupApi | null>(null);

/** Only one `SwipeRow` open at a time (movimiento-interacciones.md §4b «Una a la vez»). */
export function SwipeRowGroup({ children, ref }: SwipeRowGroupProps & { ref?: Ref<SwipeRowGroupHandle> }) {
  const rows = useRef(new Map<string, Closer>());
  const openId = useRef<string | null>(null);

  const closeAll = useCallback(() => {
    if (openId.current) rows.current.get(openId.current)?.();
    openId.current = null;
  }, []);

  const api = useMemo<GroupApi>(() => ({
    opened: (id) => {
      if (openId.current && openId.current !== id) rows.current.get(openId.current)?.();
      openId.current = id;
    },
    register: (id, close) => {
      rows.current.set(id, close);
      return () => {
        rows.current.delete(id);
        if (openId.current === id) openId.current = null;
      };
    },
  }), []);

  useImperativeHandle(ref, () => ({ closeAll }), [closeAll]);

  return <GroupContext.Provider value={api}>{children}</GroupContext.Provider>;
}

export const useSwipeRowGroup = () => useContext(GroupContext);
