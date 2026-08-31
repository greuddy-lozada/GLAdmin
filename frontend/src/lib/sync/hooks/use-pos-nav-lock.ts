import { usePathname } from 'next/navigation';
import { useOffline } from './use-offline';
import { isPosNavLocked } from '../pos-nav-lock';

export { isPosNavLocked, isPosSafePath } from '../pos-nav-lock';

export function usePosNavLock() {
  const pathname = usePathname();
  const { isOnline } = useOffline();
  return {
    isOnline,
    lockNav: isPosNavLocked(pathname, isOnline),
  };
}
