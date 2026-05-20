import { createContext, useContext, type ReactNode } from 'react';

const MobileMenuContext = createContext(false);

export function MobileMenuProvider({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return <MobileMenuContext.Provider value={open}>{children}</MobileMenuContext.Provider>;
}

/** true cuando el menú hamburguesa del sitio público está abierto */
export function useMobileMenuOpen(): boolean {
  return useContext(MobileMenuContext);
}
