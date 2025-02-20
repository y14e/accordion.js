class Accordion {
  constructor(element, props) {
    this.element = element;
    this.props = {
      selector: {
        header: '[data-accordion-header]',
        trigger: '[data-accordion-trigger]',
        panel: '[data-accordion-header] + *',
        ...props?.selector,
      },
      animation: {
        duration: 300,
        easing: 'ease',
        ...props?.animation,
      },
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.props.animation.duration = 0;
    const NOT_NESTED = `:not(:scope ${this.props.selector.panel} *)`;
    this.triggers = this.element.querySelectorAll(`${this.props.selector.trigger}${NOT_NESTED}:not(:disabled)`);
    this.panels = this.element.querySelectorAll(`${this.props.selector.panel}${NOT_NESTED}`);
    if (!this.triggers.length || !this.panels.length) return;
    this.initialize();
  }

  initialize() {
    this.triggers.forEach((trigger, i) => {
      const id = Math.random().toString(36).slice(-8);
      trigger.setAttribute('id', trigger.getAttribute('id') || `accordion-trigger-${id}`);
      const panel = this.panels[i];
      panel.setAttribute('id', panel.getAttribute('id') || `accordion-panel-${id}`);
      trigger.setAttribute('aria-controls', panel.getAttribute('id'));
      trigger.setAttribute('tabindex', '0');
      trigger.addEventListener('click', event => this.handleClick(event));
      trigger.addEventListener('keydown', event => this.handleKeyDown(event));
    });
    this.panels.forEach((panel, i) => {
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${this.triggers[i].getAttribute('id')}`.trim());
      if (panel.hasAttribute('hidden')) panel.setAttribute('hidden', 'until-found');
      panel.setAttribute('role', 'region');
      panel.addEventListener('beforematch', event => this.handleBeforeMatch(event));
    });
  }

  toggle(trigger, isOpen) {
    const element = this.element;
    element.setAttribute('data-accordion-animating', '');
    const name = trigger.getAttribute('data-accordion-name');
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`);
      if (isOpen && opened && opened !== trigger) this.close(opened);
    }
    trigger.setAttribute('aria-expanded', String(isOpen));
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    panel.removeAttribute('hidden');
    const height = `${panel.scrollHeight}px`;
    panel.style.setProperty('overflow', 'clip');
    panel.style.setProperty('will-change', [...new Set(window.getComputedStyle(panel).getPropertyValue('will-change').split(',')).add('max-height').values()].filter(value => value !== 'auto').join(','));
    panel.animate({ maxHeight: [isOpen ? '0' : height, isOpen ? height : '0'] }, { duration: this.props.animation.duration, easing: this.props.animation.easing }).addEventListener('finish', () => {
      element.removeAttribute('data-accordion-animating');
      if (!isOpen) panel.setAttribute('hidden', 'until-found');
      ['max-height', 'overflow', 'will-change'].forEach(name => panel.style.removeProperty(name));
    });
  }

  handleClick(event) {
    event.preventDefault();
    if (this.element.hasAttribute('data-accordion-animating')) return;
    const trigger = event.currentTarget;
    this.toggle(trigger, trigger.getAttribute('aria-expanded') !== 'true');
  }

  handleKeyDown(event) {
    const { key } = event;
    if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const active = document.activeElement;
    const position = [...this.triggers].indexOf(active);
    const length = this.triggers.length;
    let index = position;
    switch (key) {
      case ' ':
      case 'Enter':
        active.click();
        return;
      case 'ArrowUp':
        index = (position - 1 + length) % length;
        break;
      case 'ArrowDown':
        index = (position + 1) % length;
        break;
      case 'Home':
        index = 0;
        break;
      case 'End':
        index = length - 1;
        break;
    }
    this.triggers[index].focus();
  }

  handleBeforeMatch(event) {
    this.open(document.querySelector(`[aria-controls="${event.currentTarget.getAttribute('id')}"]`));
  }

  open(trigger) {
    this.toggle(trigger, true);
  }

  close(trigger) {
    this.toggle(trigger, false);
  }
}

export default Accordion;
