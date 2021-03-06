import { LineItem } from '../../3-infrastructure/models/line-item';
import { ShoppingCart } from '../../3-infrastructure/models/shopping-cart';
import { TaxBaseInfo } from '../../3-infrastructure/models/tax-base-info';
import { CheckOutCalculator } from './check-out-calculator';
import { InvoiceManager } from './invoice-manager';
import { OrderManager } from './order-manager';
import { TaxBaseInfoAdapter } from './tax-base-info-adapter';
import { TaxCalculator } from './tax-calculator';

export class CheckOutFacade {
  private readonly checkOutCalculator: CheckOutCalculator;

  constructor( private shoppingCart: ShoppingCart ) {
    this.checkOutCalculator = new CheckOutCalculator( shoppingCart );
  }
  public calculateShippingCosts() {
    this.checkOutCalculator.calculateShippingCosts();
  }
  public applyPaymentMethodExtra( payment: string ) {
    this.checkOutCalculator.applyPaymentMethodExtra( payment );
  }
  public applyDiscount() {
    this.checkOutCalculator.applyDiscount();
  }
  public calculateTotalTax(): number {
    const totalTaxInfo: TaxBaseInfo = new TaxBaseInfoAdapter(
      this.shoppingCart.client
    ).getFromFromLegalAmount( this.shoppingCart.legalAmounts );
    return TaxCalculator.calculateTax( totalTaxInfo );
  }
  public calculateLineTax( line: LineItem ): number {
    const lineTaxInfo: TaxBaseInfo = new TaxBaseInfoAdapter(
      this.shoppingCart.client
    ).getFromFromLineItem( line );
    return TaxCalculator.calculateTax( lineTaxInfo );
  }
  public sendInvoice( shoppingCart: ShoppingCart ) {
    const invoiceManager = new InvoiceManager();
    invoiceManager.send( shoppingCart );
  }
  public sendOrder( shoppingCart: ShoppingCart ) {
    const orderManager = new OrderManager();
    orderManager.send( shoppingCart );
  }
}
