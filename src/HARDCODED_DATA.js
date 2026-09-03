// HARDCODED DATA - INVENTORY FROM PAPER RECORDS
// DATE: 06 AUG 2026

export const HARDCODED_INVENTORY = [
  // Broths & Sauces
  { name: 'Tonkatsu Broth', quantity: 3.5, unit: 'liters', unitPrice: 150, category: 'Broth' },
  { name: 'Curry Sauce', quantity: 450, unit: 'ml', unitPrice: 80, category: 'Broth' },
  { name: 'Miso Paste', quantity: 50, unit: 'ml', unitPrice: 100, category: 'Broth' },
  { name: 'Shoyu Sauce', quantity: 6, unit: 'liters', unitPrice: 120, category: 'Broth' },
  { name: 'Noodle Sauce', quantity: 1, unit: 'liters', unitPrice: 200, category: 'Broth' },
  { name: 'Gyoza Sauce', quantity: 450, unit: 'ml', unitPrice: 90, category: 'Broth' },

  // Noodles
  { name: 'Ramen Noodles', quantity: 0.6, unit: 'kg', unitPrice: 500, category: 'Noodles' },
  { name: 'Yakisoba', quantity: 4, unit: 'kg', unitPrice: 400, category: 'Noodles' },

  // Proteins & Toppings
  { name: 'Gyoza', quantity: 450, unit: 'pcs', unitPrice: 2, category: 'Proteins' },
  { name: 'Eggs/Tamago', quantity: 6, unit: 'pcs', unitPrice: 30, category: 'Proteins' },
  { name: 'Chashu Bits', quantity: 0, unit: 'g', unitPrice: 50, category: 'Proteins' },
  { name: 'Chashu Pork', quantity: 13, unit: 'kg', unitPrice: 800, category: 'Proteins' },

  // Vegetables
  { name: 'Black Garlic', quantity: 630, unit: 'g', unitPrice: 15, category: 'Vegetables' },
  { name: 'Seaweeds Strip Nori', quantity: 140, unit: 'g', unitPrice: 50, category: 'Vegetables' },
  { name: 'Black Fungus/Kikurage', quantity: 350, unit: 'g', unitPrice: 20, category: 'Vegetables' },
  { name: 'Wakame Seaweeds', quantity: 930, unit: 'g', unitPrice: 10, category: 'Vegetables' },
  { name: 'Black Sesame Seeds', quantity: 180, unit: 'g', unitPrice: 25, category: 'Vegetables' },

  // Spices & Oils
  { name: 'Vegetable Oil', quantity: 700, unit: 'ml', unitPrice: 80, category: 'Spices' },
  { name: 'Sesame Oil', quantity: 115, unit: 'ml', unitPrice: 200, category: 'Spices' },
  { name: 'Capsaicin', quantity: 500, unit: 'g', unitPrice: 30, category: 'Spices' },
  { name: 'Chili Oil', quantity: 220, unit: 'ml', unitPrice: 150, category: 'Spices' },
  { name: 'Red Pepper', quantity: 280, unit: 'g', unitPrice: 40, category: 'Spices' },

  // Supplies & Packaging
  { name: 'Take-Out Paper Box', quantity: 1000, unit: 'pcs', unitPrice: 1, category: 'Other' },
  { name: 'Take-out Bowls', quantity: 37, unit: 'pcs', unitPrice: 5, category: 'Other' },
  { name: 'Chopsticks wood disp', quantity: 150, unit: 'pcs', unitPrice: 0.5, category: 'Other' },
  { name: 'Ramen soup spoon disp', quantity: 24, unit: 'pcs', unitPrice: 2, category: 'Other' },
  { name: 'Disposable gloves', quantity: 0.5, unit: 'box', unitPrice: 50, category: 'Other' },

  // Beverages
  { name: 'Coke', quantity: 12, unit: 'pcs', unitPrice: 40, category: 'Other' },
  { name: 'Sprite', quantity: 28, unit: 'pcs', unitPrice: 40, category: 'Other' },
  { name: 'Royal', quantity: 11, unit: 'pcs', unitPrice: 30, category: 'Other' },
  { name: 'Pepsi', quantity: 23, unit: 'pcs', unitPrice: 40, category: 'Other' },
  { name: 'Mountain Dew', quantity: 20, unit: 'pcs', unitPrice: 50, category: 'Other' },
  { name: 'Bottled Water', quantity: 15, unit: 'pcs', unitPrice: 20, category: 'Other' },

  // Gas & Supplies
  { name: 'Gasul', quantity: 1, unit: 'full', unitPrice: 200, category: 'Other' },
  { name: 'Butane', quantity: 2, unit: 'pcs', unitPrice: 100, category: 'Other' },
  { name: 'Sando Bag', quantity: 1, unit: 'box', unitPrice: 150, category: 'Other' },
  { name: 'Water Blue Jag', quantity: 1, unit: 'pcs', unitPrice: 200, category: 'Other' },
  { name: 'Paper Tissue', quantity: 2, unit: 'box', unitPrice: 100, category: 'Other' },
];

// RECIPES FROM PAPER - Based on ramen types in Image 2
export const HARDCODED_RECIPES = [
  {
    name: 'Tonkatsu Ramen',
    price: 350,
    ingredients: [
      { ingredientName: 'Ramen Noodles', quantity: 0.2, unit: 'kg' },
      { ingredientName: 'Tonkatsu Broth', quantity: 0.3, unit: 'liters' },
      { ingredientName: 'Chashu Pork', quantity: 0.05, unit: 'kg' },
      { ingredientName: 'Eggs/Tamago', quantity: 1, unit: 'pcs' },
      { ingredientName: 'Black Garlic', quantity: 5, unit: 'g' },
      { ingredientName: 'Seaweeds Strip Nori', quantity: 3, unit: 'g' },
    ]
  },
  {
    name: 'Tantan Ramen',
    price: 315,
    ingredients: [
      { ingredientName: 'Ramen Noodles', quantity: 0.2, unit: 'kg' },
      { ingredientName: 'Curry Sauce', quantity: 0.15, unit: 'liters' },
      { ingredientName: 'Sesame Oil', quantity: 10, unit: 'ml' },
      { ingredientName: 'Chili Oil', quantity: 5, unit: 'ml' },
      { ingredientName: 'Eggs/Tamago', quantity: 1, unit: 'pcs' },
    ]
  },
  {
    name: 'Shoyu Ramen',
    price: 315,
    ingredients: [
      { ingredientName: 'Ramen Noodles', quantity: 0.2, unit: 'kg' },
      { ingredientName: 'Shoyu Sauce', quantity: 0.3, unit: 'liters' },
      { ingredientName: 'Chashu Pork', quantity: 0.03, unit: 'kg' },
      { ingredientName: 'Eggs/Tamago', quantity: 1, unit: 'pcs' },
      { ingredientName: 'Black Sesame Seeds', quantity: 3, unit: 'g' },
    ]
  },
  {
    name: 'Miso Ramen',
    price: 300,
    ingredients: [
      { ingredientName: 'Ramen Noodles', quantity: 0.2, unit: 'kg' },
      { ingredientName: 'Miso Paste', quantity: 0.1, unit: 'liters' },
      { ingredientName: 'Vegetable Oil', quantity: 10, unit: 'ml' },
      { ingredientName: 'Eggs/Tamago', quantity: 1, unit: 'pcs' },
    ]
  },
  {
    name: 'Gyoza',
    price: 150,
    ingredients: [
      { ingredientName: 'Gyoza', quantity: 5, unit: 'pcs' },
      { ingredientName: 'Vegetable Oil', quantity: 20, unit: 'ml' },
      { ingredientName: 'Gyoza Sauce', quantity: 0.05, unit: 'liters' },
    ]
  },
];

// SALES DATA FROM PAPER - 06 AUG 2026
export const HARDCODED_SALES = [
  // Customer sales from the paper (approximated from tallies)
  { recipeId: 'tonkatsu', recipeName: 'Tonkatsu Ramen', quantity: 5, price: 350, paymentMethod: 'GCash', timestamp: '2026-08-06' },
  { recipeId: 'tantan', recipeName: 'Tantan Ramen', quantity: 3, price: 315, paymentMethod: 'Grab', timestamp: '2026-08-06' },
  { recipeId: 'gyoza', recipeName: 'Gyoza', quantity: 2, price: 150, paymentMethod: 'Cash', timestamp: '2026-08-06' },
  { recipeId: 'shoyu', recipeName: 'Shoyu Ramen', quantity: 2, price: 315, paymentMethod: 'Cash', timestamp: '2026-08-06' },
  { recipeId: 'miso', recipeName: 'Miso Ramen', quantity: 1, price: 300, paymentMethod: 'GCash', timestamp: '2026-08-06' },
];

// DAILY EXPENSES - From Image 2
export const HARDCODED_EXPENSES = [
  { date: '2026-08-06', category: 'Cable', amount: 280 },
  { date: '2026-08-06', category: 'Corks', amount: 150 },
  { date: '2026-08-06', category: 'Cabbage/Carrot', amount: 680 },
  { date: '2026-08-06', category: 'Seaweed Oil', amount: 180 },
  { date: '2026-08-06', category: 'Butter', amount: 100 },
  { date: '2026-08-06', category: 'Gas', amount: 400 },
  { date: '2026-08-06', category: 'Misc', amount: 200 },
];
