import { Product } from "./Product";
import { SupermarketCatalog } from "./SupermarketCatalog";
import * as _ from "lodash";
import { ProductQuantity } from "./ProductQuantity";
import { Discount } from "./Discount";
import { Receipt } from "./Receipt";
import { Offer } from "./Offer";
import { SpecialOfferType } from "./SpecialOfferType";

type ProductQuantities = { [productName: string]: ProductQuantity };
export type OffersByProduct = { [productName: string]: Offer };

export class ShoppingCart {
  private readonly items: ProductQuantity[] = [];
  _productQuantities: ProductQuantities = {};

  getItems(): ProductQuantity[] {
    return _.clone(this.items);
  }

  addItem(product: Product): void {
    this.addItemQuantity(product, 1.0);
  }

  productQuantities(): ProductQuantities {
    return this._productQuantities;
  }

  public addItemQuantity(product: Product, quantity: number): void {
    let productQuantity = new ProductQuantity(product, quantity);
    this.items.push(productQuantity);
    let currentQuantity = this._productQuantities[product.name];
    if (currentQuantity) {
      this._productQuantities[product.name] = this.increaseQuantity(
        product,
        currentQuantity,
        quantity
      );
    } else {
      this._productQuantities[product.name] = productQuantity;
    }
  }

  private increaseQuantity(
    product: Product,
    productQuantity: ProductQuantity,
    quantity: number
  ) {
    return new ProductQuantity(product, productQuantity.quantity + quantity);
  }

  handleOffers(
    receipt: Receipt,
    offers: OffersByProduct,
    catalog: SupermarketCatalog
  ): void {
    // console.log(this._productQuantities());
    for (const productName in this.productQuantities()) {
      const productQuantity = this._productQuantities[productName];
      // productQuantity: ProductQuantity {
      //    product: Product {
      //      name: 'toothpaste', unit: 1
      //    },
      //    quantity: 1 }
      const product = productQuantity.product;
      // product: Product { name: 'toothpaste', unit: 1 }
      const quantity: number = productQuantity.quantity;
      // quantity: 1
      if (offers[productName]) {
        const offer: Offer = offers[productName];
        const unitPrice: number = catalog.getUnitPrice(product);
        let discount: Discount | null = null;
        let x;
        if (offer.offerType == SpecialOfferType.ThreeForTwo) {
          x = 3;
          let numberOfXs = Math.floor(quantity / x);
          if (quantity > 2) {
            const discountAmount =
              quantity * unitPrice -
              (numberOfXs * 2 * unitPrice + (quantity % 3) * unitPrice);
            discount = new Discount(product, "3 for 2", discountAmount);
          }
        } else if (offer.offerType == SpecialOfferType.TwoForAmount) {
          x = 2;
          if (quantity >= x) {
            const total =
              offer.argument * Math.floor(quantity / x) +
              (quantity % x) * unitPrice;
            const discountN = unitPrice * quantity - total;
            discount = new Discount(
              product,
              x + " for " + offer.argument,
              discountN
            );
          }
        }
        if (offer.offerType == SpecialOfferType.FiveForAmount) {
          x = 5;
          if (quantity >= x) {
            const total =
              offer.argument * Math.floor(quantity / x) +
              (quantity % x) * unitPrice;
            const discountN = unitPrice * quantity - total;
            discount = new Discount(
              product,
              x + " for " + offer.argument,
              discountN
            );
          }
        }
        if (offer.offerType == SpecialOfferType.TenPercentDiscount) {
          discount = new Discount(
            product,
            offer.argument + "% off",
            (quantity * unitPrice * offer.argument) / 100.0
          );
        }
        if (
          offer.offerType == SpecialOfferType.BundleOneToothbrushOneToothpaste
        ) {
          let toothbrushQuantity = this.productQuantities().toothbrush.quantity;
          let toothpasteQuantity = this.productQuantities().toothpaste.quantity;
          let bundleQuantity = Math.min(toothbrushQuantity, toothpasteQuantity);
          discount = new Discount(
            product,
            offer.argument + "% off (bundle)",
            (bundleQuantity * unitPrice * offer.argument) / 100.0
          );
        }
        if (discount != null) receipt.addDiscount(discount);
      }
    }
  }
}
