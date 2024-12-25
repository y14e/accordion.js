import { getUUID } from './uuid.js';

// accordion [20241225]
export default class Accordion {
  constructor(a) {
    const b = a.querySelectorAll('[data-accordion-trigger]:not(:scope [data-accordion-header] + * *)');
    b.forEach(c => {
      const d = c.closest('[data-accordion-header]').nextElementSibling;
      c.setAttribute('aria-controls', d.id = d.id || `accordion-panel-${getUUID()}`);
      d.setAttribute('role', 'region');
      d.setAttribute('aria-labelledby', `${d.getAttribute('aria-labelledby') || ''} ${c.id = c.id || 'accordion-trigger-' + getUUID()}`.trim());
      const e = async (a, b) => {
        const c = a.closest('[data-accordion-header]').nextElementSibling;
        const d = c.style;
        c.hidden = false;
        const e = `${c.scrollHeight}px`;
        const f = async () => {
          for (let i = 0; i < 2; i++) {
            await new Promise(requestAnimationFrame);
          }
        };
        c.addEventListener('transitionend', function e(f) {
          if (f.propertyName !== 'max-height') {
            return;
          }
          delete a.dataset.accordionTransitioning;
          if (!b) {
            c.hidden = 'until-found';
          }
          d.maxHeight = d.overflow = '';
          this.removeEventListener('transitionend', e);
        });
        a.dataset.accordionTransitioning = '';
        a.ariaExpanded = b;
        d.maxHeight = b ? 0 : e;
        d.overflow = 'clip';
        await f();
        d.maxHeight = b ? e : 0;
      };
      const f = (a, b) => {
        const c = a.dataset.accordionName;
        e(a, b);
        if (b && c) {
          [...document.querySelectorAll(`[aria-expanded="true"][data-accordion-name="${c}"]`)].filter(b => b !== a).forEach(a => {
            e(a, false);
          });
        }
      };
      c.addEventListener('click', b => {
        b.preventDefault();
        if (a.querySelector('[data-accordion-transitioning]')) {
          return;
        }
        f(c, c.ariaExpanded !== 'true');
      });
      c.addEventListener('keydown', a => {
        const c = a.key;
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(c)) {
          return;
        }
        a.preventDefault();
        const d = [...b].indexOf(document.activeElement);
        const e = b.length;
        const f = b[c === 'ArrowUp' ? d - 1 < 0 ? e - 1 : d - 1 : c === 'ArrowDown' ? (d + 1) % e : c === 'Home' ? 0 : e - 1];
        f.focus();
      });
      d.addEventListener('beforematch', a => {
        f(document.querySelector(`[aria-controls="${a.target.id}"]`), true);
      });
    });
  }
}