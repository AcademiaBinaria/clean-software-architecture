import { LOCAL_TAXES_TREE } from '../../3-infraestructure/database/config/local-taxes-tree';
import { Checker } from '../../3-infraestructure/helper/checker';
import { CountryTaxNode } from '../../3-infraestructure/models/country-tax-node';
import { RegionTaxNode } from '../../3-infraestructure/models/region-tax-node';
import { TaxBaseInfo } from '../../3-infraestructure/models/tax-base-info';

export class TaxCalculator {
  private static readonly decimalPlaces: number = 2;
  private static readonly taxExemptRegion: string = 'St Pierre';
  private static readonly localTaxesTree: CountryTaxNode[] = LOCAL_TAXES_TREE;
  private static readonly checker = new Checker();

  public static calculateTax( taxBaseInfo: TaxBaseInfo ): number {
    if ( TaxCalculator.isTaxExempt( taxBaseInfo ) ) {
      return 0;
    } else {
      return TaxCalculator.calculateLocalTax( taxBaseInfo );
    }
  }

  private static isTaxExempt( taxBaseInfo: TaxBaseInfo ): boolean {
    return (
      taxBaseInfo.isATaxFreeProduct === true ||
      taxBaseInfo.isStudent === true ||
      taxBaseInfo.region === TaxCalculator.taxExemptRegion
    );
  }

  private static calculateLocalTax( taxBaseInfo: TaxBaseInfo ): number {
    const localTax = TaxCalculator.getLocalVAT( taxBaseInfo );
    const baseTax = ( taxBaseInfo.base * localTax ) / 100;
    const roundedTax = baseTax.toFixed( TaxCalculator.decimalPlaces );
    return Number( roundedTax );
  }

  private static getLocalVAT( taxBaseInfo: TaxBaseInfo ): number {
    const countryTaxNode = TaxCalculator.checker.findSafe(
      TaxCalculator.localTaxesTree,
      ( countryTaxNode: CountryTaxNode ) => countryTaxNode.name === taxBaseInfo.country
    );
    return TaxCalculator.getCountryVAT( countryTaxNode, taxBaseInfo.region );
  }

  private static getCountryVAT( countryTaxNode: CountryTaxNode, regionName: string ): number {
    const regionTaxNode = TaxCalculator.checker.findSafe(
      TaxCalculator.localTaxesTree,
      ( regionTaxNode: RegionTaxNode ) => regionTaxNode.name === regionName,
      countryTaxNode
    );
    return regionTaxNode.localVAT;
  }
}
