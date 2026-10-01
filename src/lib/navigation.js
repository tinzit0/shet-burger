import { useEffect, useState } from 'react';

export const currentPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

// Only public navigation is intercepted. Admin keeps its existing entry points.
export function navigate(path) {
  if (currentPath() !== path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function usePublicRoute() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const update = () => setPath(currentPath());
    const click = event => {
      const link = event.target.closest?.('a[data-route]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
      event.preventDefault();
      navigate(new URL(link.href).pathname);
    };
    window.addEventListener('popstate', update);
    document.addEventListener('click', click);
    return () => { window.removeEventListener('popstate', update); document.removeEventListener('click', click); };
  }, []);
  useEffect(() => {
    if (path.startsWith('/admin')) return;
    document.title = path === '/delivery' ? 'Pedidos · SHET BURGER' : 'SHET BURGER · Hamburguesas en Nonguén';
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [path]);
  return path;
}
