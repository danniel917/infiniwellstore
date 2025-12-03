'use strict';

jQuery(document).ready(function () {});

// tweaks these below variable if you want to show subtotal and discount
var showCartSubTotalDiscountSection = true;
var showEmptyCartIcon = false;
var showCartCountInTopNav = true;
var showProgressBar = true;
var showVendorOnCartPage = false;
// Fixed variables
var lineItemComparePrice;
var cartObject;
var cartCountEmptyValue = '0';
var boxID = 'BuilderID';
var cartExtraInfo;
//extra classes for the elements
var removeExtraClass = 'btn-border-black-animate';
// recharge 2020
var frequency = '';
var recurringchecked = false;
var frequency_unit = '';
var freqProductSlider;
//SVG icons
var removeMiniCartTextOrIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.83157 1.01683C8.94087 0.903666 9.00134 0.752104 8.99998 0.594786C8.99861 0.437468 8.93551 0.286981 8.82426 0.175736C8.71302 0.0644912 8.56253 0.00138973 8.40521 2.26815e-05C8.2479 -0.00134437 8.09633 0.0591325 7.98317 0.168427L4.50737 3.64423L1.03157 0.168427C0.918411 0.0591325 0.76685 -0.00134437 0.609532 2.26815e-05C0.452214 0.00138973 0.301727 0.0644912 0.190482 0.175736C0.0792369 0.286981 0.0161354 0.437468 0.0147684 0.594786C0.0134013 0.752104 0.0738782 0.903666 0.183173 1.01683L3.65897 4.49263L0.183173 7.96843C0.125867 8.02377 0.0801575 8.08998 0.0487121 8.16318C0.0172667 8.23639 0.000714944 8.31512 2.26542e-05 8.39479C-0.000669636 8.47445 0.0145113 8.55346 0.0446798 8.6272C0.0748483 8.70094 0.1194 8.76793 0.175736 8.82426C0.232071 8.8806 0.299063 8.92515 0.3728 8.95532C0.446538 8.98549 0.525546 9.00067 0.605214 8.99998C0.684881 8.99928 0.763613 8.98273 0.836815 8.95129C0.910018 8.91984 0.976225 8.87413 1.03157 8.81683L4.50737 5.34103L7.98317 8.81683C8.09633 8.92612 8.2479 8.9866 8.40521 8.98523C8.56253 8.98386 8.71302 8.92076 8.82426 8.80952C8.93551 8.69827 8.99861 8.54778 8.99998 8.39047C9.00134 8.23315 8.94087 8.08159 8.83157 7.96843L5.35577 4.49263L8.83157 1.01683Z" fill="#84827E"/></svg>';
var minusIcon =
	'<svg width="11" height="3" viewBox="0 0 11 3" fill="none" xmlns="http://www.w3.org/2000/svg">   <path fill="#253032" d="M.5.563h10v2H.5z"/> </svg>';
var plusIcon =
	'<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 6.563v4h2v-4h4v-2h-4v-4h-2v4h-4v2h4z" fill="#253032"/> </svg>';
$(document).ready(function ($) {
	reloadAjaxCartItemUsingCartAjaxObject();

	// Queue both progressBar and quickCartTotal to wait for formatter initialization
	if (typeof window.ThemeInitQueue !== 'undefined') {
		window.ThemeInitQueue.add(function() {
			progressBar();
			quickCartTotal();
		}, {
			name: 'Initial Cart Display',
			requires: ['jquery'],
			priority: 2
		});
	} else {
		// Fallback if queue system isn't available
		progressBar();
		quickCartTotal();
	}
	//	window.location.href = "https://checkout.rechargeapps.com/r/checkout?myshopify_domain=XXX.myshopify.com";
	//window.location = '/checkout';
});
/*
EVENTS
1. Update quantity
2. remove item from cart
3. reload ajax cart
4. quickCartTotal
5. cart.requestComplete
*/
//QUANTITY UPDATE
function updateCartQuantity(cartThis) {
	var id = $(cartThis).attr('data-variant-id');
	var quantity = $('#updates_' + id).val();
	var type = $(cartThis).attr('date-type');
	var newQuantity = 0;
	if (quantity != '') {
		newQuantity = parseInt(quantity);
		if (type == 'type') {
		} else {
			if (type == 'plus') {
				newQuantity = newQuantity + 1;
			} else {
				if (newQuantity > 0) {
					newQuantity = newQuantity - 1;
				}
			}
		}
		var formData = {
			updates: {},
		};
		formData.updates[id] = newQuantity;
		// Perform the AJAX request to update the cart
		$.ajax({
			type: 'POST',
			url: '/cart/update.js',
			data: formData,
			dataType: 'json',
			success: function (cart) {
				// Perform any additional tasks after removing items
				$('#updates_' + id).val(newQuantity);
				getCartData(cart);
			},
			error: function (error) {
				// Handle error if the request fails
				console.error('Error updating items from the cart:', error);
			},
		});
	}
}

/* If you need extra information like collection title, metafield etc then use this function */
function reloadAjaxCartItemUsingCartAjaxObject(data) {
	//   cartInfo(data);
	$.ajax({
		type: 'GET',
		url: '/cart?view=alternate.json',
		success: function (response) {
			//extra information against the cart like collection title metafield, product title metafield, tags
			cartExtraInfo = $.parseJSON(response);
			cartInfo(data);
		},
		error: function (status) {
			console.warn('ERROR', status);
			cartInfo(data);
		},
	});
}
$(document).on('click', '.js__recharge-switch', function () {
	var id = $(this).attr('data-id');
	var lineQuantity = $(this).attr('data-qty');
	var lineCount = id;
	if ($(this).is(':checked')) {
		$('#rechagrePlanID' + id).addClass('active');
		$('#rechagrePlanID' + id)
			.parent('div')
			.children('.update-text')
			.show();
		$('#rechagrePlanID' + id)
			.children('li:first-child')
			.click();
	} else {
		$('#rechagrePlanID' + id).removeClass('active');
		$('#rechagrePlanID' + id)
			.parent('div')
			.children('.update-text')
			.hide();
		CartJS.updateItem(
			lineCount,
			lineQuantity,
			{
				selling_plan: '',
			},
			{
				success: function (data, textStatus, jqXHR) {},
				error: function (jqXHR, textStatus, errorThrown) {},
			}
		);
	}
});
$(document).on('click', '.js__rechagre-options li', function () {
	var planID = $(this).attr('data-id');
	var lineCount = $(this)
		.parent('ul')
		.attr('id')
		.replace('rechagrePlanID', '');
	var lineQuantity = $(this).parent('ul').attr('data-qty');
	$(this).parent('ul').children('li').removeClass('active');
	$(this).addClass('active');
	CartJS.updateItem(
		lineCount,
		lineQuantity,
		{
			selling_plan: parseInt(planID),
		},
		{
			success: function (data, textStatus, jqXHR) {},
			error: function (jqXHR, textStatus, errorThrown) {},
		}
	);
});

//RELOAD AJAX CART
var discountPriceTotal = 0;
function cartInfo(data) {
	var lineCount = 1;
	var cartObject;
	if (data == undefined) {
		cartObject = CartJS.cart;
	} else {
		cartObject = data;
		quickCartTotal(data);
	}
	var discountPriceTotal = 0;
	$('.js__top-cart-addons').html('');
	$('.js__ajax-products-bind').html('');
	$('.cart-list').html('');
	$('.js__freq-bought-products').hide();
	var freqProductCount = 0;
	if (cartObject.items.length == 0) {
		$('.empty-cart-section').show();
		$('.js__show-cart-items-section').hide();
		$('.js__top-cart-form-actions').hide();
		$('.js__freq-bought-products').show();
		$('.js__top-cart-addons').html($('.js__minicart-rec-items').html());
		// Safely destroy existing slider if it exists
		if (freqProductSlider && typeof freqProductSlider.destroy === 'function') {
			freqProductSlider.destroy();
		}
		freqProductSlider = new Swiper('.js__freq-product-slider', {
			slidesPerView: 2,
			spaceBetween: 20,
			freeMode: true,
			watchSlidesProgress: true,
			clickable: true,
			resistance: false,
			shortSwipes: false,
			slidesPerGroup: 2,
			loop: false,
			threshold: 5,
			pagination: {
				el: '.addons-swiper-pagination',
				clickable: true,
			},
		});
	} else {
		$('.js__top-cart-form-actions').show();
		$(cartObject.items).each(function () {
			var imageURL = this.featured_image.url;
			//imageURL = imageURL[0] + "." + imageURL[1] + '_450x450' + "." + imageURL[2];
			var imageAlt = this.featured_image.alt;
			var itemPrice = this.original_price;
			var itemLinePriceTotal = this.line_price;
			var handle = this.handle;
			var itemID = this.id;
			var itemPriceAfterDiscount = this.discounted_price;
			var comparePrice = '';
			let disabled = '';
			let finalLineItemPrice = this.final_line_price;
			let cartBundleBoxID = '';
			let boolPromoOffer = false;
			let productTitle = this.product_title;
			let url = this.url;
			let itemProperties = '';
			let itemPropertiesElement = '';
			let itemPropertiesElementMiniCart = '';
			var boolItemBoxType = false;
			var hideElementClass = '';
			var readonly = '';
			var justifyCenter = '';
			let sellingPlayInformation = '';
			var productLimitAddon = $('.js__top-cart-addons').attr(
				'data-limit'
			);
			if (this.selling_plan_allocation != undefined) {
				sellingPlayInformation =
					this.selling_plan_allocation.selling_plan.name;
			}
			var ProductType = '';
			if (this.properties != null) {
				itemProperties = this.properties;
				if (Object.keys(itemProperties).length > 0) {
					$.each(itemProperties, function (key, value) {
						/* If box ID exists, then remove quantity + -  working */
						if (key == boxID) {
							cartBundleBoxID = value;
						}
						if (key == '_ProductUrl') {
							url = value;
						}
						if (key == '_promoOffer') {
							boolPromoOffer = true;
						}
					});
					/* Checking the Box ID for the builder */
					itemPropertiesElementMiniCart = '';
					itemPropertiesElement = '<ul>';
					$.each(itemProperties, function (key, value) {
						/* If box ID exists, then remove quantity + -  working */
						if (key == boxID || key == '_FreeGift') {
							hideElementClass = 'hide';
							readonly = "readonly='readonly'";
							boolItemBoxType = true;
							justifyCenter = 'justify-center ';
							url = 'javascript:;';
							ProductType = 'FreeGift';
						}
						if (key.indexOf('_') > -1) {
						} else {
							if (key != boxID) {
								itemPropertiesElement +=
									"<li class='flex'><span>" +
									key +
									": </span><span style='padding-left: 5px'>" +
									value +
									'</span>';
								itemPropertiesElement += '</li>';
							} else {
								itemPropertiesElement +=
									"<li class='flex'><span>" +
									key +
									": </span><span style='padding-left: 5px'>" +
									value +
									'</span>';
								itemPropertiesElement += '</li>';
							}
						}
						// Recharge - when subscription is via properties for older recharge version before November 2020
						recharge2020(key, value);
					});
					itemPropertiesElementMiniCart =
						itemPropertiesElement + '</ul>';
					// Recharge 2020, check if it's a subscription, then bind the value in the UL
					if (recurringchecked) {
						itemPropertiesElement +=
							"<li class='flex'><span>Recurring Delivery every " +
							frequency +
							' ' +
							frequency_unit +
							'. Change or cancel anytime</span>';
						itemPropertiesElement += '</li>';
					}
					itemPropertiesElement += '</ul>';
				} else {
					//itemPropertiesElement = "";
				}
			}
			var rechargeSelected = this.selling_plan_allocation;
			var sellingPlanID = '';
			if (this.selling_plan_allocation != undefined) {
				sellingPlanID = this.selling_plan_allocation.selling_plan.id;
			}
			var rechargeDropdown = '';
			var rechargeRadio = '';

			/* Loop through cartExtraInformation section */
			$(cartExtraInfo.items).each(function (key, value) {
				if (value.id == itemID) {
					if (value.comparePrice != null) {
						comparePrice = value.comparePrice;
					}
					if (value.product_meta_image != '') {
						imageURL = value.product_meta_image;
					}
					$(value.recommedProduct).each(function (
						key,
						valueRecommedProduct
					) {
						var boolProductExists = false;
						$(cartObject.items).each(function () {
							if (
								valueRecommedProduct.product_id ==
								this.product_id
							) {
								boolProductExists = true;
							}
						});
						$('.js__top-cart-addons  .addons-slide').each(function (
							index
						) {
							var product_ID = $(this).attr('data-id');
							if (product_ID == valueRecommedProduct.product_id) {
								boolProductExists = true;
							}
						});
						if (boolProductExists == false) {
							$('.js__freq-bought-products').show();
							if (
								parseInt(productLimitAddon) > freqProductCount
							) {
								$('.js__top-cart-addons').append(
									' <div data-id="' +
										valueRecommedProduct.product_id +
										'" class="swiper-slide slider addons-slide addons-slide-' +
										valueRecommedProduct.product_variant +
										'"  data-attr-variantid="' +
										valueRecommedProduct.product_variant +
										'"><div class="image-section"><a href="' +
										valueRecommedProduct.product_url +
										'" title="' +
										valueRecommedProduct.product_name +
										'"> <img class="lazyload"  src="' +
										valueRecommedProduct.product_image +
										'"    >  </a>    </div> <div class="content">   <h5>   <a href="' +
										valueRecommedProduct.product_url +
										'" title="' +
										valueRecommedProduct.product_name +
										'">' +
										valueRecommedProduct.product_name +
										'</a>  </h5>  <p class="product-card__price">    <span>' +
										valueRecommedProduct.product_price +
										'</span> <s style="display:none">' +
										valueRecommedProduct.product_compare_price +
										'</s>  </p>  <div class="add-link"> <button  class="freq-add js__quick-view-mini-cart-click"   title="' +
										valueRecommedProduct.product_name +
										'"      href="javascript:;"   title="Shop ' +
										valueRecommedProduct.product_name +
										'" data-id="mini-cart-' +
										valueRecommedProduct.product_id +
										'" data-attr-variantid="' +
										valueRecommedProduct.product_variant +
										'" data-attr-productid="' +
										valueRecommedProduct.product_id +
										'" data-available="' +
										valueRecommedProduct.product_available +
										'" data-image="' +
										valueRecommedProduct.product_popup_image +
										'"  >Quick Add +</button> <div class="js__benefits" style="display:none">' +
										valueRecommedProduct.product_benefits +
										'</div>  </div> </div> </div>'
								);
								freqProductCount++;
							}
						}
					});
					try {
						// Safely destroy existing slider if it exists
						if (freqProductSlider && typeof freqProductSlider.destroy === 'function') {
							freqProductSlider.destroy();
						}
						freqProductSlider = new Swiper(
							'.js__freq-product-slider',
							{
								slidesPerView: 2,
								spaceBetween: 20,
								freeMode: true,
								watchSlidesProgress: true,
								clickable: true,
								resistance: false,
								shortSwipes: false,
								slidesPerGroup: 2,
								loop: false,
								threshold: 5,
								pagination: {
									el: '.addons-swiper-pagination',
									clickable: true,
								},
							}
						);
					} catch {}
					var Quantity = value.quantity;
					if (ProductType == 'FreeGift') {
						if (parseInt(Quantity) > 1) {
							/*Update Free Gift Quantity if more than 1*/
							var formData = {
								updates: {},
							};
							formData.updates[itemID] = 1;
							// Perform the AJAX request to update the cart
							$.ajax({
								type: 'POST',
								url: '/cart/update.js',
								data: formData,
								dataType: 'json',
								success: function (cart) {
									// Perform any additional tasks after removing items
									Quantity = 1;
									getCartData(cart);
								},
								error: function (error) {
									// Handle error if the request fails
									console.error(
										'Error updating items from the cart:',
										error
									);
								},
							});
						}
					}
					if (value.product_recharge == 'True') {
						var optionActive = 'active';
						if (rechargeSelected == undefined) {
							optionActive = '';
						}
						var rechargeOptions =
							"<ul id='rechagrePlanID" +
							lineCount +
							"' data-qty=" +
							Quantity +
							" class='rechagre-options js__rechagre-options " +
							optionActive +
							"'>";
						var productRechargeDiscount = '';
						var rechargeSelectOptions = '';
						$(value.recharge).each(function (key, valueRecharge) {
							if (
								sellingPlanID ==
								valueRecharge.product_rechargeID
							) {
								rechargeOptions +=
									"<li class='active' data-id=" +
									valueRecharge.product_rechargeID +
									'>' +
									valueRecharge.product_rechargeName.replace(
										'Delivery every ',
										''
									) +
									'</li>';
								productRechargeDiscount =
									valueRecharge.product_rechargeDiscount;
								rechargeSelectOptions +=
									'<option selected value=' +
									valueRecharge.product_rechargeID +
									'>' +
									valueRecharge.product_rechargeName +
									'</option>';
							} else {
								rechargeOptions +=
									'<li data-id=' +
									valueRecharge.product_rechargeID +
									'>' +
									valueRecharge.product_rechargeName.replace(
										'Delivery every ',
										''
									) +
									'</li>';
								productRechargeDiscount =
									valueRecharge.product_rechargeDiscount;
								rechargeSelectOptions +=
									'<option value=' +
									valueRecharge.product_rechargeID +
									'>' +
									valueRecharge.product_rechargeName +
									'</option>';
							}
						});
						rechargeOptions += '</ul>';
						if (rechargeSelected == undefined) {
							rechargeDropdown =
								"<select id='planID" +
								lineCount +
								"' data-qty=" +
								Quantity +
								" class='" +
								hideElementClass +
								" custom-dropdown-select js__cart-plan'>" +
								rechargeSelectOptions +
								"<option value='One Time Purchase' selected>One Time Purchase</option></select>";
						} else {
							rechargeDropdown =
								"<select id='planID" +
								lineCount +
								"' data-qty=" +
								this.quantity +
								" class='" +
								hideElementClass +
								" custom-dropdown-select js__cart-plan'>" +
								rechargeSelectOptions +
								"<option value='One Time Purchase'>One Time Purchase</option></select>";
						}
						if (rechargeSelected == undefined) {
							rechargeRadio =
								'<div class="cart-recahrge-section"><div class="inner"><label class="switch "> <input type="checkbox" data-qty=' +
								Quantity +
								'  data-id=' +
								lineCount +
								' class="js__recharge-switch" value="' +
								value.product_rechargeID +
								'"  >  <span class="slider"></span></label><span class="text">Subscribe</span><span class="save">Save ' +
								productRechargeDiscount +
								'%</span></div><div class="rechargeOptions-outer">' +
								rechargeOptions +
								"<span class='update-text' style='display:none'>Update or cancel anytime.</div></span></div>";
						} else {
							rechargeRadio =
								'<div class="cart-recahrge-section"><div class="inner"><label class="switch "> <input data-id=' +
								lineCount +
								' class="js__recharge-switch" type="checkbox" value="' +
								value.product_rechargeID +
								'" checked >  <span class="slider"></span></label><span class="text">Subscribe</span><span class="save">Save ' +
								productRechargeDiscount +
								'%</span></div><div class="rechargeOptions-outer">' +
								rechargeOptions +
								"<span class='update-text'>Update or cancel anytime.</span></div></div>";
						}
					}
					productTitle =
						"<h5> <a href='" +
						url +
						"' id='product-card-" +
						this.id +
						"' tabindex='0'>" +
						value.product_title.split('with')[0] +
						' </a></h5>';
				}
			});
			/* get compare price using cartLib object */
			// if (typeof cartLib !== "undefined") {
			//           $.each(cartLib, function(key, value) {
			//               //console.log(value);
			//               if (value["id"] == itemID) {
			//                   comparePrice = value["comparePrice"];
			//               }
			//           });
			//       }
			/* FORMATTED PRICING */

			if (this.selling_plan_allocation != undefined) {
				comparePrice = this.selling_plan_allocation.compare_at_price;
			}
			var formattedcomparePrice = formatter.format(comparePrice / 100);
			var comparePriceHtml = '';
			if (comparePrice > parseFloat(itemPrice)) {
				comparePriceHtml = '<s>' + formattedcomparePrice + '</s>';
			}

			// total compared price for the item with quantity
			var totalListItemComparePrice = formatter.format(
				(comparePrice * this.quantity) / 100
			);
			// item original price
			var formattedItemPrice = formatter.format(itemPrice / 100);
			// line price
			var formattedItemLinePriceTotal = formatter.format(
				itemLinePriceTotal / 100
			);
			//final line item price
			var formattedFinalLineItemPrice = formatter.format(
				finalLineItemPrice / 100
			);
			if (comparePrice != '') {
				if (comparePrice > parseFloat(itemPrice)) {
					discountPriceTotal +=
						comparePrice * this.quantity - finalLineItemPrice;
				}
			}

			//Price after discount
			let showPrice = '';
			let itemPriceAfterDiscountStatus = false;
			let discountedMessage = '';
			let discountedMessageElement = '';
			if (this.discounts != null) {
				discountedMessage = this.discounts;
				if (Object.keys(discountedMessage).length > 0) {
					//console.log("DISCOUNT EXISTS");
					discountedMessageElement =
						"<span class='discountedMessage'>";
					$.each(discountedMessage, function (key, value) {
						discountedMessageElement += value.title;
					});
					discountedMessageElement += '</span>';
				}
			}
			var formattedItemPriceAfterDiscount = formatter.format(
				itemPriceAfterDiscount / 100
			);
			// if itemPriceAfterDiscount > 0 then set the status to true so you can interchange the values
			if (this.discounts.length > 0) {
				itemPriceAfterDiscountStatus = true;
			}
			// if it's true; then show the compared price as the main price this.price and main price as discounted price
			if (itemPriceAfterDiscountStatus) {
				//comparePriceHtml
				showPrice =
					'<span class="price-wrapper js__raw-line-item-price"  data-attr-compare-price="0"><s>' +
					formattedItemPrice +
					'</s><span class="price" data-key="' +
					itemID +
					'">' +
					formattedItemPriceAfterDiscount +
					"</span><span class='forMiniCart'>" +
					formattedFinalLineItemPrice +
					'</span></span>' +
					discountedMessageElement;
			} else {
				showPrice =
					'<span class="price-wrapper js__raw-line-item-price"  data-attr-compare-price="0">' +
					comparePriceHtml +
					'<span class="price" data-key="' +
					itemID +
					'">' +
					formattedItemPrice +
					"</span><span class='forMiniCart'>" +
					formattedFinalLineItemPrice +
					'</span></span>';
			}
			/* check if variantTitle is NULL, then don't show variant */
			var variantTitle = this.variant_title;
			if (variantTitle == null) {
				variantTitle = '';
			}
			var variantData = '';
			$.each(this.options_with_values, function (key, value) {
				//console.log("key" + key);console.log("value" + value["name"]);console.log("value" + value["value"]);
				variantData +=
					'<li><span>' +
					value['name'] +
					': ' +
					value['value'].split('with')[0] +
					'</span></li>';
			});
			/* CUSTOM - if the product title contains "bag",  then disabled the quantity element
          To be applied for all the products with BoxID and Promo Offer
          */
			if (
				(this.product_title.toLowerCase().indexOf('bag') >= 0 &&
					cartBundleBoxID != '') ||
				(this.product_title.toLowerCase().indexOf('bag') >= 0 &&
					boolPromoOffer)
			) {
				//if you want to hide the quantity + - then enable the class below
				// hideElementClass="hide"
				justifyCenter = 'justify-center ';
				readonly = "readonly='readonly'";
				disabled = 'disabled ';
			}
			/* 
      LINE ITEM FOR THE MINI CART
      */
			// remove anchor
			let removeAnchorElement =
				'<div class="remove js__cart-item-remove ' +
				removeExtraClass +
				'" data-cart-line-count="' +
				lineCount +
				'" data-variant-id="' +
				itemID +
				'"  data-cart-remove-variant="' +
				this.id +
				'>' +
				removeMiniCartTextOrIcon +
				'</div>';

			// Save to wishlist
			// let wishlistAnchorElement =
			// '<button class="btn--addtoWishlist' +
			// removeExtraClass +
			// '" data-cart-line-count="' +
			// lineCount +
			// '" data-variant-id="' +
			// itemID +
			// '"  data-cart-remove-variant="' +
			// this.id + ">"
			// "Save to Wishlist"
			// "</button>";
			//quantity element
			var quantityElement =
				'<div class="cart-quantity-outer ' +
				disabled +
				justifyCenter +
				'"> <a  tabindex="0"  class="minus-qty ' +
				hideElementClass +
				'  font-zero" date-type="minus" onclick="updateCartQuantity(this)"   data-variant-id="' +
				itemID +
				'">' +
				minusIcon +
				'</a> <input aria-label="Quantity"  tabindex="-1"  data-limit="' +
				boolItemBoxType +
				'"  ' +
				readonly +
				'   onkeydown="return isNumeric(event);" data-variant-id="' +
				itemID +
				'" onblur="updateCartQuantity(this)" date-type="type" type="number"  data-attr-raw-variant-quantity="94" data-cart-line-count="' +
				lineCount +
				'" class="cart__quantity-selector js__cart__quantity-selector" name="updates[]" id="updates_' +
				itemID +
				'" value="' +
				this.quantity +
				'" maxlength="3" size="3"> <a  tabindex="0"  class="plus-qty ' +
				hideElementClass +
				'  font-zero" date-type="plus" onclick="updateCartQuantity(this)"     data-variant-id="' +
				itemID +
				'">' +
				plusIcon +
				'</a> </div>';
			//vendor element
			let vendorElement =
				'<span class="subheading uppercase">' + this.vendor + '</span>';
			var lineItem;
			lineItem =
				'<li class="flex-wrap js__cart-table-item-row" data-cart-line-count=' +
				lineCount +
				' data-handle="' +
				handle +
				'" data-variant-id=' +
				itemID +
				'><div class="image-section"> <a href="' +
				url +
				'"><img alt="' +
				imageAlt +
				'" src="' +
				imageURL +
				'""> </a> <button data-with-epi="true" class="swym-button swym-add-to-wishlist-view-product wishlist swym-button product_' +
				this.product_id +
				'" data-swaction="addToWishlist" data-product-id="' +
				this.product_id +
				'" data-variant-id="' +
				itemID +
				'" data-product-url="https://infiniwell.com/' +
				this.url +
				'"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none"  class="icon-heart"><path d="M11.9825 5.17292C11.9416 5.05071 11.8357 4.96167 11.7084 4.94208L8.32665 4.42538L6.81146 1.19767C6.75474 1.07701 6.63339 1 6.50017 1C6.36696 1 6.24578 1.07701 6.18888 1.19767L4.67369 4.42538L1.29197 4.94225C1.1646 4.96167 1.05889 5.05088 1.01781 5.17309C0.976901 5.29513 1.00767 5.42989 1.09774 5.5222L3.5547 8.04156L2.97407 11.6003C2.95275 11.7303 3.00758 11.8611 3.11536 11.9367C3.17449 11.9785 3.24376 11.9996 3.3132 11.9996C3.37027 11.9996 3.42768 11.9852 3.47959 11.9566L6.5 10.2861L9.52041 11.9566C9.57232 11.9852 9.62973 11.9996 9.6868 11.9996C9.75624 11.9996 9.82569 11.9785 9.88464 11.9367C9.99242 11.8611 10.0472 11.7303 10.0259 11.6003L9.4453 8.04156L11.9023 5.5222C11.9925 5.42972 12.0234 5.29496 11.9825 5.17292Z" stroke="#1A1F2A" stroke-width="0.8"/></svg><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none"  class="icon-heart-filled"><path d="M11.9825 5.17292C11.9416 5.05071 11.8357 4.96167 11.7084 4.94208L8.32665 4.42538L6.81146 1.19767C6.75474 1.07701 6.63339 1 6.50017 1C6.36696 1 6.24578 1.07701 6.18888 1.19767L4.67369 4.42538L1.29197 4.94225C1.1646 4.96167 1.05889 5.05088 1.01781 5.17309C0.976901 5.29513 1.00767 5.42989 1.09774 5.5222L3.5547 8.04156L2.97407 11.6003C2.95275 11.7303 3.00758 11.8611 3.11536 11.9367C3.17449 11.9785 3.24376 11.9996 3.3132 11.9996C3.37027 11.9996 3.42768 11.9852 3.47959 11.9566L6.5 10.2861L9.52041 11.9566C9.57232 11.9852 9.62973 11.9996 9.6868 11.9996C9.75624 11.9996 9.82569 11.9785 9.88464 11.9367C9.99242 11.8611 10.0472 11.7303 10.0259 11.6003L9.4453 8.04156L11.9023 5.5222C11.9925 5.42972 12.0234 5.29496 11.9825 5.17292Z" fill="#1A1F2A" stroke="#1A1F2A" stroke-width="0.8"/></svg></button></div>';
			lineItem +=
				'<div class="content"><div class="title-section">' +
				productTitle +
				removeAnchorElement +
				// wishlistAnchorElement +
				'';
			if (sellingPlayInformation != '') {
				//lineItem += '<p class="capitalize">' + sellingPlayInformation + "</p>";
			}
			if (itemPropertiesElementMiniCart != '') {
				lineItem +=
					'<p class="capitalize">' +
					itemPropertiesElementMiniCart +
					'</p>';
			}
			if (variantTitle != '') {
				lineItem += '<ul>' + variantData + '</ul>';
			}
			lineItem +=
				showPrice +
				'</div><div class="flex-space-between"><p class="hide">Qty ' +
				this.quantity +
				'</p>' +
				quantityElement;
			lineItem +=
				"<span class='price'>" +
				formattedItemPriceAfterDiscount +
				comparePriceHtml +
				'</span></div>' +
				rechargeRadio +
				'</div>';
			lineItem += '</li>';
			/* Bind the line item to the list */
			$('.js__ajax-products-bind').append(lineItem);
			setTimeout(function () {
				window.SwymCallbacks.push(swymCallbackFn);
				function swymCallbackFn(swat) {
					// your API calls go here

					swat.initializeActionButtons('.js__ajax-products-bind');
				}
				if (!window.SwymCallbacks) {
					window.SwymCallbacks = [];
				}
				window.SwymCallbacks.push(swymCallbackFn);
			}, 500);

			/*******LINE ITEM FOR THE CART PAGE********/
			if ($('.cart-list')[0]) {
				var cartLineItem = '';
				cartLineItem =
					'<div class="cart-list__items cart-table-body js__cart-table-item-row flex" data-cart-line-count="' +
					lineCount +
					'" data-attr-compare-price="" data-variant-id="' +
					itemID +
					'"><div class="cart-list__items__columns"><div class="image-section "><img class="img-responsive img-thumbnail item-image" src="' +
					imageURL +
					'" alt="' +
					imageAlt +
					'"></div> <div class="content">';
				// show vendor on cart page
				if (showVendorOnCartPage) {
					cartLineItem += vendorElement;
				}
				cartLineItem += productTitle;
				cartLineItem += '<div class="cart-list__variant-properties">';
				if (sellingPlayInformation != '') {
					cartLineItem +=
						'<span class="capitalize">' +
						sellingPlayInformation +
						'</span>';
				}
				if (itemPropertiesElement != '') {
					cartLineItem +=
						'<span class="capitalize">' +
						itemPropertiesElement +
						'</span>';
				}
				if (variantTitle != '') {
					cartLineItem += '<ul>' + variantData + '</ul>';
				}
				cartLineItem += '</div>';
				cartLineItem +=
					'<a class="remove link--primary" data-cart-line-count="' +
					lineCount +
					'" data-variant-id="' +
					itemID +
					'" href="javascript:;">remove</a></div>  </div>  <div class="cart-list__items__columns">';
				cartLineItem += showPrice;
				cartLineItem += '</div>';
				cartLineItem +=
					'<div class="cart-list__items__columns quantity" data-variant-id="' +
					itemID +
					'"> ' +
					quantityElement +
					'  <span class="js__out-of-stock"></span>';
				// ** Remove action is added here too
				cartLineItem +=
					"</div><div class='cart-list__items__columns recharge ' > " +
					rechargeDropdown +
					' </div>';
				cartLineItem +=
					'<div class="cart-list__items__columns total-price " data-head="Total"> <span class="price-wrapper js__set-line-item-price" data-attr-price="' +
					itemPrice +
					'" data-attr-compare-price=' +
					totalListItemComparePrice +
					'><s class="hide">' +
					totalListItemComparePrice +
					'</s><span class="price" data-key="' +
					itemID +
					'">' +
					formattedItemLinePriceTotal +
					'</span> </span>';
				// ** Remove element is added here too
				cartCountEmptyValue += ' </div></div>';
				$('.cart-list').append(cartLineItem);
			}
			lineCount++;
		});
	}
	$('.total-discount').hide();
	if (discountPriceTotal > 0) {
		$('.total-discount').show();
		var formatteddiscountPriceTotal = formatter.format(
			discountPriceTotal / 100
		);
		$('.js__cart-total-discount').html(formatteddiscountPriceTotal);
	}
}
//CALCULATE TOTAL OF THE CART
function quickCartTotal(data) {
	if (data == undefined) {
		cartObject = CartJS.cart;
	} else {
		cartObject = data;
	}
	let total = cartObject.items_subtotal_price;
	total = total / 100;
	total = formatter.format(total);
	$('.js__cart-total').html(total);
	$('.js__ajax-cart-total').html('' + total);
	$('.js__ajax-cart-total').show();
	$('.js__ajax-cart-count').removeClass('multiple-digit');
	if (parseInt(cartObject.item_count) > 9) {
		$('.js__ajax-cart-count').addClass('multiple-digit');
	}
	$('.js__ajax-cart-count').html(cartObject.item_count);
	$('.js__minicart-cart-count .count').html(cartObject.item_count);
	$('.js__top-cart-form-actions').show();
	$('.js__cart-expand ').removeClass('empty-cart');
}
/* REMOVE */
var savedItemPropertyBoxID = '';
$(document).on('click', '.remove', function () {
	var variantID = parseInt($(this).attr('data-variant-id'));
	var clickedLineItemCount = parseInt($(this).attr('data-cart-line-count'));
	var currentLoopItemCount = 1;
	// console.log(variantID);
	var boxID = 'BuilderID';
	var itemsToRemove = [];
	var formData = {
		updates: {},
	};
	$.getJSON('/cart.js', function (cart) {
		var savedItemPropertyBoxID = '';
		// console.log(cart.items.length);
		// Find the item with the matching variantID and save its BoxID property
		for (var i = 0; i < cart.items.length; i++) {
			if (clickedLineItemCount === currentLoopItemCount) {
				var currentItem = cart.items[i];
				if (currentItem.variant_id === variantID) {
					// console.log(currentItem);
					// console.log(currentItem.variant_id);
					// console.log("variant ID matches");
					// console.log(currentItem.properties);
					// console.log(currentItem.properties[boxID]);
					if (
						currentItem.properties &&
						currentItem.properties[boxID]
					) {
						savedItemPropertyBoxID = currentItem.properties[boxID];
						// console.log("Saved Item Property Box ID:", savedItemPropertyBoxID);
						break;
					} else {
						// it doesn't has the BoxID, then delete the particular LineItem
						// console.log("Current Line Item - With no BoxID")
						itemsToRemove.push(currentItem.variant_id);
					}
				}
			}
			currentLoopItemCount = currentLoopItemCount + 1;
		}
		// Loop through cart items to find items with matching BoxID
		for (var j = 0; j < cart.items.length; j++) {
			var currentItem = cart.items[j];
			if (
				currentItem.properties &&
				currentItem.properties[boxID] === savedItemPropertyBoxID
			) {
				itemsToRemove.push(currentItem.variant_id);
				//console.log("Item Variant ID to Remove:", currentItem.variant_id);
			}
		}
		// console.log(itemsToRemove);
		// console.log(itemsToRemove.length);
		// Call the function to remove items from the cart
		removeItemsFromCart(itemsToRemove);
		// Remove items from the cart
	});
});
$(document).on('change', '.js__cart-plan', function () {
	var lineCount = $(this).attr('id').replace('planID', '');
	var lineQuantity = $(this).attr('data-qty');
	var rechargeValue = $(this).val();
	if (rechargeValue == 'One Time Purchase') {
		CartJS.updateItem(
			lineCount,
			lineQuantity,
			{
				selling_plan: '',
			},
			{
				success: function (data, textStatus, jqXHR) {},
				error: function (jqXHR, textStatus, errorThrown) {},
			}
		);
	} else {
		CartJS.updateItem(
			lineCount,
			lineQuantity,
			{
				selling_plan: parseInt(rechargeValue),
			},
			{
				success: function (data, textStatus, jqXHR) {},
				error: function (jqXHR, textStatus, errorThrown) {},
			}
		);
	}
	// rechargeDropdown = "<select id='planID" + lineCount + "' data-qty=" + this.quantity + " class='custom-dropdown-select js__cart-plan'><option value=" + value.product_rechargeID + " selected>" + value.product_rechargeName + "</option><option value='One Time Purchase'>One Time Purchase</option></select>";
});
// Function to remove items from the cart
function removeItemsFromCart(itemsToRemove) {
	var formData = {
		updates: {},
	};
	// Populate the formData with variant IDs to remove
	for (var k = 0; k < itemsToRemove.length; k++) {
		var variantID = itemsToRemove[k];
		formData.updates[variantID] = 0;
	}
	$.ajax({
		type: 'POST',
		url: '/cart/update.js',
		data: formData,
		dataType: 'json',
		success: function (cart) {
			getCartData(cart);
		},
		error: function (error) {
			// Handle error if the request fails
			console.error('Error removing items from the cart:', error);
		},
	});
}
function getCartData() {
	$.getJSON('/cart.js', function (cart) {
		cartInfo(cart);
		progressBar();
		setTimeout(function () {
			// addons();
		}, 1000);
	});
}
/*
PROGRESS BAR
*/
function progressBar() {
	var totalAmount = 0;
	var shippingGrandTotal = 0;
	if (showProgressBar) {
		fetch('/cart.js', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then((res) => res.json())
			.then((data) => {
				totalAmount = data.total_price / 100;
				var freeShippingAmount = parseFloat(
					$('.js__free-shipping-limit').html()
				);
				$('.js__free-shipping__icon').removeClass('active');
				$('.js__free-gift-1__icon').removeClass('active');
				$('.js__free-gift-2__icon').removeClass('active');
				$('.js__gift-products').addClass('hide');
				$('.js__gift-products-1').addClass('hide');
				$('.js__gift-products-2').addClass('hide');
				shippingGrandTotal = freeShippingAmount;
				var freeShippingRemaningAmount =
					freeShippingAmount - totalAmount;
				var freeShippingPercentage = 100;
				if (freeShippingRemaningAmount > 0) {
					freeShippingPercentage =
						(totalAmount * 100) / freeShippingAmount;
					$('.js__free-shipping-limit-message').show();
					$('.js__free-shipping-message').hide();
					$('.js__free-shipping').hide();
					$('.js__CartShipping').addClass('hide');
				} else {
					$('.js__CartShipping').removeClass('hide');
					$('.js__free-shipping-limit-message').hide();
					$('.js__free-shipping-message').show();
					$('.js__free-shipping').show();
				}
				$('.js__free-shipping-remaning-amount').html(
					formatter.format(freeShippingRemaningAmount)
				);
				$('.js__free-shipping__progress-bar').attr(
					'data-percentage',
					freeShippingPercentage
				);
				var boolAddProduct = true;
				var boolFreeGIft1 = true;
				var boolFreeGIft2 = true;
				var count = cartObject.items.length;
				var itemCount = 0;
				$('.js__gift-products').addClass('hide');
				$(cartObject.items).each(function () {
					if (this.properties != null) {
						var itemProperties = this.properties;
						if (Object.keys(itemProperties).length > 0) {
							$.each(itemProperties, function (key, value) {
								/* If box ID exists, then remove quantity + -  working */

								if (key == '_FreeGift') {
									if (value == 1 || value == '1') {
										boolFreeGIft1 = false;
									}
									if (value == 2 || value == '2') {
										boolFreeGIft2 = false;
									}
								}
							});
							/* Checking the Box ID for the builder */
						} else {
							//itemPropertiesElement = "";
						}
					}
					itemCount++;
					console.log('boolFreeGIft1' + boolFreeGIft1);
					console.log('boolFreeGIft2' + boolFreeGIft2);
					if (parseInt(count) == itemCount) {
						if (boolFreeGIft1 == false) {
							$('.js__gift-products-1').addClass('hide');
						}
						if (boolFreeGIft2 == false) {
							$('.js__gift-products-2').addClass('hide');
						}
						if (boolFreeGIft1 == false && boolFreeGIft2 == false) {
							$('.js__gift-products').addClass('hide');
						}
					}
				});
				$('.js__free-shipping__progress-bar')
					.children('span')
					.css('width', freeShippingPercentage + '%');
				var giftProduct1 = $('.js__free-gift-product-1').attr(
					'data-attr-variantid'
				);
				var giftProduct2 = $('.js__free-gift-product-2').attr(
					'data-attr-variantid'
				);
				/*Free gift 1 */
				if (freeShippingPercentage == 100) {
					$('.js__free-shipping__icon').addClass('active');
					if ($('.js__free-gift-1').html() != '') {
						var freeGift1Amount = parseFloat(
							$('.js__free-gift-1').html()
						);
						var freeGift1RemaningAmount =
							freeGift1Amount - totalAmount;
						var freeGift1Percentage = 100;
						if (freeGift1RemaningAmount > 0) {
							freeGift1Percentage =
								(totalAmount * 100) / freeGift1Amount;
						}
						$('.js__free__gift-1__progress-bar').attr(
							'data-percentage',
							freeGift1Percentage
						);
						$('.js__free__gift-1__progress-bar')
							.children('span')
							.css('width', freeGift1Percentage + '%');
						console.log(
							'freeGift1Percentage' + freeGift1Percentage
						);

						/*Free gift 2 */
						if (freeGift1Percentage == 100) {
							// addFreeGift(giftProduct1, 1);
							if (boolFreeGIft1 == true) {
								/*  $(".js__gift-products").removeClass("hide")
                 $(".js__gift-products-1").removeClass("hide")
                $(".js__gift-products-1").find(".js__freegift-add-to-cart").removeClass("hide");*/
								$('.js__gift-products-1')
									.find('.js__freegift-add-to-cart')
									.click();
							}
							$('.js__free-gift-1__icon').addClass('active');
							if ($('.js__free-gift-2').html() != '') {
								var freeGift2Amount = parseFloat(
									$('.js__free-gift-2').html()
								);
								shippingGrandTotal =
									freeShippingAmount +
									freeGift1Amount +
									freeGift2Amount;
								var freeGift2RemaningAmount =
									freeGift2Amount - totalAmount;
								var freeGift2Percentage = 100;
								if (freeGift2RemaningAmount > 0) {
									freeGift2Percentage =
										(totalAmount * 100) / freeGift2Amount;
								}
								$('.js__free__gift-2__progress-bar').attr(
									'data-percentage',
									freeGift2Percentage
								);
								$('.js__free__gift-2__progress-bar')
									.children('span')
									.css('width', freeGift2Percentage + '%');
								console.log(
									'freeGift2Percentage' + freeGift2Percentage
								);
								if (freeGift2Percentage == 100) {
									//  addFreeGift(giftProduct2, 2);
									if (boolFreeGIft2 == true) {
										/* $(".js__gift-products").removeClass("hide")
                    $(".js__gift-products-2").removeClass("hide")
                   $(".js__gift-products-2").find(".js__freegift-add-to-cart").removeClass("hide");*/
										$('.js__gift-products-2')
											.find('.js__freegift-add-to-cart')
											.click();
									}
									$('.js__free-gift-2__icon').addClass(
										'active'
									);
								} else {
									if (boolFreeGIft2 == false) {
										removeFreeGift(giftProduct2);
									}
								}
							}
						} else {
							if (boolFreeGIft1 == false) {
								removeFreeGift(giftProduct1);
							}
							if (boolFreeGIft2 == false) {
								removeFreeGift(giftProduct2);
							}
						}
					}
				} else {
					if (boolFreeGIft1 == false) {
						removeFreeGift(giftProduct1);
					}
					if (boolFreeGIft2 == false) {
						removeFreeGift(giftProduct2);
					}
				}
				if ($('.js__free-gift-1').html() != '') {
					shippingGrandTotal = parseFloat(
						$('.js__free-gift-1').html()
					);
				}
				if ($('.js__free-gift-2').html() != '') {
					shippingGrandTotal = parseFloat(
						$('.js__free-gift-2').html()
					);
				}
				var shippingGrandRemaningAmount =
					shippingGrandTotal - totalAmount;
				var shippingGrandPercentage = 100;
				if (shippingGrandRemaningAmount > 0) {
					shippingGrandPercentage =
						(totalAmount * 100) / shippingGrandTotal;
				}
				$('.js__grandtotal-shipping').attr(
					'data-percentage',
					shippingGrandPercentage
				);
				$('.js__grandtotal-shipping').css(
					'width',
					shippingGrandPercentage + '%'
				);
			});
	}
}
function removeFreeGift(variantID) {
	fetch('/cart.js', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})
		.then((res) => res.json())
		.then((data) => {
			$(cartObject.items).each(function () {
				var itemID = this.id;
				if (itemID == variantID) {
					var formData = {
						updates: {},
					};
					formData.updates[variantID] = 0;
					$.ajax({
						type: 'POST',
						url: '/cart/update.js',
						data: formData,
						dataType: 'json',
						success: function (cart) {
							getCartData(cart);
						},
						error: function (error) {
							// Handle error if the request fails
							console.error(
								'Error removing items from the cart:',
								error
							);
						},
					});
				}
			});
		});
}
$(document).ready(function ($) {
	$(document).on('click', '.js__freegift-add-to-cart', function (e) {
		$(this).addClass('clicked');
		var giftNumber = $(this).attr('data-gift-number');
		var variantID = $(this).attr('data-attr-variantid');
		addFreeGift(variantID, giftNumber);
	});
});
function addFreeGift(variantID, giftnumber) {
	console.log('free gift' + variantID + 'fff' + giftnumber);
	var selectedVariantID = variantID;
	var giftNumberRow = $('.js__gift-' + selectedVariantID).attr('data-number');
	if (parseInt(giftNumberRow) == parseInt(giftnumber)) {
		$('.js__gift-' + selectedVariantID)
			.find('.js__freegift-add-to-cart')
			.addClass('hide');
		$('.js__gift-' + selectedVariantID)
			.find('.js__freegift-add-to-cart')
			.removeClass('clicked');
		var quantity = 1;
		let items = [];
		items.push({
			id: selectedVariantID,
			quantity: quantity,
			'properties[_FreeGift]': giftnumber,
		});
		CartJS.addItems(items, {
			success: function (response, textStatus, jqXHR) {
				console.log('success');
				getCartData();
				$('.js__gift-' + selectedVariantID).addClass('hide');
				$('.js__gift-' + selectedVariantID)
					.find('.js__freegift-add-to-cart')
					.removeClass('clicked');
			},
			// Define an error callback to display an error message.
			error: function (jqXHR, textStatus, errorThrown) {
				console.log('error');
				showCartErrorMessage();
			},
		});
	}
}
$(document).ready(function ($) {
	//Mini Cart  you may also like product slider

	freqProductSlider = new Swiper('.js__freq-product-slider', {
		slidesPerView: 2,
		spaceBetween: 10,
		freeMode: true,
		watchSlidesProgress: true,
		clickable: true,
		resistance: false,
		shortSwipes: false,
		loop: false,
		threshold: 5,
		pagination: {
			el: '.addons-swiper-pagination',
			clickable: true,
		},
	});
	$('.js__addon-add-to-cart').click(function () {
		let quantity = 1;
		let addonSelectedVariantID = $(this).attr('data-attr-variantid');
		let productID = $(this).attr('data-product-id');
		cartAddItemAddon(addonSelectedVariantID, quantity, productID);
	});
	$('.js__addon-add-to-cart').keypress(function () {
		var keycode = event.keyCode || event.which;
		if (keycode == '13') {
			event.preventDefault();
			let quantity = 1;
			let addonSelectedVariantID = $(this).attr('data-attr-variantid');
			// cartAddItemAddon(addonSelectedVariantID, quantity);
		}
	});

	/*
  ADDONS
  NOTE:: CONFUSING CODE FOR THE ADDONS - WILL NEED TO CLEAN IT A BIT
  1. Try to get all the addon handles for the items which are in the cart
  2. Create an array for item>addon
  3. Loop through all the cart items and addon
  4. CHECK - if addon is already there in the list, then the same 2nd addon should not be visible
  */
	function cartAddItemAddon(
		addonSelectedVariantID,
		addonQuantity,
		addonProductID
	) {
		CartJS.addItem(
			addonSelectedVariantID,
			addonQuantity,
			{},
			{
				success: function (data, textStatus, jqXHR) {
					$('.modal-quick-view-mini-cart').hide();
					/* $(".addons-slide-" + addonProductID).addClass("remove-slide");
         const targetClass = 'remove-slide';
         // Select the <ul> and check if all <li> elements within it have the target class
         const allHaveClass = $('.addons-slide').length === $('.addons-slide.' + targetClass).length;
         // Safely destroy existing slider if it exists
         if (freqProductSlider && typeof freqProductSlider.destroy === 'function') {
             freqProductSlider.destroy();
         }
         if (allHaveClass) {
             $(".js__freq-bought-products").addClass("hide");
             console.log('All <li> elements have the class:', targetClass);
         } else {
               //  freq-product-list-slider
              freqProductSlider = new Swiper('.js__freq-product-slider', {
                 slidesPerView: 'auto',
                 spaceBetween: 20,
                 freeMode: true,
                 watchSlidesProgress: true,
                 clickable: true,
                 resistance: false,
                 shortSwipes: false,
                 loop: false,
                 threshold: 5,
                 speed: 4000,
                 autoplay: {
                     delay: 1,
                     disableOnInteraction: false,
                 },
                 pagination: {
                     el: ".addons-swiper-pagination",
                     clickable: true, 
                 },
             })
         }*/
					//console.log("success");
					/* Pending - Remove the selected addon when add to cart is clicked */
				},
				error: function (jqXHR, textStatus, errorThrown) {
					//console.log("error");
				},
			}
		);
	}

	//Addons are fetched from the schemas; Varies from theme to theme
	setTimeout(function () {
		// addons();
	}, 1000);
});
function recharge2020(key, value) {
	if (key == 'shipping_interval_frequency') {
		frequency = value;
		recurringchecked = 'true';
	}
	if (key == 'shipping_interval_unit_type') {
		if (frequency == '1') {
			if (value == 'Days') {
				frequency_unit = 'Day';
			} else if (value == 'Months') {
				frequency_unit = 'Month';
			} else if (value == 'Weeks') {
				frequency_unit = 'Week';
			}
		} else {
			frequency_unit = value;
		}
	}
}

/*cart numeric type*/
// $(".js__cart__quantity-selector").keypress(function (event) {
//     var keycode = event.keyCode || event.which;
//     if (keycode == "13") {
//         event.preventDefault();
//         if ($(this).val() == "0") {
//             $(this).val("1");
//         }
//         var lineCount = $(this).attr("data-cart-line-count");
//         updateQuantity(lineCount);
//         return false;
//     }
// });

jQuery(function () {
	$(document).on('click', '.js__freq-bought-accordian', function (e) {
		if ($('.js__freq-bought-accordian-content').css('display') == 'none') {
			$('.js__freq-bought-accordian-content').slideDown();
			$('.js__freq-bought-accordian').addClass('active');
		} else {
			$('.js__freq-bought-accordian-content').slideUp();
			$('.js__freq-bought-accordian').removeClass('active');
		}
	});
	$(document).on('click', '.js__wishlist-add-to-cart', function (e) {
		e.preventDefault();
		var selectedVariantID = $(this).attr('data-variant-id');
		var quantity = 1;
		let items = []; /* For the main item */
		items.push({
			id: selectedVariantID,
			quantity: quantity,
		});
		CartJS.addItems(items, {
			success: function (response, textStatus, jqXHR) {
				if (getglobalLib('Mini_Cart') == 'yes') {
					setTimeout(function () {
						fetch('/cart.js', {
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
							},
						})
							.then((res) => res.json())
							.then((data) => {
								$('.js__tab-mybag').click();
								$('.js__tab-mybag').addClass('active');
							});
					}, 500);
					/* Show message */
				} else {
				}
			},
			// Define an error callback to display an error message.
			error: function (jqXHR, textStatus, errorThrown) {
				showCartErrorMessage();
			},
		});
	});
});
$(document).ready(function ($) {
	var targetNodes = $('.cart-sidebar__footer');
	var MutationObserver =
		window.MutationObserver || window.WebKitMutationObserver;
	var bundleObersrver = new MutationObserver(mutationHandler);
	var obsConfig = {
		childList: true,
		characterData: true,
		attributes: true,
		subtree: true,
	}; //--- Add a target node to the observer. Can only add one node at a time.

	targetNodes.each(function () {
		bundleObersrver.observe(this, obsConfig);
	});
	function mutationHandler(mutationRecords) {
		//loop through all the mutations that just occured
		mutationRecords.forEach(function (mutation) {
			if (mutation.type == 'childList') {
				//loop though the added nodes
				mutation.addedNodes.forEach(function (added_node) {
					if ($('.XLcXEW3RnM9fyU7k7fvC').html() != undefined) {
						setTimeout(function () {
							var paddingBottom =
								$('.cart-sidebar__footer').height() + 10;
							$('.cart-sidebar').css(
								'padding-bottom',
								paddingBottom + 'px'
							);
						}, 500);
						bundleObersrver.disconnect();
					}
				});
			}
		});
	}
});
jQuery(function () {
	/* Product card click - open quick view pop up */
	$(document).on('click', '.js__quick-view-mini-cart-click', function (e) {
		e.preventDefault();
		e.stopImmediatePropagation();
		var productID = $(this).attr('data-attr-productid');
		var variantID = $(this).attr('data-attr-variantid');
		var available = $(this).attr('data-available');
		var image = $(this).attr('data-image');
		var name = $(this)
			.parent('div')
			.parent('div')
			.children('p')
			.children('a')
			.html();
		var price = $(this)
			.parent('div')
			.parent('div')
			.children('.product-card__price')
			.children('span')
			.html();
		var comparePrice = $(this)
			.parent('div')
			.parent('div')
			.children('.product-card__price')
			.children('s')
			.html();
		var benefits = $(this).parent('div').children('.js__benefits').html();
		$('.js__popup-mini-cart-product-benefits').hide();
		if (benefits != '') {
			$('.js__popup-mini-cart-product-benefits').show();
			$('.js__popup-mini-cart-benefits-description').html(benefits);
		}
		$('.js__popup-mini-cart-product-image').attr('src', image);
		$('.js__popup-mini-cart-product-name').html(name);
		$('.js__popup-mini-cart-product-price').html(
			'<span>' + price + '</span><s>' + comparePrice + '</s>'
		);
		$('.js__addon-add-to-cart').attr('data-attr-variantid', variantID);
		$('.js__addon-add-to-cart').attr('data-product-id', productID);
		if (available == 'true') {
			$('.js__addon-add-to-cart').removeAttr('disabled');
			$('.js__addon-add-to-cart').html('Add');
		} else {
			$('.js__addon-add-to-cart').attr('disabled', 'disabled');
			$('.js__addon-add-to-cart').html('Out Of Stock');
		}
		// $(".js__top-cart-addons").append(' <div class="swiper-slide slider addons-slide addons-slide-'+valueRecommedProduct.product_variant+'"  data-attr-variantid="'+valueRecommedProduct.product_variant+'"><div class="image-section"><a href="'+valueRecommedProduct.product_url+'" title="'+valueRecommedProduct.product_name+'"> <img class="lazyload"  src="'+valueRecommedProduct.product_image+'"    >  </a>    </div> <div class="content">   <h5>   <a href="'+valueRecommedProduct.product_url+'" title="'+valueRecommedProduct.product_name+'">'+valueRecommedProduct.product_name+'</a>  </h5>  <p class="product-card__price">    <span>'+valueRecommedProduct.product_price+'</span>  </p>  <div class="add-link"> <button  class="freq-add js__quick-view-mini-cart-click"   title="'+valueRecommedProduct.product_name+'"      href="javascript:;"   title="Shop '+valueRecommedProduct.product_name+'" data-id="mini-cart-'+valueRecommedProduct.product_id+'" data-attr-variantid="'+valueRecommedProduct.product_variant+'" data-attr-productid="'+valueRecommedProduct.product_variant+'" >Quick Add +</button>  </div> </div> </div>');

		$('.modal-quick-view-mini-cart').show();
	});
});
('use strict');

jQuery(function () {
	// Check if the device has touch capability
	if (
		'ontouchstart' in window ||
		navigator.maxTouchPoints > 0 ||
		navigator.msMaxTouchPoints > 0
	) {
		// If it's a touch device, make each button inside product cards visible
		var productCards = document.querySelectorAll('.product-card');
		productCards.forEach(function (card) {
			var quickViewButton = card.querySelector('.js__quick-view-click');
			if (quickViewButton) {
				quickViewButton.style.opacity = '1'; // or any other appropriate opacity value
			}
		});
	}

	// logo Slider
	var logoSlider = new Swiper('.js_logo-slider', {
		slidesPerView: 'auto',
		spaceBetween: 20,
		freeMode: true,
		watchSlidesProgress: true,
		clickable: true,
		resistance: false,
		shortSwipes: false,
		loop: true,
		grabCursor: false,
		// threshold: 1,
		speed: 4000,
		autoplay: {
			delay: 1,
			disableOnInteraction: false,
			// reverseDirection: true,
		},

		/* breakpoints: {
         0: {
             slidesPerView: 2,
             spaceBetween: 20,
         },
         350: {
             slidesPerView: 2,
             spaceBetween: 20,
         },
         480: {
             slidesPerView: 4,
             spaceBetween: 20,
         },
         600: {
             slidesPerView: 4,
             spaceBetween: 20,
         },
         980: {
             slidesPerView: 5,
             spaceBetween: 20,
         },
         1024: {
             slidesPerView: 6,
             spaceBetween: 20,
         },
         1200: {
             slidesPerView: 7,
             spaceBetween: 20,
         },
         1280: {
             slidesPerView: 8,
             spaceBetween: 20,
         },
     },*/
	});

	//    embed slider
	var embedtSlider = new Swiper('.js_four-column-embed-slider', {
		slidesPerView: 'auto',
		spaceBetween: 10,
		grabCursor: true,
		updateOnWindowResize: true,
		// centeredSlides: true,
		loop: true,
		threshold: 1,
		navigation: {
			nextEl: '.swiper-button-next-embed-slider',
			prevEl: '.swiper-button-prev-embed-slider ',
		},
	});
	var halfcontentSlider = new Swiper('.js_half-content-half-image-slider', {
		slidesPerView: 1,
		resistance: false,
		loop: true,
		spaceBetween: 30,
		// autoplay: {
		//     delay: 10000,
		// },
		// Navigation arrows
		navigation: {
			nextEl: '.swiper-button-next-content-slider',
			prevEl: '.swiper-button-prev-content-slider',
		},
	});
	var customProductSlider = new Swiper('.js__product-slider', {
		slidesPerView: 'auto',
		spaceBetween: 20,
		grabCursor: false,
		loop: true,
		// loopedSlides: 100,
		updateOnWindowResize: true,
		direction: 'horizontal',
		// effect: 'coverflow',
		// freeModeSticky: true,
		freeMode: true,
		freeModeMomentumBounce: false,
		// freeModeMomentumRatio: .1,
		// freeModeMomentumVelocityRatio: .8,
		// freeMode: true,

		// centeredSlides: true,
		threshold: 1,
		breakpoints: {
			0: {
				slidesPerView: 1,
				spaceBetween: 10,
			},
			481: {
				slidesPerView: 2,
				spaceBetween: 10,
			},
			601: {
				slidesPerView: 3,
				spaceBetween: 10,
			},
			769: {
				slidesPerView: 4,
				spaceBetween: 20,
			},
			981: {
				slidesPerView: 5,
				spaceBetween: 20,
			},
			1024: {
				slidesPerView: 6,
				spaceBetween: 20,
			},
			1440: {
				slidesPerView: 'auto',
				spaceBetween: 20,
			},
		},
		navigation: {
			nextEl: '.swiper-button-next-product-slider',
			prevEl: '.swiper-button-prev-product-slider ',
		},
	});
	var blogSlider = new Swiper('.js__blog-slider', {
		slidesPerView: 'auto',
		spaceBetween: 20,
		threshold: 1,
		loop: true,
		breakpoints: {
			0: {
				slidesPerView: 1,
				autoHeight: true,
			},
			601: {
				slidesPerView: 'auto',
			},
			1920: {
				slidesPerView: 'auto',
			},
		},
		navigation: {
			nextEl: '.swiper-button-next-blog-slider',
			prevEl: '.swiper-button-prev-blog-slider ',
		},
	});
	var productSlider = new Swiper('.js__small-product-slider', {
		slidesPerView: 3,
		spaceBetween: 25,
		loop: true,
		threshold: 1,
		breakpoints: {
			1025: {
				slidesPerView: 3,
				spaceBetween: 25,
			},
			981: {
				slidesPerView: 2,
				spaceBetween: 25,
			},
			480: {
				slidesPerView: 3,
				spaceBetween: 25,
			},
			0: {
				slidesPerView: 2,
				spaceBetween: 25,
			},
		},
		navigation: {
			nextEl: '.swiper-button-next-small-product-slider',
			prevEl: '.swiper-button-prev-small-product-slider ',
		},
	});

	
	//---------------------------------

	/* ===========================
   Very simple hero video setup
   =========================== */

// 1) Make hero videos iOS-autoplay safe
function ensureInlineVideoAttrs(scope) {
  (scope || document).querySelectorAll('.hero-banner-slider video, .home-hero-mobile video').forEach(v => {
    v.muted = true;
    v.setAttribute('muted', 'muted');          // iOS is picky
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.removeAttribute('controls');
    v.preload = 'auto';
  });
}

// 2) Pause every video inside a Swiper instance
function pauseAllSlideVideos(swiper) {
  if (!swiper || !swiper.slides) return;
  swiper.slides.forEach(slide => {
    const v = slide.querySelector && slide.querySelector('video');
    if (v && !v.paused) {
      try { v.pause(); } catch (e) {}
    }
  });
}

// 3) Play the video (if any) in a given slide
//    IMPORTANT: only call load() the FIRST time (readyState === 0).
function playVideoInSlide(slide) {
  if (!slide) return;
  const v = slide.querySelector && slide.querySelector('video');
  if (!v) return;

  // Safety: make sure inline attrs are set on this slide
  ensureInlineVideoAttrs(slide);

  // Only set src/load once. After that, just play() – no flicker.
  if (!v.src) {
    const s = v.querySelector('source');
    if (s && s.src) v.src = s.src;
  }
  if (v.readyState === 0) {
    // Not loaded yet – first time we see this video
    try { v.load(); } catch (e) {}
  }

  try {
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Ignore autoplay policy errors – user interaction will unlock later
      });
    }
  } catch (e) {
    // ignore
  }
}

// Run once on page load
ensureInlineVideoAttrs(document);

/* ===========================
   Desktop hero slider
   =========================== */

const heroSlider = new Swiper('.js__hero-banner-slider', {
  slidesPerView: 1,
  speed: 600,
  effect: 'fade',
  fadeEffect: { crossFade: true },   // smooth fade, no “flash old slide”
  loop: false,
  rewind: true,
  autoplay: {
    // per-slide delays from data-swiper-autoplay on slides
    waitForTransition: true,
    disableOnInteraction: false,
  },
  pagination: {
    el: '.hero-banner-slider .swiper-pagination',
    clickable: true,
    renderBullet: (index, className) =>
      `<span class="${className} ${className}-${index} animation-${index}"><i class="bar-bg"></i><b class="bar-fill"></b></span>`,
  },
  on: {
    init(sw) {
      // original bullet tweak
      const fb = document.querySelector('.hero-banner-slider .swiper-pagination-bullet-0');
      if (fb) fb.classList.remove('swiper-pagination-bullet-0');

      pauseAllSlideVideos(sw);
      const active = sw.slides[sw.activeIndex];
      playVideoInSlide(active);
    },
    slideChangeTransitionStart(sw) {
      // keep bullet tweak
      const fb = document.querySelector('.hero-banner-slider .swiper-pagination-bullet-0');
      if (fb) fb.classList.remove('swiper-pagination-bullet-0');

      // when fade begins: stop old video, start new one
      pauseAllSlideVideos(sw);
      const active = sw.slides[sw.activeIndex];
      playVideoInSlide(active);
    },
    // slideChangeTransitionEnd can be left empty or used as a safety re-play if you want
  },
});

/* ===========================
   Mobile hero slider
   =========================== */

const heroSliderMobile = new Swiper('.js__home-hero-mobile-slider', {
  slidesPerView: 1,
  resistance: false,
  effect: 'fade',
  fadeEffect: { crossFade: true },
  speed: 600,
  loop: false,
  rewind: true,
  autoplay: {
    waitForTransition: true,
    disableOnInteraction: false,
  },
  pagination: {
    el: '.js__home-hero-mobile-slider .swiper-pagination',
    clickable: true,
    renderBullet: (index, className) =>
      `<span class="${className} ${className}-${index} animation-${index}"><i class="bar-bg"></i><b class="bar-fill"></b></span>`,
  },
  on: {
    init(sw) {
      const fbm = document.querySelector('.js__home-hero-mobile-slider .swiper-pagination-bullet-0');
      if (fbm) fbm.classList.remove('swiper-pagination-bullet-0');

      pauseAllSlideVideos(sw);
      const active = sw.slides[sw.activeIndex];
      playVideoInSlide(active);
    },
    slideChangeTransitionStart(sw) {
      const fbm = document.querySelector('.js__home-hero-mobile-slider .swiper-pagination-bullet-0');
      if (fbm) fbm.classList.remove('swiper-pagination-bullet-0');

      pauseAllSlideVideos(sw);
      const active = sw.slides[sw.activeIndex];
      playVideoInSlide(active);
    },
  },
});




	//---------------------------------


	var productSliderMobile = new Swiper('.js__product-slider-mobile', {
		slidesPerView: 3,
		spaceBetween: 7,
		resistance: false,
		loop: false,
		updateOnWindowResize: true,
		breakpoints: {
			0: {
				slidesPerView: 1,
				initialSlide: 1,
				loop: true,
			},
			481: {
				slidesPerView: 3,
			},
		},
		// autoplay: {
		//     delay: 10000,
		// },
		// Navigation arrows
	});

	/* Collection selected*/
	$(document).ready(function ($) {
		$('.js__collections-select').change(function () {
			window.location = $(this).val();
		});

		/*Dropdown selected*/
		$('.js__collection-content li').each(function (index) {
			var value = $(this).attr('data-url').toLowerCase();
			if (window.location.href.toLowerCase().indexOf(value) > -1) {
				$(this).addClass('active');
				$('.js__collections-select').val($(this).attr('data-url'));
			}
		});
		if (!('ontouchstart' in document.documentElement)) {
			document.documentElement.className += ' no-touch';
		}
	});
	try {
		var pageTotal = parseInt($('.js__total-page').val());
		var currentPage = parseInt($('.js__current-page').val());
		var itemTotal = parseInt($('.js__items-count').val());
		var perPageItem = parseInt($('.js__perpage-item').val());
		var itemStart = 1;
		var itemEnd = 0;
		if (currentPage > 1) {
			itemStart = perPageItem * (currentPage - 1) + 1;
		}
		itemEnd = itemStart + perPageItem - 1;
		if (pageTotal == currentPage) {
			itemEnd = itemTotal;
		}
		$('.js__page-range').html(itemStart + ' - ' + itemEnd);
	} catch {}

	/* PDP
  Tab working */
	$('.tab-link').on('click', function () {
		var dataId = $(this).attr('data-attr');
		var i, tabcontent, tablink;
		tabcontent = document.getElementsByClassName('tab-content');
		for (i = 0; i < tabcontent.length; i++) {
			tabcontent[i].style.display = 'none';
		}
		tablink = document.getElementsByClassName('tab-link');
		for (i = 0; i < tablink.length; i++) {
			tablink[i].className = tablink[i].className.replace(' active', '');
		}
		document.getElementById(dataId).style.display = 'block';
		event.currentTarget.className += ' active';

		/*PDP select*/
		$('.js__pdp-tab-select').val(dataId);
		$('.js__faq-search-section').addClass('hide');
		$('.js__faq-tab').removeClass('hide');
		$('.js__no-data-found').addClass('hide');
		$('#txt-faq-search').val('');
	});
	$('.cart-tab-link').on('click', function (e) {
		var dataId = $(this).attr('data-attr');
		var i, tabcontentcart, tablinkcart;
		tabcontentcart = document.getElementsByClassName('cart-tab-content');
		for (i = 0; i < tabcontentcart.length; i++) {
			tabcontentcart[i].style.display = 'none';
		}
		tablinkcart = document.getElementsByClassName('cart-tab-link');
		for (i = 0; i < tablinkcart.length; i++) {
			tablinkcart[i].className = tablinkcart[i].className.replace(
				' active',
				''
			);
		}
		document.getElementById(dataId).style.display = 'block';
		event.currentTarget.className += ' active';
	});
	$(document).on('click', '.pdp-tab-link', function (e) {
		var dataId = $(this).attr('data-attr');
		var i, tabcontent, tablink;
		tabcontent = document.getElementsByClassName('pdp-tab-content');
		$(this)
			.parent('li')
			.parent('ul')
			.parent('.pdp-tab-small__wrapper__head')
			.parent('.pdp-tab-small__wrapper')
			.children('.pdp-tab-small__wrapper__content')
			.children('.pdp-tab-content')
			.hide();
		$(this)
			.parent('li')
			.parent('ul')
			.parent('.pdp-tab-small__wrapper__head')
			.parent('.pdp-tab-small__wrapper__head-outer')
			.parent('.pdp-tab-small__wrapper')
			.children('.pdp-tab-small__wrapper__content')
			.children('.pdp-tab-content')
			.hide();
		$(this)
			.parent('li')
			.parent('ul')
			.children('li')
			.children('.pdp-tab-link')
			.removeClass('active');
		tablink = document.getElementsByClassName('pdp-tab-link');
		document.getElementById(dataId).style.display = 'block';
		event.currentTarget.className += ' active';
		$(this).addClass('active');

		/*PDP select*/
		$('.js__pdp-tab-select').val(dataId);
	});

	$('.pdp-tab-link').first().click();
	/* GLOBAL
  Scroll to particular Div with # value */
	$('a[href^="#"]').on('click', function (event) {
		var target = $(this.getAttribute('href'));
		if (target.length) {
			event.preventDefault();
			$('.tab-head').hide();
			$('html, body')
				.stop()
				.animate(
					{
						scrollTop: target.offset().top - 150,
					},
					1000
				);
		}
	});

	/* accordion working about content in small screen*/
	$('.js__accordian')
		.children('li')
		.children('h2,h5,h6,h3')
		.click(function (e) {
			if (
				$(this).parent('li').children('.content').css('display') ==
				'none'
			) {
				$(this)
					.parent('li')
					.parent('.js__accordian')
					.children('li')
					.children('.content')
					.hide();
				$(this)
					.parent('li')
					.parent('.js__accordian')
					.children('li')
					.removeClass('active');
				$(this).parent('li').children('.content').slideDown();
				$(this).parent('li').addClass('active');
			} else {
				$(this).parent('li').children('.content').slideUp();
				$(this).parent('li').removeClass('active');
			}
		});

	/* Accordion working when we have multiple content*/

	$('.js__accordians').children('li').attr('aria-expanded', false);
	$('.js__accordians')
		.children('li')
		.children('h5,h6,h3,h4')
		.attr('role', 'button');
	$('.js__accordians')
		.children('li')
		.children('h5,h6,h3,h4')
		.attr('tabindex', '0');
	$('.js__accordians')
		.children('li')
		.children('h5,h6,h3,h4')
		.click(function (e) {
			var type = $(this).parent('li').attr('data-attr');
			if ($('.' + type).css('display') == 'none') {
				$(this).attr('aria-expanded', true);
				$(this)
					.parent('li')
					.parent('.js__accordians')
					.children('.content')
					.hide();
				$(this)
					.parent('li')
					.parent('.js__accordians')
					.children('li')
					.removeClass('active');
				$('.' + type).slideDown();
				$(this).parent('li').addClass('active');
				$(this).addClass('active');
			} else {
				$(this).attr('aria-expanded', false);
				$(this).parent('li').removeClass('active');
				$('.' + type).slideUp();
				$(this).removeClass('active');
			}
		});
	$('.js__accordians')
		.children('li')
		.children('h5,h6,h3,h4')
		.keypress(function (e) {
			if (e.which == 13) {
				var type = $(this).parent('li').attr('data-attr');
				if ($('.' + type).css('display') == 'none') {
					$(this).attr('aria-expanded', true);
					$(this)
						.parent('li')
						.parent('.js__accordians')
						.children('.content')
						.hide();
					$(this)
						.parent('li')
						.parent('.js__accordians')
						.children('li')
						.removeClass('active');
					$('.' + type).slideDown();
					$(this).parent('li').addClass('active');
					$(this).addClass('active');
				} else {
					$(this).attr('aria-expanded', false);
					$(this).parent('li').removeClass('active');
					$('.' + type).slideUp();
					$(this).removeClass('active');
				}
			}
		});
});

/** Dropdown **/
jQuery(function ($) {
	$('.js__cate-accordian .togglebtn h3').on('click', function () {
		if (
			$('.js__cate-accordian').children('.rem').css('display') == 'none'
		) {
			$('.rem').slideDown(300);
			$(this).parent('.togglebtn').toggleClass('active');
		} else {
			$('.rem').slideUp(300);
			$('.togglebtn').removeClass('active');
		}
	});
	$('.js__dropdown_result').on('click', function () {
		if ($('.js__dropdown').css('display') == 'none') {
			$('.js__dropdown').slideDown(300);
		} else {
			$('.js__dropdown').slideUp(300);
		}
		$(this).toggleClass('active');
	});
	var path = window.location.href; // because the 'href' property of the DOM element is the absolute path
	$('.js__dropdown li a').each(function () {
		if (this.href === path) {
			$(this).addClass('active');
			if ($(this).html() != 'view all') {
				$('.js__dropdown_result').html($(this).html());
			}
			$('.js__dropdown').slideUp(300);
			$('.js__dropdown_result').removeClass('active');
		}
	});
	$('.js__active-class li a').each(function () {
		if (this.href === path) {
			$('.js__active-class li a').removeClass('active');
			$(this).addClass('active');
		}
	});
});
/* Mini cart - Checkout Button visiblity fix for IOS Mobile */
var lastScroll = 0;
jQuery(document).ready(function ($) {
	$('.cart-sidebar__middle').addClass('safari-mobile');
	$(window).scroll(function () {
		var scroll = $(window).scrollTop();
		if (scroll > lastScroll) {
			$('.cart-sidebar__middle').removeClass('safari-mobile');
		} else if (scroll < lastScroll) {
			$('.cart-sidebar__middle').addClass('safari-mobile');
		}
		lastScroll = scroll;
	});
});

/** Dropdown **/
jQuery(function ($) {
	/*Blog dropdown*/
	$('.js__blog-select').change(function () {
		window.location = $(this).val();
	});
	/*Dropdown selected*/
	$('.js__blog-select option').each(function (index) {
		var value = $(this).val().toLowerCase();
		if (window.location.href.toLowerCase().indexOf(value) > -1) {
			$('.js__blog-select').val($(this).val());
		}
	});
});
jQuery(function ($) {
	$('.js--open-rates-popup').on('click', function () {
		$('.js__rates-popup').show();
	});
	$('.js__modal-close').on('click', function () {
		$('.modal').hide();
	});
});

/*First tab link and first tab content active */
jQuery(document).ready(function ($) {
	$('.tab-link').first().addClass('active');
	$('.cart-tab-link').first().addClass('active');
	$('.pdp-tab-link').first().addClass('active');
	$('.shopify-section .tab-content').first().show();
	$('.pdp-tab-section .tab-content').first().show();
	$('.pdp-tab-small .tab-content').first().show();
	$('.pdp-tab-content').first().show();
	$('.cart-tab-content').first().show();
	$(document).on('click', '.js__tab-small', function (e) {
		e.preventDefault();
		if (
			$(this)
				.parent('.tab-content')
				.children('.accordion-con')
				.css('display') == 'none'
		) {
			// $(".accordion-con").slideUp();
			// $(".accordion-con").removeClass("active");
			// $(".accordion-link").removeClass("active");
			// $(".tab-content").removeClass("active");

			$('.tab-link').removeClass('active');
			$(this)
				.parent('.tab-content')
				.children('.accordion-con')
				.slideDown();
			$(this)
				.parent('.tab-content')
				.children('.accordion-con')
				.addClass('active');
			// $(this).parent(".tab-content").addClass("active");
			$(this)
				.parent('.tab-content')
				.children('.accordion-link')
				.addClass('active');
			var dataId = $(this).parent('.tab-content').attr('data-attr');
			document.getElementById(dataId).className += ' active';
			$('html,body').animate(
				{
					scrollTop: $(this).offset().top - 120,
				},
				500
			);
		} else {
			// $(".accordion-con").slideUp();
			// $(".accordion-con").removeClass("active");
			// $(".tab-content").removeClass("active");
			$(this)
				.parent('.tab-content')
				.children('.accordion-link')
				.removeClass('active');
			// $(this).parent(".tab-content").removeClass("active");
			$(this)
				.parent('.tab-content')
				.children('.accordion-con')
				.removeClass('active');
		}
	});
	$(document).on('click', '.js___accordion', function (e) {
		e.preventDefault();
		if (
			$(this)
				.parent('.tab-content')
				.children('.accordion-con')
				.css('display') == 'none'
		) {
			$('.accordion-con').slideUp();
			$('.accordion-con').removeClass('active');
			$('.accordion-link').removeClass('active');
			// $(".tab-content").removeClass("active");
			$('.tab-link').removeClass('active');
			$(this)
				.parent('.tab-content')
				.children('.accordion-con')
				.slideDown();
			$(this)
				.parent('.tab-content')
				.children('.accordion-con')
				.addClass('active');
			// $(this).parent(".tab-content").addClass("active");
			$(this)
				.parent('.tab-content')
				.children('.accordion-link')
				.addClass('active');
			var dataId = $(this).parent('.tab-content').attr('data-attr');
			document.getElementById(dataId).className += ' active';
			$('html,body').animate(
				{
					scrollTop: $(this).offset().top - 120,
				},
				500
			);
		} else {
			$('.accordion-con').slideUp();
			$('.accordion-con').removeClass('active');
			// $(".tab-content").removeClass("active");
			$(this)
				.parent('.tab-content')
				.children('.accordion-link')
				.removeClass('active');
			// $(this).parent(".tab-content").removeClass("active");
			$(this)
				.parent('.tab-content')
				.children('.accordion-con')
				.removeClass('active');
		}
	});
});

/*Select Dropdown change wit Tab */
jQuery(function () {
	var path = window.location.href; // because the 'href' property of the DOM element is the absolute path
	$('.dropdown-select option').each(function () {
		if (this.value.toLowerCase() == path.toLowerCase()) {
			this.setAttribute('selected', true);
		}
	});
	$('.dropdown-select').change(function () {
		var dropdown = $('.dropdown-select').val();
		$('.js__faq-search-section').addClass('hide');
		$('.js__faq-tab').removeClass('hide');
		$('#txt-faq-search').val('');
		$('.js__no-data-found').addClass('hide');
		//first hide all tabs again when a new option is selected
		$('.tab-content').hide();
		//then show the tab content of whatever option value was selected
		$('#' + 'tab-' + dropdown).show();
		if (dropdown == 'all') {
			$('.js__tab-content').each(function () {
				if (
					$(this).find('.js__accordian').html().trim() ==
					'<li>Sorry Data Is Not Added Yet</li>'
				) {
					$(this).hide();
				} else {
					$(this).show();
				}
			});
		}
	});
	$('.js__tab-content').each(function () {
		if ($(this).find('.js__accordian').html().trim() == '') {
			$(this)
				.find('.js__accordian')
				.html('<li>Sorry Data Is Not Added Yet</li>');
		}
	});
});
/*Blog content checking if p tag has image then adding class*/

jQuery(function () {
	$('.article-content p').each(function (index) {
		if ($(this).html().indexOf('<img') > -1) {
			$(this).addClass('full-width');
		}
		if ($(this).html().indexOf('<iframe') > -1) {
			$(this).addClass('full-width');
		}
	});
});
// jQuery(document).ready(function ($) {
//     // Get the element
//     for (var i = 0; i < 250; i++) {
//       var marqueeFooter = document.querySelector('.js__marquee-right .repeat');
//       // Create a copy of it
//       var cloneFooter = marqueeFooter.cloneNode(true);
//       // Inject it into the DOM
//       marqueeFooter.before(cloneFooter);
//     }
//   });
// Footer dropdown
(function ($) {
	$(function () {
		var navLink = false;
		$('.accordion-toggle-footer-link').on('mousedown', function (e) {
			'use strict';

			e.stopImmediatePropagation();
			if ($(this).hasClass('active')) {
				$(this).removeClass('active');
				$(this).siblings('.accordion-content-footer').slideUp(300);
			} else {
				$('.accordion-toggle-footer-link').removeClass('active');
				$(this).addClass('active');
				$('.accordion-content-footer').slideUp(300);
				$(this).siblings('.accordion-content-footer').slideDown(300);
			}
			navLink = true;
		});
	});
})(jQuery);
/* quick view modal pop up */

var popupCollectionSlider;
var popupCollectionSliderThumbnail;
jQuery(function () {
	/* Product card click - open quick view pop up */
	$(document).on('click', '.js__quick-view-click', function (e) {
		console.log('clicked quick view');

  		e.preventDefault();
  		e.stopImmediatePropagation();

		var id = $(this).attr('data-id');
		var $modal = $('#modal-' + id);

		console.log('Quick view id:', id, 'modal found:', $modal.length);

		if (!$modal.length) {
			console.warn('No quick view modal found for product id', id);
			return;
		}


			//Executed after SWYM has loaded all necessary resources.
			function onSwymLoadCallback(swat) {
				// Please make all SWYM-related API calls inside this function.
				// You can use the swat argument within this scope.
				if (swat) {
					swat.initializeActionButtons(
						'#shopify-section-collection-modals'
					);
				}
			}
			if (!window.SwymCallbacks) {
				window.SwymCallbacks = [];
			}
			window.SwymCallbacks.push(onSwymLoadCallback);
			$('.popup-subscribe-option-' + id)
				.find('input')
				.click();
			$('.pdp-tab-link-' + id + ' li:first-child')
				.children('a')
				.click();
			$('.js__popup-variant-select-' + id + ' li:first-child').click();
			// show modal pop up
			$('#modal-' + id).show();
		/* Swiper/Slider */
		try {
			var sliderIMages = $(this).attr('data-slider_main').split('|');
			$(this).parent('div');
			$('#modal-' + id)
				.find('.js__popup-collection-slider')
				.children('.swiper-wrapper')
				.empty();
			$('#modal-' + id)
				.find('.js__popup-collection-slider-thumbnail')
				.children('.swiper-wrapper')
				.empty();
			for (var k = 0; k < sliderIMages.length - 1; k++) {
				$('#modal-' + id)
					.find('.js__popup-collection-slider')
					.children('.swiper-wrapper')
					.append(
						' <div class="swiper-slide slide">  <a class="image-section" ><img src="' +
							sliderIMages[k] +
							'"> </a> </div>  '
					);
				$('#modal-' + id)
					.find('.js__popup-collection-slider-thumbnail')
					.children('.swiper-wrapper')
					.append(
						' <div class="swiper-slide slide">  <a class="image-section" ><img src="' +
							sliderIMages[k] +
							'"> </a> </div>  '
					);
			}
			/* Swiper Video working */
			$(this)
				.children('.data-var_videos')
				.children('li')
				.each(function (index) {
					$('#modal-' + id)
						.find('.js__popup-collection-slider')
						.children('.swiper-wrapper')
						.append(
							'<div class="swiper-slide slide">  <div class="image-section video-section" >' +
								$(this).html() +
								' </div> </div>'
						);
					$('#modal-' + id)
						.find('.js__popup-collection-slider-thumbnail')
						.children('.swiper-wrapper')
						.append(
							' <div class="swiper-slide slide">  <div class="image-section video-section" > </div> </div>  '
						);
				});
		} catch {}
		try {
			if (typeof popupCollectionSliderThumbnail !== 'undefined') {
				popupCollectionSliderThumbnail.destroy();
			}
			if (typeof popupCollectionSlider !== 'undefined') {
				popupCollectionSlider.destroy();
			}
			popupCollectionSliderThumbnail = new Swiper(
				'.js__popup-collection-slider-thumbnail-' + id,
				{
					slidesPerView: 'auto',
					spaceBetween: 10,
					resistance: false,
					shortSwipes: true,
					navigation: {
						nextEl: '.swiper-button-next-popup-thumbnail',
						prevEl: '.swiper-button-prev-popup-thumbnail',
					},
				}
			);
			popupCollectionSlider = new Swiper(
				'.js__popup-collection-slider-' + id,
				{
					slidesPerView: 1,
					spaceBetween: 20,
				}
			);
		} catch {}
		$('.js_pdp-variant-options-' + id)
			.find('.js__popup-variant-select')
			.children('li:first-child')
			.click();
	});
	$(document).on('click', '.modal', function (e) {
		if (
			!(
				$(e.target).closest('.modal-content').length > 0 ||
				$(e.target).closest('.close').length > 0
			)
		) {
			$(this).hide();
		}
	});

	/*Quantity Plus Minus*/
	$(document).on(
		'click',
		'.js__popup-quantity .js-plus-minus-qty',
		function (e) {
			var type = $(this).attr('data-type');
			var productQuantity = $(this)
				.parent('.js__popup-quantity')
				.find('.qty-val')
				.val();
			if (type == 'minus') {
				if (productQuantity > 1) {
					productQuantity--;
				}
			} else {
				productQuantity++;
			}
			$(this)
				.parent('.js__popup-quantity')
				.find('.qty-val')
				.val(productQuantity);
		}
	);

	/* Quick View - Variant Radio Button Clicks */
	$(document).on('click', '.js__popup-variant-select li', function (e) {
		$(this).parent('ul').children('li').removeClass('active');
		var index = $(this).parent('ul').attr('data-index');
		var option = $(this).attr('data-value');
		var variantOuter = $(this)
			.parent('ul')
			.parent('div')
			.parent('div')
			.parent('.product__information')
			.siblings('.popup-footer')
			.find('.sm-rc-widget');
		variantOuter.children('.sm-rc-option-' + index).val(option);
		variantOuter.children('.sm-rc-option-' + index).change();
		$(this).addClass('active');
		var pID = $(this).attr('data-id');
		$('#product-select-' + pID + ' option').each(function (index) {
			var optionName = $(this).html();
			var vID = $(this).attr('value');
			var variantSoldout = $(this).attr('data-soldout');
			var price = $(this).attr('data-price');
			if (optionName.trim() == option.trim()) {
				if (variantSoldout == 'true') {
					$('.js__modal-popup-addtocart-' + pID).attr(
						'disabled',
						'disabled'
					);
					//update the text for the add to cart button to sold out
					$('.js__modal-popup-addtocart-text-' + pID).html('Soldout');
					//hide the price if it's sold out
					$('.modal-popup-price-' + pID).hide();
				} else {
					//update the text for the button to add to cart, if not sold out
					$('.js__modal-popup-addtocart-text-' + pID).html(
						'Add to Cart'
					);
					// update the price in the button - add to cart
					$('.modal-popup-price-' + pID).show();
					// if not sold out, then remove the attr disabled
					$('.js__modal-popup-addtocart-' + pID).removeAttr(
						'disabled'
					);
				}
				// update the variant ID for the data-variant-id
				$('.js__modal-popup-addtocart-' + pID).attr(
					'data-variant-id',
					vID
				);
				/* Not sure what are they being used for */
				// $(".discount_variant-" + pID + " span").hide();
				//$(".js__popup-variant-price-" + vID).show();
				//$(".js__rc_block__type__onetime-" + pID).find(".rc_price__onetime").html(price);
				//$(".modal-popup-price-subcription-" + pID).html($(".js__popup-variant-price-" + vID).html());
			}
		});

		/* Not being used any more */
		//$(".js__rc_radio_options-" + pID + " .rc_block__type-modal-popup.rc_block__type--active").click();
	});

	// $(document).on("change", ".js__shipping_interval_frequency", function (e) {
	//     var id = $(this).attr("data-id");

	//     if ($(this).val() != "") {

	//         $(".js__modal-popup-addtocart-" + id).addClass("hide");
	//         $(".js__modal-popup-addtocart-subcription-" + id).removeClass("hide");
	//         $(".js__modal-popup-addtocart-" + id).removeAttr("disabled");
	//         $(".js__modal-popup-addtocart-text-" + id).html("Add to Cart - ");
	//         $(".modal-popup-price-" + id).css("display", "inline-block")
	//     } else {

	//         $(".js__modal-popup-addtocart-" + id).removeClass("hide");
	//         $(".js__modal-popup-addtocart-subcription-" + id).addClass("hide");
	//         $(".js__modal-popup-addtocart-" + id).attr("disabled", "disabled");
	//         $(".js__modal-popup-addtocart-text-" + id).html("Select Frequency");
	//         $(".modal-popup-price-" + id).css("display", "none")

	//     }

	// })

	// $(document).on("click", ".js__rc_block__type__onetime-modal-popup", function (e) {
	//     var id = $(this).attr("data-id");
	//     $(".js__modal-popup-addtocart-" + id).removeClass("hide");
	//     $(".js__modal-popup-addtocart-subcription-" + id).addClass("hide");
	//     $(".js__modal-popup-addtocart-" + id).removeAttr("disabled");
	//     $(".js__modal-popup-addtocart-text-" + id).html("Add to Cart - ");
	//     $(".modal-popup-price-" + id).css("display", "inline-block")
	// })

	// $(document).on("click", ".js__rc_block__type__autodeliver-modal-popup", function (e) {
	//     var id = $(this).attr("data-id");

	//     $(".js__modal-popup-addtocart-" + id).attr("disabled", "disabled");
	//     $(".js__shipping_interval_frequency-" + id).change();
	// })

	$(document).on('click', '.js__modal-popup-addtocart', function (e) {
		var pID = $(this).attr('data-id');
		var selectedVariantID = $(this).attr('data-variant-id');
		var quantity = parseInt($('.js-quantity-selector-' + pID).val());
		var recharge = $('.js__rc_radio_options-' + pID).html();
		var productUrl = $('.js__product-url-' + pID).val();
		let items = [];
		if (recharge == undefined) {
			/* For the main item */
			items.push({
				id: selectedVariantID,
				quantity: quantity,
				'properties[_ProductUrl]': productUrl,
			});
		} else {
			if (
				$(
					'.js__rc_radio_options-' +
						pID +
						' .rc_block__type-modal-popup.rc_block__type--active'
				).hasClass('rc_block__type__onetime')
			) {
				items.push({
					id: selectedVariantID,
					quantity: quantity,
					'properties[_ProductUrl]': productUrl,
				});
			} else {
				var shippingIntervalFrequency = $(
					'.js__shipping_interval_frequency-' + pID
				).val();
				var shippingIntervalUnitType = $(
					'.js__shipping_interval_unit_type-' + pID
				).html();
				items.push({
					id: selectedVariantID,
					quantity: quantity,
					'properties[shipping_interval_frequency]':
						shippingIntervalFrequency,
					'properties[shipping_interval_unit_type]':
						shippingIntervalUnitType,
					'properties[_ProductUrl]': productUrl,
				});
			}
		}
		CartJS.addItems(items, {
			success: function (response, textStatus, jqXHR) {
				CartJS.getNote();
				$('.modal-quick-view').hide();
				if (getglobalLib('Mini_Cart') == 'yes') {
					/* Show message */
					setTimeout(openMiniCart, 500);
				} else {
					window.location = '/cart';
				}
			},
			// Define an error callback to display an error message.
			error: function (jqXHR, textStatus, errorThrown) {
				showCartErrorMessage();
			},
		});
	});
	$(document).on(
		'click',
		'.js__popup-collection-slider-thumbnail .slide',
		function (e) {
			var slideno = parseInt($(this).index());
			e.preventDefault();
			e.stopPropagation();
			popupCollectionSlider.slideTo(slideno, 1000, false);
		}
	);
	$(document).on('click', '.js__quick-view-popup-close', function (e) {
		e.preventDefault();
		e.stopPropagation();
		$('.modal-quick-view').hide();
		$('.modal-quick-view-mini-cart').hide();
	});
	var modal = document.getElementById('js__ingredients-popup');

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function (event) {
		if (event.target == modal) {
			modal.style.display = 'none';
		}
	};
});
jQuery(document).ready(function ($) {
	// MODAL TEMPLATE
	$('.modal-quick-view .pdp__variants input').on('click', function () {
		var varId = $(this).closest('label').attr('data-variant_id');
		//fire the closest variant selector
		$(this)
			.closest('.modal')
			.find('[sm-rc-variant-selector]')
			.val(varId)
			.change();
	});
	$('.modal-quick-view .pdp__recharge input').on('click', function () {
		var planId = $(this).closest('label').attr('data-plan_id');
		$(this)
			.closest('.modal')
			.find('[sm-rc-plan-selector]')
			.val(planId)
			.change();
	});
	$(document).on(
		'click',
		'.modal-quick-view .pdp__recharge input',
		function () {
			$(this)
				.parent('label')
				.parent('div')
				.parent('.pdp__recharge')
				.children('.variant')
				.removeClass('active');
			$(this).parent('label').parent('div').addClass('active');
			if ($(this).val() == 'rc-yes') {
				$(this).closest('.modal').find('.form__group--rc').show();
				var planId = $(this)
					.closest('.pdp__recharge')
					.find('.frequency-select')
					.val();
				$(this)
					.closest('.modal')
					.find('[sm-rc-plan-selector]')
					.val(planId)
					.change();
			} else {
				$(this).closest('.modal').find('.form__group--rc').hide();
				$(this)
					.closest('.modal')
					.find('[sm-rc-plan-selector]')
					.val('false')
					.change();
			}
		}
	);
	// RECHARE WIDGET SUBSCRIPTION PLAN
	$('.modal-quick-view .frequency-select').on('change', function () {
		var planId = $(this).val();
		$(this)
			.closest('.modal')
			.find('[sm-rc-plan-selector]')
			.val(planId)
			.change();
	});
});
jQuery(document).ready(function ($) {
	$('.hero-banner-slider .content').addClass('animate');
});
$(document).ready(function ($) {
	$('.js__btn-faq-search').on('click', function () {
		var search = $('#txt-faq-search').val().toLowerCase();
		if (search != '') {
			$('.js__no-data-found').removeClass('hide');
			$('.tab-link').removeClass('active');
			$('.dropdown-select').val('all');
			//Go through each list item and hide if not match search
			$('.js__faq-search-section').removeClass('hide');
			$('.js__faq-search-section').find('.tab-content').show();
			$('.js__faq-tab').addClass('hide');
			$('.js__faq-search li').each(function () {
				if (
					$(this)
						.children('h3')
						.html()
						.toLowerCase()
						.indexOf(search) != -1
				) {
					$(this).show();
					$('.js__no-data-found').addClass('hide');
				} else {
					$(this).hide();
				}
			});
		}
	});
});
jQuery(document).ready(function ($) {
	var cardSliders = new Swiper('.js_three-column-card-slider1', {
		slidesPerView: 'auto',
		spaceBetween: 20,
		freeMode: true,
		watchSlidesProgress: true,
		// clickable: true,
		resistance: false,
		shortSwipes: false,
		loop: true,
		// grabCursor: false,
		// threshold: 1,
		speed: 4000,
		autoplay: {
			delay: 1,
			disableOnInteraction: false,
			pauseOnMouseEnter: true,
		},
		breakpoints: {
			0: {
				slidesPerView: 1,
				spaceBetween: 10,
			},
			376: {
				slidesPerView: 2,
				spaceBetween: 10,
			},
			377: {
				slidesPerView: 'auto',
			},
		},
	});
	$(document).on('change', '.js__custom-dropdown-select', function () {
		var id = $(this).attr('data-id');
		var value = $(this).val();
		console.log('Selected ID:', id);
		console.log('Dropdown Value:', value);
		$('#recharge-quick-popup-' + id).val(value);
		$('#recharge-quick-popup-' + id).change();
	});
});
('use strict');

var showCartMessage = true;
jQuery(function () {
	//Nav - Open and Close Mini cart

	if (getglobalLib('Mini_Cart') == 'yes') {
		$('.js__cart-expand').on('click', function () {
			$('#CartSidebar').toggleClass('active');
			$('#cart_overlay').toggleClass('active');
			$('html').toggleClass('mini-cart-open');
			$(this).addClass('active');
		});
		$('.js__cart-close').on('click', function () {
			$('#CartSidebar').removeClass('active');
			$('#cart_overlay').removeClass('active');
			$('.js__cart-expand').removeClass('active');
			$('html').removeClass('mini-cart-open');
		});
		$('.js__cart-expand').attr('href', 'javascript:void(0)');
	}
	/* Cart - Free Shipping Progress bar Visiblity */
	try {
		if (
			getglobalLib('Free_Shipping_progressbar') == 'yes' &&
			$('.js__free-shipping-limit').html().trim() != '' &&
			showProgressBar == true
		) {
			$('.js__progressbar_visiblity').removeClass('hide');
		}
	} catch {}

	/* Remove mini cart from the cart page */
	if ($('.cart-table-body')[0]) {
		$('#CartSidebar').remove();
		$('#cart_overlay').remove();
		$('.js__top-cart-form-actions').remove();
		$('.js__ajax-products-bind').remove();
		$('.mini-cart').removeClass('js__cart-expand');
		$('.mini-cart').attr('href', '/cart');
	}
	/* show no items in cart */
	if (CartJS.cart.item_count == 0) {
		$('.empty-cart-section').show();
		$('.js__show-cart-items-section').hide();
		$('#shopify-section-cart-recommendations').hide();
	} else {
		$('.empty-cart-section').hide();
	}
	/*Quantity Plus Minus for the textbox */
	$('.js__product-single__quantity .js__minus-qty').click(function () {
		decreaseQuantity();
	});
	$('.js__product-single__quantity .js__plus-qty').click(function () {
		increaseQuantity();
	});
	function increaseQuantity() {
		var productQuantity = $('.js__quantity-selector').val();
		productQuantity++;
		$('.js__quantity-selector').val(productQuantity);
	}
	function decreaseQuantity() {
		var productQuantity = $('.js__quantity-selector').val();
		if (productQuantity > 1) {
			productQuantity--;
		}
		$('.js__quantity-selector').val(productQuantity);
	}
});

/* 
NOTIFICATIONS SECTION
Show Noticiations On Success and Error
Note: This function isn't being used in every theme
Feel free to comment/uncomment as per the functionality
*/
function showCartSuccessMessage() {
	setTimeout(openMiniCart, 500);
	if (showCartMessage == true) {
		$('#cart-message').addClass('message-success');
		$('#cart-message').removeClass('message-error');
		$('#cart-message').html('Successfully added to cart!');
		$('#cart-message').show();
		setTimeout(function () {
			$('#cart-message').hide();
		}, 5000);
	}
}
function showCartErrorMessage() {
	if (showCartMessage == true) {
		$('#cart-message').removeClass('message-success');
		$('#cart-message').addClass('message-error');
		$('#cart-message').html(
			'Sorry! Seems like the product is out of stock'
		);
		$('#cart-message').show();
		setTimeout(function () {
			$('#cart-message').hide();
		}, 5000);
	}
}
function openMiniCart() {
	fetch('/cart.js', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})
		.then((res) => res.json())
		.then((data) => {
			$('#CartSidebar').toggleClass('active');
			$('#cart_overlay').toggleClass('active');
		});
}

/* EVENT: When the cart request is completed everytime the below function is run */
$(document).on('cart.requestComplete', function (event, cart) {
	reloadAjaxCartItemUsingCartAjaxObject(cart);
	//Progress Bar of shipping in cart and mini cart; Varies from theme to theme
	progressBar();
	//Show and hide empty cart depending upon the cart items
	setTimeout(function () {
		// calculateSubTotalWithDiscount();
		// addons();
	}, 1000);
});

// $(document).on("cart.requestStarted", function (event, cart) {console.log("Request started"); });
//$(document).on("cart.ready", function (event, cart) {});

/* currency formatter 
const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
});*/
('use strict');

jQuery(function () {
	/* Footer - Accordion Visiblity */
	if (getglobalLib('Footer_Accordion') == 'yes') {
		$('.js__accordion-toggle-visiblity').addClass(
			'accordion-toggle-footer'
		);
		$('.js__accordion-content-visiblity').addClass(
			'accordion-content-footer'
		);
	}
	/* FAQ - Category Sidebar Visiblity */
	if (getglobalLib('FAQ_Side_Panel') == 'yes') {
		$('.js__faq-category-side-panel').removeClass('hide');
	}
	if (getglobalLib('Product_Recommendation_Slider') == 'on') {
		$('#js__pdp-recommendation-slider').not('.slick-initialized').slick({
			slidesToShow: 4,
			slidesToScroll: 4,
			dots: false,
			centerMode: false,
			infinite: false,
			focusOnSelect: true,
			variableWidth: true,
			draggable: true,
		});
	}
});
('use strict');

jQuery(function () {
	/* Global
  Announcement Slider */
	var announcementSlider = new Swiper('.js__announcement-slider', {
		slidesPerView: 1,
		resistance: false,
		shortSwipes: true,
		loop: false,
		autoHeight: true,
	});

	/* Announcement 
  Close on Click  */
	$('#announcement-close').on('click', function () {
		$('.announcement-bar').hide();
		$('body').removeClass('announcement-visible');
	});
	if (
		$('div').hasClass('hero-banner') ||
		$('div').hasClass('error-page') ||
		$('div').hasClass('inner-hero-section')
	) {
		$('body').addClass('transparent-header');
		$('.js__main-content').addClass('active');
	} else {
		$('body').removeClass('transparent-header');
		$('.js__main-content').removeClass('active');
	}

	/* MEGAMENU
    active link while submenu open */
	if ($(window).width() > 980) {
		$('.has-sub-nav').hover(
			function (event) {
				event.stopPropagation(); // Stop event propagation
				// Adding a extra link to give anchor hover effect
				$(this).children('.site-nav__link').addClass('hover-submenu');

				// Give Visibility and opacity to the Sub nav menu
				$(this).children('.sub-nav').css('visibility', 'visible');
				$(this).children('.sub-nav').css('opacity', '1');
				$(this).children('.sub-nav').css('z-index', '1');
				$(this).children('.sub-nav').addClass('active');
				$('body').removeClass('transparent-header');
				$('.main-header').addClass('active');
				// Remove transparent header from index page when sub menu open
				$('.template-index').addClass('remove-transparent-header');
				if ($('.js__search ').hasClass('active') == true) {
					$('.js__header-search-section').removeClass('active');
					$('.js__search ').removeClass('active');
					$('body .boost-pfs-search-suggestion').css(
						'display',
						'none'
					);
					$('body #boost-sd__search-widget-init-wrapper-1').css(
						'display',
						'none'
					);
				}
			},
			function (event) {
				event.stopPropagation(); // Stop event propagation
				// Remove  extra link to remove anchor hover effect
				$(this)
					.children('.site-nav__link')
					.removeClass('hover-submenu');
				$('.has-sub-nav')
					.children('.site-nav__link')
					.removeClass('hover-submenu');
				// Remove Visibility and opacity from the Sub nav menu
				$('.has-sub-nav')
					.children('.sub-nav')
					.css('visibility', 'hidden');
				$('.has-sub-nav').children('.sub-nav').css('opacity', '0');
				$('.has-sub-nav').children('.sub-nav').removeClass('active');
				// $(this).children(".sub-nav").css("z-index", "-10");
				if (
					$('.js__header-search-section').hasClass('active') === true
				) {
					$('.main-header').addClass('active');
				} else {
					$('.main-header').removeClass('active');
				}
				// $(".main-header").removeClass("active");
				if ($('body').hasClass('fixed-header')) {
					$('body').removeClass('transparent-header');
				} else {
					// $("body").addClass("transparent-header");
					if ($('.main-header').hasClass('active')) {
						$('body').removeClass('transparent-header');
					} else {
						if (
							$('div').hasClass('hero-banner') ||
							$('div').hasClass('error-page') ||
							$('div').hasClass('inner-hero-section')
						) {
							$('body').addClass('transparent-header');
						} else {
							if ($('div').hasClass('white-bg') === true) {
								$('body').removeClass('transparent-header');
								$('body').removeClass('template-index');
							}
							$('body').removeClass('transparent-header');
						}
					}
				}
				$('body').removeClass('remove-transparent-header');
				// Add transparent header from index page when sub menu open
				// $(".template-index").addClass("transparent-header");
			}
		);
		$('.has-big-nav').hover(
			function (event) {
				event.stopPropagation(); // Stop event propagation
				// Adding a extra link to give anchor hover effect
				$(this).children('.site-nav__link').addClass('hover-submenu');
				// Give Visibility and opacity to the Big nav menu
				$(this).children('.big-nav').css('visibility', 'visible');
				$(this).children('.big-nav').css('opacity', '1');
				$(this).children('.big-nav').addClass('active');
				// Remove transparent header from index page when big nav menu open
				$('body').removeClass('transparent-header');
				$('.main-header').addClass('active');
				if ($('.js__search').hasClass('active') == true) {
					$('.js__header-search-section').removeClass('active');
					$('.js__search').removeClass('active');
					$('body .boost-pfs-search-suggestion').css(
						'display',
						'none'
					);
					$('body #boost-sd__search-widget-init-wrapper-1').css(
						'display',
						'none'
					);
				}
			},
			function (event) {
				event.stopPropagation(); // Stop event propagation
				// Remove  extra link to remove anchor hover effect
				$(this)
					.children('.site-nav__link')
					.removeClass('hover-submenu');
				// Remove Visibility and opacity from the Big nav menu
				$('.has-big-nav .big-nav').css('visibility', 'hidden');
				$('.has-big-nav .big-nav').css('opacity', '0');
				$('.has-big-nav').children('.big-nav').removeClass('active');
				if (
					$('.js__header-search-section').hasClass('active') === true
				) {
					$('.main-header').addClass('active');
				} else {
					$('.main-header').removeClass('active');
				}

				// Add transparent header from index page when sub menu open
				if ($('body').hasClass('fixed-header')) {
					$('body').removeClass('transparent-header');
				} else {
					// $("body").addClass("transparent-header");
					if ($('.main-header').hasClass('active')) {
						$('body').removeClass('transparent-header');
					} else {
						if (
							$('div').hasClass('hero-banner') ||
							$('div').hasClass('error-page') ||
							$('div').hasClass('inner-hero-section')
						) {
							$('body').addClass('transparent-header');
						} else {
							if ($('div').hasClass('white-bg') === true) {
								$('body').removeClass('transparent-header');
								$('body').removeClass('template-index');
							}
							$('body').removeClass('transparent-header');
						}
					}
				}
				// $(".template-index").addClass("transparent-header");
			}
		);
	}

	//  Sub Menu in MObile
	/* SubMenu
     Accordion JS */
	// (function($) {
	//     $(function() {
	//         var navLink = false;
	//         $(".accordion-toggle")
	//             .on("mousedown", function(e) {
	//                 "use strict";
	//                 e.stopImmediatePropagation();
	//                 if ($(this).parent("div").hasClass("footer-links")) {
	//                     if ($(window).width() < 981) {
	//                         if ($(this).hasClass("active")) {
	//                             $(this).removeClass("active");

	//                             $(this).siblings(".accordion-content").slideUp(300);
	//                         } else {
	//                             $(".accordion-toggle").removeClass("active");
	//                             $(this).addClass("active");

	//                             $(".accordion-content").slideUp(300);
	//                             $(this).siblings(".accordion-content").slideDown(300);
	//                         }
	//                     }
	//                 } else {
	//                     if ($(this).hasClass("active")) {
	//                         $(this).removeClass("active");
	//                         $(this).parent("li.has-sub-nav").removeClass("active");
	//                         $(this).siblings(".accordion-content").slideUp(500);
	//                     } else {
	//                         $(".accordion-toggle").removeClass("active");
	//                         $(".accordion-toggle").parent("li.has-sub-nav").removeClass("active");
	//                         $(this).addClass("active");
	//                         $(this).parent("li.has-sub-nav").addClass("active");
	//                         $(".accordion-content").slideUp(500);
	//                         $(this).siblings(".accordion-content").slideDown(500);
	//                     }
	//                 }
	//                 navLink = true;
	//             })
	//             .focus(function(e) {
	//                 "use strict";
	//                 if (navLink) {
	//                     navLink = false;
	//                 } else {
	//                     if ($(this).parent("div").hasClass("footer-links")) {
	//                         if ($(window).width() < 980) {
	//                             if ($(this).hasClass("active")) {
	//                                 $(this).removeClass("active");
	//                                 $(this).siblings(".accordion-content").slideUp(300);
	//                             } else {
	//                                 $(".accordion-toggle").removeClass("active");
	//                                 $(this).addClass("active");
	//                                 $(".accordion-content").slideUp(300);
	//                                 $(this).siblings(".accordion-content").slideDown(300);
	//                             }
	//                         }
	//                     } else {
	//                         if ($(this).hasClass("active")) {
	//                             $(this).removeClass("active");
	//                             $(this).siblings(".accordion-content").slideUp(600);
	//                             $(this).parent("li.has-sub-nav").removeClass("active");
	//                         } else {
	//                             $(".accordion-toggle").removeClass("active");
	//                             $(".accordion-toggle").parent("li.has-sub-nav").removeClass("active");
	//                             $(this).parent("li.has-sub-nav").addClass("active");
	//                             $(this).addClass("active");
	//                             $(".accordion-content").slideUp(600);
	//                             $(this).siblings(".accordion-content").slideDown(600);
	//                         }
	//                     }
	//                 }
	//             });
	//     });

	// })(jQuery);

	(function ($) {
		$(function () {
			var navLink = false;
			$('.accordion-toggle')
				.on('mousedown', function (e) {
					'use strict';

					e.stopImmediatePropagation();
					if ($(this).parent('div').hasClass('footer-links')) {
						if ($(window).width() < 981) {
							if ($(this).hasClass('active')) {
								$(this).removeClass('active');
								$(this)
									.siblings('.accordion-content')
									.slideUp(300);
							} else {
								$('.accordion-toggle').removeClass('active');
								$(this).addClass('active');
								$('.accordion-content').slideUp(300);
								$(this)
									.siblings('.accordion-content')
									.slideDown(300);
							}
						}
					} else {
						if ($(this).hasClass('active')) {
							let $this = $(this);
							let $accordionContent =
								$this.siblings('.accordion-content');
							let $subNavLinks =
								$accordionContent.find('.sub-nav-links li');

							// Staggered exit animation, slightly slower
							$subNavLinks.each(function (index) {
								let delay = index * 120; // 120ms stagger for smooth exit
								let animationName = $(this).is(':last-child')
									? 'slideInreverse'
									: 'slideInreverse';
								$(this).css({
									animation: ''
										.concat(
											animationName,
											' 0.8s ease-in-out '
										)
										.concat(delay, 'ms forwards'),
								});
							});
							setTimeout(function () {
								// Remove active classes after animation completes
								$this.removeClass('active');
								$this
									.parent('li.has-sub-nav')
									.removeClass('active');
								$accordionContent.slideUp(500);

								// Reset animation *without removing animation-delay*
								setTimeout(() => {
									$subNavLinks.each(function () {
										let delay =
											$(this).css('animation-delay'); // Preserve delay
										$(this).css({
											animation: '',
											'animation-delay': delay, // Keep the delay intact
										});
									});
								}, $subNavLinks.length * 120 + 800); // Ensure last child completes before reset
							}, 1000);
						} else {
							// Animate out the currently open accordion before opening the new one
							let $activeAccordion = $(
								'.accordion-toggle.active'
							);
							if ($activeAccordion.length) {
								let $activeContent =
									$activeAccordion.siblings(
										'.accordion-content'
									);
								let $activeSubNavLinks =
									$activeContent.find('.sub-nav-links li');

								// Apply exit animation before closing the active accordion
								$activeSubNavLinks.each(function (index) {
									let delay = index * 120;
									let animationName = $(this).is(
										':last-child'
									)
										? 'slideInreverse'
										: 'slideInreverse';
									$(this).css({
										animation: ''
											.concat(
												animationName,
												' 0.8s ease-in-out '
											)
											.concat(delay, 'ms forwards'),
									});
								});
								setTimeout(() => {
									// Remove active classes and close previous accordion
									$activeAccordion.removeClass('active');
									$activeAccordion
										.parent('li.has-sub-nav')
										.removeClass('active');
									$activeContent.slideUp(500);

									// Reset animation without affecting delay
									setTimeout(() => {
										$activeSubNavLinks.each(function () {
											let delay =
												$(this).css('animation-delay');
											$(this).css({
												animation: '',
												'animation-delay': delay,
											});
										});
									}, $activeSubNavLinks.length * 120 + 800);
								}, 1000);
							}

							// Now, open the new accordion
							$(this).addClass('active');
							$(this).parent('li.has-sub-nav').addClass('active');
							$(this)
								.siblings('.accordion-content')
								.slideDown(500);
						}
					}
					navLink = true;
				})
				.focus(function (e) {
					'use strict';

					if (navLink) {
						navLink = false;
					} else {
						if ($(this).parent('div').hasClass('footer-links')) {
							if ($(window).width() < 980) {
								if ($(this).hasClass('active')) {
									$(this).removeClass('active');
									$(this)
										.siblings('.accordion-content')
										.slideUp(300);
								} else {
									$('.accordion-toggle').removeClass(
										'active'
									);
									$(this).addClass('active');
									$('.accordion-content').slideUp(300);
									$(this)
										.siblings('.accordion-content')
										.slideDown(300);
								}
							}
						} else {
							if ($(this).hasClass('active')) {
								$(this).removeClass('active');
								$(this)
									.siblings('.accordion-content')
									.slideUp(600);
								$(this)
									.parent('li.has-sub-nav')
									.removeClass('active');
							} else {
								$('.accordion-toggle').removeClass('active');
								$('.accordion-toggle')
									.parent('li.has-sub-nav')
									.removeClass('active');
								$(this)
									.parent('li.has-sub-nav')
									.addClass('active');
								$(this).addClass('active');
								$('.accordion-content').slideUp(600);
								$(this)
									.siblings('.accordion-content')
									.slideDown(600);
							}
						}
					}
				});
		});
	})(jQuery);

	// sEARCH BAR
	$(document).click(function (e) {
		var container = $('.search-li');

		// if the target of the click isn't the container nor a descendant of the container
		if (!container.is(e.target) && container.has(e.target).length === 0) {
			$('.js__header-search-section').removeClass('active');
			$('.js__search').removeClass('active');
			$('body .boost-pfs-search-suggestion').css('display', 'none');
			$('body #boost-sd__search-widget-init-wrapper-1').css(
				'display',
				'none'
			);
			if (
				$('div').hasClass('inner-hero-section') ||
				$('div').hasClass('error-page') ||
				$('div').hasClass('hero-banner-slider')
			) {
				if ($('.js__main-header').hasClass('active') === true) {
					$('body').removeClass('transparent-header');
				}
			} else {
				$('body').removeClass('transparent-header');
			}
		}
	});
	$('.js__search').on('click', function (e) {
		e.preventDefault();
		// if($(this).hasClass("active")){
		//     // $(".js__header-search-section").removeClass("active");
		//     $(".js__search").toggleClass("active");
		//     $("body .boost-pfs-search-suggestion").css("display","none");
		//     $("body #boost-sd__search-widget-init-wrapper-1").css("display","none");
		//     $(".js__main-header").removeClass("active");
		//     $(".js__header-search-section").removeClass("active");
		// }

		$('.js__header-search-section').toggleClass('active');
		$('#navbarNavDropdown').removeClass('active');
		// $(".announcement-bar").removeClass("active");
		$('#hamburger').removeClass('active');
		$('.search').focus();
		$('.boost-pfs-search-box').focus();
		$('.boost-pfs-search-suggestion-wrapper').removeClass(
			'boost-pfs-search-suggestion-open'
		);
		$('body .boost-pfs-search-suggestion').css('display', 'none');
		$('body #boost-sd__search-widget-init-wrapper-1').css(
			'display',
			'none'
		);
		$(this).toggleClass('active');
		$('.js__main-header').addClass('active');
		$('body').removeClass('transparent-header');
		$('html').removeClass('scroll-stop');
		$('html').css('overflow-y', 'scroll');
		if ($('.js__main-header').hasClass('active')) {
			if ($(this).hasClass('active')) {
				$('.js__main-header').addClass('active');
			} else {
				$('.js__main-header').removeClass('active');
			}
		}
		if ($('body').hasClass('fixed-header')) {
			$('body').removeClass('transparent-header');
		}
		if (
			$('div').hasClass('inner-hero-section') === false ||
			$('div').hasClass('.hero-banner-slider') === false
		) {
			$('body').removeClass('transparent-header');
		}
		if (
			$('div').hasClass('inner-hero-section') ||
			$('div').hasClass('error-page') ||
			$('div').hasClass('hero-banner-slider')
		) {
			if ($('.js__main-header').hasClass('active') === true) {
				$('body').removeClass('transparent-header');
			} else {
				if ($('body').hasClass('fixed-header')) {
					$('body').removeClass('transparent-header');
				} else {
					$('body').addClass('transparent-header');
				}
			}

			// $("body").addClass("transparent-header");
			// $("body").addClass("template-index");
		}
	});
	// $(".js__search").on("click", function(e) {
	//     e.preventDefault();

	//     const $this = $(this);
	//     const isActive = $this.hasClass("active");

	//     // Toggle active class on search icon
	//     $this.toggleClass("active", !isActive);

	//     // Toggle active class on search section
	//     $(".js__header-search-section").toggleClass("active", !isActive);
	//     $(".js__main-header").toggleClass("active", !isActive);

	//     // Manage additional elements
	//     $("#navbarNavDropdown, #hamburger").removeClass("active");
	//     $(".boost-pfs-search-suggestion-wrapper").removeClass("boost-pfs-search-suggestion-open");
	//     $("body .boost-pfs-search-suggestion, body #boost-sd__search-widget-init-wrapper-1").css("display", "none");

	//     // Focus on search field only when opening
	//     if (!isActive) {
	//         $(".search, .boost-pfs-search-box").first().focus();
	//     }

	//     // Manage header transparency
	//     if ($("body").hasClass("fixed-header")) {
	//         $("body").removeClass("transparent-header");
	//     } else {
	//         if ($(".js__main-header").hasClass("active")) {
	//             $("body").removeClass("transparent-header");
	//         } else {
	//             $("body").addClass("transparent-header");
	//         }
	//     }

	//     // Manage scroll behavior
	//     $("html").css("overflow-y", isActive ? "scroll" : "auto");
	// });
});

/** Fix Header on Scroll **/
$(window).scroll(function () {
	var sticky = $('header'),
		scroll = $(window).scrollTop();
	if (scroll >= 30) {
		sticky.addClass('fixed');
		$('body').addClass('fixed-header');
		$('.fixed-header').removeClass('transparent-header');
	} else {
		sticky.removeClass('fixed');
		$('body').removeClass('fixed-header');
		if ($('#navbarNavDropdown').hasClass('active')) {
			$('body').removeClass('transparent-header');
			$('.main-header').addClass('active');
		} else {
			if (
				$('div').hasClass('hero-banner') ||
				$('div').hasClass('error-page') ||
				$('div').hasClass('inner-hero-section')
			) {
				$('body').addClass('transparent-header');
			} else {
				$('body').removeClass('transparent-header');
			}
		}
		if ($('.js__main-header').hasClass('active') === true) {
			$('body').removeClass('transparent-header');
		} else {
			if (
				$('div').hasClass('hero-banner') ||
				$('div').hasClass('error-page') ||
				$('div').hasClass('inner-hero-section')
			) {
				$('body').addClass('transparent-header');
			} else {
				$('body').removeClass('transparent-header');
			}
			//   $("body").removeClass("transparent-header");
		}
	}
});

/** Mobile Navigation Open Close **/
(function ($) {
	$(function () {
		var navLink = false;
		$('#hamburger')
			.mousedown(function (e) {
				$(this).toggleClass('active');
				$('#navbarNavDropdown').toggleClass('active');
				$('.js__mobile-menu-open-hide').toggleClass('active');
				$('.js__mobile-announcement-text').toggleClass('active');
				$('.main-header').toggleClass('active');
				// $(".announcement-bar").toggleClass("active");
				$('body').removeClass('transparent-header');
				if ($('body').hasClass('transparent-header')) {
					$('body').removeClass('transparent-header');
				}
				if ($('#navbarNavDropdown').hasClass('active')) {
					$('.js__logo').addClass('active');
					$('.template-index').removeClass('transparent-header');
					$('.main-header').addClass('active');
					if ($(window).width() < 980) {
						$('html').css('overflow', 'hidden');
						$('html').addClass('scroll-stop');
					} else {
						$('html').removeClass('scroll-stop');
						$('html').css('overflow-y', 'scroll');
					}
				} else {
					$('.js__logo').toggleClass('active');
					$('.main-header').removeClass('active');
					if ($('body').hasClass('fixed-header')) {
						$('.template-index').removeClass('transparent-header');
					} else {
						$('.template-index').addClass('transparent-header');
					}
					$('html').css('overflow-y', 'scroll');
					$('body .boost-pfs-search-suggestion-group').css(
						'display',
						'none'
					);
				}
				navLink = true;
			})
			.focus(function (e) {
				'use strict';

				if (navLink) {
				} else {
					$(this).toggleClass('active');
					$('#navbarNavDropdown').toggleClass('active');
					$('.js__mobile-menu-open-hide').toggleClass('active');
					$('.js__mobile-announcement-text').toggleClass('active');
					if ($('#navbarNavDropdown').hasClass('active')) {
						$('.js__logo').addClass('active');
						$('.template-index').removeClass('transparent-header');
					} else {
						$('.js__logo').toggleClass('active');
						$('.template-index').addClass('transparent-header');
					}
				}
			});
	});
})(jQuery);

/** CART SIDEBAR
 * Close on Outside Click
 * **/
$(document).mouseup(function (e) {
	var popup = $('#CartSidebar');
	var overlay = $('#cart_overlay');
	if (!popup.is(e.target) && popup.has(e.target).length == 0) {
		popup.removeClass('active');
		overlay.removeClass('active');
		$('html').removeClass('mini-cart-open');
	}
});
/* OPEN BIG NAV SECTION ON DESKTOP */
(function ($) {
	$(function () {
		var navLink = false;
		$('.js__big-nav-link')
			.mousedown(function (e) {
				$(this).toggleClass('active');
				$('.js__big-nav').toggleClass('active');
				navLink = true;
			})
			.focus(function (e) {
				'use strict';

				if (navLink) {
				} else {
					$(this).toggleClass('active');
					$('.js__big-nav').toggleClass('active');
				}
			});
	});
})(jQuery);
/* OPEN SUB NAV SECTION ON MOBILE */
(function ($) {
	$(function () {
		var navLink = false;
		$('.js__sub-nav-link')
			.mousedown(function (e) {
				$(this).toggleClass('active');
				$('.js__sub-nav').toggleClass('active');
				navLink = true;
			})
			.focus(function (e) {
				'use strict';

				if (navLink) {
				} else {
					$(this).toggleClass('active');
					$('.js__sub-nav').toggleClass('active');
				}
			});
	});
})(jQuery);

// Close MOBILE SUB NAV ON CLICK BACK
(function ($) {
	$(function () {
		var navLink = false;
		$('.js__sub-nav-close')
			.mousedown(function (e) {
				$(this).toggleClass('active');
				$('.js__sub-nav').toggleClass('active');
				navLink = true;
			})
			.focus(function (e) {
				'use strict';

				if (navLink) {
				} else {
					$(this).toggleClass('active');
					$('.js__sub-nav').toggleClass('active');
				}
			});
	});
})(jQuery);
jQuery(document).ready(function () {
	// Loop through each main menu item
	jQuery('.main-menu > ul.mobile-menu-main > li').each(function (
		index,
		element
	) {
		// Get total number of main menu items
		var totalMainItems = jQuery(
			'.main-menu > ul.mobile-menu-main > li'
		).length;

		// Calculate and apply reverse animation delay for main menu items
		var delayMain = 0.4 + (totalMainItems - index - 1) * 0.09; // Reverse index delay
		const delaySub = 0.1 + index * 0.09;
		jQuery(this).css('animation-delay', delaySub + 's');

		// Find and loop through sub-navigation items
		var subNavItems = jQuery(this).find(
			'.accordion-content .flex .sub-nav-links > li'
		);
		var totalSubNavItems = subNavItems.length;
		subNavItems.each(function (subIndex) {
			// Calculate and apply reverse animation delay for sub-items
			var delaySub = 0.6 + (totalSubNavItems - subIndex - 1) * 0.09; // Reverse index delay
			jQuery(this).css('animation-delay', delaySub + 's');
		});
	});
});
jQuery(document).ready(function () {
	// Loop through each main menu item
	jQuery('.main-menu .bottom-two-column-image-card ul li').each(function (
		index,
		element
	) {
		// Get total number of main menu items
		var totalMainItems = jQuery(
			'.main-menu .bottom-two-column-image-card'
		).length;

		// Calculate and apply reverse animation delay for main menu items

		const delaySub = 1 + index * 0.1;
		jQuery(this).css('animation-delay', delaySub + 's');
	});
});
jQuery(document).ready(function () {
	// Loop through each main menu item
	jQuery('.main-menu .mobile-bottomlink ul li').each(function (
		index,
		element
	) {
		// Get total number of main menu items
		var totalMainItems = jQuery('.main-menu .mobile-bottomlink').length;

		// Calculate and apply reverse animation delay for main menu items

		const delaySub = 2 + index * 0.1;
		jQuery(this).css('animation-delay', delaySub + 's');
	});
});
('use strict');

var pdpThumbnail;
var pdpSlider;
$(document).ready(function ($) {
	var producrSlider = new Swiper('.js__pdp-recommendation-slider', {
		slidesPerView: 3,
		autoHeight: true,
		resistance: false,
		shortSwipes: true,
		spaceBetween: 40,
		// Navigation arrows
		navigation: {
			nextEl: '.swiper-button-next-product-recommed',
			prevEl: '.swiper-button-prev-product-recommed',
		},
		breakpoints: {
			0: {
				slidesPerView: 1,
			},
			601: {
				slidesPerView: 2,
			},
			981: {
				slidesPerView: 3,
			},
		},
	});

	/*Slider working Start*/
	if (getglobalLib('PDP_Slider_Thumbnail') == 'vertical') {
		pdpThumbnail = new Swiper('.js__pdp-thumbnail-slider', {
			slidesPerView: 3,
			resistance: false,
			shortSwipes: false,
			clickable: true,
			grabCursor: true,
			observer: true,
			observeParents: true,
			draggable: true,
			breakpoints: {
				980: {
					slidesPerView: 'auto',
					direction: 'horizontal',
				},
				981: {
					slidesPerView: 6,
					direction: 'vertical',
				},
			},
		});
	} else {
		pdpThumbnail = new Swiper('.js__pdp-thumbnail-slider', {
			resistance: false,
			shortSwipes: true,
			slidesPerView: 'auto',
			freeMode: true,
			watchSlidesProgress: true,
			clickable: true,
			grabCursor: true,
			mousewheel: true,
			direction: 'horizontal',
			spaceBetween: 12,
		});
	}
	pdpSlider = new Swiper('.js__pdp-slider', {
		slidesPerView: 1,
		grabCursor: false,
		mousewheel: false,
		clickable: false,
		resistance: false,
		shortSwipes: true,
		spaceBetween: 12,
		loop: true,
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
		},
		navigation: {
			nextEl: '.swiper-button-next-pdp',
			prevEl: '.swiper-button-prev-pdp',
		},
		thumbs: {
			swiper: pdpThumbnail,
		},
	});
	/*PDP tab section drop down change*/
	$('.js__pdp-tab-select').change(function () {
		$('.tab-content').removeClass('active');
		$('.tab-content').hide();
		$('#' + $(this).val()).show();
		$('#' + $(this).val()).addClass('active');
		$('.tab-link').removeClass('active');
		$('#tab-link-' + $(this).val()).addClass('active');
	});

	/* var pdpSlideCount = 0;
   $(document).on("click", ".swiper-button-next-pdp.swiper-button-disabled", function(e) {
           var ariaLabel = $(".js__pdp-slider").find(".swiper-slide-active").attr("aria-label").split("/");
           console.log(ariaLabel[0]);
           console.log(ariaLabel[1]);
           pdpSlideCount++;
           if (pdpSlideCount == 2) {
               if (ariaLabel[0].trim() == ariaLabel[1].trim()) {
                   pdpSlideCount = 0
                   pdpSlider.slideTo(0);
               }
           }
        })*/
	/* Manual click of thumbnail of slider*/
	$(document).on('click', '.pdp-thumbnail li', function (e) {
		var slideno = $(this).index();
		$('.pdp-thumbnail li').removeClass('active');
		$(this).addClass('active');
		$('.pdp-slider').slick('slickGoTo', slideno);
		setTimeout(function () {
			$('.pdp-thumbnail').slick('slickGoTo', slideno);
		}, 500);
		/* var slideno = $(this).index();
             $(".pdp-thumbnail li").removeClass("active");
             $(this).addClass("active");
             console.log("slideno"+slideno);
       
             $(".pdp-slider").slick("slickGoTo", slideno);*/
	});
	/*Write review click*/
	$('.js__write-review-btn').click(function () {
		$('.yotpo-new-review-btn').click();
	});

	/*View details*/
	$(document).on('click', '.js__pdp-view-details', function (e) {
		e.preventDefault();
		$('.tab-link').removeClass('active');
		$('.tab-head li:first-child').children('.tab-link').addClass('active');
		$('.tab-content').removeClass('active');
		$('.tab-content:first-child').addClass('active');
		$('.tab-content').hide();
		$('.tab-content:first-child').show();
		$('.js__pdp-tab-select').val(
			$('.tab-head li:first-child')
				.children('.tab-link')
				.attr('data-attr')
		);
		setTimeout(function () {
			var target = $('.tab-content:first-child');
			$('html, body').animate(
				{
					scrollTop: target.offset().top - 350,
				},
				500
			);
		}, 500);
	});

	/*Review star click*/
	$(document).on('click', '.js__review-section', function (e) {
		e.preventDefault();
		$('.tab-link').removeClass('active');
		$('#tab-link-reviews').addClass('active');
		$('.tab-content').removeClass('active');
		$('#reviews').addClass('active');
		$('.tab-content').hide();
		$('#reviews').show();
		$('.js__pdp-tab-select').val('Reviews');
		setTimeout(function () {
			var target = $('#reviews');
			$('html, body').animate(
				{
					scrollTop: target.offset().top - 350,
				},
				500
			);
		}, 500);
	});

	/*Ninja price update */
	var targetNodes = $('.product__form');
	var MutationObserver =
		window.MutationObserver || window.WebKitMutationObserver;
	var bundleObersrver = new MutationObserver(mutationHandler);
	var obsConfig = {
		childList: true,
		characterData: true,
		attributes: true,
		subtree: true,
	}; //--- Add a target node to the observer. Can only add one node at a time.

	targetNodes.each(function () {
		bundleObersrver.observe(this, obsConfig);
	});
	function mutationHandler(mutationRecords) {
		//loop through all the mutations that just occured
		mutationRecords.forEach(function (mutation) {
			if (mutation.type == 'childList') {
				//loop though the added nodes
				mutation.addedNodes.forEach(function (added_node) {
					// Select the custom web component
					const rechargeWidget = document.querySelector(
						'recharge-subscription-widget'
					);

					// Ensure the component has a shadowRoot
					if (rechargeWidget && rechargeWidget.shadowRoot) {
						// Access the shadow root
						const shadowRoot = rechargeWidget.shadowRoot;
						// Select all elements with the class 'rc-purchase-option__label'
						const labels = shadowRoot.querySelectorAll(
							'.rc-purchase-option__label'
						);

						// Add click event listener to each label
						labels.forEach(function (label) {
							label.addEventListener('click', function () {
								updateRechargePrice();
								// Perform your custom actions here
							});
						});
					} else {
						console.log(
							'Shadow root not found or recharge-subscription-widget not present.'
						);
					}
					updateRechargePrice();
					if ($('.rc-template__radio-group').html() != undefined) {
						console.log('click recharge active');
						$('.label-recharge-info').remove();
						if ($('.js__subscribeText').html() != '') {
							$('.subscription-radio').append(
								"<span class='label-recharge-info'>" +
									$('.js__subscribeText').html() +
									'</span>'
							);
						}
						if ($('.js__onetimeText').html() != '') {
							$('.onetime-radio').append(
								"<span class='label-recharge-info'>" +
									$('.js__onetimeText').html() +
									'</span>'
							);
						}
						var priceText = $('.subscription-radio')
							.find('.price-label')
							.html();
						if (priceText.startsWith('€')) {
							// Remove the Euro symbol temporarily
							priceText = priceText.substring(1);

							// Replace the comma with a dot
							priceText = priceText.replace(',', '.');

							// Add the Euro symbol back and update the element
							$('.subscription-radio')
								.find('.price-label')
								.html('€' + priceText);
						}
						priceText = $('.onetime-radio')
							.find('.price-label')
							.html();
						if (priceText.startsWith('€')) {
							// Remove the Euro symbol temporarily
							priceText = priceText.substring(1);

							// Replace the comma with a dot
							priceText = priceText.replace(',', '.');

							// Add the Euro symbol back and update the element
							$('.onetime-radio')
								.find('.price-label')
								.html('€' + priceText);
						}
						setTimeout(function () {
							$('.rc-radio--active').click();
						}, 500);
						bundleObersrver.disconnect();
					}
				});
			}
		});
	}

	/* change frequency dropdown checking if   value not null then change button text */

	$(document).on(
		'change',
		'.rc_widget__option__plans__dropdown',
		function (e) {
			$('.rc-option--active').click();
		}
	);
	$(document).on('click', '.rc-radio', function (e) {
		console.log('click radio ');
		var price = $(this).find('.price-label').html();
		$('.pdp-add-to-cart-price').html(price);
		console.log('click radio price' + price);
		$('.product-single__prices').children('span').html(price);
	});

	/*Slider working End*/
	/* Call page load functions */
	setTimeout(function () {
		setColorThumbImages();
	}, 1000);
	/* FORMATTING: Loop Through each color thumb and set the images for them through the product color library object */
	function setColorThumbImages() {
		if ($('.js-variant-color-swatch li')[0]) {
			$('.js-variant-color-swatch  li').each(function (index) {
				var color = $(this).attr('data-color');
				var colorValue = getVariantColor(color);
				//$(this).children("div.color").css("background-color", colorValue);
				if (colorValue == '') {
					$(this).children('img').css('opacity', '0');
				}
				$(this).children('img').attr('src', colorValue);
			});
		}
	}
});
/*PENDING Get Variant Color*/
function getVariantColor(color) {
	try {
		var variantColorValue = '';
		$.each(prodColor, function (key, value) {
			if (color.toLowerCase() == value.title.toLowerCase()) {
				variantColorValue = value.color;
			}
		});
		/* $.each(prodLib, function (key, value) {
       if (color.toLowerCase() == value.option1.toLowerCase()) {
         variantColorValue = value.image;
       }
     });*/
		return variantColorValue;
	} catch {}
}
function updateRechargePrice() {
	const rechargeWidget = document.querySelector(
		'recharge-subscription-widget'
	);

	// Ensure the component has a shadowRoot
	if (rechargeWidget && rechargeWidget.shadowRoot) {
		// Access the shadow root
		const shadowRoot = rechargeWidget.shadowRoot;

		// Find the checked input within the `rc-purchase-option`
		const checkedInput = shadowRoot.querySelector(
			'.rc-purchase-option input:checked'
		);
		if (checkedInput) {
			// Navigate to the parent `.rc-purchase-option` and find the associated `.rc-price`
			const purchaseOption = checkedInput.closest('.rc-purchase-option');
			const priceElement = purchaseOption?.querySelector(
				'.rc-price:last-child'
			);
			if (priceElement) {
				// Extract the text content of the price element
				const priceText = priceElement.textContent
					.trim()
					.replace(', Discounted price:', '');
				console.log('Price:', priceText.trim());
				$('.product-single__prices')
					.children('span')
					.html(priceText.trim());
			} else {
				console.log(
					'Price element (.rc-price) not found within the checked purchase option.'
				);
			}
		} else {
			console.log('No checked input found inside rc-purchase-option.');
		}
	} else {
		console.log(
			'Shadow root not found or recharge-subscription-widget not present.'
		);
	}
}

/* Color swatch click*/
$(document).ready(function ($) {
	$(document).on('mouseenter', '.js__product-cart-color li', function () {
		var productID = $(this).attr('data-product-id');
		var variantImage = $(this).attr('data-image');
		var featuredImage = $(this).attr('data-featured_image');
		if (variantImage.indexOf('no-image-') == -1) {
			$('.js__product-image-' + productID).attr('src', variantImage);
		} else {
			$('.js__product-image-' + productID).attr('src', featuredImage);
		}
	});
	$(document).on('mouseleave', '.js__product-cart-color li', function () {
		var productID = $(this).attr('data-product-id');
		var featuredImage = $('.js__product-image-' + productID).attr(
			'data-src'
		);
		$('.js__product-image-' + productID).attr('src', featuredImage);
	});
});
('use strict');

var colorSelected = '';
var secondOptionVariantValue = '';
var thirdOptionVariantValue = '';
var selectedVariantID;
$(document).ready(function ($) {
	/* if no varient then active class added in product image section*/
	if (prodLib.length == 0) {
		$('.js-pdp-media').addClass('active');
		$('.js__pdp-thumbnail-slider li:first-child').addClass('active');
	}
	var colorPosition = $('#colorPosition').val();
	var numberOfAvailableOptions = parseInt($('#optionSize').val());

	// on page load check the color position, and set 2nd and 3rd options values
	checkColorPosition();
	function checkColorPosition() {
		getColorPosition();
		/* 
    if only color and no other options
    */
		if (colorPosition != undefined && numberOfAvailableOptions == 1) {
			SoldOutUnavailableOnColorSwatches(colorSelected);
		}
	}

	/*Quantity Plus Minus*/
	$('.js-product-single__quantity .js-plus-minus-qty').click(function (e) {
		//  e.preventDefault()
		var type = $(this).attr('data-type');
		var productQuantity = $('.js-quantity-selector').val();
		if (type == 'minus') {
			if (productQuantity > 1) {
				productQuantity--;
			}
		} else {
			productQuantity++;
		}
		$('.js-quantity-selector').val(productQuantity);
	});

	// On DD change, fire the form DD element and also run the soldoutColorSwatches function
	$('.js__pdp-variant-select').change(function () {
		var optionIndex = $(this).attr('data-option');
		var optionValue = $(this).val();
		$(
			'#product .product__form .options .option.option-' +
				optionIndex +
				' .label span'
		).text(optionValue);

		// button  - Sold out and add to cart
		$('#product-select-option-' + optionIndex)
			.val(optionValue)
			.trigger('change');
		/*Checking if this is filter type then image filter code will work*/
		var OptionType = $(this).attr('data-type');
		var FilterType = $('#variantFilterType').val();
		if (OptionType == FilterType) {
			imageFilter(optionValue);
		}
		var selectedVariant = $('#product-select :selected')
			.text()
			.replace('- sold out!', '');
		$('.js__product-variant-selected').html(selectedVariant);
		$('.rc-radio--active').click();

		//color swatch - sold out working
		SoldOutUnavailableOnColorSwatches(colorSelected);
	});
	$(document).on('click', '.js__pdp-variant-select li', function () {
		var optionIndex = $(this).attr('data-option');
		var optionValue = $(this).attr('data-value');
		var optionType = $(this).parent('ul').attr('data-type');
		$(this).parent('ul').children('li').removeClass('active');
		$(this).addClass('active');
		$('#product-select-option-' + optionIndex)
			.val(optionValue)
			.trigger('change');
		$('#product-select').change();

		/*Checking if this is filter type then image filter code will work*/
		try {
			var FilterType = $('#variantFilterType').val();
			if (optionType == FilterType) {
				imageFilter(optionValue);
			}
		} catch {}
		// button  - Sold out and add to cart

		try {
			SoldOutUnavailableOnColorSwatches(colorSelected);
		} catch {}
		//color swatch - sold out working
	});
	$('.js__pdp-variant-select li.active').click();
	$('.js__color-swatches').click(function () {
		// remove active class - from all the li's
		$('.js__color-swatches').removeClass('active');
		// add class on the one which is clicked
		$(this).addClass('active');
		var optionindex = $(this).data('option');
		var thevalue = $(this).data('value');

		//show the selected value
		$('.variant-option.option-' + optionindex + ' .label span').text(
			thevalue
		);

		// trigger change
		$('#product-select-option-' + optionindex)
			.val(thevalue)
			.trigger('change');

		/*Checking if this is filter type then image filter code will work*/
		var OptionType = $(this).parent('ul').attr('data-type');
		var FilterType = $('#variantFilterType').val();
		if (OptionType == FilterType) {
			imageFilter(thevalue);
		}
	});

	/*Run this function when image change on variant click*/
	function imageFilter(selectedValue) {
		/*Slick slider filter on swatch click*/
		var thumbColorSelected = selectedValue.replace(' ', '-');
		thumbColorSelected = thumbColorSelected.replace(/[^a-zA-Z0-9 ]/g, '-');
		thumbColorSelected = thumbColorSelected.replace(/ /g, '-');
		thumbColorSelected = thumbColorSelected.replace(/--/g, '-');
		thumbColorSelected = thumbColorSelected.replace(/---/g, '-');

		// $(".pdp-slider").slick("slickUnfilter");
		//   $(".js__pdp-thumbnail-slider").slick("slickUnfilter");
		$('.pdp-slider')
			.find('.all')
			.addClass(thumbColorSelected.toLowerCase());
		$('.js__pdp-thumbnail-slider')
			.find('.all')
			.addClass(thumbColorSelected.toLowerCase());
		//   $(".pdp-slider").slick("slickFilter", "." + thumbColorSelected.toLowerCase());
		//  $(".js__pdp-thumbnail-slider").slick( "slickFilter","." + thumbColorSelected.toLowerCase());
		$('.js__pdp-thumbnail-slider .swiper-slide').removeClass('active');
		//$(".js__pdp-thumbnail-slider").slick("refresh");

		$('.pdp-slider')
			.find('.slide')
			.addClass('remove-slide')
			.removeClass('swiper-slide')
			.removeAttr('aria-label');
		$('.js__pdp-thumbnail-slider')
			.find('.slide')
			.addClass('remove-slide')
			.removeClass('swiper-slide')
			.removeAttr('aria-label');
		$('.pdp-slider')
			.find('.slide')
			.children('.image-section')
			.removeAttr('data-fancybox');
		$('.pdp-slider')
			.find('.' + thumbColorSelected.toLowerCase())
			.removeClass('remove-slide')
			.addClass('swiper-slide');
		$('.js__pdp-thumbnail-slider')
			.find('.' + thumbColorSelected.toLowerCase())
			.removeClass('remove-slide')
			.addClass('swiper-slide');
		$('.pdp-slider')
			.find('.' + thumbColorSelected.toLowerCase())
			.children('.image-section')
			.attr('data-fancybox', 'product');
		pdpThumbnail.destroy();
		pdpSlider.destroy();
		if (getglobalLib('PDP_Slider_Thumbnail') == 'vertical') {
			pdpThumbnail = new Swiper('.js__pdp-thumbnail-slider', {
				slidesPerView: 3,
				resistance: false,
				shortSwipes: false,
				freeMode: true,
				watchSlidesProgress: true,
				clickable: true,
				grabCursor: true,
				observer: true,
				observeParents: true,
				draggable: true,
				breakpoints: {
					980: {
						slidesPerView: 'auto',
						direction: 'horizontal',
					},
					981: {
						slidesPerView: 6,
						direction: 'vertical',
					},
				},
			});
		} else {
			pdpThumbnail = new Swiper('.js__pdp-thumbnail-slider', {
				resistance: false,
				shortSwipes: true,
				loop: true,
				slidesPerView: 'auto',
				freeMode: true,
				watchSlidesProgress: true,
				clickable: true,
				grabCursor: true,
				mousewheel: true,
				spaceBetween: 10,
			});
		}
		pdpSlider = new Swiper('.js__pdp-slider', {
			slidesPerView: 1,
			grabCursor: false,
			mousewheel: false,
			clickable: false,
			resistance: false,
			shortSwipes: true,
			loop: true,
			spaceBetween: 12,
			navigation: {
				nextEl: '.swiper-button-next-pdp',
				prevEl: '.swiper-button-prev-pdp',
			},
			thumbs: {
				swiper: pdpThumbnail,
			},
		});

		/*Selected first variant image in slider which have no all class*/
		var boolVariantFirstImage = false;
		$('.js__pdp-thumbnail-slider  li').each(function () {
			if (!$(this).hasClass('all')) {
				if (boolVariantFirstImage == false) {
					$(this).click();
					$(this).addClass('active');
					boolVariantFirstImage = true;
				}
			}
		});
		/*When we dont have any variant image*/

		if (boolVariantFirstImage == false) {
			$('.js__pdp-thumbnail-slider li:first-child').addClass('active');
			$('.js__pdp-thumbnail-slider li:first-child').click();
		}
		colorSelected = selectedValue;
	}
	// main sold out and unavailable working
	function SoldOutUnavailableOnColorSwatches(colorSelected) {
		getColorPosition();

		// Remove out of stock and unavailable from color swatches
		$('.js__color-swatches').removeClass('out-of-stock');
		$('.js__color-swatches').removeClass('unavailable');
		var colorLength = $('.js__color-swatches').length;
		var colorCount = 1;
		/*
    Loop Through each input radio for the color
    */

		// we are using color swatch working for other options when they are radio buttons
		$('.js__color-swatches').each(function (index) {
			var colorValue = $(this).attr('data-value');
			var checkColorOptionExists = false;
			/* 
       Loop through product library object for variant 
       and if variant select matches and quantity = 0 then show out of stock message
       */

			/*
      PENDING - Merge - ProdLib Each Function
      */

			$.each(prodLib, function (key, value) {
				let itemQuantity = value.quantity;
				let itemAvailable = value.available;
				var prodColorOptionValue = '';
				var prodSecondOptionValue = '';
				var prodThirdOptionValue = '';
				if (colorPosition == '1') {
					prodColorOptionValue = value.option1;
					prodSecondOptionValue = value.option2;
					prodThirdOptionValue = value.option3;
				}
				if (colorPosition == '2') {
					prodColorOptionValue = value.option2;
					prodSecondOptionValue = value.option1;
					prodThirdOptionValue = value.option3;
				}
				if (colorPosition == '3') {
					prodColorOptionValue = value.option3;
					prodSecondOptionValue = value.option1;
					prodThirdOptionValue = value.option2;
				}
				var colorOption = prodColorOptionValue.toLowerCase();
				colorOption = colorOption.replace(/[^a-zA-Z0-9 ]/g, '-');
				colorOption = colorOption.replace(/ /g, '-');
				colorOption = colorOption.replace(/--/g, '-');
				colorOption = colorOption.replace(/---/g, '-');
				/*Checking each color  size quantity and which have 0 then added out of stock class*/
				if (numberOfAvailableOptions == 3) {
					/*three matching option checking quantity if 0 then showing out of stock */
					if (
						secondOptionVariantValue.toLowerCase() ==
							prodSecondOptionValue.toLowerCase() &&
						thirdOptionVariantValue.toLowerCase() ==
							prodThirdOptionValue.toLowerCase()
					) {
						{
							//check if quantity>1 then set the color swatch - Out of stock
							setColorSwatchOutofStock(
								colorOption,
								itemQuantity,
								itemAvailable
							);
						}
					}
				} else if (numberOfAvailableOptions == 2) {
					/*two matching option checking quantity if 0 then showing out of stock */
					if (
						prodSecondOptionValue.toLowerCase() ==
						secondOptionVariantValue.toLowerCase()
					) {
						{
							//check if quantity>1 then set the color swatch - Out of stock
							setColorSwatchOutofStock(
								colorOption,
								itemQuantity,
								itemAvailable
							);
						}
					}
				} else {
					//check if quantity>1 then set the color swatch - Out of stock
					setColorSwatchOutofStock(
						colorOption,
						itemQuantity,
						itemAvailable
					);
				}
				if (prodColorOptionValue == colorValue) {
					if (numberOfAvailableOptions == 3) {
						if (
							prodSecondOptionValue.toLowerCase() ==
								secondOptionVariantValue.toLowerCase() &&
							prodThirdOptionValue.toLowerCase() ==
								thirdOptionVariantValue.toLowerCase()
						) {
							checkColorOptionExists = true;
						}
					} else if (numberOfAvailableOptions == 2) {
						if (
							prodSecondOptionValue.toLowerCase() ==
							secondOptionVariantValue.toLowerCase()
						) {
							checkColorOptionExists = true;
						}
					} else {
						checkColorOptionExists = true;
					}
				}
			});
			if (checkColorOptionExists == false) {
				var colorOption = colorValue;
				colorOption = colorOption.replace(/[^a-zA-Z0-9 ]/g, '-');
				colorOption = colorOption.replace(/ /g, '-');
				colorOption = colorOption.replace(/--/g, '-');
				colorOption = colorOption.replace(/---/g, '-');
				colorOption = colorOption.toLowerCase();
				$(
					'.js__color-swatches[data-type-value=' + colorOption + ']'
				).removeClass('out-of-stock');
				$(
					'.js__color-swatches[data-type-value=' + colorOption + ']'
				).addClass('unavailable');
				if (
					$(
						'.js__color-swatches[data-type-value=' +
							colorOption +
							']'
					).hasClass('active')
				) {
					var nextColor = colorCount + 1;
					if (colorCount < colorLength) {
						$(
							'.js__color-swatches:nth-child(' + nextColor + ')'
						).click();
					} else {
						$('.js__color-swatches:nth-child(1)').click();
					}
				}
			}
			colorCount++;
		});
	}
	function getColorPosition() {
		if (colorPosition != undefined && numberOfAvailableOptions > 1) {
			if (colorPosition == '1') {
				secondOptionVariantValue = $('.js__pdp-variant-select1').val();
				if (numberOfAvailableOptions > 2) {
					thirdOptionVariantValue = $(
						'.js__pdp-variant-select2'
					).val();
				}
			}
			if (colorPosition == '2') {
				secondOptionVariantValue = $('.js__pdp-variant-select0').val();
				if (numberOfAvailableOptions > 2) {
					thirdOptionVariantValue = $(
						'.js__pdp-variant-select2'
					).val();
				}
			}
			if (colorPosition == '3') {
				secondOptionVariantValue = $('.js__pdp-variant-select0').val();
				if (numberOfAvailableOptions > 2) {
					thirdOptionVariantValue = $(
						'.js__pdp-variant-select1'
					).val();
				}
			}
		} else {
			secondOptionVariantValue = $('.js__pdp-variant-select0').val();
			if (numberOfAvailableOptions > 1) {
				thirdOptionVariantValue = $('.js__pdp-variant-select1').val();
			}
		}
		try {
			colorSelected = colorSelected.toLowerCase();
		} catch {}
	}
	function setColorSwatchOutofStock(
		prodColor,
		prodQuantity,
		prodAvailability
	) {
		if (prodQuantity < 1 && prodAvailability == 'false') {
			$(
				'.js__color-swatches[data-type-value=' + prodColor + ']'
			).addClass('out-of-stock');
		}
	}
	$(window).scroll(function () {
		var sticky = $('.product__media-outer'),
			scroll = $(window).scrollTop();
		var pos = sticky.height();
		if ((scroll >= 768) & (scroll <= pos - 690)) {
			sticky.addClass('fixed');
			// $(".main-content").addClass("active");
		} else {
			sticky.removeClass('fixed');
			// $(".main-content").removeClass("active");
		}
	});

	// show para on click read More button

	$('.js__read-more_btn').click(function () {
		$('.js__read-less-content').addClass('hide');
		$('.js__read-more-content').removeClass('hide');
	});
	$('.js__read-less_btn').click(function () {
		$('.js__read-less-content').removeClass('hide');
		$('.js__read-more-content').addClass('hide');
	});

	function boostAd(){
		$('.product-card').each(function(index){
		$(this).attr('style', 'order:'+(index + 1)+';');
		});
		console.log('boost detected');
		var ad = $('.smCollectionAd--unset');
		ad.addClass('product-card');
		ad.prependTo('.collection__product-list');
		ad.removeClass('smCollectionAd--unset');
		ad.show();
	}

	if ($('.smCollectionAd--unset').length > 0 || $('.template-collection').length > 0){
		var readyCheck = false;
		var boostCheck = setInterval(function(){
			console.log('check')
			readyCheck = $('.boost-pfs-filter-product-item[data-page="1"]').length > 0;
			if (readyCheck){
			clearInterval(boostCheck);
			boostAd();
				$('.productCard__buy').on('click', function(){
				console.log('clicked buy button');
				var varid = $(this).attr('data-prod');
				var sellingPlan = parseInt($(this).attr('data-plan'));
				CartJS.addItem(
					parseInt(varid),
					1, 
					{
						selling_plan: sellingPlan,
					}, 
					{
						success: function(data, textStatus, jqXHR) {
							//success state
							successState();
							if (getglobalLib('Mini_Cart') == 'yes') {
								$('.modal-quick-view').hide();
								jQuery.getJSON('/cart.js', function(cart) {
									// show message
									showCartSuccessMessage();
									// now have access to Shopify cart object
									reloadAjaxCartItemUsingCartAjaxObject(cart);
									//Progress Bar of shipping in cart and mini cart; Varies from theme to theme
									progressBar();
									//Show and hide empty cart depending upon the cart items
									setTimeout(function() {
										
										addons();
									}, 1000);
								});
							} else {
								window.location = '/cart';
							}
						},
						error: function(jqXHR, textStatus, errorThrown) {
							//error state
							console.log('Error: ' + errorThrown + '!');
						}
					}
				);
			});
			}
		}, 100);
	}
	
	
	$('.productCard__buy').on('click', function(){
		console.log('clicked buy button');
		var varid = $(this).attr('data-prod');
		var sellingPlan = parseInt($(this).attr('data-plan'));
		CartJS.addItem(
			parseInt(varid),
			1, 
			{
				selling_plan: sellingPlan,
			}, 
			{
				success: function(data, textStatus, jqXHR) {
					//success state
					successState();
					if (getglobalLib('Mini_Cart') == 'yes') {
						$('.modal-quick-view').hide();
						jQuery.getJSON('/cart.js', function(cart) {
							// show message
							showCartSuccessMessage();
							// now have access to Shopify cart object
							reloadAjaxCartItemUsingCartAjaxObject(cart);
							//Progress Bar of shipping in cart and mini cart; Varies from theme to theme
							progressBar();
							//Show and hide empty cart depending upon the cart items
							setTimeout(function() {
								
								addons();
							}, 1000);
						});
					} else {
						window.location = '/cart';
					}
				},
				error: function(jqXHR, textStatus, errorThrown) {
					//error state
					console.log('Error: ' + errorThrown + '!');
				}
			}
		);
	});
	
	

	var tabbedSliders = [];
	$('.tabbedProds__sliderOuterWrapper').each(function(){
		var wrapper = $(this);
		var index = wrapper.attr('data-slider');
		var config = {
			slidesPerView: 1,
			spaceBetween: 20,
			grabCursor: false,
			loop: true,
			updateOnWindowResize: true,
			direction: 'horizontal',
			freeModeMomentumBounce: false,
			threshold: 1,
			initialSlide: 1,
			breakpoints: {
				0: {
					slidesPerView: 1,
					spaceBetween: 10,
				},
				481: {
					slidesPerView: 2,
					spaceBetween: 10,
				},
				601: {
					slidesPerView: 3,
					spaceBetween: 10,
				},
				769: {
					slidesPerView: 4,
					spaceBetween: 20,
					initialSlide: 0,
				},
				981: {
					slidesPerView: 5,
					spaceBetween: 20,
					initialSlide: 0,
				},
				1024: {
					slidesPerView: 6,
					spaceBetween: 20,
					initialSlide: 0,
				}
			},
			pagination: {
				el: '.tabbedProds__sliderOuterWrapper[data-slider="' + index + '"] .tabbedProds__bullets',
				clickable: true,
				type: 'bullets',
			}
		}
		tabbedSliders.push(new Swiper('.tabbedProds__sliderOuterWrapper[data-slider="' + index + '"] .tabbedProds__sliderInnerWrapper', config));
		//callRechargeScript(document.querySelectorAll('.tabbedModals'));
	});

	$('.tabbedProds__tab').on('click', function(){
		if (!$(this).hasClass('tabbedProds__tab--active')){
			$('.tabbedProds__tab--active').removeClass('tabbedProds__tab--active');
			$('.tabbedProds__sliderOuterWrapper--active').removeClass('tabbedProds__sliderOuterWrapper--active');
			var tabIndex = $(this).attr('data-tab');
			$(this).addClass('tabbedProds__tab--active');
			$('.tabbedProds__sliderOuterWrapper[data-slider="'+tabIndex+'"]').addClass('tabbedProds__sliderOuterWrapper--active');
		}
	});



	class iwSearch extends HTMLElement {
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
		if (this.instantSearchContent.typeof != "null"){
			this.trendingProductsSwiperContainer = this.instantSearchContent.closest('.swiper');
		}
		
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


});

