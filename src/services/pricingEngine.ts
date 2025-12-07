import type { CommonService, EstimateLineItem } from '../types/models';

interface PartsPrice {
  part_number: string;
  description: string;
  price: number;
  supplier?: string;
  markup_percentage?: number;
}

interface LaborRate {
  category: string;
  hourly_rate: number;
  minimum_charge?: number;
}

class PricingEngineService {
  // Default labor rates (can be customized per shop)
  private defaultLaborRates: LaborRate[] = [
    { category: 'diagnostic', hourly_rate: 125, minimum_charge: 100 },
    { category: 'general', hourly_rate: 110 },
    { category: 'electrical', hourly_rate: 135 },
    { category: 'engine', hourly_rate: 120 },
    { category: 'transmission', hourly_rate: 125 },
    { category: 'brake', hourly_rate: 100 },
    { category: 'suspension', hourly_rate: 115 },
  ];

  // Common parts database (expandable)
  private commonParts: PartsPrice[] = [
    // Oil & Filters
    { part_number: 'OF-001', description: 'Engine Oil Filter', price: 12.50, supplier: 'ACDelco', markup_percentage: 40 },
    { part_number: 'OL-001', description: 'Conventional Motor Oil (5qt)', price: 24.99, supplier: 'Valvoline', markup_percentage: 35 },
    { part_number: 'OL-002', description: 'Full Synthetic Motor Oil (5qt)', price: 44.99, supplier: 'Mobil 1', markup_percentage: 35 },

    // Brake Components
    { part_number: 'BP-001', description: 'Front Brake Pads (Set)', price: 45.00, supplier: 'Wagner', markup_percentage: 50 },
    { part_number: 'BP-002', description: 'Rear Brake Pads (Set)', price: 38.00, supplier: 'Wagner', markup_percentage: 50 },
    { part_number: 'BR-001', description: 'Front Brake Rotor', price: 65.00, supplier: 'ACDelco', markup_percentage: 45 },
    { part_number: 'BR-002', description: 'Rear Brake Rotor', price: 55.00, supplier: 'ACDelco', markup_percentage: 45 },
    { part_number: 'BF-001', description: 'Brake Fluid (DOT 3)', price: 8.99, supplier: 'Prestone', markup_percentage: 60 },

    // Air & Cabin Filters
    { part_number: 'AF-001', description: 'Engine Air Filter', price: 18.50, supplier: 'K&N', markup_percentage: 45 },
    { part_number: 'CF-001', description: 'Cabin Air Filter', price: 22.00, supplier: 'FRAM', markup_percentage: 45 },

    // Belts & Hoses
    { part_number: 'BL-001', description: 'Serpentine Belt', price: 28.00, supplier: 'Gates', markup_percentage: 50 },
    { part_number: 'HS-001', description: 'Upper Radiator Hose', price: 35.00, supplier: 'Gates', markup_percentage: 45 },
    { part_number: 'HS-002', description: 'Lower Radiator Hose', price: 32.00, supplier: 'Gates', markup_percentage: 45 },

    // Spark Plugs & Ignition
    { part_number: 'SP-001', description: 'Spark Plug (Standard)', price: 4.50, supplier: 'NGK', markup_percentage: 60 },
    { part_number: 'SP-002', description: 'Spark Plug (Iridium)', price: 12.00, supplier: 'NGK', markup_percentage: 50 },
    { part_number: 'IC-001', description: 'Ignition Coil', price: 85.00, supplier: 'Delphi', markup_percentage: 40 },

    // Fluids
    { part_number: 'FL-001', description: 'Transmission Fluid (1qt)', price: 11.99, supplier: 'Valvoline', markup_percentage: 50 },
    { part_number: 'FL-002', description: 'Coolant (1gal)', price: 14.99, supplier: 'Prestone', markup_percentage: 40 },
    { part_number: 'FL-003', description: 'Power Steering Fluid', price: 8.99, supplier: 'Lucas', markup_percentage: 50 },
  ];

  getLaborRate(category: string = 'general'): LaborRate {
    return this.defaultLaborRates.find(rate => rate.category === category) || this.defaultLaborRates[1];
  }

  searchParts(query: string): PartsPrice[] {
    const searchTerm = query.toLowerCase();
    return this.commonParts.filter(part =>
      part.description.toLowerCase().includes(searchTerm) ||
      part.part_number.toLowerCase().includes(searchTerm)
    );
  }

  getPartPrice(partNumber: string): PartsPrice | null {
    return this.commonParts.find(part => part.part_number === partNumber) || null;
  }

  calculatePartPrice(costPrice: number, markupPercentage: number = 40): number {
    return Math.round((costPrice * (1 + markupPercentage / 100)) * 100) / 100;
  }

  calculateLaborCost(hours: number, category: string = 'general'): number {
    const laborRate = this.getLaborRate(category);
    const cost = hours * laborRate.hourly_rate;

    // Apply minimum charge if specified
    if (laborRate.minimum_charge && cost < laborRate.minimum_charge) {
      return laborRate.minimum_charge;
    }

    return Math.round(cost * 100) / 100;
  }

  createServiceLineItem(service: CommonService): EstimateLineItem {
    const laborCost = this.calculateLaborCost(service.labor_hours || 0);

    return {
      id: `service_${service.id}`,
      type: 'service',
      description: service.name,
      quantity: 1,
      unit_price: service.base_price || laborCost,
      total_price: service.base_price || laborCost,
      notes: service.description,
    };
  }

  createPartLineItem(partNumber: string, quantity: number = 1, customPrice?: number): EstimateLineItem | null {
    const part = this.getPartPrice(partNumber);
    if (!part) return null;

    const unitPrice = customPrice || this.calculatePartPrice(part.price, part.markup_percentage);
    const totalPrice = unitPrice * quantity;

    return {
      id: `part_${partNumber}_${Date.now()}`,
      type: 'part',
      description: part.description,
      part_number: partNumber,
      quantity,
      unit_price: unitPrice,
      total_price: Math.round(totalPrice * 100) / 100,
      supplier: part.supplier,
    };
  }

  createLaborLineItem(description: string, hours: number, category: string = 'general'): EstimateLineItem {
    const laborRate = this.getLaborRate(category);
    const totalPrice = this.calculateLaborCost(hours, category);

    return {
      id: `labor_${Date.now()}`,
      type: 'labor',
      description,
      quantity: hours,
      unit_price: laborRate.hourly_rate,
      total_price: totalPrice,
      notes: `${hours} hrs @ $${laborRate.hourly_rate}/hr`,
    };
  }

  calculateEstimateTotal(lineItems: EstimateLineItem[]): {
    subtotal: number;
    tax: number;
    total: number;
    laborTotal: number;
    partsTotal: number;
    servicesTotal: number;
  } {
    let laborTotal = 0;
    let partsTotal = 0;
    let servicesTotal = 0;

    lineItems.forEach(item => {
      switch (item.type) {
        case 'labor':
          laborTotal += item.total_price;
          break;
        case 'part':
          partsTotal += item.total_price;
          break;
        case 'service':
          servicesTotal += item.total_price;
          break;
      }
    });

    const subtotal = laborTotal + partsTotal + servicesTotal;
    const tax = Math.round(subtotal * 0.0875 * 100) / 100; // 8.75% tax rate (configurable)
    const total = subtotal + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total: Math.round(total * 100) / 100,
      laborTotal: Math.round(laborTotal * 100) / 100,
      partsTotal: Math.round(partsTotal * 100) / 100,
      servicesTotal: Math.round(servicesTotal * 100) / 100,
    };
  }

  // Generate estimate templates for common services
  getEstimateTemplate(serviceType: string): EstimateLineItem[] {
    const templates: { [key: string]: () => EstimateLineItem[] } = {
      'oil-change': () => [
        this.createPartLineItem('OL-001')!,
        this.createPartLineItem('OF-001')!,
        this.createLaborLineItem('Oil Change Service', 0.5, 'general'),
      ],

      'brake-pads-front': () => [
        this.createPartLineItem('BP-001')!,
        this.createLaborLineItem('Front Brake Pad Installation', 1.5, 'brake'),
      ],

      'brake-pads-rear': () => [
        this.createPartLineItem('BP-002')!,
        this.createLaborLineItem('Rear Brake Pad Installation', 1.0, 'brake'),
      ],

      'diagnostic': () => [
        this.createLaborLineItem('Vehicle Diagnostic', 1.0, 'diagnostic'),
      ],

      'tune-up-basic': () => [
        this.createPartLineItem('SP-001', 4)!,
        this.createPartLineItem('AF-001')!,
        this.createPartLineItem('OF-001')!,
        this.createPartLineItem('OL-002')!,
        this.createLaborLineItem('Basic Tune-up Service', 2.0, 'engine'),
      ],
    };

    const template = templates[serviceType];
    return template ? template() : [];
  }

  // Add custom part (for parts not in database)
  addCustomPart(description: string, partNumber: string, cost: number, markup: number = 40): EstimateLineItem {
    const unitPrice = this.calculatePartPrice(cost, markup);

    return {
      id: `custom_${partNumber}_${Date.now()}`,
      type: 'part',
      description,
      part_number: partNumber,
      quantity: 1,
      unit_price: unitPrice,
      total_price: unitPrice,
      notes: 'Custom part - pricing verified',
    };
  }
}

export default new PricingEngineService();