export const services = [
  {
    id: 'inspection',
    title: 'Pre-Purchase Home Inspection',
    duration: '2 hr',
    price: '¥18,000',
    priceUSD: '$120',
    image: '/service-inspection.png',
    description:
      'Thorough on-site inspection of the property before you commit. We check structure, plumbing, electrical, and identify any hidden issues that could affect your investment.',
    features: [
      'On-site structural assessment',
      'Plumbing and electrical check',
      'Mold and moisture inspection',
      'Detailed written report',
      'Photo documentation',
    ],
    bookingType: 'book',
  },
  {
    id: 'management',
    title: 'Property Management',
    duration: '1 hr',
    price: 'Contact for pricing',
    priceUSD: '',
    image: '/service-management.png',
    description:
      'Full property management for absentee owners. We handle tenant relations, maintenance, repairs, and ensure your investment stays in top condition while you focus on other things.',
    features: [
      'Tenant screening and management',
      'Monthly property inspections',
      'Maintenance coordination',
      'Rent collection',
      'Financial reporting',
    ],
    bookingType: 'plans',
  },
  {
    id: 'consultation',
    title: 'Free Initial Consultation',
    duration: '45 min',
    price: 'Free',
    priceUSD: '',
    image: '/service-consultation.png',
    description:
      'Get personalized advice about investing in Japan real estate. We discuss your goals, budget, and the best opportunities for your situation.',
    features: [
      'Investment goal assessment',
      'Budget planning advice',
      'Area recommendations',
      'Q&A session',
      'No obligation',
    ],
    bookingType: 'book',
  },
];
