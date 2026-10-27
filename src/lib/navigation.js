import { useEffect, useState } from 'react';

export const currentPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

// Only public navigation is intercepted. Admin keeps its existing entry points.
export function navigate(path) {
  const target = new URL(path, window.location.href);
  const next = `${target.pathname}${target.search}${target.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current !== next) {
    window.history.pushState({}, '', next);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  if (target.hash) window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.querySelector(target.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  else window.scrollTo({ top: 0, behavior: 'instant' });
}

export function usePublicRoute() {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const update = () => setPath(currentPath());
    const click = event => {
      const link = event.target.closest?.('a[data-route]');
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
      event.preventDefault();
      const url = new URL(link.href);
      navigate(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener('popstate', update);
    document.addEventListener('click', click);
    return () => { window.removeEventListener('popstate', update); document.removeEventListener('click', click); };
  }, []);
  useEffect(() => {
    if (path.startsWith('/admin')) return;
    document.title = path === '/delivery' ? 'Pedidos · SHET BURGER' : 'SHET BURGER · Hamburguesas en Nonguén';
    document.getElementById('main-content')?.focus({ preventScroll: true });
    if (window.location.hash) window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' })));
  }, [path]);
  return path;
}
