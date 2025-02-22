type Props = {
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

class Accordion {
  element: HTMLElement;
  props: Props;
  items: NodeListOf<HTMLElement>;
  headers: NodeListOf<HTMLElement>;
  triggers: NodeListOf<HTMLElement>;
  panels: NodeListOf<HTMLElement>;

  constructor(element: HTMLElement, props?: Partial<Props>) {
    this.element = element;
    this.props = {
      selector: {
        item: ':has(> [data-accordion-header])',
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
    this.items = this.element.querySelectorAll(`${this.props.selector.item}${NOT_NESTED}`);
    this.headers = this.element.querySelectorAll(`${this.props.selector.header}${NOT_NESTED}`);
    this.triggers = this.element.querySelectorAll(`${this.props.selector.trigger}${NOT_NESTED}`);
    this.panels = this.element.querySelectorAll(`${this.props.selector.panel}${NOT_NESTED}`);
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
    this.element.setAttribute('data-accordion-initialized', '');
  }

  private toggle(trigger: HTMLElement, isOpen: boolean): void {
    const element = this.element;
    element.setAttribute('data-accordion-animating', '');
    const name = trigger.getAttribute('data-accordion-name');
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`) as HTMLElement;
      if (isOpen && opened && opened !== trigger) this.close(opened);
    }
    trigger.setAttribute('aria-expanded', String(isOpen));
    const panel = document.getElementById(trigger.getAttribute('aria-controls') as string) as HTMLElement;
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

  private handleClick(event: MouseEvent): void {
    event.preventDefault();
    if (this.element.hasAttribute('data-accordion-animating')) return;
    const trigger = event.currentTarget as HTMLElement;
    this.toggle(trigger, trigger.getAttribute('aria-expanded') !== 'true');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const { key } = event;
    if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const focusables = [...this.triggers].filter(trigger => !trigger.hasAttribute('disabled'));
    const active = document.activeElement as HTMLElement;
    const index = focusables.indexOf(active);
    const length = focusables.length;
    let newIndex = index;
    switch (key) {
      case ' ':
      case 'Enter':
        active.click();
        return;
      case 'ArrowUp':
        newIndex = (index - 1 + length) % length;
        break;
      case 'ArrowDown':
        newIndex = (index + 1) % length;
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
    this.open(document.querySelector(`[aria-controls="${(event.currentTarget as HTMLElement).getAttribute('id')}"]`) as HTMLElement);
  }

  open(trigger: HTMLElement): void {
    this.toggle(trigger, true);
  }

  close(trigger: HTMLElement): void {
    this.toggle(trigger, false);
  }
}

export default Accordion;
