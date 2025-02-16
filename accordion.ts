type AccordionOptions = {
  selector?: {
    header?: string;
    trigger?: string;
    panel?: string;
  };
  animation?: {
    duration?: number;
    easing?: string;
  };
};

class Accordion {
  element: HTMLElement;
  options: Required<AccordionOptions>;
  triggers: NodeListOf<HTMLElement>;
  panels: NodeListOf<HTMLElement>;

  constructor(element: HTMLElement, options?: AccordionOptions) {
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

  private initialize(): void {
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
      if (panel.hidden) panel.setAttribute('hidden', 'until-found');
      panel.role = 'region';
      panel.addEventListener('beforematch', event => this.handleBeforeMatch(event));
    });
  }

  private toggle(trigger: HTMLElement, isOpen: boolean): void {
    const element = this.element;
    element.dataset.accordionAnimating = '';
    const name = trigger.dataset.accordionName;
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`) as HTMLElement;
      if (isOpen && opened && opened !== trigger) this.close(opened);
    }
    trigger.ariaExpanded = String(isOpen);
    const panel = document.getElementById(trigger.getAttribute('aria-controls') as string) as HTMLElement;
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

  private handleClick(event: MouseEvent): void {
    event.preventDefault();
    if (this.element.hasAttribute('data-accordion-animating')) return;
    const trigger = event.currentTarget as HTMLElement;
    this.toggle(trigger, trigger.ariaExpanded !== 'true');
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const { key } = event;
    if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const active = document.activeElement as HTMLElement;
    if ([' ', 'Enter'].includes(key)) {
      active.click();
      return;
    }
    const index = [...this.triggers].indexOf(active);
    const length = this.triggers.length;
    this.triggers[key === 'ArrowUp' ? (index - 1 < 0 ? length - 1 : index - 1) : key === 'ArrowDown' ? (index + 1) % length : key === 'Home' ? 0 : length - 1].focus();
  }

  private handleBeforeMatch(event: Event): void {
    this.open(document.querySelector(`[aria-controls="${(event.currentTarget as HTMLElement).id}"]`) as HTMLElement);
  }

  open(trigger: HTMLElement): void {
    this.toggle(trigger, true);
  }

  close(trigger: HTMLElement): void {
    this.toggle(trigger, false);
  }
}

export default Accordion;
