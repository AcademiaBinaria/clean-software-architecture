import { CheckOutFacade } from '../2-business/lib/check-out-facade';
import { ShoppingCartFacade } from '../2-business/lib/shopping-cart-facade';
import { CheckOut } from '../3-infrastructure/models/check-out';
import { Client } from '../3-infrastructure/models/client';
import { LineItem } from '../3-infrastructure/models/line-item';
import { ShoppingCart } from '../3-infrastructure/models/shopping-cart';
import { WarehouseAdministrator } from './warehouse-administrator';

export class ShoppingCartManager {
  private readonly shoppingCartFacade = new ShoppingCartFacade();
  private readonly checkOutFacade: CheckOutFacade;
  constructor( client: Client ) {
    this.shoppingCart = this.shoppingCartFacade.buildShoppingCart( client );
    this.checkOutFacade = new CheckOutFacade( this.shoppingCart );
  }
  public readonly shoppingCart: ShoppingCart;

  public addLineItem( purchasedItem: LineItem ) {
    this.shoppingCart.lineItems.push( purchasedItem );
  }
  public removeLineItem( productName: string ) {
    this.shoppingCart.lineItems = this.shoppingCart.lineItems.filter(
      lineItem => lineItem.productName !== productName
    );
  }

  public loadFromStorage() {
    this.shoppingCartFacade.loadFromStorage( this.shoppingCart );
  }
  public saveToStorage() {
    this.shoppingCartFacade.saveToStorage( this.shoppingCart );
  }
  public calculateCheckOut( checkOut: CheckOut ) {
    this.shoppingCartFacade.setCheckOut( checkOut );
    this.calculateTotalAmount();
    this.checkOutFacade.calculateShippingCosts();
    this.checkOutFacade.applyPaymentMethodExtra( checkOut.paymentMethod );
    this.checkOutFacade.applyDiscount();
    this.shoppingCart.legalAmounts.taxes += this.checkOutFacade.calculateTotalTax();
    this.setInvoiceNumber();
    this.sendOrderToWarehouse();
    this.shoppingCartFacade.deleteFromStorage( this.shoppingCart );
  }

  public sendInvoiceToCustomer() {
    this.checkOutFacade.sendInvoice( this.shoppingCart );
  }

  private setInvoiceNumber() {
    const lastInvoiceNumber = this.shoppingCartFacade.readLastInvoiceNumber();
    this.shoppingCart.legalAmounts.invoiceNumber = lastInvoiceNumber + 1;
    this.shoppingCartFacade.writeLastInvoiceNumber( this.shoppingCart );
  }

  private calculateTotalAmount() {
    const warehouseAdministrator = new WarehouseAdministrator();
    this.shoppingCart.lineItems.forEach( line => {
      this.processLineItem( warehouseAdministrator, line );
    } );
  }

  private processLineItem( warehouseAdministrator: WarehouseAdministrator, line: LineItem ) {
    line.quantity = warehouseAdministrator.updatePurchasedProduct( line );
    line.amount = line.price * line.quantity;
    this.shoppingCart.legalAmounts.amount += line.amount;
    this.addTaxesByProduct( line );
  }

  private addTaxesByProduct( line: LineItem ) {
    line.taxes = this.checkOutFacade.calculateLineTax( line );
    this.shoppingCart.legalAmounts.taxes += line.taxes;
  }

  private sendOrderToWarehouse() {
    this.checkOutFacade.sendOrder( this.shoppingCart );
  }
}
