// Datos de tarjetas de crédito disponibles en México
export interface CreditCardTemplate {
  id: string;
  bank: string;
  name: string;
  type: 'classic' | 'gold' | 'platinum' | 'black' | 'infinite' | 'signature';
  annualInterestRate: number; // CAT (Costo Anual Total) aproximado
  moratoryInterestRate: number; // Tasa de interés moratorio anual
  minPaymentPercentage: number; // Porcentaje mínimo de pago
  paymentDays: number; // Días después de la fecha de corte para pagar sin intereses
  benefits: string[];
  annualFee: number; // Anualidad aproximada
}

export const CREDIT_CARD_TEMPLATES: CreditCardTemplate[] = [
  // BBVA
  {
    id: 'bbva_classic',
    bank: 'BBVA',
    name: 'Tarjeta Clásica',
    type: 'classic',
    annualInterestRate: 45.5,
    moratoryInterestRate: 75.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de protección de compras', 'Programa de recompensas'],
    annualFee: 0,
  },
  {
    id: 'bbva_oro',
    bank: 'BBVA',
    name: 'Tarjeta Oro',
    type: 'gold',
    annualInterestRate: 42.0,
    moratoryInterestRate: 72.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de viaje', 'Acceso a salas VIP', 'Programa de puntos'],
    annualFee: 1200,
  },
  {
    id: 'bbva_platinum',
    bank: 'BBVA',
    name: 'Tarjeta Platinum',
    type: 'platinum',
    annualInterestRate: 38.5,
    moratoryInterestRate: 68.5,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de viaje premium', 'Concierge', 'Puntos BBVA'],
    annualFee: 3500,
  },
  
  // Banamex
  {
    id: 'banamex_classic',
    bank: 'Citibanamex',
    name: 'Tarjeta Clásica',
    type: 'classic',
    annualInterestRate: 46.0,
    moratoryInterestRate: 76.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de compras', 'Programa de recompensas'],
    annualFee: 0,
  },
  {
    id: 'banamex_oro',
    bank: 'Citibanamex',
    name: 'Tarjeta Oro',
    type: 'gold',
    annualInterestRate: 43.0,
    moratoryInterestRate: 73.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de viaje', 'Acceso a salas VIP', 'Puntos Premia'],
    annualFee: 1500,
  },
  {
    id: 'banamex_platinum',
    bank: 'Citibanamex',
    name: 'Tarjeta Platinum',
    type: 'platinum',
    annualInterestRate: 39.5,
    moratoryInterestRate: 69.5,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro premium', 'Concierge', 'Puntos Premia'],
    annualFee: 4000,
  },
  {
    id: 'banamex_costco',
    bank: 'Citibanamex',
    name: 'Costco Banamex',
    type: 'gold',
    annualInterestRate: 61.9, // Tasa promedio ponderada anual
    moratoryInterestRate: 85.9, // CAT promedio sin IVA
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: [
      '5% reembolso en gasolineras Costco',
      '4% reembolso en educación',
      '3% reembolso en Costco México/EE.UU.',
      '2% reembolso en restaurantes y streaming',
      '1% reembolso en otros establecimientos',
      '2.3% ahorro adicional en Costco México',
      'Seguro de compras y viajes',
    ],
    annualFee: 450, // Primer año gratis, luego $450 + IVA
  },
  {
    id: 'banamex_joy',
    bank: 'Citibanamex',
    name: 'Joy Banamex',
    type: 'classic',
    annualInterestRate: 46.0, // Similar a tarjeta clásica
    moratoryInterestRate: 76.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: [
      'Sin anualidad',
      'Seguro de compras en línea',
      'Seguro de viajes',
      'Protección de compras',
    ],
    annualFee: 0, // Sin anualidad, pero $149/mes si no se usa al menos $300/mes
  },
  
  // Santander
  {
    id: 'santander_classic',
    bank: 'Santander',
    name: 'Tarjeta Clásica',
    type: 'classic',
    annualInterestRate: 47.0,
    moratoryInterestRate: 77.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de compras', 'Programa de puntos'],
    annualFee: 0,
  },
  {
    id: 'santander_oro',
    bank: 'Santander',
    name: 'Tarjeta Oro',
    type: 'gold',
    annualInterestRate: 44.0,
    moratoryInterestRate: 74.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de viaje', 'Puntos Santander'],
    annualFee: 1300,
  },
  {
    id: 'santander_platinum',
    bank: 'Santander',
    name: 'Tarjeta Platinum',
    type: 'platinum',
    annualInterestRate: 40.0,
    moratoryInterestRate: 70.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro premium', 'Concierge', 'Puntos Santander'],
    annualFee: 3800,
  },
  
  // HSBC
  {
    id: 'hsbc_classic',
    bank: 'HSBC',
    name: 'Tarjeta Clásica',
    type: 'classic',
    annualInterestRate: 46.5,
    moratoryInterestRate: 76.5,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de compras', 'Programa de recompensas'],
    annualFee: 0,
  },
  {
    id: 'hsbc_oro',
    bank: 'HSBC',
    name: 'Tarjeta Oro',
    type: 'gold',
    annualInterestRate: 43.5,
    moratoryInterestRate: 73.5,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de viaje', 'Puntos HSBC'],
    annualFee: 1400,
  },
  {
    id: 'hsbc_platinum',
    bank: 'HSBC',
    name: 'Tarjeta Platinum',
    type: 'platinum',
    annualInterestRate: 39.0,
    moratoryInterestRate: 69.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro premium', 'Concierge', 'Puntos HSBC'],
    annualFee: 3900,
  },
  {
    id: 'hsbc_zero',
    bank: 'HSBC',
    name: 'HSBC Zero',
    type: 'classic',
    annualInterestRate: 76.8, // CAT promedio
    moratoryInterestRate: 76.8,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: [
      'Sin anualidad (si se usa al menos 1 vez al mes)',
      'Sin comisión por disposición de efectivo',
      'Sin comisión por reposición',
      'Promociones exclusivas',
      'Meses sin intereses en establecimientos participantes',
    ],
    annualFee: 0, // Sin anualidad, pero $99/mes si no se usa al menos 1 vez al mes
  },
  {
    id: 'hsbc_2now',
    bank: 'HSBC',
    name: 'HSBC 2Now',
    type: 'gold',
    annualInterestRate: 91.6, // CAT promedio
    moratoryInterestRate: 91.6,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: [
      '2% reembolso en todas las compras',
      'Saldo HSBC 2Now acreditado en la tarjeta',
      '3 meses sin intereses automáticos en compras mayores a $3,000',
      'Seguro de compras y viajes',
      'Promociones exclusivas',
    ],
    annualFee: 0, // Sin anualidad si se gastan al menos $2,500/mes, sino $186 + IVA mensual
  },
  
  // Scotiabank
  {
    id: 'scotiabank_classic',
    bank: 'Scotiabank',
    name: 'Tarjeta Clásica',
    type: 'classic',
    annualInterestRate: 47.5,
    moratoryInterestRate: 77.5,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de compras', 'Programa de puntos'],
    annualFee: 0,
  },
  {
    id: 'scotiabank_oro',
    bank: 'Scotiabank',
    name: 'Tarjeta Oro',
    type: 'gold',
    annualInterestRate: 44.5,
    moratoryInterestRate: 74.5,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Seguro de viaje', 'Puntos Scotia'],
    annualFee: 1350,
  },
  
  // American Express
  {
    id: 'amex_green',
    bank: 'American Express',
    name: 'Tarjeta Verde',
    type: 'classic',
    annualInterestRate: 45.0,
    moratoryInterestRate: 75.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Puntos Membership Rewards', 'Seguro de viaje'],
    annualFee: 2500,
  },
  {
    id: 'amex_gold',
    bank: 'American Express',
    name: 'Tarjeta Dorada',
    type: 'gold',
    annualInterestRate: 42.5,
    moratoryInterestRate: 72.5,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Puntos Membership Rewards', 'Acceso a salas VIP', 'Concierge'],
    annualFee: 5500,
  },
  {
    id: 'amex_platinum',
    bank: 'American Express',
    name: 'Tarjeta Platinum',
    type: 'platinum',
    annualInterestRate: 38.0,
    moratoryInterestRate: 68.0,
    minPaymentPercentage: 5,
    paymentDays: 20,
    benefits: ['Puntos Membership Rewards', 'Concierge premium', 'Acceso a salas VIP'],
    annualFee: 12000,
  },
];

export const getCreditCardTemplate = (id: string): CreditCardTemplate | undefined => {
  return CREDIT_CARD_TEMPLATES.find(template => template.id === id);
};

export const getCreditCardsByBank = (bank: string): CreditCardTemplate[] => {
  return CREDIT_CARD_TEMPLATES.filter(template => template.bank === bank);
};

export const getBanks = (): string[] => {
  return Array.from(new Set(CREDIT_CARD_TEMPLATES.map(template => template.bank)));
};
