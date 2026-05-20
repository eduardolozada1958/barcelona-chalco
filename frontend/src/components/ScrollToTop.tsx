import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Al cambiar de ruta, vuelve arriba (evita quedarse abajo al entrar a un perfil). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
