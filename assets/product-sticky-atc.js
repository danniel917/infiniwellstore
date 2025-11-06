class ProductStickyAtc extends HTMLElement {
  // Private fields for better encapsulation
  scrollThrottle = null;
  boundHandlers = {};

  constructor() {
    super();
    // Cache DOM references once
    this.boundHandlers = {
      toggleDropdown: this.onToggleDropdown.bind(this),
      clickItem: this.onClickItem.bind(this),
      clickBody: this.onClickBody.bind(this),
      scroll: this.onScroll.bind(this),
    };
    console.log('sticky atc');
  }

  connectedCallback() {
    // Null-safe element references
    this.form = this.querySelector('form');
    this.dropdown = this.querySelector('.subscription-dropdown');
    this.dropdownHeader = this.querySelector(
      '.subscription-dropdown__header'
    );
    this.dropdownHeaderText = this.querySelector(
      '.subscription-dropdown__header--text'
    );
    this.dropdownItems = this.querySelectorAll(
      '.subscription-dropdown__item'
    );
    this.anchorElement = document.querySelector('.product__actions');
    this.submitButton = this.querySelector('[type="submit"]');
    this.closeButton = this.querySelector(
      '.subscription-dropdown__close'
    );
    this.variantInput = this.querySelector('[name="id"]');
    this.sellingPlanInput = this.querySelector(
      '[name="selling_plan"]'
    );

    if (!this.dropdownHeader || !this.dropdownItems.length) return;

    // Event listeners with cached references
    this.dropdownHeader.addEventListener(
      'click',
      this.boundHandlers.toggleDropdown
    );
    this.dropdownItems.forEach((item) => {
      item.addEventListener('click', this.boundHandlers.clickItem);
    });
    document.addEventListener('click', this.boundHandlers.clickBody);
    window.addEventListener('scroll', this.boundHandlers.scroll, {
      passive: true,
    });
    this.form.addEventListener(
      'submit',
      this.onSubmitHandler.bind(this)
    );
    this.closeButton.addEventListener(
      'click',
      this.closeContent.bind(this)
    );

    // Initial state check
    this.checkScrollPosition();
  }

  disconnectedCallback() {
    // Cleanup all event listeners
    this.dropdownHeader?.removeEventListener(
      'click',
      this.boundHandlers.toggleDropdown
    );
    this.dropdownItems?.forEach((item) => {
      item.removeEventListener('click', this.boundHandlers.clickItem);
    });
    document.removeEventListener(
      'click',
      this.boundHandlers.clickBody
    );
    window.removeEventListener('scroll', this.boundHandlers.scroll);
  }

  // Private methods (ES2022)
  onToggleDropdown(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropdown?.classList.toggle('active');
  }

  onClickItem(e) {
    e.stopPropagation();
    const text = e.currentTarget.textContent;
    if (text.toLowerCase().indexOf('one-time') > -1)
      this.dropdownHeaderText.textContent = 'One-Time';
    else this.dropdownHeaderText.textContent = 'Subscribe & Save';

    this.dropdownItems.forEach((item) => {
      item.classList.toggle('active', item == e.currentTarget);

      let percent = Number(item.dataset.percent);
      const originalPrice = Number(item.dataset.price);
      const discountPrice = originalPrice * percent;

      if (item.classList.contains('active')) {
        if (item.dataset.available.trim() == 'true') {
          this.submitButton.removeAttribute('disabled');
          this.submitButton.textContent = `ADD TO CART | ${this.moneyFormat(discountPrice)}`;
        } else {
          this.submitButton.setAttribute('disabled', 'disabled');
          this.submitButton.textContent = 'Sold Out';
        }

        this.variantInput.value = item.dataset.value.trim();
        this.sellingPlanInput.value = item.dataset.sellingPlan.trim();
      }

      if (discountPrice != originalPrice) {
        item.querySelector(
          '.subscription-dropdown__item-price'
        ).innerHTML =
          `${this.moneyFormat(discountPrice)}<span>${this.moneyFormat(originalPrice)}</span>`;
      } else {
        item.querySelector(
          '.subscription-dropdown__item-price'
        ).innerHTML = `${this.moneyFormat(originalPrice)}`;
      }
    });

    this.closeContent();
  }

  closeContent(e) {
    e?.stopPropagation();
    this.dropdown?.classList.remove('active');
  }

  onClickBody(e) {
    if (
      !this.dropdown.contains(e.target) &&
      !e.target.closest('[data-option], [data-value]')
    ) {
      this.dropdown.classList.remove('active');
    }
  }

  onScroll() {
    if (!this.scrollThrottle) {
      this.scrollThrottle = requestAnimationFrame(() => {
        this.checkScrollPosition();
        this.scrollThrottle = null;
      });
    }
  }

  checkScrollPosition() {
    if (!this.anchorElement) return;
    const rect = this.anchorElement.getBoundingClientRect();
    this.classList.toggle('active', window.scrollY > rect.bottom);
  }

  moneyFormat(money) {
    return `$${(money / 100).toFixed(2)}`;
  }

  async onSubmitHandler(e) {
    e.preventDefault();
    this.closeContent();
    try {
      const formData = new FormData(e.target);
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData,
      });
      const data = await response.json();

      if (data.status) {
        const msgElement = document.getElementById('cart-message');
        msgElement.innerHTML = 'Invalid Quantity!';
        msgElement.style.display = 'block';
        msgElement.classList.add('message-error');
        setTimeout(() => (msgElement.style.display = 'none'), 5000);
        return;
      }

      if (getglobalLib('Mini_Cart') === 'yes') {
        const cartResponse = await fetch('/cart.js');
        const cartData = await cartResponse.json();
        showCartSuccessMessage();
        reloadAjaxCartItemUsingCartAjaxObject(cartData);
        progressBar();
        // Wait for cart to update before showing drawer
        await new Promise((resolve) => setTimeout(resolve, 100));
        addons();
      } else {
        window.location.href = window.routes.cart_url;
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// Safe registration
if (!customElements.get('product-sticky-atc')) {
  customElements.define('product-sticky-atc', ProductStickyAtc);
}
