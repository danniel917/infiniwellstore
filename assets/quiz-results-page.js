// // quiz-results-page.js

// /* RESULTS - OPTIMIZED VERSION */

// // -----------------------------------------------------
// // Shopify Storefront API CONFIG (safe to expose)
// // -----------------------------------------------------
// const SHOP_DOMAIN = "tailormade-health.myshopify.com";
// const STOREFRONT_TOKEN = "7d8fb1f19b8eaf27a7a574412283e285";

// // Cache for API responses
// const apiCache = new Map();

// /**************************************
//  * GRAPHQL FETCH WRAPPER WITH CACHING
//  **************************************/
// async function storefrontQuery(query, variables = {}) {
//   const cacheKey = JSON.stringify({ query, variables });
  
//   if (apiCache.has(cacheKey)) {
//     console.log('CACHE HIT:', cacheKey.substring(0, 50));
//     return apiCache.get(cacheKey);
//   }

//   const res = await fetch(`https://${SHOP_DOMAIN}/api/2024-01/graphql.json`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN
//     },
//     body: JSON.stringify({ query, variables })
//   });

//   const json = await res.json();
//   console.log("GRAPHQL RAW:", json);

//   if (json.errors) console.error("GraphQL Errors:", json.errors);
  
//   apiCache.set(cacheKey, json.data);
//   return json.data;
// }

// /**************************************
//  * COMBINED PRODUCT DATA FETCH (OPTIMIZED)
//  **************************************/
// async function fetchAllProductData(productId, productHandle) {
//   const gid = `gid://shopify/Product/${productId}`;
  
//   const query = `
//     query ProductData($id: ID!, $handle: String!) {
//       product(id: $id) {
//         reviewCount: metafield(namespace: "app--1576377--reviews", key: "review_count") {
//           value
//         }
//         productLabel: metafield(namespace: "custom", key: "product_label") {
//           reference {
//             ... on MediaImage {
//               image {
//                 url
//                 altText
//               }
//             }
//           }
//         }
//       }
//       productByHandle: product(handle: $handle) {
//         variants(first: 1) {
//           edges {
//             node {
//               id
//               priceV2 { amount, currencyCode }
//               compareAtPriceV2 { amount, currencyCode }
//               sellingPlanAllocations(first: 5) {
//                 edges {
//                   node {
//                     priceAdjustments {
//                       price { amount, currencyCode }
//                       compareAtPrice { amount, currencyCode }
//                       perDeliveryPrice { amount, currencyCode }
//                     }
//                     sellingPlan {
//                       id
//                       name
//                       description
//                       recurringDeliveries
//                       billingPolicy {
//                         ... on SellingPlanRecurringBillingPolicy {
//                           interval
//                           intervalCount
//                         }
//                       }
//                       deliveryPolicy {
//                         ... on SellingPlanRecurringDeliveryPolicy {
//                           interval
//                           intervalCount
//                         }
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   `;

//   const data = await storefrontQuery(query, { id: gid, handle: productHandle });
  
//   // Parse reviews
//   const reviewCount = parseInt(data?.product?.reviewCount?.value || 0, 10);
//   const reviews = { count: reviewCount, rating: 5 };
  
//   // Parse selling plans
//   const variantNode = data?.productByHandle?.variants?.edges?.[0]?.node;
//   const edges = variantNode?.sellingPlanAllocations?.edges || [];
  
//   const sellingPlans = edges.map((e) => {
//     const adj = e.node.priceAdjustments?.[0];
//     const price = parseFloat(adj?.price?.amount || variantNode.priceV2.amount);
//     const compareAt = parseFloat(adj?.compareAtPrice?.amount || price);
//     const discountPercent = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

//     return {
//       id: e.node.sellingPlan.id,
//       name: e.node.sellingPlan.name,
//       description: e.node.sellingPlan.description,
//       recurringDeliveries: e.node.sellingPlan.recurringDeliveries,
//       billingPolicy: e.node.sellingPlan.billingPolicy,
//       deliveryPolicy: e.node.sellingPlan.deliveryPolicy,
//       discountPercent,
//       price,
//       compareAt,
//       perDeliveryPrice: parseFloat(adj?.perDeliveryPrice?.amount || price)
//     };
//   });
  
//   // Parse metafields (removed recommendationRationale)
//   const metafields = {
//     productLabel: data?.product?.productLabel?.reference?.image || null
//   };
  
//   return { reviews, sellingPlans, metafields };
// }

// /**************************************
//  * EXTRACT FIRST NAME FROM ANSWERS
//  **************************************/
// function extractFirstName(answers) {
//   if (!answers) return '';
  
//   // Check multiple possible locations for the first name
//   let firstName = '';
  
//   // 1. Check direct answer field (with various possible key names)
//   firstName = answers['first_name'] ||
//               answers['First name'] ||
//               '';
  
//   // 2. If not found, check smart_properties_outputs
//   if (!firstName && answers.smart_properties_outputs) {
//     firstName = answers.smart_properties_outputs.first_name || '';
//   }
  
//   // 3. Loop through all answer keys to find any that contain "first" and "name"
//   if (!firstName) {
//     for (const key in answers) {
//       if (typeof answers[key] === 'string' && 
//           key.toLowerCase().includes('first') && 
//           key.toLowerCase().includes('name')) {
//         firstName = answers[key];
//         break;
//       }
//     }
//   }
  
//   return firstName.trim();
// }

// /**************************************
//  * CALCULATE DISCOUNT PERCENTAGE
//  **************************************/
// function calculateDiscount(email, phone) {
//   // Check if email exists and is not empty
//   const hasEmail = email && email.trim() !== '';
  
//   // Check if phone exists and is not empty
//   const hasPhone = phone && phone.trim() !== '';
  
//   // Both email and phone = 25% OFF with code QUIZ25
//   if (hasEmail && hasPhone) {
//     return { percent: 25, code: 'QUIZ25', show: true };
//   }
  
//   // Only email = 15% OFF with code QUIZ15
//   if (hasEmail) {
//     return { percent: 15, code: 'QUIZ15', show: true };
//   }
  
//   // Nothing = don't show discount
//   return { percent: 0, code: '', show: false };
// }

// // /**************************************
// //  * WAIT FOR QUIZ RESULTS CONTAINER
// //  **************************************/
// // function waitForResultsContainer() {
// //   return new Promise((resolve) => {
// //     const check = () => {
// //       const el = document.querySelector("#octane-quiz-outer-wrapper.oct-quiz-wrapper--result-page #octane-quiz-wrapper");
// //       if (el) return resolve(el);
// //       requestAnimationFrame(check);
// //     };
// //     check();
// //   });
// // }

// /**************************************
//  * WAIT FOR QUIZ RESULTS CONTAINER
//  **************************************/
// function waitForResultsContainer() {
//   return new Promise((resolve) => {
//     const check = () => {
//       // Wait for Octane's results container
//       const el = document.querySelector("#octane-quiz-outer-wrapper.oct-quiz-wrapper--result-page #octane-quiz-wrapper");
//       if (el) {
//         console.log('Results container found');
//         return resolve(el);
//       }
//       requestAnimationFrame(check);
//     };
//     check();
//   });
// }

// /**************************************
//  * GET HANDLE FROM URL
//  **************************************/
// function getHandleFromUrl(url) {
//   if (!url) return null;
//   const match = url.match(/\/products\/([a-zA-Z0-9\-_]+)/);
//   return match ? match[1] : null;
// }

// /**************************************
//  * FORMAT NUMBER WITH COMMAS
//  **************************************/
// function formatNumberWithCommas(number) {
//   return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// }

// /**************************************
//  * PARSE RICH TEXT JSON TO HTML
//  **************************************/
// function parseRichTextToHTML(jsonString) {
//   if (!jsonString) return '';
  
//   try {
//     const richText = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    
//     function processNode(node) {
//       if (!node) return '';
      
//       if (node.type === 'text') {
//         let text = node.value || '';
//         if (node.bold) text = `<strong>${text}</strong>`;
//         if (node.italic) text = `<em>${text}</em>`;
//         return text;
//       }
      
//       const children = node.children ? node.children.map(processNode).join('') : '';
      
//       switch (node.type) {
//         case 'root': return children;
//         case 'paragraph': return `<p>${children}</p>`;
//         case 'heading':
//           const level = node.level || 2;
//           return `<h${level}>${children}</h${level}>`;
//         case 'list':
//           const listTag = node.listType === 'ordered' ? 'ol' : 'ul';
//           return `<${listTag}>${children}</${listTag}>`;
//         case 'list-item': return `<li>${children}</li>`;
//         case 'link':
//           return `<a href="${node.url}" target="${node.target || '_self'}">${children}</a>`;
//         default: return children;
//       }
//     }
    
//     return processNode(richText);
//   } catch (error) {
//     console.error('Error parsing rich text:', error);
//     return jsonString;
//   }
// }

// /**************************************
//  * EXTRACT RECOMMENDATION RATIONALE FROM SECTION
//  **************************************/
// function extractRecommendationRationale(results, section) {
//   console.log('=== EXTRACT RECOMMENDATION RATIONALE DEBUG ===');
//   console.log('Results object:', results);
//   console.log('Section object:', section);
  
//   // First, try to get from results.info.product_blocks (direct URL path)
//   if (results.info && results.info.product_blocks && results.info.product_blocks[0]) {
//     const topContent = results.info.product_blocks[0].top_content;
//     if (topContent && topContent[0] && topContent[0].text) {
//       console.log('Found in results.info.product_blocks[0].top_content[0].text');
//       console.log('Text:', topContent[0].text);
//       console.log('==============================================');
      
//       return {
//         title: 'Recommendation Rationale',
//         description: topContent[0].text
//       };
//     }
//   }
  
//   // Second, try to get from section.top_content (normal completion path)
//   if (section && section.top_content && section.top_content[0] && section.top_content[0].text) {
//     console.log('Found in section.top_content[0].text');
//     console.log('Text:', section.top_content[0].text);
//     console.log('==============================================');
    
//     return {
//       title: 'Recommendation Rationale',
//       description: section.top_content[0].text
//     };
//   }
  
//   console.warn('No recommendation rationale found in either location');
//   console.log('==============================================');
//   return null;
// }

// /**************************************
//  * RENDER RECOMMENDATION RATIONALE
//  **************************************/
// function renderRecommendationRationale(rationale) {
//   // If no rationale object or no description, don't render anything
//   if (!rationale || !rationale.description) return '';
  
//   // Render with innerHTML - description already contains HTML tags
//   return `
//     <div class="qp-recommendation-rationale">
//       <h4 class="qp-rationale-title">${rationale.title}</h4>
//       <div class="qp-rationale-description">
//         ${rationale.description}
//       </div>
//     </div>
//   `;
// }

// /**************************************
//  * INIT PRODUCT LOGIC (OPTIMIZED)
//  **************************************/
// function initProduct(productEl, productId, sellingPlans) {
//   // Cache selectors
//   const radios = productEl.querySelectorAll(`input[name="purchase_desktop_${productId}"], input[name="purchase_mobile_${productId}"]`);
//   const planSelects = productEl.querySelectorAll(".qp-plan-select");
  
//   if (radios.length === 0) {
//     console.warn("No radios found for product", productId);
//     return;
//   }

//   // Use event delegation on parent instead of individual listeners
//   productEl.addEventListener("change", (e) => {
//     const target = e.target;
    
//     // Handle radio button changes
//     if (target.type === 'radio' && target.name.includes(`purchase_`) && target.name.includes(`_${productId}`)) {
//       const productContainer = target.closest('.quiz-product--desktop, .quiz-product--mobile, .quiz-product.pair-with');
//       if (!productContainer) return;
      
//       const planSelect = productContainer.querySelector(".qp-plan-select");
//       const subscriptionDetails = productContainer.querySelector(".qp-subscription .qp-details");
//       const form = productContainer.querySelector(`form[data-product-id="${productId}"]`);
//       const sellingPlanInput = form?.querySelector(".sp-input");

//       if (target.value === "subscription") {
//         if (planSelect) planSelect.style.display = "block";
//         if (subscriptionDetails) subscriptionDetails.style.display = "block";

//         if (sellingPlanInput) {
//           const firstPlanId = sellingPlans[0]?.id;
//           if (firstPlanId) {
//             const numericId = firstPlanId.split("/").pop();
//             sellingPlanInput.value = numericId;
//           }
//         }
//       } else {
//         if (planSelect) planSelect.style.display = "none";
//         if (subscriptionDetails) subscriptionDetails.style.display = "none";
//         if (sellingPlanInput) sellingPlanInput.value = "";
//       }
//     }
    
//     // Handle plan select dropdown changes
//     if (target.classList.contains('qp-plan-select')) {
//       const productContainer = target.closest('.quiz-product--desktop, .quiz-product--mobile, .quiz-product.pair-with');
//       if (!productContainer) return;
      
//       const form = productContainer.querySelector(`form[data-product-id="${productId}"]`);
//       const sellingPlanInput = form?.querySelector(".sp-input");

//       if (sellingPlanInput && target.value) {
//         const numericId = target.value.split("/").pop();
//         sellingPlanInput.value = numericId;
//       }
//     }
//   });
// }

// /**************************************
//  * HANDLE FORM SUBMISSIONS
//  **************************************/
// function handleFormSubmissions() {
//   // Handle button clicks to detect which button was pressed
//   document.addEventListener('click', function(e) {
//     const button = e.target.closest('button[type="submit"]');
//     if (!button) return;
    
//     const form = button.closest('form.qp-atc-form');
//     if (!form) return;
    
//     // Check if this is the "Add to Order" button (not Express Checkout)
//     const isAddToOrder = button.classList.contains('qp-add-to-order') || 
//                          button.textContent.includes('Add to Order');
    
//     if (isAddToOrder) {
//       e.preventDefault();
//       e.stopPropagation();
      
//       const formData = new FormData(form);
//       const data = {};
      
//       for (let [key, value] of formData.entries()) {
//         data[key] = value;
//       }
      
//       // Remove the return_to parameter for Add to Order (we don't want to redirect)
//       delete data.return_to;
      
//       console.log('Adding product to cart:', data);
      
//       // Add to cart via AJAX
//       fetch('/cart/add.js', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data)
//       })
//       .then(response => {
//         if (!response.ok) {
//           throw new Error('Failed to add to cart');
//         }
//         return response.json();
//       })
//       .then(addedItem => {
//         console.log('Product added to cart successfully:', addedItem);
        
//         // Fetch fresh cart data
//         return fetch('/cart.js', {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         });
//       })
//       .then(res => res.json())
//       .then(cart => {
//         console.log('Cart refreshed:', cart);
        
//         // Update cart display with fresh data
//         if (typeof reloadAjaxCartItemUsingCartAjaxObject === 'function') {
//           reloadAjaxCartItemUsingCartAjaxObject(cart);
//         }
        
//         // Update progress bar
//         if (typeof progressBar === 'function') {
//           progressBar();
//         }
        
//         // Open the minicart
//         setTimeout(function() {
//           $('#CartSidebar').addClass('active');
//           $('#cart_overlay').addClass('active');
//           $('.js__cart-expand').addClass('active');
//           $('html').addClass('mini-cart-open');
//         }, 200);
//       })
//       .catch(error => {
//         console.error('Error adding to cart:', error);
//         alert('Failed to add product to cart. Please try again.');
//       });
//     }
//     // If it's Express Checkout button, let the form submit normally
//   });
// }

// /**************************************
//  * RENDER STARS (OPTIMIZED)
//  **************************************/
// function renderStars(productEl, productId) {
//   const starsHTML = '★★★★★';
//   const containers = productEl.querySelectorAll(`.qp-review-stars[data-product-id="${productId}"]`);
//   containers.forEach(container => {
//     container.innerHTML = starsHTML;
//   });
// }

// /**************************************
//  * BUILD PRODUCT HTML - DESKTOP VERSION
//  **************************************/
// function buildProductHTMLDesktop(product, reviews, sellingPlans, metafields, isSecondProduct = false, firstName = '', discount = null) {
//   const variant = product.variants?.[0];
//   const oneTimePrice = variant.price_formatted;
//   const firstPlan = sellingPlans[0];
//   const buttonText = isSecondProduct ? "Add to Order" : "Express Checkout";
//   const subscriptionPrice = firstPlan?.perDeliveryPrice ? `$${firstPlan.perDeliveryPrice.toFixed(2)}` : oneTimePrice;
  
//   const sellingPlanOptions = sellingPlans.map(plan => `<option value="${plan.id}">${plan.name}</option>`).join("");
  
//   // Build the title with first name if available
//   const titleText = firstName ? `Designed for you, ${firstName}...` : 'Designed for you...';
  
//   return `
//     <div class="qp-left">
//       <img src="${product.image}" class="qp-image" loading="lazy" />
//       ${metafields.productLabel ? `<img src="${metafields.productLabel.url}" alt="${metafields.productLabel.altText || 'Product Label'}" class="qp-product-label" loading="lazy" />` : ''}
//     </div>
//     <div class="qp-right">
//       <div class="qp-product-header">
//         <h2 class="qp-title">${titleText}</h2>
//         <div class="qp-reviews-wrapper">
//           <div class="qp-review-stars" data-product-id="${product.id}"></div>
//           <div class="qp-review-count">${formatNumberWithCommas(reviews.count)} Reviews</div>
//         </div>
//         <h3 class="qp-product-title">${product.title}</h3>
//         <div class="qp-price-info--first">
//           <h3 class="qp-product-price">${subscriptionPrice}</h3>
//           <span class="qp-old-price">${oneTimePrice}</span>
//         </div>
//           ${discount && discount.show ? `<div class="qp-product-discount"><span>${discount.percent}% OFF</span><span class="qp-discount-code">Code: ${discount.code}</span></div>` : ''}
//       </div>
//       <div class="qp-subscription-container">
//         <div class="qp-suscription-save">${firstPlan?.discountPercent ? `<span class="qp-save-extra">Save Extra ${firstPlan.discountPercent}%</span>` : ""}</div>
//         <div class="qp-subscription">
//           <label>
//             <div class="qp-radio">
//               <input type="radio" name="purchase_desktop_${product.id}" value="subscription"/>
//               <span class="qp-radio__label">Subscribe & Save</span>
//             </div>
//             <div class="qp-price-info">
//               <span class="qp-current-price">$${firstPlan?.perDeliveryPrice.toFixed(2) || '0.00'}</span>
//               <span class="qp-old-price">${oneTimePrice}</span>
//             </div>
//           </label>
//           <select class="qp-plan-select" data-product-id="${product.id}" style="display:none;">${sellingPlanOptions}</select>
//           <div class="qp-details" style="display:none;">
//             <div class="qp-detail">
//               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66669 10.6L3.13336 7.06662L2.40002 7.73328L5.93336 11.2666L6.66669 12L13.7334 4.93328L13 4.19995L6.66669 10.6Z" fill="#84827E"/>
//               </svg>
//               Delivery every 30 days
//             </div>
//             <div class="qp-detail">
//               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66669 10.6L3.13336 7.06662L2.40002 7.73328L5.93336 11.2666L6.66669 12L13.7334 4.93328L13 4.19995L6.66669 10.6Z" fill="#84827E"/>
//               </svg>
//               Pause or cancel anytime
//             </div>
//           </div>
//         </div>
//         <div class="qp-one-time">
//           <label>
//             <div class="qp-radio">
//               <input type="radio" name="purchase_desktop_${product.id}" value="onetime" checked />
//               <span class="qp-radio__label">One-time</span>
//             </div>
//             <div class="qp-price-info">
//               <span class="qp-current-price">${oneTimePrice}</span>
//             </div>
//           </label>
//         </div>
//       </div>
//       <div class="qp-product-footer">
// <form class="qp-atc-form" action="/cart/add" method="post" data-product-id="${product.id}">
//   <input type="hidden" name="id" value="${variant.id}">
//   <input type="hidden" name="selling_plan" class="sp-input" />
//   ${!isSecondProduct ? '<input type="hidden" name="return_to" value="/checkout">' : ''}
//   <button type="submit" class="qp-atc-btn btn--primary">
//     <span>${buttonText}</span>
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M14.0391 5.08594L12.9609 6.16406L18.0469 11.25H3V12.75H18.0469L12.9609 17.8359L14.0391 18.9141L20.4141 12.5391L20.9297 12L20.4141 11.4609L14.0391 5.08594Z" fill="CurrentColor"/>
//     </svg>
//   </button>
// </form>
//         <div class="qp-product-details">
//           <div class="qp-product-details__item">
//             <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <path d="M8 2C4.69141 2 2 4.69141 2 8C2 11.3086 4.69141 14 8 14C11.3086 14 14 11.3086 14 8C14 4.69141 11.3086 2 8 2ZM8 3C10.7676 3 13 5.23242 13 8C13 10.7676 10.7676 13 8 13C5.23242 13 3 10.7676 3 8C3 5.23242 5.23242 3 8 3ZM7.5 4V8.5H11V7.5H8.5V4H7.5Z" fill="#1A1B1B"/>
//             </svg>
//             <span>Free Shipping (3-4 days)</span>
//           </div>
//           <div class="qp-product-details__item">
//             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
//               <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66672 10.6L3.13339 7.06662L2.40005 7.73328L5.93339 11.2666L6.66672 12L13.7334 4.93328L13.0001 4.19995L6.66672 10.6Z" fill="#1A1B1B"/>
//             </svg>
//             <span>30-Day Risk Free Guarantee</span>
//           </div>
//         </div>
//       </div>
//       ${renderRecommendationRationale(metafields.recommendationRationale)}
//     </div>
//   `;
// }

// /**************************************
//  * BUILD PRODUCT HTML - MOBILE VERSION
//  **************************************/
// function buildProductHTMLMobile(product, reviews, sellingPlans, metafields, isSecondProduct = false, firstName = '', discount = null) {
//   const variant = product.variants?.[0];
//   const oneTimePrice = variant.price_formatted;
//   const firstPlan = sellingPlans[0];
//   const buttonText = isSecondProduct ? "Add to Order" : "Express Checkout";
//   const subscriptionPrice = firstPlan?.perDeliveryPrice ? `$${firstPlan.perDeliveryPrice.toFixed(2)}` : oneTimePrice;
  
//   const sellingPlanOptions = sellingPlans.map(plan => `<option value="${plan.id}">${plan.name}</option>`).join("");
  
//   // Build the title with first name if available
//   const titleText = firstName ? `Designed for you, ${firstName}...` : 'Designed for You...';
  
//   return `
//     ${!isSecondProduct ? `<h2 class="qp-title qp-title--mobile">${titleText}</h2>` : ''}
//     <div class="qp-mobile-top-row">
//       <div class="qp-left qp-left--mobile">
//         <img src="${product.image}" class="qp-image" loading="lazy" />
//       </div>
//       <div class="qp-product-header qp-product-header--mobile">
//         <div class="qp-reviews-wrapper">
//           <div class="qp-review-stars" data-product-id="${product.id}"></div>
//           <div class="qp-review-count">${formatNumberWithCommas(reviews.count)} Reviews</div>
//         </div>
//         <h3 class="qp-product-title">${product.title}</h3>
//         <div class="qp-price-info--first">
//           <h3 class="qp-product-price">${subscriptionPrice}</h3>
//           <span class="qp-old-price">${oneTimePrice}</span>
//         </div>
//         ${discount && discount.show ? `<div class="qp-product-discount"><span>${discount.percent}% OFF</span><span class="qp-discount-code">Code: ${discount.code}</span></div>` : ''}
//         <form class="qp-atc-form" action="/cart/add" method="post" data-product-id="${product.id}">
//           <input type="hidden" name="id" value="${variant.id}">
//           <input type="hidden" name="selling_plan" class="sp-input" />
//           ${!isSecondProduct ? '<input type="hidden" name="return_to" value="/checkout">' : ''}
//           <button type="submit" class="qp-atc-btn btn--primary">
//             <span>${buttonText}</span>
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <path d="M14.0391 5.08594L12.9609 6.16406L18.0469 11.25H3V12.75H18.0469L12.9609 17.8359L14.0391 18.9141L20.4141 12.5391L20.9297 12L20.4141 11.4609L14.0391 5.08594Z" fill="CurrentColor"/>
//             </svg>
//           </button>
//         </form>
//       </div>
//     </div>
//     <div class="qp-mobile-full-width">
//       <div class="qp-subscription-container">
//         <div class="qp-suscription-save">${firstPlan?.discountPercent ? `<span class="qp-save-extra">Save Extra ${firstPlan.discountPercent}%</span>` : ""}</div>
//         <div class="qp-subscription">
//           <label>
//             <div class="qp-radio">
//               <input type="radio" name="purchase_mobile_${product.id}" value="subscription"/>
//               <span class="qp-radio__label">Subscribe & Save</span>
//             </div>
//             <div class="qp-price-info">
//               <span class="qp-current-price">$${firstPlan?.perDeliveryPrice.toFixed(2) || '0.00'}</span>
//               <span class="qp-old-price">${oneTimePrice}</span>
//             </div>
//           </label>
//           <select class="qp-plan-select" data-product-id="${product.id}" style="display:none;">${sellingPlanOptions}</select>
//           <div class="qp-details" style="display:none;">
//             <div class="qp-detail">
//               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66669 10.6L3.13336 7.06662L2.40002 7.73328L5.93336 11.2666L6.66669 12L13.7334 4.93328L13 4.19995L6.66669 10.6Z" fill="#84827E"/>
//               </svg>
//               Delivery every 30 days
//             </div>
//             <div class="qp-detail">
//               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66669 10.6L3.13336 7.06662L2.40002 7.73328L5.93336 11.2666L6.66669 12L13.7334 4.93328L13 4.19995L6.66669 10.6Z" fill="#84827E"/>
//               </svg>
//               Pause or cancel anytime
//             </div>
//           </div>
//         </div>
//         <div class="qp-one-time">
//           <label>
//             <div class="qp-radio">
//               <input type="radio" name="purchase_mobile_${product.id}" value="onetime" checked />
//               <span class="qp-radio__label">One-time</span>
//             </div>
//             <div class="qp-price-info">
//               <span class="qp-current-price">${oneTimePrice}</span>
//             </div>
//           </label>
//         </div>
//       </div>
//       <div class="qp-product-footer">
// <form class="qp-atc-form" action="/cart/add" method="post" data-product-id="${product.id}">
//   <input type="hidden" name="id" value="${variant.id}">
//   <input type="hidden" name="selling_plan" class="sp-input" />
//   ${!isSecondProduct ? '<input type="hidden" name="return_to" value="/checkout">' : ''}
//   <button type="submit" class="qp-atc-btn btn--primary">
//     <span>${buttonText}</span>
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <path d="M14.0391 5.08594L12.9609 6.16406L18.0469 11.25H3V12.75H18.0469L12.9609 17.8359L14.0391 18.9141L20.4141 12.5391L20.9297 12L20.4141 11.4609L14.0391 5.08594Z" fill="CurrentColor"/>
//     </svg>
//   </button>
// </form>
//         <div class="qp-product-details">
//           <div class="qp-product-details__item">
//             <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <path d="M8 2C4.69141 2 2 4.69141 2 8C2 11.3086 4.69141 14 8 14C11.3086 14 14 11.3086 14 8C14 4.69141 11.3086 2 8 2ZM8 3C10.7676 3 13 5.23242 13 8C13 10.7676 10.7676 13 8 13C5.23242 13 3 10.7676 3 8C3 5.23242 5.23242 3 8 3ZM7.5 4V8.5H11V7.5H8.5V4H7.5Z" fill="#1A1B1B"/>
//             </svg>
//             <span>Free Shipping (3-4 days)</span>
//           </div>
//           <div class="qp-product-details__item">
//             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
//               <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66672 10.6L3.13339 7.06662L2.40005 7.73328L5.93339 11.2666L6.66672 12L13.7334 4.93328L13.0001 4.19995L6.66672 10.6Z" fill="#1A1B1B"/>
//             </svg>
//             <span>30-Day Risk Free Guarantee</span>
//           </div>
//         </div>
//       </div>
//       ${renderRecommendationRationale(metafields.recommendationRationale)}
//       ${metafields.productLabel ? `<img src="${metafields.productLabel.url}" alt="${metafields.productLabel.altText || 'Product Label'}" class="qp-product-label" loading="lazy" />` : ''}
//     </div>
//   `;
// }

// /**************************************
//  * MAIN QUIZ EXECUTION (OPTIMIZED)
//  **************************************/
// document.addEventListener("octane.quiz.completed", async function (e) {
//   const eventData = e.detail;
//   console.log("QUIZ EVENT DATA:", eventData);

//   // Handle different data structures (normal completion vs direct URL)
//   let results;
  
//   if (eventData.state && eventData.state.headless_results_page_accessed) {
//     // Direct URL access - data is nested
//     console.log("Direct URL result detected");
//     results = eventData.state.headless_results_page_accessed;
//     // IMPORTANT: Add the info object from state to results
//     results.info = eventData.state.info;
//   } else if (eventData.sections) {
//     // Normal quiz completion - data is at top level
//     console.log("Normal quiz completion detected");
//     results = eventData;
//   } else {
//     console.error("Unknown results structure:", eventData);
//     return;
//   }
  
//   console.log("QUIZ RESULTS:", results);
//   console.log("RESULTS INFO:", results.info);

//   const container = await waitForResultsContainer();
  
//   // Extract first name from answers
//   const firstName = extractFirstName(results.answers);
//   console.log("First name extracted:", firstName);

//   // Calculate discount based on email and phone
//   const discount = calculateDiscount(results.email, results.phone);
//   console.log("Discount calculated:", discount);
  
//   // ... rest of the code stays the same
  
//   // Use document fragment for batch DOM manipulation
//   const fragment = document.createDocumentFragment();

//   for (const section of results.sections) {
//     const sectionWrapper = document.createElement("div");
//     sectionWrapper.className = "quiz-section";

//     // Fetch all product data with combined query
//     const productsData = await Promise.all(
//       section.products.map(async (product) => {
//         const handle = getHandleFromUrl(product.link);
        
//         if (!handle) {
//           console.warn("Cannot extract handle for", product.title);
//           return null;
//         }

//         const data = await fetchAllProductData(product.id, handle);
//         return {
//           product,
//           ...data
//         };
//       })
//     );

//     // Filter out null results
//     const validProducts = productsData.filter(p => p !== null);

//     if (validProducts.length > 0) {
//       const firstProductData = validProducts[0];

//       // Extract recommendation rationale - pass both results and section
//       const recommendationRationale = extractRecommendationRationale(results, section);
      
//       // Desktop version
//       const productElDesktop = document.createElement("div");
//       productElDesktop.className = "quiz-product quiz-product--desktop";
//       productElDesktop.innerHTML = buildProductHTMLDesktop(
//         firstProductData.product,
//         firstProductData.reviews,
//         firstProductData.sellingPlans,
//         { ...firstProductData.metafields, recommendationRationale },
//         false,
//         firstName,
//         discount
//       );

//       if (validProducts.length > 1) {
//         const secondProductData = validProducts[1];
        
//         // Add the "Pair it with:" title first
//         const qpRightDesktop = productElDesktop.querySelector(".qp-right");
//         if (qpRightDesktop) {
//           const pairWithTitle = document.createElement("span");
//           pairWithTitle.className = "pair-with__title";
//           pairWithTitle.textContent = "Pair it with:";
//           qpRightDesktop.appendChild(pairWithTitle);
          
//           // Then add the second product
//           const secondProductElDesktop = document.createElement("div");
//           secondProductElDesktop.className = "quiz-product pair-with";
//           secondProductElDesktop.innerHTML = buildProductHTMLDesktop(
//             secondProductData.product,
//             secondProductData.reviews,
//             secondProductData.sellingPlans,
//             secondProductData.metafields,
//             true,
//             firstName
//           );
          
//           qpRightDesktop.appendChild(secondProductElDesktop);
          
//           initProduct(secondProductElDesktop, secondProductData.product.id, secondProductData.sellingPlans);
//           renderStars(secondProductElDesktop, secondProductData.product.id);
//         }
//       }

//       sectionWrapper.appendChild(productElDesktop);
//       initProduct(productElDesktop, firstProductData.product.id, firstProductData.sellingPlans);
//       renderStars(productElDesktop, firstProductData.product.id);

//       // Mobile version
//       const productElMobile = document.createElement("div");
//       productElMobile.className = "quiz-product quiz-product--mobile";
//       productElMobile.innerHTML = buildProductHTMLMobile(
//         firstProductData.product,
//         firstProductData.reviews,
//         firstProductData.sellingPlans,
//         { ...firstProductData.metafields, recommendationRationale },
//         false,
//         firstName,
//         discount
//       );

//       if (validProducts.length > 1) {
//         const secondProductData = validProducts[1];
//         const pairWithMobileContainer = document.createElement("div");
//         pairWithMobileContainer.className = "qp-pair-with-mobile-wrapper";
//         pairWithMobileContainer.innerHTML = `<span class="pair-with__title pair-with__title--mobile">Pair it with:</span>`;
        
//         const secondProductElMobile = document.createElement("div");
//         secondProductElMobile.className = "quiz-product pair-with";
//         secondProductElMobile.innerHTML = buildProductHTMLMobile(
//           secondProductData.product,
//           secondProductData.reviews,
//           secondProductData.sellingPlans,
//           secondProductData.metafields,
//           true,
//           firstName
//         );
        
//         pairWithMobileContainer.appendChild(secondProductElMobile);
        
//         const qpMobileFullWidth = productElMobile.querySelector(".qp-mobile-full-width");
//         if (qpMobileFullWidth) {
//           qpMobileFullWidth.appendChild(pairWithMobileContainer);
//         }

//         initProduct(secondProductElMobile, secondProductData.product.id, secondProductData.sellingPlans);
//         renderStars(secondProductElMobile, secondProductData.product.id);
//       }

//       sectionWrapper.appendChild(productElMobile);
//       initProduct(productElMobile, firstProductData.product.id, firstProductData.sellingPlans);
//       renderStars(productElMobile, firstProductData.product.id);

//       fragment.appendChild(sectionWrapper);
//     }
//   }
  
//   // Single DOM update - CLEAR OCTANE'S DEFAULT RESULTS AND REPLACE WITH CUSTOM
//   const existingHeader = container.querySelector('.custom-quiz-header');
//   const hasRetakeButton = existingHeader?.querySelector('#custom-retake-button');

//   // Clear Octane's default results content
//   container.innerHTML = "";

//   // Only preserve header if it has the correct Retake Quiz button
//   if (existingHeader && hasRetakeButton) {
//     console.log('Preserving Retake Quiz header during results render');
//     container.appendChild(existingHeader);
//   }

//   // Add your custom results
//   container.appendChild(fragment);

//   // Create or replace header with Retake Quiz button
//   if (!existingHeader || !hasRetakeButton) {
//     console.log('Creating/Replacing with Retake Quiz header');
    
//     // Use the global createCustomHeader function if available
//     if (typeof window.createCustomHeader === 'function') {
//       window.createCustomHeader(container, true); // true = isResultsPage
//     } else {
//       console.warn('createCustomHeader function not available');
//     }
//   }
// });

// // Call when DOM is ready
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', handleFormSubmissions);
// } else {
//   handleFormSubmissions();
// }


// quiz-results-page.js

/* RESULTS - OPTIMIZED VERSION */

// -----------------------------------------------------
// Shopify Storefront API CONFIG (safe to expose)
// -----------------------------------------------------
const SHOP_DOMAIN = "tailormade-health.myshopify.com";
const STOREFRONT_TOKEN = "7d8fb1f19b8eaf27a7a574412283e285";

// Cache for API responses
const apiCache = new Map();

/**************************************
 * GRAPHQL FETCH WRAPPER WITH CACHING
 **************************************/
async function storefrontQuery(query, variables = {}) {
  const cacheKey = JSON.stringify({ query, variables });
  
  if (apiCache.has(cacheKey)) {
    console.log('CACHE HIT:', cacheKey.substring(0, 50));
    return apiCache.get(cacheKey);
  }

  const res = await fetch(`https://${SHOP_DOMAIN}/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json();
  console.log("GRAPHQL RAW:", json);

  if (json.errors) console.error("GraphQL Errors:", json.errors);
  
  apiCache.set(cacheKey, json.data);
  return json.data;
}

/**************************************
 * COMBINED PRODUCT DATA FETCH (OPTIMIZED)
 **************************************/
async function fetchAllProductData(productId, productHandle) {
  const gid = `gid://shopify/Product/${productId}`;
  
  const query = `
    query ProductData($id: ID!, $handle: String!) {
      product(id: $id) {
        reviewCount: metafield(namespace: "app--1576377--reviews", key: "review_count") {
          value
        }
        productLabel: metafield(namespace: "custom", key: "product_label") {
          reference {
            ... on MediaImage {
              image {
                url
                altText
              }
            }
          }
        }
      }
      productByHandle: product(handle: $handle) {
        variants(first: 1) {
          edges {
            node {
              id
              priceV2 { amount, currencyCode }
              compareAtPriceV2 { amount, currencyCode }
              sellingPlanAllocations(first: 5) {
                edges {
                  node {
                    priceAdjustments {
                      price { amount, currencyCode }
                      compareAtPrice { amount, currencyCode }
                      perDeliveryPrice { amount, currencyCode }
                    }
                    sellingPlan {
                      id
                      name
                      description
                      recurringDeliveries
                      billingPolicy {
                        ... on SellingPlanRecurringBillingPolicy {
                          interval
                          intervalCount
                        }
                      }
                      deliveryPolicy {
                        ... on SellingPlanRecurringDeliveryPolicy {
                          interval
                          intervalCount
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await storefrontQuery(query, { id: gid, handle: productHandle });
  
  // Parse reviews
  const reviewCount = parseInt(data?.product?.reviewCount?.value || 0, 10);
  const reviews = { count: reviewCount, rating: 5 };
  
  // Parse selling plans
  const variantNode = data?.productByHandle?.variants?.edges?.[0]?.node;
  const edges = variantNode?.sellingPlanAllocations?.edges || [];
  
  const sellingPlans = edges.map((e) => {
    const adj = e.node.priceAdjustments?.[0];
    const price = parseFloat(adj?.price?.amount || variantNode.priceV2.amount);
    const compareAt = parseFloat(adj?.compareAtPrice?.amount || price);
    const discountPercent = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

    return {
      id: e.node.sellingPlan.id,
      name: e.node.sellingPlan.name,
      description: e.node.sellingPlan.description,
      recurringDeliveries: e.node.sellingPlan.recurringDeliveries,
      billingPolicy: e.node.sellingPlan.billingPolicy,
      deliveryPolicy: e.node.sellingPlan.deliveryPolicy,
      discountPercent,
      price,
      compareAt,
      perDeliveryPrice: parseFloat(adj?.perDeliveryPrice?.amount || price)
    };
  });
  
  // Parse metafields
  const metafields = {
    productLabel: data?.product?.productLabel?.reference?.image || null
  };
  
  return { reviews, sellingPlans, metafields };
}

/**************************************
 * EXTRACT FIRST NAME FROM ANSWERS
 **************************************/
function extractFirstName(answers) {
  if (!answers) return '';
  
  // Check multiple possible locations for the first name
  let firstName = '';
  
  // 1. Check direct answer field (with various possible key names)
  firstName = answers['first_name'] ||
              answers['First name'] ||
              '';
  
  // 2. If not found, check smart_properties_outputs
  if (!firstName && answers.smart_properties_outputs) {
    firstName = answers.smart_properties_outputs.first_name || '';
  }
  
  // 3. Loop through all answer keys to find any that contain "first" and "name"
  if (!firstName) {
    for (const key in answers) {
      if (typeof answers[key] === 'string' && 
          key.toLowerCase().includes('first') && 
          key.toLowerCase().includes('name')) {
        firstName = answers[key];
        break;
      }
    }
  }
  
  return firstName.trim();
}

/**************************************
 * CALCULATE DISCOUNT PERCENTAGE
 **************************************/
function calculateDiscount(email, phone) {
  // Check if email exists and is not empty
  const hasEmail = email && email.trim() !== '';
  
  // Check if phone exists and is not empty
  const hasPhone = phone && phone.trim() !== '';
  
  // Both email and phone = 25% OFF with code QUIZ25
  if (hasEmail && hasPhone) {
    return { percent: 25, code: 'QUIZ25', show: true };
  }
  
  // Only email = 15% OFF with code QUIZ15
  if (hasEmail) {
    return { percent: 15, code: 'QUIZ15', show: true };
  }
  
  // Nothing = don't show discount
  return { percent: 0, code: '', show: false };
}

/**************************************
 * WAIT FOR QUIZ RESULTS CONTAINER
 **************************************/
function waitForResultsContainer() {
  return new Promise((resolve) => {
    const check = () => {
      // Wait for Octane's results container
      const el = document.querySelector("#octane-quiz-outer-wrapper.oct-quiz-wrapper--result-page #octane-quiz-wrapper");
      if (el) {
        console.log('Results container found');
        return resolve(el);
      }
      requestAnimationFrame(check);
    };
    check();
  });
}

/**************************************
 * GET HANDLE FROM URL
 **************************************/
function getHandleFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/products\/([a-zA-Z0-9\-_]+)/);
  return match ? match[1] : null;
}

/**************************************
 * FORMAT NUMBER WITH COMMAS
 **************************************/
function formatNumberWithCommas(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**************************************
 * PARSE RICH TEXT JSON TO HTML
 **************************************/
function parseRichTextToHTML(jsonString) {
  if (!jsonString) return '';
  
  try {
    const richText = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    
    function processNode(node) {
      if (!node) return '';
      
      if (node.type === 'text') {
        let text = node.value || '';
        if (node.bold) text = `<strong>${text}</strong>`;
        if (node.italic) text = `<em>${text}</em>`;
        return text;
      }
      
      const children = node.children ? node.children.map(processNode).join('') : '';
      
      switch (node.type) {
        case 'root': return children;
        case 'paragraph': return `<p>${children}</p>`;
        case 'heading':
          const level = node.level || 2;
          return `<h${level}>${children}</h${level}>`;
        case 'list':
          const listTag = node.listType === 'ordered' ? 'ol' : 'ul';
          return `<${listTag}>${children}</${listTag}>`;
        case 'list-item': return `<li>${children}</li>`;
        case 'link':
          return `<a href="${node.url}" target="${node.target || '_self'}">${children}</a>`;
        default: return children;
      }
    }
    
    return processNode(richText);
  } catch (error) {
    console.error('Error parsing rich text:', error);
    return jsonString;
  }
}

/**************************************
 * EXTRACT RECOMMENDATION RATIONALE FROM SECTION
 **************************************/
function extractRecommendationRationale(results, section) {
  console.log('=== EXTRACT RECOMMENDATION RATIONALE DEBUG ===');
  console.log('Results object:', results);
  console.log('Section object:', section);
  
  // First, try to get from results.info.product_blocks (direct URL path)
  if (results.info && results.info.product_blocks && results.info.product_blocks[0]) {
    const topContent = results.info.product_blocks[0].top_content;
    if (topContent && topContent[0] && topContent[0].text) {
      console.log('Found in results.info.product_blocks[0].top_content[0].text');
      console.log('Text:', topContent[0].text);
      console.log('==============================================');
      
      return {
        title: 'Recommendation Rationale',
        description: topContent[0].text
      };
    }
  }
  
  // Second, try to get from section.top_content (normal completion path)
  if (section && section.top_content && section.top_content[0] && section.top_content[0].text) {
    console.log('Found in section.top_content[0].text');
    console.log('Text:', section.top_content[0].text);
    console.log('==============================================');
    
    return {
      title: 'Recommendation Rationale',
      description: section.top_content[0].text
    };
  }
  
  console.warn('No recommendation rationale found in either location');
  console.log('==============================================');
  return null;
}

/**************************************
 * RENDER RECOMMENDATION RATIONALE
 **************************************/
function renderRecommendationRationale(rationale) {
  // If no rationale object or no description, don't render anything
  if (!rationale || !rationale.description) return '';
  
  // Render with innerHTML - description already contains HTML tags
  return `
    <div class="qp-recommendation-rationale">
      <h4 class="qp-rationale-title">${rationale.title}</h4>
      <div class="qp-rationale-description">
        ${rationale.description}
      </div>
    </div>
  `;
}

/**************************************
 * FETCH DEFAULT PRODUCT DATA
 **************************************/
async function fetchDefaultProduct() {
  const defaultProductId = '8059324301501';
  
  // First, get the product handle from the product ID
  const productQuery = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        handle
        title
        featuredImage {
          url
        }
        variants(first: 1) {
          edges {
            node {
              id
              priceV2 { amount, currencyCode }
              compareAtPriceV2 { amount, currencyCode }
            }
          }
        }
      }
    }
  `;
  
  const gid = `gid://shopify/Product/${defaultProductId}`;
  const productData = await storefrontQuery(productQuery, { id: gid });
  
  if (!productData || !productData.product) {
    console.error('Default product not found');
    return null;
  }
  
  const product = productData.product;
  const handle = product.handle;
  const variant = product.variants.edges[0].node;
  
  // Format the product data to match the structure expected by buildProductHTML
  const formattedProduct = {
    id: defaultProductId,
    title: product.title,
    image: product.featuredImage.url,
    link: `/products/${handle}`,
    variants: [{
      id: variant.id.split('/').pop(),
      price_formatted: `$${parseFloat(variant.priceV2.amount).toFixed(2)}`
    }]
  };
  
  // Fetch all additional data using the existing function
  const additionalData = await fetchAllProductData(defaultProductId, handle);
  
  return {
    product: formattedProduct,
    ...additionalData
  };
}

/**************************************
 * BUILD DEFAULT PRODUCT SECTION
 **************************************/
async function buildDefaultProductSection(firstName = '', discount = null, results = null) {
  console.log('Building default product section...');
  
  const defaultProductData = await fetchDefaultProduct();
  
  if (!defaultProductData) {
    console.error('Could not load default product');
    return null;
  }
  
  const sectionWrapper = document.createElement("div");
  sectionWrapper.className = "quiz-section";
  
  // Extract recommendation rationale from results
  let rationaleText = "Your BPC-Lx™ Pro dosage of 500 mcg, validated by third-party potency testing, is optimized for moderate neurological and systemic challenges. Administered rapidly, it supports mental clarity by ensuring quick bioavailability when focus fluctuates throughout your day.";
  
  // Try to get the rationale text from the results
  if (results) {
    // Check in results.info.product_blocks (direct URL path)
    if (results.info && results.info.product_blocks && results.info.product_blocks[0]) {
      const topContent = results.info.product_blocks[0].top_content;
      if (topContent && topContent[0] && topContent[0].text) {
        rationaleText = topContent[0].text;
        console.log('Using rationale from results.info.product_blocks');
      }
    }
    
    // Check in results.sections[0].top_content (normal completion path)
    if (results.sections && results.sections[0] && results.sections[0].top_content) {
      const topContent = results.sections[0].top_content;
      if (topContent && topContent[0] && topContent[0].text) {
        rationaleText = topContent[0].text;
        console.log('Using rationale from results.sections[0].top_content');
      }
    }
  }
  
  console.log('Default product rationale text:', rationaleText);
  
  // Default recommendation rationale with extracted text
  const defaultRationale = {
    title: 'Recommendation Rationale',
    description: rationaleText
  };
  
  const metafields = {
    ...defaultProductData.metafields,
    recommendationRationale: defaultRationale
  };
  
  // Desktop version
  const productElDesktop = document.createElement("div");
  productElDesktop.className = "quiz-product quiz-product--desktop";
  productElDesktop.innerHTML = buildProductHTMLDesktop(
    defaultProductData.product,
    defaultProductData.reviews,
    defaultProductData.sellingPlans,
    metafields,
    false,
    firstName,
    discount
  );
  
  sectionWrapper.appendChild(productElDesktop);
  initProduct(productElDesktop, defaultProductData.product.id, defaultProductData.sellingPlans, discount);
  renderStars(productElDesktop, defaultProductData.product.id);
  
  // Mobile version
  const productElMobile = document.createElement("div");
  productElMobile.className = "quiz-product quiz-product--mobile";
  productElMobile.innerHTML = buildProductHTMLMobile(
    defaultProductData.product,
    defaultProductData.reviews,
    defaultProductData.sellingPlans,
    metafields,
    false,
    firstName,
    discount
  );
  
  sectionWrapper.appendChild(productElMobile);
  initProduct(productElMobile, defaultProductData.product.id, defaultProductData.sellingPlans, discount);
  renderStars(productElMobile, defaultProductData.product.id);
  
  return sectionWrapper;
}

/**************************************
 * BUILD CHECKOUT URL WITH DISCOUNT (IMPROVED)
 **************************************/
function buildCheckoutUrl(variantId, sellingPlanId, discount) {
  let params = new URLSearchParams();
  
  // Add required parameters
  params.append('id', variantId);
  params.append('quantity', '1');
  
  // Add selling plan if subscription is selected
  if (sellingPlanId) {
    params.append('selling_plan', sellingPlanId);
  }
  
  // Add return_to with discount or direct checkout
  if (discount && discount.show && discount.code) {
    params.append('return_to', `/discount/${discount.code}?redirect=/checkout`);
  } else {
    params.append('return_to', '/checkout');
  }
  
  const url = `/cart/add?${params.toString()}`;
  console.log('Built checkout URL:', url);
  
  return url;
}

/**************************************
 * UPDATE CHECKOUT BUTTON URL
 **************************************/
function updateCheckoutButtonUrl(productEl, productId, discount) {
  const forms = productEl.querySelectorAll(`form[data-product-id="${productId}"]`);
  
  forms.forEach(form => {
    // Skip forms with "Add to Order" button (second product)
    const isAddToOrder = form.querySelector('.qp-add-to-order');
    if (isAddToOrder) return;
    
    const variantId = form.querySelector('input[name="id"]').value;
    const sellingPlanInput = form.querySelector('.sp-input');
    const sellingPlanId = sellingPlanInput ? sellingPlanInput.value : '';
    
    // Build the new checkout URL
    const checkoutUrl = buildCheckoutUrl(variantId, sellingPlanId, discount);
    
    // Update form action
    form.setAttribute('action', checkoutUrl);
    
    console.log('Updated checkout URL:', checkoutUrl);
  });
}

/**************************************
 * INIT PRODUCT LOGIC (UPDATED WITH DYNAMIC CHECKOUT URL)
 **************************************/
function initProduct(productEl, productId, sellingPlans, discount) {
  // Cache selectors
  const radios = productEl.querySelectorAll(`input[name="purchase_desktop_${productId}"], input[name="purchase_mobile_${productId}"]`);
  const planSelects = productEl.querySelectorAll(".qp-plan-select");
  
  if (radios.length === 0) {
    console.warn("No radios found for product", productId);
    return;
  }

  // Use event delegation on parent instead of individual listeners
  productEl.addEventListener("change", (e) => {
    const target = e.target;
    
    // Handle radio button changes
    if (target.type === 'radio' && target.name.includes(`purchase_`) && target.name.includes(`_${productId}`)) {
      const productContainer = target.closest('.quiz-product--desktop, .quiz-product--mobile, .quiz-product.pair-with');
      if (!productContainer) return;
      
      const planSelect = productContainer.querySelector(".qp-plan-select");
      const subscriptionDetails = productContainer.querySelector(".qp-subscription .qp-details");
      const form = productContainer.querySelector(`form[data-product-id="${productId}"]`);
      const sellingPlanInput = form?.querySelector(".sp-input");

      if (target.value === "subscription") {
        if (planSelect) planSelect.style.display = "block";
        if (subscriptionDetails) subscriptionDetails.style.display = "block";

        if (sellingPlanInput) {
          const firstPlanId = sellingPlans[0]?.id;
          if (firstPlanId) {
            const numericId = firstPlanId.split("/").pop();
            sellingPlanInput.value = numericId;
          }
        }
      } else {
        if (planSelect) planSelect.style.display = "none";
        if (subscriptionDetails) subscriptionDetails.style.display = "none";
        if (sellingPlanInput) sellingPlanInput.value = "";
      }
      
      // Update checkout button URL after radio change
      updateCheckoutButtonUrl(productContainer, productId, discount);
    }
    
    // Handle plan select dropdown changes
    if (target.classList.contains('qp-plan-select')) {
      const productContainer = target.closest('.quiz-product--desktop, .quiz-product--mobile, .quiz-product.pair-with');
      if (!productContainer) return;
      
      const form = productContainer.querySelector(`form[data-product-id="${productId}"]`);
      const sellingPlanInput = form?.querySelector(".sp-input");

      if (sellingPlanInput && target.value) {
        const numericId = target.value.split("/").pop();
        sellingPlanInput.value = numericId;
        
        // Update checkout button URL after plan change
        updateCheckoutButtonUrl(productContainer, productId, discount);
      }
    }
  });
  
  // Set initial checkout URL
  updateCheckoutButtonUrl(productEl, productId, discount);
}

/**************************************
 * HANDLE FORM SUBMISSIONS
 **************************************/
function handleFormSubmissions() {
  let clickedButton = null;
  
  // Capture which button was clicked
  document.addEventListener('click', function(e) {
    const button = e.target.closest('button[type="submit"]');
    if (button && button.closest('form.qp-atc-form')) {
      clickedButton = button;
    }
  }, true);
  
  // Intercept form submission
  document.addEventListener('submit', function(e) {
    if (e.target.classList.contains('qp-atc-form')) {
      const form = e.target;
      
      // Check if "Add to Order" button was clicked
      const isAddToOrder = clickedButton && 
                          (clickedButton.classList.contains('qp-add-to-order') || 
                           clickedButton.textContent.includes('Add to Order'));
      
      if (isAddToOrder) {
        // STOP THE FORM FROM SUBMITTING
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
          data[key] = value;
        }
        
        // Remove return_to to prevent redirect
        delete data.return_to;
        
        console.log('Adding product to cart:', data);
        
        // Disable button to prevent double-clicks
        clickedButton.disabled = true;
        
        // Add to cart via AJAX
        fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(addedItem => {
          console.log('Product added successfully');
          
          // Fetch fresh cart data
          return fetch('/cart.js');
        })
        .then(res => res.json())
        .then(cart => {
          // Update cart display
          if (typeof reloadAjaxCartItemUsingCartAjaxObject === 'function') {
            reloadAjaxCartItemUsingCartAjaxObject(cart);
          }
          if (typeof progressBar === 'function') {
            progressBar();
          }
          
          // Open minicart
          $('#CartSidebar').addClass('active');
          $('#cart_overlay').addClass('active');
          $('html').addClass('mini-cart-open');
          
          // Re-enable button
          clickedButton.disabled = false;
          clickedButton = null;
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Failed to add product to cart');
          clickedButton.disabled = false;
          clickedButton = null;
        });
        
        return false;
      }
      
      // Reset for next submission
      clickedButton = null;
    }
  }, true);
}

/**************************************
 * RENDER STARS (OPTIMIZED)
 **************************************/
function renderStars(productEl, productId) {
  const starsHTML = '★★★★★';
  const containers = productEl.querySelectorAll(`.qp-review-stars[data-product-id="${productId}"]`);
  containers.forEach(container => {
    container.innerHTML = starsHTML;
  });
}

/**************************************
 * BUILD PRODUCT HTML - DESKTOP VERSION (UPDATED)
 **************************************/
function buildProductHTMLDesktop(product, reviews, sellingPlans, metafields, isSecondProduct = false, firstName = '', discount = null) {
  const variant = product.variants?.[0];
  const oneTimePrice = variant.price_formatted;
  const firstPlan = sellingPlans[0];
  const buttonText = isSecondProduct ? "Add to Order" : "Express Checkout";
  const buttonClass = isSecondProduct ? "qp-add-to-order" : "";
  const subscriptionPrice = firstPlan?.perDeliveryPrice ? `$${firstPlan.perDeliveryPrice.toFixed(2)}` : oneTimePrice;
  
  const sellingPlanOptions = sellingPlans.map(plan => `<option value="${plan.id}">${plan.name}</option>`).join("");
  
  // Build the title with first name if available
  const titleText = firstName ? `Designed for you, ${firstName}...` : 'Designed for you...';
  
  // Build initial checkout URL for Express Checkout (first product only)
  const initialCheckoutUrl = !isSecondProduct ? buildCheckoutUrl(variant.id, '', discount) : '/cart/add';
  
  return `
    <div class="qp-left">
      <img src="${product.image}" class="qp-image" loading="lazy" />
      ${metafields.productLabel ? `<img src="${metafields.productLabel.url}" alt="${metafields.productLabel.altText || 'Product Label'}" class="qp-product-label" loading="lazy" />` : ''}
    </div>
    <div class="qp-right">
      <div class="qp-product-header">
        <h2 class="qp-title">${titleText}</h2>
        <div class="qp-reviews-wrapper">
          <div class="qp-review-stars" data-product-id="${product.id}"></div>
          <div class="qp-review-count">${formatNumberWithCommas(reviews.count)} Reviews</div>
        </div>
        <h3 class="qp-product-title">${product.title}</h3>
        <div class="qp-price-info--first">
          <h3 class="qp-product-price">${subscriptionPrice}</h3>
          <span class="qp-old-price">${oneTimePrice}</span>
        </div>
          ${discount && discount.show ? `<div class="qp-product-discount"><span>${discount.percent}% OFF</span><span class="qp-discount-code">Code: ${discount.code}</span></div>` : ''}
      </div>
      <div class="qp-subscription-container">
        <div class="qp-suscription-save">${firstPlan?.discountPercent ? `<span class="qp-save-extra">Save Extra ${firstPlan.discountPercent}%</span>` : ""}</div>
        <div class="qp-subscription">
          <label>
            <div class="qp-radio">
              <input type="radio" name="purchase_desktop_${product.id}" value="subscription"/>
              <span class="qp-radio__label">Subscribe & Save</span>
            </div>
            <div class="qp-price-info">
              <span class="qp-current-price">$${firstPlan?.perDeliveryPrice.toFixed(2) || '0.00'}</span>
              <span class="qp-old-price">${oneTimePrice}</span>
            </div>
          </label>
          <select class="qp-plan-select" data-product-id="${product.id}" style="display:none;">${sellingPlanOptions}</select>
          <div class="qp-details" style="display:none;">
            <div class="qp-detail">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66669 10.6L3.13336 7.06662L2.40002 7.73328L5.93336 11.2666L6.66669 12L13.7334 4.93328L13 4.19995L6.66669 10.6Z" fill="#84827E"/>
              </svg>
              Delivery every 30 days
            </div>
            <div class="qp-detail">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66669 10.6L3.13336 7.06662L2.40002 7.73328L5.93336 11.2666L6.66669 12L13.7334 4.93328L13 4.19995L6.66669 10.6Z" fill="#84827E"/>
              </svg>
              Pause or cancel anytime
            </div>
          </div>
        </div>
        <div class="qp-one-time">
          <label>
            <div class="qp-radio">
              <input type="radio" name="purchase_desktop_${product.id}" value="onetime" checked />
              <span class="qp-radio__label">One-time</span>
            </div>
            <div class="qp-price-info">
              <span class="qp-current-price">${oneTimePrice}</span>
            </div>
          </label>
        </div>
      </div>
      <div class="qp-product-footer">
      <form class="qp-atc-form" action="${initialCheckoutUrl}" method="post" data-product-id="${product.id}">
        <input type="hidden" name="id" value="${variant.id}">
        <input type="hidden" name="selling_plan" class="sp-input" value="" />
        <button type="submit" class="qp-atc-btn btn--primary ${buttonClass}">
          <span>${buttonText}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.0391 5.08594L12.9609 6.16406L18.0469 11.25H3V12.75H18.0469L12.9609 17.8359L14.0391 18.9141L20.4141 12.5391L20.9297 12L20.4141 11.4609L14.0391 5.08594Z" fill="CurrentColor"/>
          </svg>
        </button>
      </form>
        <div class="qp-product-details">
          <div class="qp-product-details__item">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2C4.69141 2 2 4.69141 2 8C2 11.3086 4.69141 14 8 14C11.3086 14 14 11.3086 14 8C14 4.69141 11.3086 2 8 2ZM8 3C10.7676 3 13 5.23242 13 8C13 10.7676 10.7676 13 8 13C5.23242 13 3 10.7676 3 8C3 5.23242 5.23242 3 8 3ZM7.5 4V8.5H11V7.5H8.5V4H7.5Z" fill="#1A1B1B"/>
            </svg>
            <span>Free Shipping (3-4 days)</span>
          </div>
          <div class="qp-product-details__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66672 10.6L3.13339 7.06662L2.40005 7.73328L5.93339 11.2666L6.66672 12L13.7334 4.93328L13.0001 4.19995L6.66672 10.6Z" fill="#1A1B1B"/>
            </svg>
            <span>30-Day Risk Free Guarantee</span>
          </div>
        </div>
      </div>
      ${renderRecommendationRationale(metafields.recommendationRationale)}
    </div>
  `;
}

/**************************************
 * BUILD PRODUCT HTML - MOBILE VERSION (UPDATED)
 **************************************/
function buildProductHTMLMobile(product, reviews, sellingPlans, metafields, isSecondProduct = false, firstName = '', discount = null) {
  const variant = product.variants?.[0];
  const oneTimePrice = variant.price_formatted;
  const firstPlan = sellingPlans[0];
  const buttonText = isSecondProduct ? "Add to Order" : "Express Checkout";
  const buttonClass = isSecondProduct ? "qp-add-to-order" : "";
  const subscriptionPrice = firstPlan?.perDeliveryPrice ? `$${firstPlan.perDeliveryPrice.toFixed(2)}` : oneTimePrice;
  
  const sellingPlanOptions = sellingPlans.map(plan => `<option value="${plan.id}">${plan.name}</option>`).join("");
  
  // Build the title with first name if available
  const titleText = firstName ? `Designed for you, ${firstName}...` : 'Designed for You...';
  
  // Build initial checkout URL for Express Checkout (first product only)
  const initialCheckoutUrl = !isSecondProduct ? buildCheckoutUrl(variant.id, '', discount) : '/cart/add';
  
  return `
    ${!isSecondProduct ? `<h2 class="qp-title qp-title--mobile">${titleText}</h2>` : ''}
    <div class="qp-mobile-top-row">
      <div class="qp-left qp-left--mobile">
        <img src="${product.image}" class="qp-image" loading="lazy" />
      </div>
      <div class="qp-product-header qp-product-header--mobile">
        <div class="qp-reviews-wrapper">
          <div class="qp-review-stars" data-product-id="${product.id}"></div>
          <div class="qp-review-count">${formatNumberWithCommas(reviews.count)} Reviews</div>
        </div>
        <h3 class="qp-product-title">${product.title}</h3>
        <div class="qp-price-info--first">
          <h3 class="qp-product-price">${subscriptionPrice}</h3>
          <span class="qp-old-price">${oneTimePrice}</span>
        </div>
        ${discount && discount.show ? `<div class="qp-product-discount"><span>${discount.percent}% OFF</span><span class="qp-discount-code">Code: ${discount.code}</span></div>` : ''}
        <form class="qp-atc-form" action="${initialCheckoutUrl}" method="post" data-product-id="${product.id}">
          <input type="hidden" name="id" value="${variant.id}">
          <input type="hidden" name="selling_plan" class="sp-input" value="" />
          <button type="submit" class="qp-atc-btn btn--primary ${buttonClass}">
            <span>${buttonText}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.0391 5.08594L12.9609 6.16406L18.0469 11.25H3V12.75H18.0469L12.9609 17.8359L14.0391 18.9141L20.4141 12.5391L20.9297 12L20.4141 11.4609L14.0391 5.08594Z" fill="CurrentColor"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
    <div class="qp-mobile-full-width">
      <div class="qp-subscription-container">
        <div class="qp-suscription-save">${firstPlan?.discountPercent ? `<span class="qp-save-extra">Save Extra ${firstPlan.discountPercent}%</span>` : ""}</div>
        <div class="qp-subscription">
          <label>
            <div class="qp-radio">
              <input type="radio" name="purchase_mobile_${product.id}" value="subscription"/>
              <span class="qp-radio__label">Subscribe & Save</span>
            </div>
            <div class="qp-price-info">
              <span class="qp-current-price">$${firstPlan?.perDeliveryPrice.toFixed(2) || '0.00'}</span>
              <span class="qp-old-price">${oneTimePrice}</span>
            </div>
          </label>
          <select class="qp-plan-select" data-product-id="${product.id}" style="display:none;">${sellingPlanOptions}</select>
          <div class="qp-details" style="display:none;">
            <div class="qp-detail">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66669 10.6L3.13336 7.06662L2.40002 7.73328L5.93336 11.2666L6.66669 12L13.7334 4.93328L13 4.19995L6.66669 10.6Z" fill="#84827E"/>
              </svg>
              Delivery every 30 days
            </div>
            <div class="qp-detail">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66669 10.6L3.13336 7.06662L2.40002 7.73328L5.93336 11.2666L6.66669 12L13.7334 4.93328L13 4.19995L6.66669 10.6Z" fill="#84827E"/>
              </svg>
              Pause or cancel anytime
            </div>
          </div>
        </div>
        <div class="qp-one-time">
          <label>
            <div class="qp-radio">
              <input type="radio" name="purchase_mobile_${product.id}" value="onetime" checked />
              <span class="qp-radio__label">One-time</span>
            </div>
            <div class="qp-price-info">
              <span class="qp-current-price">${oneTimePrice}</span>
            </div>
          </label>
        </div>
      </div>
      <div class="qp-product-footer">
      <form class="qp-atc-form" action="${initialCheckoutUrl}" method="post" data-product-id="${product.id}">
        <input type="hidden" name="id" value="${variant.id}">
        <input type="hidden" name="selling_plan" class="sp-input" value="" />
        <button type="submit" class="qp-atc-btn btn--primary ${buttonClass}">
          <span>${buttonText}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.0391 5.08594L12.9609 6.16406L18.0469 11.25H3V12.75H18.0469L12.9609 17.8359L14.0391 18.9141L20.4141 12.5391L20.9297 12L20.4141 11.4609L14.0391 5.08594Z" fill="CurrentColor"/>
          </svg>
        </button>
      </form>
        <div class="qp-product-details">
          <div class="qp-product-details__item">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2C4.69141 2 2 4.69141 2 8C2 11.3086 4.69141 14 8 14C11.3086 14 14 11.3086 14 8C14 4.69141 11.3086 2 8 2ZM8 3C10.7676 3 13 5.23242 13 8C13 10.7676 10.7676 13 8 13C5.23242 13 3 10.7676 3 8C3 5.23242 5.23242 3 8 3ZM7.5 4V8.5H11V7.5H8.5V4H7.5Z" fill="#1A1B1B"/>
            </svg>
            <span>Free Shipping (3-4 days)</span>
          </div>
          <div class="qp-product-details__item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.66672 10.6L3.13339 7.06662L2.40005 7.73328L5.93339 11.2666L6.66672 12L13.7334 4.93328L13.0001 4.19995L6.66672 10.6Z" fill="#1A1B1B"/>
            </svg>
            <span>30-Day Risk Free Guarantee</span>
          </div>
        </div>
      </div>
      ${renderRecommendationRationale(metafields.recommendationRationale)}
      ${metafields.productLabel ? `<img src="${metafields.productLabel.url}" alt="${metafields.productLabel.altText || 'Product Label'}" class="qp-product-label" loading="lazy" />` : ''}
    </div>
  `;
}

/**************************************
 * MAIN QUIZ EXECUTION (UPDATED WITH EMAIL/PHONE PRESERVATION)
 **************************************/
document.addEventListener("octane.quiz.completed", async function (e) {
  const eventData = e.detail;
  console.log("QUIZ EVENT DATA:", eventData);

  // Handle different data structures (normal completion vs direct URL)
  let results;
  let email = '';
  let phone = '';
  
  if (eventData.state && eventData.state.headless_results_page_accessed) {
    // Direct URL access - data is nested
    console.log("Direct URL result detected");
    results = eventData.state.headless_results_page_accessed;
    // IMPORTANT: Add the info object from state to results
    results.info = eventData.state.info;
    
    // CRITICAL: Extract email and phone from state for direct URL access
    // Check multiple possible locations
    email = eventData.state.email || 
            results.email || 
            eventData.email || 
            '';
    phone = eventData.state.phone || 
            results.phone || 
            eventData.phone || 
            '';
    
    console.log('Direct URL - Email:', email);
    console.log('Direct URL - Phone:', phone);
  } else if (eventData.sections) {
    // Normal quiz completion - data is at top level
    console.log("Normal quiz completion detected");
    results = eventData;
    email = results.email || '';
    phone = results.phone || '';
  } else {
    console.error("Unknown results structure:", eventData);
    return;
  }
  
  console.log("QUIZ RESULTS:", results);
  console.log("RESULTS INFO:", results.info);
  console.log("Email for discount:", email);
  console.log("Phone for discount:", phone);

  const container = await waitForResultsContainer();
  
  // Extract first name from answers
  const firstName = extractFirstName(results.answers);
  console.log("First name extracted:", firstName);

  // Calculate discount based on email and phone (now using extracted values)
  const discount = calculateDiscount(email, phone);
  console.log("Discount calculated:", discount);
  
  // Use document fragment for batch DOM manipulation
  const fragment = document.createDocumentFragment();

  // Check if results have any products - check the products array inside sections
  const hasProducts = results.sections && 
                      results.sections.length > 0 && 
                      results.sections.some(section => 
                        section.products && 
                        Array.isArray(section.products) && 
                        section.products.length > 0
                      );
  
  console.log("Has products:", hasProducts);
  
  if (!hasProducts) {
    console.log('No products in results, showing default product');
    
    // Build default product section - pass results to extract rationale
    const defaultSection = await buildDefaultProductSection(firstName, discount, results);
    
    if (defaultSection) {
      fragment.appendChild(defaultSection);
    } else {
      console.error('Failed to build default product section');
      container.innerHTML = '<div class="quiz-error">Unable to load product recommendations. Please try again.</div>';
      return;
    }
  } else {
    // Original logic for when products exist
    for (const section of results.sections) {
      const sectionWrapper = document.createElement("div");
      sectionWrapper.className = "quiz-section";

      // Fetch all product data with combined query
      const productsData = await Promise.all(
        section.products.map(async (product) => {
          const handle = getHandleFromUrl(product.link);
          
          if (!handle) {
            console.warn("Cannot extract handle for", product.title);
            return null;
          }

          const data = await fetchAllProductData(product.id, handle);
          return {
            product,
            ...data
          };
        })
      );

      // Filter out null results
      const validProducts = productsData.filter(p => p !== null);

      if (validProducts.length > 0) {
        const firstProductData = validProducts[0];

        // Extract recommendation rationale - pass both results and section
        const recommendationRationale = extractRecommendationRationale(results, section);
        
        // Desktop version
        const productElDesktop = document.createElement("div");
        productElDesktop.className = "quiz-product quiz-product--desktop";
        productElDesktop.innerHTML = buildProductHTMLDesktop(
          firstProductData.product,
          firstProductData.reviews,
          firstProductData.sellingPlans,
          { ...firstProductData.metafields, recommendationRationale },
          false,
          firstName,
          discount
        );

        if (validProducts.length > 1) {
          const secondProductData = validProducts[1];
          
          // Add the "Pair it with:" title first
          const qpRightDesktop = productElDesktop.querySelector(".qp-right");
          if (qpRightDesktop) {
            const pairWithTitle = document.createElement("span");
            pairWithTitle.className = "pair-with__title";
            pairWithTitle.textContent = "Pair it with:";
            qpRightDesktop.appendChild(pairWithTitle);
            
            // Then add the second product
            const secondProductElDesktop = document.createElement("div");
            secondProductElDesktop.className = "quiz-product pair-with";
            secondProductElDesktop.innerHTML = buildProductHTMLDesktop(
              secondProductData.product,
              secondProductData.reviews,
              secondProductData.sellingPlans,
              secondProductData.metafields,
              true,
              firstName
            );
            
            qpRightDesktop.appendChild(secondProductElDesktop);
            
            initProduct(secondProductElDesktop, secondProductData.product.id, secondProductData.sellingPlans, null);
            renderStars(secondProductElDesktop, secondProductData.product.id);
          }
        }

        sectionWrapper.appendChild(productElDesktop);
        initProduct(productElDesktop, firstProductData.product.id, firstProductData.sellingPlans, discount);
        renderStars(productElDesktop, firstProductData.product.id);

        // Mobile version
        const productElMobile = document.createElement("div");
        productElMobile.className = "quiz-product quiz-product--mobile";
        productElMobile.innerHTML = buildProductHTMLMobile(
          firstProductData.product,
          firstProductData.reviews,
          firstProductData.sellingPlans,
          { ...firstProductData.metafields, recommendationRationale },
          false,
          firstName,
          discount
        );

        if (validProducts.length > 1) {
          const secondProductData = validProducts[1];
          const pairWithMobileContainer = document.createElement("div");
          pairWithMobileContainer.className = "qp-pair-with-mobile-wrapper";
          pairWithMobileContainer.innerHTML = `<span class="pair-with__title pair-with__title--mobile">Pair it with:</span>`;
          
          const secondProductElMobile = document.createElement("div");
          secondProductElMobile.className = "quiz-product pair-with";
          secondProductElMobile.innerHTML = buildProductHTMLMobile(
            secondProductData.product,
            secondProductData.reviews,
            secondProductData.sellingPlans,
            secondProductData.metafields,
            true,
            firstName
          );
          
          pairWithMobileContainer.appendChild(secondProductElMobile);
          
          const qpMobileFullWidth = productElMobile.querySelector(".qp-mobile-full-width");
          if (qpMobileFullWidth) {
            qpMobileFullWidth.appendChild(pairWithMobileContainer);
          }

          initProduct(secondProductElMobile, secondProductData.product.id, secondProductData.sellingPlans, null);
          renderStars(secondProductElMobile, secondProductData.product.id);
        }

        sectionWrapper.appendChild(productElMobile);
        initProduct(productElMobile, firstProductData.product.id, firstProductData.sellingPlans, discount);
        renderStars(productElMobile, firstProductData.product.id);

        fragment.appendChild(sectionWrapper);
      }
    }
  }
  
  // Single DOM update - CLEAR OCTANE'S DEFAULT RESULTS AND REPLACE WITH CUSTOM
  const existingHeader = container.querySelector('.custom-quiz-header');
  const hasRetakeButton = existingHeader?.querySelector('#custom-retake-button');

  // Clear Octane's default results content
  container.innerHTML = "";

  // Only preserve header if it has the correct Retake Quiz button
  if (existingHeader && hasRetakeButton) {
    console.log('Preserving Retake Quiz header during results render');
    container.appendChild(existingHeader);
  }

  // Add your custom results
  container.appendChild(fragment);

  // Create or replace header with Retake Quiz button
  if (!existingHeader || !hasRetakeButton) {
    console.log('Creating/Replacing with Retake Quiz header');
    
    // Use the global createCustomHeader function if available
    if (typeof window.createCustomHeader === 'function') {
      window.createCustomHeader(container, true); // true = isResultsPage
    } else {
      console.warn('createCustomHeader function not available');
    }
  }
});

// Call when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleFormSubmissions);
} else {
  handleFormSubmissions();
}