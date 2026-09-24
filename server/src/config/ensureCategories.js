const Category = require('../models/Category');

// Default categories required by the platform (Section 11 of the spec).
// This runs once on server startup and only inserts categories if the
// Category collection is empty, so it never overwrites admin edits.
const DEFAULT_CATEGORIES = [
  { name: 'Electronics', icon: 'Cpu', subcategories: ['Chargers', 'Headphones', 'Cameras', 'Speakers', 'Smartwatches'] },
  { name: 'Mobile Phones', icon: 'Smartphone', subcategories: ['Apple iPhone', 'Samsung Galaxy', 'OnePlus', 'Google Pixel', 'Xiaomi'] },
  { name: 'Laptops', icon: 'Laptop', subcategories: ['MacBook', 'Lenovo ThinkPad', 'Dell XPS', 'HP Pavilion', 'ASUS ROG'] },
  { name: 'Tablets', icon: 'Tablet', subcategories: ['iPad', 'Samsung Tab', 'Kindle'] },
  { name: 'Bags', icon: 'Backpack', subcategories: ['Backpack', 'Handbag', 'Tote Bag', 'Gym Bag', 'Suitcase'] },
  { name: 'Wallets', icon: 'Wallet', subcategories: ['Leather Wallet', 'Cardholder', 'Coin Purse'] },
  { name: 'Keys', icon: 'Key', subcategories: ['Car Keys', 'House Keys', 'Bike Keys', 'Keychains'] },
  { name: 'Documents', icon: 'FileText', subcategories: ['Passport', 'Driving License', 'Marksheets', 'Contracts'] },
  { name: 'ID Cards', icon: 'CreditCard', subcategories: ['College ID', 'National ID / Aadhaar', 'Employee Badge', 'Bus Pass'] },
  { name: 'Books', icon: 'BookOpen', subcategories: ['Textbooks', 'Notebooks', 'Novels', 'Diaries'] },
  { name: 'Clothing', icon: 'Shirt', subcategories: ['Jackets', 'Hoodies', 'Caps/Hats', 'Scarves'] },
  { name: 'Jewelry', icon: 'Sparkles', subcategories: ['Rings', 'Necklaces', 'Bracelets', 'Earrings'] },
  { name: 'Watches', icon: 'Watch', subcategories: ['Wristwatch', 'Vintage Watch', 'Fitness Tracker'] },
  { name: 'Accessories', icon: 'Glasses', subcategories: ['Sunglasses', 'Reading Glasses', 'Umbrella', 'Water Bottle'] },
  { name: 'Vehicles', icon: 'Bike', subcategories: ['Bicycle', 'Scooter Helmet', 'Skateboard'] },
  { name: 'Other', icon: 'Package', subcategories: ['Musical Instruments', 'Sports Equipment', 'Miscellaneous'] },
];

const ensureDefaultCategories = async () => {
  try {
    const existing = await Category.find({}, 'name');
    const existingNames = new Set(existing.map((c) => c.name.trim().toLowerCase()));

    const missing = DEFAULT_CATEGORIES.filter(
      (c) => !existingNames.has(c.name.trim().toLowerCase())
    );

    if (missing.length === 0) {
      return; // Every default category already exists - nothing to do.
    }

    const created = await Category.insertMany(missing);
    console.log(`Auto-seeded ${created.length} missing default categories (${created.map((c) => c.name).join(', ')}).`);
  } catch (error) {
    console.error(`Failed to auto-seed default categories: ${error.message}`);
  }
};

module.exports = { ensureDefaultCategories, DEFAULT_CATEGORIES };
