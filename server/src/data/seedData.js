export const initialCategories = [
  {
    id: 'cat-1',
    name: 'Royal Bridal Lehengas',
    slug: 'bridal-lehengas',
    description: 'Handcrafted zari, velvet, and raw silk bridal couture collections',
    featured: true,
    itemCount: 4,
  },
  {
    id: 'cat-2',
    name: 'Heritage Silk Sarees',
    slug: 'heritage-silk-sarees',
    description: 'Pure Kanjivaram, Banarasi, and Paithani handwoven silks',
    featured: true,
    itemCount: 4,
  },
  {
    id: 'cat-3',
    name: 'Kundan & Polki Jewellery',
    slug: 'jewellery',
    description: 'Artisanal 22K gold-plated Kundan, Polki, and Jadau ornaments',
    featured: true,
    itemCount: 4,
  },
  {
    id: 'cat-4',
    name: 'Designer Sherwanis & Kurta Sets',
    slug: 'menswear',
    description: 'Bespoke hand-embroidered royal grooms wear and festive attire',
    featured: false,
    itemCount: 2,
  },
];

export const initialProducts = [
  {
    id: 'prod-1',
    name: 'Noor-E-Chashm Crimson Bridal Lehenga',
    slug: 'noor-e-chashm-crimson-bridal-lehenga',
    category: 'bridal-lehengas',
    categoryId: 'cat-1',
    price: 185000,
    discountPrice: 165000,
    inStock: true,
    stockCount: 5,
    rating: 4.95,
    reviewCount: 38,
    featured: true,
    isNew: true,
    sku: 'SHR-LEH-001',
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Heavy crimson velvet lehenga intricately detailed with antique gold zardozi, dabka, and nakshi embroidery with double dupatta.',
    tags: ['bridal', 'lehenga', 'crimson', 'zardozi', 'velvet'],
    specs: {
      fabric: 'Micro Velvet & Organza Dupattas',
      work: 'Handcrafted Zardozi, Gota Patti, French Knots',
      care: 'Strictly Dry Clean Only',
      deliveryTime: '7-10 Business Days',
    },
  },
  {
    id: 'prod-2',
    name: 'Padmavati Rose Gold Banarasi Silk Saree',
    slug: 'padmavati-rose-gold-banarasi-silk-saree',
    category: 'heritage-silk-sarees',
    categoryId: 'cat-2',
    price: 54000,
    discountPrice: 48500,
    inStock: true,
    stockCount: 12,
    rating: 4.9,
    reviewCount: 54,
    featured: true,
    isNew: false,
    sku: 'SHR-SAR-002',
    images: [
      'https://images.unsplash.com/photo-1610030469668-93510cb67655?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Pure Katan silk Banarasi saree woven with delicate rose-gold real zari floral kadwa jaal motifs and intricate pallu.',
    tags: ['saree', 'banarasi', 'katan silk', 'rose gold'],
    specs: {
      fabric: 'Pure 100% Katan Silk with Silk Mark',
      weave: 'Handwoven Kadwa Jaal',
      blousePiece: 'Included (Unstitched 80cm matching)',
    },
  },
  {
    id: 'prod-3',
    name: 'Navratna Royal Heritage Polki Choker Set',
    slug: 'navratna-royal-heritage-polki-choker-set',
    category: 'jewellery',
    categoryId: 'cat-3',
    price: 76000,
    discountPrice: 69999,
    inStock: true,
    stockCount: 8,
    rating: 5.0,
    reviewCount: 29,
    featured: true,
    isNew: true,
    sku: 'SHR-JWL-003',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Heritage Jadau Polki choker adorned with certified natural gemstones, cultured pearls, and meenakari enamel work.',
    tags: ['jewellery', 'choker', 'polki', 'kundan', 'navratna'],
    specs: {
      material: 'Silver-Alloy base with 22K Antique Micron Gold Plating',
      stones: 'Uncut Polki Crystals, Ruby & Emerald drop beads',
      closure: 'Adjustable Dori with Handcrafted Tassels',
    },
  },
  {
    id: 'prod-4',
    name: 'Mehrunissa Ivory & Gold Silk Sherwani',
    slug: 'mehrunissa-ivory-gold-silk-sherwani',
    category: 'menswear',
    categoryId: 'cat-4',
    price: 95000,
    discountPrice: 87500,
    inStock: true,
    stockCount: 4,
    rating: 4.88,
    reviewCount: 19,
    featured: false,
    isNew: false,
    sku: 'SHR-MEN-004',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Bespoke raw silk sherwani handcrafted with subtle ton-sur-ton thread work, antique buttons, and tailored churidar.',
    tags: ['sherwani', 'groom', 'menswear', 'raw silk'],
    specs: {
      fabric: 'Raw Silk Outer with Silk Cotton Lining',
      setIncludes: 'Sherwani jacket, inner kurta, churidar, safa stole',
    },
  },
];

export const initialProjects = [
  {
    id: 'proj-1',
    name: 'Gandhidham Central Business & Tagore Corridor',
    slug: 'gandhidham-central-business-tagore-corridor',
    description: 'Premier commercial district covering Tagore Road, Sector 8, DC-5, and Oslo Circle in Gandhidham.',
    address: 'Tagore Road & Central Business District',
    city: 'Gandhidham',
    district: 'Kutch',
    state: 'Gujarat',
    status: 'active',
    latitude: 23.0753,
    longitude: 70.1337,
    boundaryGeometry: {
      type: 'Polygon',
      coordinates: [
        [
          [70.125, 23.070],
          [70.145, 23.070],
          [70.145, 23.085],
          [70.125, 23.085],
          [70.125, 23.070]
        ]
      ]
    },
    gallery: [
      '/images/commercial-tower.jpg',
      '/images/executive-office.jpg',
      '/images/market-shop.jpg'
    ],
    publicationState: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'proj-2',
    name: 'Adipur Smart Township & Ward 5 Commercial Zone',
    slug: 'adipur-smart-township-ward-5',
    description: 'Commercial high-street, retail showrooms and educational corridor in Adipur township.',
    address: 'Station Road & Ward 5A/5B',
    city: 'Adipur',
    district: 'Kutch',
    state: 'Gujarat',
    status: 'active',
    latitude: 23.0827,
    longitude: 70.0988,
    boundaryGeometry: {
      type: 'Polygon',
      coordinates: [
        [
          [70.090, 23.075],
          [70.110, 23.075],
          [70.110, 23.090],
          [70.090, 23.090],
          [70.090, 23.075]
        ]
      ]
    },
    gallery: [
      '/images/retail-showroom.jpg'
    ],
    publicationState: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'proj-3',
    name: 'Kandla Maritime Logistics & Industrial Park',
    slug: 'kandla-maritime-logistics-industrial-park',
    description: 'Heavy logistics, container warehousing, and industrial NA land parcels adjacent to Deendayal Port.',
    address: 'NH-41 & Kandla Port Industrial Zone',
    city: 'Gandhidham',
    district: 'Kutch',
    state: 'Gujarat',
    status: 'active',
    latitude: 23.0125,
    longitude: 70.2185,
    boundaryGeometry: {
      type: 'Polygon',
      coordinates: [
        [
          [70.200, 23.000],
          [70.235, 23.000],
          [70.235, 23.025],
          [70.200, 23.025],
          [70.200, 23.000]
        ]
      ]
    },
    gallery: [
      '/images/industrial-logistics.jpg',
      '/images/commercial-plot.jpg'
    ],
    publicationState: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const initialPlots = [
  {
    id: 'plot-1',
    projectId: 'proj-1',
    plotNumber: 'OFC-102',
    sectorWard: 'Tagore Road Commercial Complex',
    category: 'Corporate Office',
    area: 1200,
    areaUnit: 'Sq.Ft',
    price: 35000,
    pricingType: 'lease',
    availabilityStatus: 'available',
    surveyedBoundaryGeometry: {
      type: 'Polygon',
      coordinates: [[[70.132, 23.074], [70.134, 23.074], [70.134, 23.076], [70.132, 23.076], [70.132, 23.074]]]
    },
    dimensions: { frontage: '30 ft', depth: '40 ft' },
    reraApproved: true,
    titleStatus: '100% Clear Title (7/12 & 8A)',
    features: [
      'Private executive cabin & glass conference room',
      '100% generator power backup & high-speed lift',
      'Attached pantry & dedicated covered parking'
    ],
    imageUrl: '/images/executive-office.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plot-2',
    projectId: 'proj-1',
    plotNumber: 'SHP-805',
    sectorWard: 'Sector 8 Market',
    category: 'Market Shop',
    area: 850,
    areaUnit: 'Sq.Ft',
    price: 28000,
    pricingType: 'lease',
    availabilityStatus: 'available',
    surveyedBoundaryGeometry: {
      type: 'Polygon',
      coordinates: [[[70.130, 23.072], [70.132, 23.072], [70.132, 23.073], [70.130, 23.073], [70.130, 23.072]]]
    },
    dimensions: { frontage: '25 ft', depth: '34 ft' },
    reraApproved: true,
    titleStatus: 'High Footfall Market Zone',
    features: [
      'Prime pedestrian market corner with dense daily footfall',
      'Ideal for branded apparel, electronics, pharmacy, or café',
      '11-month or multi-year registered lease option'
    ],
    imageUrl: '/images/market-shop.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plot-3',
    projectId: 'proj-2',
    plotNumber: 'SHW-501',
    sectorWard: 'Station Road, Adipur',
    category: 'High-Street Showroom',
    area: 1500,
    areaUnit: 'Sq.Ft',
    price: 65000,
    pricingType: 'lease',
    availabilityStatus: 'available',
    surveyedBoundaryGeometry: {
      type: 'Polygon',
      coordinates: [[[70.098, 23.082], [70.100, 23.082], [70.100, 23.084], [70.098, 23.084], [70.098, 23.082]]]
    },
    dimensions: { frontage: '35 ft', depth: '42.8 ft' },
    reraApproved: true,
    titleStatus: '100% Clear Commercial Approval',
    features: [
      'Corner showroom position with maximum road visibility',
      'Full mezzanine floor for inventory stock or admin room',
      'Perfect for jewelry, fashion flagship, or luxury retail'
    ],
    imageUrl: '/images/retail-showroom.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plot-4',
    projectId: 'proj-3',
    plotNumber: 'PLT-NH41',
    sectorWard: 'NH-41 Commercial Corridor',
    category: 'Commercial Plot',
    area: 2500,
    areaUnit: 'Sq.Ft',
    price: 45000,
    pricingType: 'lease',
    availabilityStatus: 'available',
    surveyedBoundaryGeometry: {
      type: 'Polygon',
      coordinates: [[[70.210, 23.010], [70.215, 23.010], [70.215, 23.015], [70.210, 23.015], [70.210, 23.010]]]
    },
    dimensions: { frontage: '50 ft', depth: '50 ft' },
    reraApproved: true,
    titleStatus: '100% Clear NA Commercial',
    features: [
      'Wide highway frontage with heavy inter-city vehicle flow',
      'Fully leveled ground with surveyor boundary demarcation',
      'Available on long-term 5 to 10-year registered lease deed'
    ],
    imageUrl: '/images/commercial-plot.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plot-5',
    projectId: 'proj-3',
    plotNumber: 'WHS-KND-09',
    sectorWard: 'Kandla Port Industrial Corridor',
    category: 'Logistics Warehouse',
    area: 25000,
    areaUnit: 'Sq.Ft',
    price: 350000,
    pricingType: 'lease',
    availabilityStatus: 'available',
    surveyedBoundaryGeometry: {
      type: 'Polygon',
      coordinates: [[[70.220, 23.015], [70.230, 23.015], [70.230, 23.025], [70.220, 23.025], [70.220, 23.015]]]
    },
    dimensions: { frontage: '150 ft', depth: '166.6 ft' },
    reraApproved: true,
    titleStatus: 'GIDC & Port Authority Approved',
    features: [
      'Seamless container trailer turn-around and concrete apron',
      'Rooftop solar net-metering & 24/7 security boundary',
      '5 mins from Deendayal Port cargo gates & railway sidings'
    ],
    imageUrl: '/images/industrial-logistics.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plot-6',
    projectId: 'proj-1',
    plotNumber: 'HGH-1201',
    sectorWard: 'Central Business District, Gandhidham',
    category: 'Corporate Office',
    area: 3500,
    areaUnit: 'Sq.Ft',
    price: 120000,
    pricingType: 'lease',
    availabilityStatus: 'available',
    surveyedBoundaryGeometry: {
      type: 'Polygon',
      coordinates: [[[70.135, 23.076], [70.140, 23.076], [70.140, 23.080], [70.135, 23.080], [70.135, 23.076]]]
    },
    dimensions: { frontage: '60 ft', depth: '58.3 ft' },
    reraApproved: true,
    titleStatus: '100% Clear Title',
    features: [
      '360-degree panoramic skyline view of Gandhidham',
      '3 MD cabins, boardroom, reception lobby & server room',
      'Ideal for shipping lines, customs broking, and tech firms'
    ],
    imageUrl: '/images/commercial-tower.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const initialMapAssets = [
  {
    id: 'asset-1',
    projectId: 'proj-1',
    assetType: 'master_plan_pdf',
    storageKey: 'MASTER-PLAN.pdf',
    url: '/MASTER-PLAN.pdf',
    format: 'pdf',
    fileSizeBytes: 1406037,
    coordinateReferenceSystem: 'EPSG:4326',
    version: '1.0',
    publicationStatus: 'published',
    createdAt: new Date().toISOString()
  },
  {
    id: 'asset-2',
    projectId: 'proj-2',
    assetType: '2d_svg',
    storageKey: 'adipur/3d-map/fills.svg',
    url: '/adipur/3d-map/fills.svg',
    format: 'svg',
    fileSizeBytes: 245000,
    coordinateReferenceSystem: 'EPSG:4326',
    version: '1.0',
    publicationStatus: 'published',
    createdAt: new Date().toISOString()
  }
];

