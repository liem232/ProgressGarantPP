export const mockProducts = [
  // Кальяны
  {
    id: '1',
    name: 'Кальян Alpha Hookah Model X',
    price: 15900,
    image: '/img/КальянAlphaHookahModelX.jpeg',
    category: 'Кальяны',
    description: 'Премиальный кальян с уникальным дизайном',
    inStock: true,
    brand: 'Alpha Hookah',
    volume: 'Средний',
    quantity: 5
    
  },
  {
    id: '2',
    name: 'Кальян SoftSmoke Glass',
    price: 12400,
    image: '/img/КальянVaporSmokyGlass.jpeg',
    category: 'Кальяны',
    description: 'Стеклянный кальян с прозрачной колбой',
    inStock: true,
    brand: 'SoftSmoke',
    volume: 'Большой',
    quantity: 8
  },

  // Табак
  {
    id: '3',
    name: 'Табак Adalya Double Apple',
    price: 890,
    image: '/img/ТабакAdalyaDoubleApple.jpeg',
    category: 'Табак',
    description: 'Классический вкус двойного яблока',
    inStock: true,
    brand: 'Adalya',
    volume: '50г',
    strength: 'Средняя',
    quantity: 25
  },
  {
    id: '4',
    name: 'Табак Darkside Medium Generis Banana',
    price: 1250,
    image: '/img/ТабакDarksideMediumGenerisBanana.jpeg',
    category: 'Табак',
    description: 'Насыщенный банановый вкус',
    inStock: true,
    brand: 'Darkside',
    volume: '30г',
    strength: 'Средняя',
    quantity: 15
  },

  // Бестабачные смеси
  {
    id: '5',
    name: 'БКС с ароматом Blackberry',
    price: 650,
    image: '/img/СмесьTeaMixEarlGrey.jpeg',
    category: 'Бестабачные смеси',
    description: 'Бестабачная смесь со вкусом ежевики',
    inStock: false,
    brand: 'MustHave',
    volume: '50г',
    strength: 'Высокая',
    quantity: 0
  },
  {
    id: '6',
    name: 'БКС: Тропический смузи',
    price: 720,
    image: '/img/СмесьFruitMixTropical.jpeg',
    category: 'Бестабачные смеси',
    description: 'Бестабачная смесь с тропическими фруктами',
    inStock: true,
    brand: 'Brusko',
    volume: '50г',
    strength: 'Средняя',
    quantity: 20
  },

  // Электронные сигареты
  {
    id: '7',
    name: 'Split S Банан',
    price: 450,
    image: '/img/JUULPodMint.jpeg',
    category: 'Электронные сигареты',
    description: 'Одноразовая электронная сигарета со вкусом банана',
    inStock: true,
    brand: 'Brusko&LANAVAPE',
    volume: '1.5мл',
    quantity: 50
  },
  {
    id: '8',
    name: 'Split L 5000 Арбуз',
    price: 590,
    image: '/img/IQOSHeetsAmber.jpeg',
    category: 'Электронные сигареты',
    description: 'Одноразовая электронная сигарета со вкусом арбуза',
    inStock: true,
    brand: 'Brusko&LANAVAPE',
    volume: '4.5мл',
    quantity: 40
  },

  // Аксессуары
  {
    id: '9',
    name: 'Щипцы для угля',
    price: 890,
    image: '/img/ЩипцыдляугляPremium.jpeg',
    category: 'Аксессуары',
    description: 'Качественные щипцы из нержавеющей стали',
    inStock: true,
    brand: 'Hornet',
    quantity: 35
  },
  {
    id: '10',
    name: 'Уголь кокосовый Cocoloco 25мм',
    price: 1200,
    image: '/img/УголькокосовыйTomCocoGold.jpeg',
    category: 'Аксессуары',
    description: 'Натуральный кокосовый уголь премиум качества',
    inStock: true,
    brand: 'Cocoloco',
    volume: '300гр',
    quantity: 60
  },

  // Дополнительные товары для каталога
  {
    id: '11',
    name: 'Кальян Hoob Atom',
    price: 8900,
    image: '/img/КальянHoobAtom.jpeg',
    category: 'Кальяны',
    description: 'Компактный дорожный кальян',
    inStock: true,
    brand: 'Hoob',
    volume: 'Малый',
    quantity: 12
  },
  {
    id: '12',
    name: 'Табак для кальяна Tropic Jack',
    price: 950,
    image: '/img/ТабакSerbetliIceLemon.jpeg',
    category: 'Табак',
    description: 'Табак с ароматом Спелый Джекфрут',
    inStock: true,
    brand: 'BlackBurn',
    volume: '35г',
    strength: 'Средняя',
    quantity: 18
  }
];

export const categories = [
  'Все товары',
  'Кальяны', 
  'Табак',
  'Бестабачные смеси',
  'Электронные сигареты',
  'Аксессуары'
];

export const brands = [
  'Все бренды',
  'Alpha Hookah',
  'BlackBurn',
  'Adalya',
  'Darkside',
  'Hoob',
  'Cocoloco',
  'Brusko&LANAVAPE',
  'Hornet',
  'Brusko',
  'SoftSmoke',
  'MustHave'
];