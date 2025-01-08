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
      return Math.random().toString(16).slice(2, 8).padEnd(6, '0');
    };
    this.triggers.forEach((trigger, i) => {
      trigger.id = trigger.id || `accordion-trigger-${id()}`;
      trigger.setAttribute('aria-controls', this.panels[i].id);
      trigger.addEventListener('click', event => {
        this.click(event);
      });
      trigger.addEventListener('keydown', event => {
        this.keydown(event);
      });
    });
    this.panels.forEach((panel, i) => {
      panel.id = panel.id || `accordion-panel-${id()}`;
      panel.setAttribute('aria-labelledby', `${panel.getAttribute('aria-labelledby') || ''} ${this.triggers[i].id}`.trim());
      panel.setAttribute('role', 'region');
      panel.addEventListener('beforematch', event => {
        this.beforematch(event);
      });
    });
  }
  toggle(trigger, open) {
    trigger.dataset.accordionTransitioning = '';
    const name = trigger.dataset.accordionName;
    if (name) {
      const opened = document.querySelector(`[aria-expanded="true"][data-accordion-name="${name}"]`);
      if (open && opened && opened !== trigger) {
        this.toggle(opened, false);
      }
    }
    trigger.ariaExpanded = open;
    const panel = trigger.closest(`${this.options.selector.header}`).nextElementSibling;
    panel.hidden = false;
    const height = `${panel.scrollHeight}px`;
    panel.addEventListener('transitionend', function once(event) {
      if (event.propertyName !== 'max-height') {
        return;
      }
      delete trigger.dataset.accordionTransitioning;
      if (!open) {
        panel.hidden = 'until-found';
      }
      panel.style.maxHeight = panel.style.overflow = '';
      this.removeEventListener('transitionend', once);
    });
    panel.style.maxHeight = open ? 0 : height;
    panel.style.overflow = 'clip';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.maxHeight = open ? height : 0;
      });
    });
  }
  click(event) {
    event.preventDefault();
    if (this.element.querySelector('[data-accordion-transitioning]')) {
      return;
    }
    const trigger = event.currentTarget;
    this.toggle(trigger, trigger.ariaExpanded !== 'true');
  }
  keydown(event) {
    const { key } = event;
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
      return;
    }
    event.preventDefault();
    const index = [...this.triggers].indexOf(document.activeElement);
    const length = this.triggers.length;
    this.triggers[key === 'ArrowUp' ? (index - 1 < 0 ? length - 1 : index - 1) : key === 'ArrowDown' ? (index + 1) % length : key === 'Home' ? 0 : length - 1].focus();
  }
  beforematch(event) {
    this.toggle(document.querySelector(`[aria-controls="${event.currentTarget.id}"]`), true);
  }
}

export default Accordion;
