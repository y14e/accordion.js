import { getUUID } from './uuid.js';

class Accordion {
  constructor(element) {
    this.element = element;
    const NOT_NESTED = ':not(:scope [data-accordion-header] + * *)';
    this.triggers = this.element.querySelectorAll(`[data-accordion-trigger]${NOT_NESTED}`);
    this.triggers
      .forEach(trigger => {
        trigger.id = trigger.id || 'accordion-trigger-' + getUUID();
        const panel = trigger.closest('[data-accordion-header]').nextElementSibling;
        panel.id = panel.id || `accordion-panel-${getUUID()}`;
        trigger.setAttribute('aria-controls', panel.id);
        trigger.addEventListener('click', event => {
          this.click(event);
        });
        trigger.addEventListener('keydown', event => {
          this.keydown(event);
        });
        panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${trigger.id}`.trim());
        panel.setAttribute('role', 'region');
        panel.addEventListener('beforematch', event => {
          this.beforematch(event);
        });
      });
  }
  toggle(trigger, open) {
    trigger.dataset.accordionTransitioning = '';
    const name = trigger.dataset.accordionName;
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`);
      if (open && opened && opened !== trigger) {
        this.toggle(opened, false);
      }
    }
    trigger.ariaExpanded = open;
    const panel = trigger.closest('[data-accordion-header]').nextElementSibling;
    panel.hidden = false;
    const height = `${panel.scrollHeight}px`;
    panel.addEventListener('transitionend', function once(event) {
      if (event.propertyName !== 'max-height') {
        return;
      }
      delete trigger.dataset.accordionTransitioning;
      if (!open) {
        panel.hidden = 'until-found';
      }
      panel.style.maxHeight = panel.style.overflow = '';
      this.removeEventListener('transitionend', once);
    });
    panel.style.maxHeight = open ? 0 : height;
    panel.style.overflow = 'clip';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.maxHeight = open ? height : 0;
      });
    });
  }
  click(event) {
    event.preventDefault();
    if (this.element.querySelector('[data-accordion-transitioning]')) {
      return;
    }
    const trigger = event.currentTarget;
    this.toggle(trigger, trigger.ariaExpanded !== 'true');
  }
  keydown(event) {
    const key = event.key;
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
      return;
    }
    event.preventDefault();
    const index = [...this.triggers].indexOf(document.activeElement);
    const length = this.triggers.length;
    this.triggers[key === 'ArrowUp' ? index - 1 < 0 ? length - 1 : index - 1 : key === 'ArrowDown' ? (index + 1) % length : key === 'Home' ? 0 : length - 1].focus();
  }
  beforematch(event) {
    this.toggle(document.querySelector(`[aria-controls="${event.currentTarget.id}"]`), true);
  }
}

export default Accordion;