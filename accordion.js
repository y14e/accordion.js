class Accordion {
  constructor(root, options) {
    this.root = root;
    this.defaults = {
      selector: {
        item: ':has(> [data-accordion-header])',
        header: '[data-accordion-header]',
        trigger: '[data-accordion-trigger]',
        panel: '[data-accordion-header] + *',
      },
      animation: {
        duration: 300,
        easing: 'ease',
      },
    };
    this.settings = {
      selector: { ...this.defaults.selector, ...options?.selector },
      animation: { ...this.defaults.animation, ...options?.animation },
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.settings.animation.duration = 0;
    const NOT_NESTED = `:not(:scope ${this.settings.selector.panel} *)`;
    this.items = this.root.querySelectorAll(`${this.settings.selector.item}${NOT_NESTED}`);
    this.headers = this.root.querySelectorAll(`${this.settings.selector.header}${NOT_NESTED}`);
    this.triggers = this.root.querySelectorAll(`${this.settings.selector.trigger}${NOT_NESTED}`);
    this.panels = this.root.querySelectorAll(`${this.settings.selector.panel}${NOT_NESTED}`);
    if (!this.items.length || !this.headers.length || !this.triggers.length || !this.panels.length) return;
    this.animations = Array(this.items.length).fill(null);
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
    this.root.setAttribute('data-accordion-initialized', '');
  }

  toggle(trigger, isOpen, isMatch = false) {
    const name = trigger.getAttribute('data-accordion-name');
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`);
      if (isOpen && opened && opened !== trigger) this.close(opened, isMatch);
    }
    const item = trigger.closest(this.settings.selector.item);
    const height = `${item.offsetHeight}px`;
    trigger.setAttribute('aria-expanded', String(isOpen));
    item.style.setProperty('overflow', 'clip');
    item.style.setProperty('will-change', [...new Set(window.getComputedStyle(item).getPropertyValue('will-change').split(',')).add('height').values()].filter(value => value !== 'auto').join(','));
    const index = [...this.triggers].indexOf(trigger);
    let animation = this.animations[index];
    if (animation) animation.cancel();
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    panel.removeAttribute('hidden');
    animation = this.animations[index] = item.animate({ height: [height, `${trigger.closest(this.settings.selector.header).scrollHeight + (isOpen ? panel.scrollHeight : 0)}px`] }, { duration: !isMatch ? this.settings.animation.duration : 0, easing: this.settings.animation.easing });
    animation.addEventListener('finish', () => {
      animation = null;
      if (!isOpen) panel.setAttribute('hidden', 'until-found');
      ['height', 'overflow', 'will-change'].forEach(name => item.style.removeProperty(name));
    });
  }

  handleClick(event) {
    event.preventDefault();
    const trigger = event.currentTarget;
    this.toggle(trigger, trigger.getAttribute('aria-expanded') !== 'true');
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
    const focusables = [...this.triggers].filter(trigger => trigger.getAttribute('aria-disabled') !== 'true' && !trigger.hasAttribute('disabled'));
    const currentIndex = focusables.indexOf(active);
    const length = focusables.length;
    let newIndex = currentIndex;
    switch (key) {
      case 'ArrowUp':
        newIndex = (currentIndex - 1 + length) % length;
        break;
      case 'ArrowDown':
        newIndex = (currentIndex + 1) % length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = length - 1;
        break;
    }
    focusables[newIndex].focus();
  }

  handleBeforeMatch(event) {
    this.open(document.querySelector(`[aria-controls="${event.currentTarget.getAttribute('id')}"]`), true);
  }

  open(trigger, isMatch = false) {
    this.toggle(trigger, true, isMatch);
  }

  close(trigger, isMatch = false) {
    this.toggle(trigger, false, isMatch);
  }
}

export default Accordion;
