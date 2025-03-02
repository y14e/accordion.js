type AccordionOptions = {
  selector: {
    item: string;
    header: string;
    trigger: string;
    panel: string;
  };
  animation: {
    duration: number;
    easing: string;
  };
};

interface HTMLElement_animation extends HTMLElement {
  _animation?: Animation | null;
}

class Accordion {
  root: HTMLElement;
  defaults: AccordionOptions;
  settings: AccordionOptions;
  items: NodeListOf<HTMLElement>;
  headers: NodeListOf<HTMLElement>;
  triggers: NodeListOf<HTMLElement>;
  panels: NodeListOf<HTMLElement>;

  constructor(root: HTMLElement, options?: Partial<AccordionOptions>) {
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
    this.initialize();
  }

  private initialize(): void {
    this.triggers.forEach((trigger, i) => {
      const id = Math.random().toString(36).slice(-8);
      trigger.setAttribute('id', trigger.getAttribute('id') || `accordion-trigger-${id}`);
      const panel = this.panels[i];
      panel.setAttribute('id', panel.getAttribute('id') || `accordion-panel-${id}`);
      trigger.setAttribute('aria-controls', panel.getAttribute('id')!);
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

  private toggle(trigger: HTMLElement, isOpen: boolean, isMatch = false): void {
    const name = trigger.getAttribute('data-accordion-name');
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`) as HTMLElement;
      if (isOpen && opened && opened !== trigger) this.close(opened, isMatch);
    }
    const item = trigger.closest(this.settings.selector.item) as HTMLElement_animation;
    const height = `${item.offsetHeight}px`;
    trigger.setAttribute('aria-expanded', String(isOpen));
    item.style.setProperty('overflow', 'clip');
    item.style.setProperty('will-change', [...new Set(window.getComputedStyle(item).getPropertyValue('will-change').split(',')).add('height').values()].filter(value => value !== 'auto').join(','));
    if (item._animation) item._animation.cancel();
    const panel = document.getElementById(trigger.getAttribute('aria-controls') as string) as HTMLElement;
    panel.removeAttribute('hidden');
    item._animation = item.animate({ height: [height, `${trigger.closest(this.settings.selector.header)!.scrollHeight + (isOpen ? panel.scrollHeight : 0)}px`] }, { duration: !isMatch ? this.settings.animation.duration : 0, easing: this.settings.animation.easing });
    item._animation.addEventListener('finish', () => {
      item._animation = null;
      if (!isOpen) panel.setAttribute('hidden', 'until-found');
      ['height', 'overflow', 'will-change'].forEach(name => item.style.removeProperty(name));
    });
  }

  private handleClick(event: MouseEvent): void {
    event.preventDefault();
    const trigger = event.currentTarget as HTMLElement;
    this.toggle(trigger, trigger.getAttribute('aria-expanded') !== 'true');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const { key } = event;
    if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const focusables = [...this.triggers].filter(trigger => !trigger.hasAttribute('disabled'));
    const active = document.activeElement as HTMLElement;
    const currentIndex = focusables.indexOf(active);
    const length = focusables.length;
    let newIndex = currentIndex;
    switch (key) {
      case ' ':
      case 'Enter':
        active.click();
        return;
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

  private handleBeforeMatch(event: Event): void {
    this.open(document.querySelector(`[aria-controls="${(event.currentTarget as HTMLElement).getAttribute('id')}"]`) as HTMLElement, true);
  }

  open(trigger: HTMLElement, isMatch = false): void {
    this.toggle(trigger, true, isMatch);
  }

  close(trigger: HTMLElement, isMatch = false): void {
    this.toggle(trigger, false, isMatch);
  }
}

export default Accordion;
