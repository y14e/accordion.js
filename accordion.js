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
      animation: {
        duration: 300,
        easing: 'ease',
        ...options?.animation,
      },
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.options.animation.duration = 0;
    }
    const NOT_NESTED = `:not(:scope ${this.options.selector.panel} *)`;
    this.triggers = this.element.querySelectorAll(`${this.options.selector.trigger}${NOT_NESTED}:not(:disabled)`);
    this.panels = this.element.querySelectorAll(`${this.options.selector.panel}${NOT_NESTED}`);
    this.initialize();
  }

  initialize() {
    this.triggers.forEach((trigger, i) => {
      const id = Math.random().toString(36).slice(-8);
      trigger.id ||= `accordion-trigger-${id}`;
      trigger.setAttribute('aria-controls', (this.panels[i].id ||= `accordion-panel-${id}`));
      trigger.tabIndex = 0;
      trigger.addEventListener('click', event => this.handleClick(event));
      trigger.addEventListener('keydown', event => this.handleKeyDown(event));
    });
    this.panels.forEach((panel, i) => {
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${this.triggers[i].id}`.trim());
      panel.role = 'region';
      panel.addEventListener('beforematch', event => this.handleBeforeMatch(event));
    });
  }

  toggle(trigger, isOpen) {
    const element = this.element;
    element.dataset.accordionAnimating = '';
    const name = trigger.dataset.accordionName;
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`);
      if (isOpen && opened && opened !== trigger) this.close(opened);
    }
    trigger.ariaExpanded = String(isOpen);
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    panel.hidden = false;
    const height = `${panel.scrollHeight}px`;
    panel.style.cssText += `
      overflow: clip;
      will-change: max-height;
    `;
    panel.animate({ maxHeight: [isOpen ? '0' : height, isOpen ? height : '0'] }, { duration: this.options.animation.duration, easing: this.options.animation.easing }).addEventListener('finish', () => {
      delete element.dataset.accordionAnimating;
      if (!isOpen) panel.setAttribute('hidden', 'until-found');
      panel.style.maxHeight = panel.style.overflow = panel.style.willChange = '';
    });
  }

  handleClick(event) {
    event.preventDefault();
    if (this.element.hasAttribute('data-accordion-animating')) return;
    const trigger = event.currentTarget;
    this.toggle(trigger, trigger.ariaExpanded !== 'true');
  }

  handleKeyDown(event) {
    const { key } = event;
    if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const active = document.activeElement;
    if ([' ', 'Enter'].includes(key)) {
      active.click();
      return;
    }
    const index = [...this.triggers].indexOf(active);
    const length = this.triggers.length;
    this.triggers[key === 'ArrowUp' ? (index - 1 < 0 ? length - 1 : index - 1) : key === 'ArrowDown' ? (index + 1) % length : key === 'Home' ? 0 : length - 1].focus();
  }

  handleBeforeMatch(event) {
    this.open(document.querySelector(`[aria-controls="${event.currentTarget.id}"]`));
  }

  open(trigger) {
    this.toggle(trigger, true);
  }

  close(trigger) {
    this.toggle(trigger, false);
  }
}

export default Accordion;
