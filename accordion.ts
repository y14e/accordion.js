type AccordionOptions = {
  selector: {
    section: string;
    header: string;
    button: string;
    panel: string;
  };
  animation: {
    duration: number;
    easing: string;
  };
};

class Accordion {
  root: HTMLElement;
  defaults: AccordionOptions;
  settings: AccordionOptions;
  sections: NodeListOf<HTMLElement>;
  headers: NodeListOf<HTMLElement>;
  buttons: NodeListOf<HTMLElement>;
  panels: NodeListOf<HTMLElement>;
  animations!: (Animation | null)[];

  constructor(root: HTMLElement, options?: Partial<AccordionOptions>) {
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

  private initialize(): void {
    this.buttons.forEach((button, i) => {
      const id = Math.random().toString(36).slice(-8);
      button.setAttribute('id', button.getAttribute('id') || `accordion-button-${id}`);
      const panel = this.panels[i];
      panel.setAttribute('id', panel.getAttribute('id') || `accordion-panel-${id}`);
      button.setAttribute('aria-controls', panel.getAttribute('id')!);
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

  private isFocusable(element: HTMLElement): boolean {
    return element.getAttribute('aria-disabled') !== 'true' && !element.hasAttribute('disabled');
  }

  private toggle(button: HTMLElement, isOpen: boolean, isMatch = false): void {
    if ((button.getAttribute('aria-expanded') === 'true') === isOpen) return;
    const name = button.getAttribute('data-accordion-name');
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`) as HTMLElement;
      if (isOpen && opened && opened !== button) this.close(opened, isMatch);
    }
    const section = button.closest(this.settings.selector.section) as HTMLElement;
    const height = `${section.offsetHeight}px`;
    button.setAttribute('aria-expanded', String(isOpen));
    section.style.setProperty('overflow', 'clip');
    section.style.setProperty('will-change', [...new Set(window.getComputedStyle(section).getPropertyValue('will-change').split(',')).add('height').values()].filter(value => value !== 'auto').join(','));
    const index = [...this.buttons].indexOf(button);
    let animation = this.animations[index];
    if (animation) animation.cancel();
    const panel = document.getElementById(button.getAttribute('aria-controls')!) as HTMLElement;
    panel.removeAttribute('hidden');
    animation = this.animations[index] = section.animate({ height: [height, `${button.closest(this.settings.selector.header)!.scrollHeight + (isOpen ? panel.scrollHeight : 0)}px`] }, { duration: !isMatch ? this.settings.animation.duration : 0, easing: this.settings.animation.easing });
    animation.addEventListener('finish', () => {
      this.animations[index] = null;
      if (!isOpen) panel.setAttribute('hidden', 'until-found');
      ['height', 'overflow', 'will-change'].forEach(name => section.style.removeProperty(name));
    });
  }

  private handleButtonClick(event: MouseEvent): void {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    this.toggle(button, button.getAttribute('aria-expanded') !== 'true');
  }

  private handleButtonKeyDown(event: KeyboardEvent): void {
    const { key } = event;
    if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const active = document.activeElement as HTMLElement;
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

  private handlePanelBeforeMatch(event: Event): void {
    this.open(document.querySelector(`[aria-controls="${(event.currentTarget as HTMLElement).getAttribute('id')}"]`)!, true);
  }

  open(button: HTMLElement, isMatch = false): void {
    this.toggle(button, true, isMatch);
  }

  close(button: HTMLElement, isMatch = false): void {
    this.toggle(button, false, isMatch);
  }
}

export default Accordion;
