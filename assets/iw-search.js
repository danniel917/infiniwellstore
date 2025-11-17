/*class iwSearch extends HTMLElement {
  constructor() {
    super();
    this.limit = this.dataset.limit;
    this.searchToggles = document.querySelectorAll('.js__search');
    this.trendingProductsCount =
      this.dataset.trendingProducts == 'true';
    this.instantSearchContent = this.querySelector(
      '.instant-search__trending-products'
    );
    this.searchInput = this.querySelector('.instant-search__input');
    this.instantSearch = this.querySelector('.iw-instant-search');
    this.predictiveSearch = this.querySelector(
      '.iw-predictive-search'
    );
    this.collectionResults = this.querySelector(
      '.predictive-search__collection-results'
    );
    this.pageResults = this.querySelector(
      '.predictive-search__page-results'
    );
    this.articleResults = this.querySelector(
      '.predictive-search__article-results'
    );
    this.productResults = this.querySelector(
      '.iw-predictive-search__products'
    );
    this.noResults = this.querySelector(
      '.iw-predictive-search__no-results'
    );
    this.submitButton = this.querySelector(
      '.iw-predictive-search__form-submit'
    );
    this.closeButton = this.querySelector('.js-search-close');
    this.hiddenClass = 'iw-hidden';
    this.trendingProductsSwiper = null;
    this.searchProductsSwiper = null;
    this.trendingProductsSwiperContainer =
      this.instantSearchContent.closest('.swiper');
    this.searchProductsSwiperContainer =
      this.productResults.closest('.swiper');
    this.trendingProductsModalContent = document.querySelector(
      '.instant-search__trending-products-modal'
    );
    this.searchProductsModalContent = document.querySelector(
      '.iw-predictive-search__products-modal'
    );
    this.mainHeader = document.querySelector('.js__main-header');
    this.isMobile = window.innerWidth < 980;

    // Add resize listener to update isMobile value
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 980;
    });
  }

  connectedCallback() {
    if (!this.trendingProductsCount) this.getTrendingProducts();
    else this.initTrendingProductsSlider();
    this.debouncedSearch = this.debounce(
      this.onChangeSearchInput.bind(this),
      1000
    );
    this.searchInput.addEventListener('input', this.debouncedSearch);
    this.searchInput.addEventListener(
      'keydown',
      this.onKeydownSearchInput.bind(this)
    );
    this.searchToggles.forEach((toggle) => {
      toggle.addEventListener(
        'click',
        this.toggleSearchContent.bind(this)
      );
    });
    document.body.addEventListener(
      'click',
      this.onClickBody.bind(this)
    );
    this.closeButton.addEventListener(
      'click',
      this.closeSearchContent.bind(this)
    );
    this.submitButton.addEventListener(
      'click',
      this.submitSearchForm.bind(this)
    );
  }

  submitSearchForm(e) {
    const query = this.searchInput.value;
    window.location.href = `/search?q=${query}`;
  }

  clearSearchInput(e) {
    this.searchInput.value = '';
    this.onChangeSearchInput();
  }

  onClickBody(e) {
    if (!e.target.closest('.iw-search')) {
      this.mainHeader.classList.remove('active');
      this.classList.remove('active');
      this.updateTransparentHeader();
    }
  }

  toggleSearchContent(e) {
    e.preventDefault();
    e.stopPropagation();
    this.mainHeader.classList.toggle('active');
    this.classList.toggle('active');

    if (this.mainHeader.classList.contains('active')) {
      if (!this.isMobile) {
        document.body.classList.remove('transparent-header');
      }
    } else {
      this.updateTransparentHeader();
    }
  }

  async getTrendingProducts() {
    this.instantSearch.classList.add('loading');
    try {
      const response = await fetch(
        '/collections/all/?sort_by=best-selling',
        {
          method: 'GET',
        }
      );
      const responseText = await response.text();

      const parsedDocument = new DOMParser().parseFromString(
        responseText,
        'text/html'
      );
      if (!parsedDocument) {
        console.error('Failed to parse response text');
        return;
      }

      const productCards =
        parsedDocument.querySelectorAll('.product-card');
      if (!this.instantSearchContent) {
        console.error('instantSearchContent is not defined');
        return;
      }

      // Collect all promises
      const promises = Array.from(productCards)
        .slice(0, this.limit)
        .map(async (productCard) => {
          const linkElement = productCard.querySelector('a');
          if (!linkElement) {
            console.error('Link element not found in product card');
            return;
          }
          const handle = linkElement
            .getAttribute('href')
            .split('/')
            .slice(-1)[0];
          const card = await this.fetchProductCard(handle);
          this.instantSearchContent.appendChild(card);
          const modal = await this.fetchProductModal(handle);
          this.trendingProductsModalContent.appendChild(modal);
        });

      // Wait for all promises to resolve
      await Promise.all(promises);

      // Run the slider initialization after all cards are appended
      this.initTrendingProductsSlider();
      this.instantSearch.classList.remove('loading');
    } catch (error) {
      console.error('Error fetching trending products:', error);
      this.instantSearch.classList.remove('loading');
    }
  }

  initTrendingProductsSlider() {
    if (
      this.trendingProductsSwiperContainer.classList.contains(
        'swiper-initialized swiper-horizontal'
      )
    )
      this.trendingProductsSwiper.destroy();
    this.trendingProductsSwiper = new Swiper(
      this.trendingProductsSwiperContainer,
      {
        slidesPerView: 3,
        slidesPerGroup: 3,
        spaceBetween: 8,
        paginationClickable: true,
        pagination: {
          el: this.trendingProductsSwiperContainer
            .previousElementSibling,
          type: 'bullets',
          clickable: true,
        },
        breakpoints: {
          768: {
            slidesPerView: 5,
            slidesPerGroup: 5,
            spaceBetween: 16,
          },
        },
      }
    );
    callRechargeScript(this.trendingProductsModalContent);
  }

  initSearchProductsSlider() {
    if (
      this.searchProductsSwiperContainer.classList.contains(
        'swiper-initialized swiper-horizontal'
      )
    )
      this.searchProductsSwiper.destroy();
    this.searchProductsSwiper = new Swiper(
      this.searchProductsSwiperContainer,
      {
        slidesPerView: 3,
        spaceBetween: 8,
        paginationClickable: true,
        pagination: {
          el: this.searchProductsSwiperContainer
            .previousElementSibling,
          type: 'bullets',
          clickable: true,
        },
        breakpoints: {
          768: {
            slidesPerView: 5,
            spaceBetween: 16,
          },
        },
      }
    );
    callRechargeScript(this.searchProductsModalContent);
  }

  onKeydownSearchInput(e) {
    if (e.code === 'Enter') {
      this.submitSearchForm(e);
    }
  }

  onChangeSearchInput(e) {
    e?.preventDefault();
    const searchQuery = this.searchInput.value;
    this.instantSearch.classList.toggle(
      this.hiddenClass,
      searchQuery
    );
    this.predictiveSearch.classList.toggle(
      this.hiddenClass,
      !searchQuery
    );
    this.clearResults();

    if (searchQuery) {
      this.getSearchResults(searchQuery);
    }
  }

  debounce = (callback, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback(...args), wait);
    };
  };

  clearResults() {
    this.collectionResults.innerHTML = '';
    this.pageResults.innerHTML = '';
    this.articleResults.innerHTML = '';
    this.productResults.innerHTML = '';
  }

  async getSearchResults(searchQuery) {
    this.predictiveSearch.classList.add('loading');
    try {
      const response = await fetch(
        `/search/suggest.json?q=${searchQuery}&resources[limit]=${this.limit}&resources[limit_scope]=each&resources[type]=product,collection,page,article`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      this.renderSearchResults(data.resources.results);
    } catch (error) {
      console.error('Error fetching search results:', error);
      this.predictiveSearch.classList.remove('loading');
    }
  }

  async renderSearchResults(results) {
    this.clearResults();
    this.searchProductsModalContent.innerHTML = '';

    const { collections, pages, products, articles } = results;
    this.toggleResultsVisibility(products.length);

    // Get parent containers
    const collectionContainer = this.collectionResults.closest(
      '.predictive-search__collection'
    );
    const pageContainer = this.pageResults.closest(
      '.predictive-search__page'
    );
    const articleContainer = this.articleResults.closest(
      '.predictive-search__article'
    );
    // Hide or show based on results
    if (collectionContainer) {
      collectionContainer.classList.toggle(
        this.hiddenClass,
        !collections.length
      );
    }
    if (pageContainer) {
      pageContainer.classList.toggle(this.hiddenClass, !pages.length);
    }
    if (articleContainer) {
      articleContainer.classList.toggle(
        this.hiddenClass,
        !(articles && articles.length)
      );
    }

    this.renderLinks(collections, this.collectionResults);
    this.renderLinks(pages, this.pageResults);
    if (articles && articles.length > 0) {
      this.renderArticleLinks(articles, this.articleResults);
    }

    const productFetchPromises = Array.from(products)
      .slice(0, this.limit)
      .map((product) => this.fetchProductCard(product.handle));
    const productCards = await Promise.all(productFetchPromises);
    productCards.forEach((productCard) => {
      if (productCard) {
        productCard.classList.add('fade-in');
        this.productResults.appendChild(productCard);
      }
    });
    const productModalPromises = Array.from(products)
      .slice(0, this.limit)
      .map((product) => this.fetchProductModal(product.handle));
    const productModals = await Promise.all(productModalPromises);
    productModals.forEach((productModal) => {
      if (productModal) {
        this.searchProductsModalContent.appendChild(productModal);
      }
    });
    this.initSearchProductsSlider();
    this.predictiveSearch.classList.remove('loading');
  }

  toggleResultsVisibility(hasProducts) {
    this.productResults.classList.toggle(
      this.hiddenClass,
      !hasProducts
    );
    this.submitButton.classList.toggle(
      this.hiddenClass,
      !hasProducts
    );
    this.noResults.classList.toggle(this.hiddenClass, hasProducts);
  }

  renderLinks(items, container) {
    const linkClass = 'iw-search__link';
    const fragment = document.createDocumentFragment();
    Array.from(items)
      .slice(0, 4)
      .forEach((item) => {
        const link = document.createElement('a');
        link.setAttribute('role', 'link');
        link.setAttribute('tabindex', '0');
        link.setAttribute('title', item.title);
        link.setAttribute('aria-label', item.title);
        link.href = item.url;
        link.className = linkClass;
        link.textContent = item.title;
        fragment.appendChild(link);
      });
    container.appendChild(fragment);
  }

  renderArticleLinks(articles, container) {
    const linkClass = 'iw-search__link iw-search__link--article';
    const fragment = document.createDocumentFragment();
    Array.from(articles)
      .slice(0, 4)
      .forEach((article) => {
        const link = document.createElement('a');
        link.setAttribute('role', 'link');
        link.setAttribute('tabindex', '0');
        link.setAttribute('title', article.title);
        link.setAttribute('aria-label', article.title);
        link.href = article.url;
        link.className = linkClass;
        link.textContent = article.title;
        fragment.appendChild(link);
      });
    container.appendChild(fragment);
  }

  async fetchProductCard(handle) {
    try {
      const response = await fetch(
        `/products/${handle}?view=iw-product-card`,
        {
          credentials: 'same-origin',
          method: 'GET',
        }
      );
      const responseText = await response.text();
      const productCard = new DOMParser()
        .parseFromString(responseText, 'text/html')
        .querySelector('.product-wrapper');
      return productCard;
    } catch (error) {
      console.error('Error fetching product card:', error);
      return null;
    }
  }

  async fetchProductModal(handle) {
    try {
      const response = await fetch(
        `/products/${handle}?view=iw-product-modal`,
        {
          credentials: 'same-origin',
          method: 'GET',
        }
      );
      const responseText = await response.text();
      const productModal = new DOMParser()
        .parseFromString(responseText, 'text/html')
        .querySelector('.modal-quick-view');
      return productModal;
    } catch (error) {
      console.error('Error fetching product card:', error);
      return null;
    }
  }

  closeSearchContent(e) {
    e.preventDefault();
    e.stopPropagation();
    this.mainHeader.classList.remove('active');
    this.classList.remove('active');
    this.updateTransparentHeader();
  }

  updateTransparentHeader() {
    if (this.isMobile) {
      return; // Don't add transparent header on mobile
    }

    // Check if body has fixed-header class
    if (document.body.classList.contains('fixed-header')) {
      document.body.classList.remove('transparent-header');
      return;
    }

    // Check if main header is active
    if (this.mainHeader.classList.contains('active')) {
      document.body.classList.remove('transparent-header');
      return;
    }

    // Check for specific page elements
    const hasHeroBanner =
      document.querySelector('.hero-banner') !== null;
    const hasErrorPage =
      document.querySelector('.error-page') !== null;
    const hasInnerHeroSection =
      document.querySelector('.inner-hero-section') !== null;
    const hasWhiteBg = document.querySelector('.white-bg') !== null;

    if (hasHeroBanner || hasErrorPage || hasInnerHeroSection) {
      document.body.classList.add('transparent-header');
    } else if (hasWhiteBg) {
      document.body.classList.remove('transparent-header');
    } else {
      document.body.classList.remove('transparent-header');
    }
  }
}

customElements.get('iw-search') ||
  customElements.define('iw-search', iwSearch);
*/