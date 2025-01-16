class Accordion {
  constructor(element, options) {
    this.element = element;
    this.options = {
      selector: {
        header: '[data-accordion-header]',
        trigger: '[data-accordion-trigger]',
        panel: '[data-accordion-header] + *',
        ...options?.selector,
      },
    };
    const NOT_NESTED = `:not(:scope ${this.options.selector.panel} *)`;
    this.triggers = this.element.querySelectorAll(`${this.options.selector.trigger}${NOT_NESTED}`);
    this.panels = this.element.querySelectorAll(`${this.options.selector.panel}${NOT_NESTED}`);
    this.initialize();
  }
  initialize() {
    const id = () => {
      return Math.random().toString(36).slice(-8);
    };
    this.triggers.forEach((trigger, i) => {
      trigger.id ||= `accordion-trigger-${id()}`;
      trigger.setAttribute('aria-controls', (this.panels[i].id ||= `accordion-panel-${id()}`));
      trigger.setAttribute('tabindex', 0);
      trigger.addEventListener('click', e => {
        this.handleClick(e);
      });
      trigger.addEventListener('keydown', e => {
        this.handleKeyDown(e);
      });
    });
    this.panels.forEach((panel, i) => {
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${this.triggers[i].id}`.trim());
      panel.setAttribute('role', 'region');
      panel.addEventListener('beforematch', e => {
        this.handleBeforeMatch(e);
      });
    });
  }
  toggle(trigger, isOpen) {
    trigger.setAttribute('data-accordion-transitioning', '');
    const name = trigger.getAttribute('data-accordion-name');
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`);
      if (isOpen && opened && opened !== trigger) {
        this.toggle(opened, false);
      }
    }
    trigger.setAttribute('aria-expanded', isOpen);
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    panel.removeAttribute('hidden');
    const height = `${panel.scrollHeight}px`;
    panel.addEventListener('transitionend', function once(e) {
      if (e.propertyName !== 'max-height') {
        return;
      }
      trigger.removeAttribute('data-accordion-transitioning');
      if (!isOpen) {
        panel.setAttribute('hidden', 'until-found');
      }
      panel.style.maxHeight = panel.style.overflow = '';
      this.removeEventListener('transitionend', once);
    });
    panel.style.maxHeight = isOpen ? 0 : height;
    panel.style.overflow = 'clip';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.maxHeight = isOpen ? height : 0;
      });
    });
  }
  handleClick(e) {
    e.preventDefault();
    if (this.element.querySelector('[data-accordion-transitioning]')) {
      return;
    }
    const trigger = e.currentTarget;
    this.toggle(trigger, trigger.getAttribute('aria-expanded') !== 'true');
  }
  handleKeyDown(e) {
    const { key } = e;
    if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
      return;
    }
    e.preventDefault();
    const active = document.activeElement;
    if ([' ', 'Enter'].includes(key)) {
      active.click();
      return;
    }
    const index = [...this.triggers].indexOf(active);
    const length = this.triggers.length;
    this.triggers[key === 'ArrowUp' ? (index - 1 < 0 ? length - 1 : index - 1) : key === 'ArrowDown' ? (index + 1) % length : key === 'Home' ? 0 : length - 1].focus();
  }
  handleBeforeMatch(e) {
    this.toggle(document.querySelector(`[aria-controls="${e.currentTarget.id}"]`), true);
  }
}

export default Accordion;
