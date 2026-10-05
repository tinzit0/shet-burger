import { useEffect } from 'react';
export default function ScrollReveals() {
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const main = document.querySelector('main');
    if (!main) return;
    let stop = () => {};
    const configure = () => {
      stop();
      if (motion.matches) return;
      const elements = new Set(), visibleDrift = new Set();
      const selector = '[data-reveal], .menu-item, .review-editorial > article';
      let scrollFrame = 0, pointerFrame = 0, tilted = null, point = null;
      const progressBar = document.querySelector('.reading-progress');
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); observer.unobserve(entry.target); }
      }), { threshold: .06 });
      const observe = root => {
        const found = [...root.querySelectorAll(selector)];
        if (root.matches?.(selector)) found.unshift(root);
        found.forEach(el => {
          if (elements.has(el)) return;
          elements.add(el); el.classList.add('motion-ready', 'reveal-pending'); observer.observe(el);
        });
      };
      const drawScroll = () => {
        scrollFrame = 0;
        const height = window.innerHeight;
        const values = [...visibleDrift].map(el => {
          const rect = el.parentElement.getBoundingClientRect();
          return [el, Math.max(-1, Math.min(1, (height / 2 - rect.top - rect.height / 2) / (height + rect.height) * 2))];
        });
        const range = document.documentElement.scrollHeight - height;
        const progress = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
        values.forEach(([el, value]) => el.style.setProperty('--scroll-progress', value.toFixed(4)));
        main.style.setProperty('--page-scroll', progress.toFixed(4));
        if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
      };
      const queueScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(drawScroll); };
      const driftObserver = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => { if (isIntersecting) visibleDrift.add(target); else visibleDrift.delete(target); });
        queueScroll();
      }, { rootMargin: '100px' });
      main.querySelectorAll('[data-drift]').forEach(el => driftObserver.observe(el));
      observe(main);
      // Category changes and newly loaded reviews also receive entrance animations.
      const mutations = new MutationObserver(records => records.forEach(record => {
        record.removedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          [...elements].forEach(el => { if (node === el || node.contains(el)) { observer.unobserve(el); elements.delete(el); } });
        });
        record.addedNodes.forEach(node => { if (node.nodeType === 1) observe(node); });
      }));
      mutations.observe(main, { childList: true, subtree: true });
      const resetTilt = () => {
        if (tilted) { tilted.style.removeProperty('--tilt-x'); tilted.style.removeProperty('--tilt-y'); tilted.classList.remove('is-tilting'); tilted = null; }
      };
      const drawPointer = () => {
        pointerFrame = 0;
        if (!point || !finePointer.matches) { resetTilt(); return; }
        const target = point.target.closest?.('[data-tilt]');
        if (target !== tilted) resetTilt();
        if (!target) return;
        tilted = target;
        const rect = target.getBoundingClientRect();
        const x = Math.max(-.5, Math.min(.5, (point.x - rect.left) / rect.width - .5));
        const y = Math.max(-.5, Math.min(.5, (point.y - rect.top) / rect.height - .5));
        target.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`);
        target.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`);
        target.classList.add('is-tilting');
      };
      const onPointer = event => {
        if (event.pointerType === 'touch' || !finePointer.matches) return;
        point = { target: event.target, x: event.clientX, y: event.clientY };
        if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
      };
      window.addEventListener('scroll', queueScroll, { passive: true });
      window.addEventListener('resize', queueScroll, { passive: true });
      main.addEventListener('pointermove', onPointer, { passive: true });
      main.addEventListener('pointerleave', resetTilt);
      finePointer.addEventListener('change', resetTilt);
      queueScroll();
      stop = () => {
        observer.disconnect(); driftObserver.disconnect(); mutations.disconnect();
        cancelAnimationFrame(scrollFrame); cancelAnimationFrame(pointerFrame); resetTilt();
        elements.forEach(el => el.classList.remove('motion-ready', 'reveal-pending'));
        main.querySelectorAll('[data-drift]').forEach(el => el.style.removeProperty('--scroll-progress'));
        main.style.removeProperty('--page-scroll');
        if (progressBar) progressBar.style.removeProperty('transform');
        window.removeEventListener('scroll', queueScroll); window.removeEventListener('resize', queueScroll);
        main.removeEventListener('pointermove', onPointer); main.removeEventListener('pointerleave', resetTilt);
        finePointer.removeEventListener('change', resetTilt);
      };
    };
    configure(); motion.addEventListener('change', configure);
    return () => { stop(); motion.removeEventListener('change', configure); };
  }, []);
  return <div className="reading-progress" aria-hidden="true"/>;
}
