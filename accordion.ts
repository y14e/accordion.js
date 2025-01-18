type AccordionOptions = {
  selector?: {
    header?: string;
    trigger?: string;
    panel?: string;
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
    };
    const NOT_NESTED = `:not(:scope ${this.options.selector.panel} *)`;
    this.triggers = this.element.querySelectorAll(`${this.options.selector.trigger}${NOT_NESTED}`);
    this.panels = this.element.querySelectorAll(`${this.options.selector.panel}${NOT_NESTED}`);
    this.initialize();
  }

  private initialize(): void {
    const id = (): string => {
      return Math.random().toString(36).slice(-8);
    };
    this.triggers.forEach((trigger, i) => {
      trigger.id ||= `accordion-trigger-${id()}`;
      trigger.setAttribute('aria-controls', (this.panels[i].id ||= `accordion-panel-${id()}`));
      trigger.tabIndex = 0;
      trigger.addEventListener('click', e => {
        this.handleClick(e);
      });
      trigger.addEventListener('keydown', e => {
        this.handleKeyDown(e);
      });
    });
    this.panels.forEach((panel, i) => {
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${this.triggers[i].id}`.trim());
      panel.role = 'region';
      panel.addEventListener('beforematch', e => {
        this.handleBeforeMatch(e);
      });
    });
  }

  private toggle(trigger: HTMLElement, isOpen: boolean): void {
    const panel = document.getElementById(trigger.getAttribute('aria-controls') as string) as HTMLElement;
    trigger.dataset.accordionTransitioning = '';
    const name = trigger.dataset.accordionName;
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`) as HTMLElement;
      if (isOpen && opened && opened !== trigger) {
        this.toggle(opened, false);
      }
    }
    trigger.ariaExpanded = String(isOpen);
    panel.hidden = false;
    const height = `${panel.scrollHeight}px`;
    panel.addEventListener('transitionend', function once(e: TransitionEvent): void {
      if (e.propertyName !== 'max-height') {
        return;
      }
      delete trigger.dataset.accordionTransitioning;
      if (!isOpen) {
        panel.setAttribute('hidden', 'until-found');
      }
      panel.style.maxHeight = panel.style.overflow = '';
      this.removeEventListener('transitionend', once);
    });
    panel.style.maxHeight = isOpen ? '0' : height;
    panel.style.overflow = 'clip';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.maxHeight = isOpen ? height : '0';
      });
    });
  }

  private handleClick(e: MouseEvent): void {
    e.preventDefault();
    if (this.element.querySelector('[data-accordion-transitioning]')) {
      return;
    }
    const trigger = e.currentTarget as HTMLElement;
    this.toggle(trigger, trigger.ariaExpanded !== 'true');
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const { key } = e;
    if (![' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
      return;
    }
    e.preventDefault();
    const active = document.activeElement as HTMLElement;
    if ([' ', 'Enter'].includes(key)) {
      active.click();
      return;
    }
    const index = [...this.triggers].indexOf(active);
    const length = this.triggers.length;
    this.triggers[key === 'ArrowUp' ? (index - 1 < 0 ? length - 1 : index - 1) : key === 'ArrowDown' ? (index + 1) % length : key === 'Home' ? 0 : length - 1].focus();
  }

  private handleBeforeMatch(e: Event): void {
    this.toggle(document.querySelector(`[aria-controls="${(e.currentTarget as HTMLElement).id}"]`) as HTMLElement, true);
  }
}

export default Accordion;
