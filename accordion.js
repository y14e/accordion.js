class Accordion {
  constructor(root, options) {
    this.root = root;
    this.defaults = {
      selector: {
        section: ':has(> [data-accordion-header])',
        header: '[data-accordion-header]',
        button: '[data-accordion-button]',
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
    this.sections = this.root.querySelectorAll(`${this.settings.selector.section}${NOT_NESTED}`);
    this.headers = this.root.querySelectorAll(`${this.settings.selector.header}${NOT_NESTED}`);
    this.buttons = this.root.querySelectorAll(`${this.settings.selector.button}${NOT_NESTED}`);
    this.panels = this.root.querySelectorAll(`${this.settings.selector.panel}${NOT_NESTED}`);
    if (!this.sections.length || !this.headers.length || !this.buttons.length || !this.panels.length) return;
    this.animations = Array(this.sections.length).fill(null);
    this.initialize();
  }

  initialize() {
    this.buttons.forEach((button, i) => {
      const id = Math.random().toString(36).slice(-8);
      button.setAttribute('id', button.getAttribute('id') || `accordion-button-${id}`);
      const panel = this.panels[i];
      panel.setAttribute('id', panel.getAttribute('id') || `accordion-panel-${id}`);
      button.setAttribute('aria-controls', panel.getAttribute('id'));
      button.setAttribute('tabindex', this.isFocusable(button) ? '0' : '-1');
      if (!this.isFocusable(button)) button.style.setProperty('pointer-events', 'none');
      button.addEventListener('click', event => this.handleButtonClick(event));
      button.addEventListener('keydown', event => this.handleButtonKeyDown(event));
    });
    this.panels.forEach((panel, i) => {
      const button = this.buttons[i];
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${button.getAttribute('id')}`.trim());
      panel.setAttribute('role', 'region');
      panel.addEventListener('beforematch', event => this.handlePanelBeforeMatch(event));
    });
    this.root.setAttribute('data-accordion-initialized', '');
  }

  isFocusable(element) {
    return element.getAttribute('aria-disabled') !== 'true' && !element.hasAttribute('disabled');
  }

  toggle(button, isOpen, isMatch = false) {
    if ((button.getAttribute('aria-expanded') === 'true') === isOpen) return;
    const name = button.getAttribute('data-accordion-name');
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`);
      if (isOpen && opened && opened !== button) this.close(opened, isMatch);
    }
    const section = button.closest(this.settings.selector.section);
    const height = `${section.offsetHeight}px`;
    button.setAttribute('aria-expanded', String(isOpen));
    section.style.setProperty('overflow', 'clip');
    section.style.setProperty('will-change', [...new Set(window.getComputedStyle(section).getPropertyValue('will-change').split(',')).add('height').values()].filter(value => value !== 'auto').join(','));
    const index = [...this.buttons].indexOf(button);
    let animation = this.animations[index];
    if (animation) animation.cancel();
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    panel.removeAttribute('hidden');
    animation = this.animations[index] = section.animate({ height: [height, `${button.closest(this.settings.selector.header).scrollHeight + (isOpen ? panel.scrollHeight : 0)}px`] }, { duration: !isMatch ? this.settings.animation.duration : 0, easing: this.settings.animation.easing });
    animation.addEventListener('finish', () => {
      this.animations[index] = null;
      if (!isOpen) panel.setAttribute('hidden', 'until-found');
      ['height', 'overflow', 'will-change'].forEach(name => section.style.removeProperty(name));
    });
  }

  handleButtonClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    this.toggle(button, button.getAttribute('aria-expanded') !== 'true');
  }

  handleButtonKeyDown(event) {
    const { key } = event;
    if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const active = document.activeElement;
    if ([' ', 'Enter'].includes(key)) {
      active.click();
      return;
    }
    const focusableButtons = [...this.buttons].filter(this.isFocusable);
    const currentIndex = focusableButtons.indexOf(active);
    const length = focusableButtons.length;
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
    focusableButtons[newIndex].focus();
  }

  handlePanelBeforeMatch(event) {
    this.open(document.querySelector(`[aria-controls="${event.currentTarget.getAttribute('id')}"]`), true);
  }

  open(button, isMatch = false) {
    this.toggle(button, true, isMatch);
  }

  close(button, isMatch = false) {
    this.toggle(button, false, isMatch);
  }
}

export default Accordion;
