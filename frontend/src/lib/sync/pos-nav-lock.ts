export function isPosSafePath(path: string): boolean {
  return path === '/pos' || path.startsWith('/pos/');
}

export function isPosNavLocked(pathname: string | null | undefined, isOnline: boolean): boolean {
  if (!pathname) return false;
  return isPosSafePath(pathname) && !isOnline;
}
