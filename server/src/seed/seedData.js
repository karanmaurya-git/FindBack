const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: __dirname + '/../../.env' });

const User = require('../models/User');
const Category = require('../models/Category');
const Item = require('../models/Item');
const Match = require('../models/Match');
const Claim = require('../models/Claim');
const Organization = require('../models/Organization');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/findback';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Item.deleteMany({}),
      Match.deleteMany({}),
      Claim.deleteMany({}),
      Organization.deleteMany({}),
      Notification.deleteMany({}),
      Activity.deleteMany({}),
    ]);
    console.log('Cleared existing data.');

    // 1. Seed Categories
    const categoriesData = [
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

    const categories = await Category.insertMany(categoriesData);
    console.log(`Seeded ${categories.length} categories.`);

    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c._id; });

    // 2. Seed Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const usersData = [
      {
        name: 'Alex Rivera (Admin)',
        email: 'admin@findback.com',
        password: passwordHash,
        role: 'admin',
        phone: '+1 555-0199',
        isVerified: true,
        avatar: { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
      },
      {
        name: 'Sarah Chen (Moderator)',
        email: 'moderator@findback.com',
        password: passwordHash,
        role: 'moderator',
        phone: '+1 555-0198',
        isVerified: true,
        avatar: { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
      },
      {
        name: 'Michael Scott',
        email: 'user@findback.com',
        password: passwordHash,
        role: 'user',
        phone: '+1 555-0197',
        isVerified: true,
        avatar: { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
      },
      {
        name: 'Emily Watson',
        email: 'emily@findback.com',
        password: passwordHash,
        role: 'user',
        phone: '+1 555-0196',
        isVerified: false,
        avatar: { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200' },
      },
    ];

    const users = await User.insertMany(usersData);
    console.log(`Seeded ${users.length} users.`);

    const admin = users[0];
    const mod = users[1];
    const user1 = users[2];
    const user2 = users[3];

    // 3. Seed Organizations
    const orgData = [
      {
        name: 'Metropolitan Tech Campus',
        type: 'university',
        description: 'Main campus lost and found registry for students and faculty.',
        admin: admin._id,
        moderators: [mod._id],
        members: [user1._id, user2._id],
        location: { type: 'Point', coordinates: [-73.985130, 40.748817], address: '350 5th Ave, New York, NY' },
      },
      {
        name: 'Apex Innovation Hub',
        type: 'office',
        description: 'Co-working space and tech corporate campus lost & found desk.',
        admin: admin._id,
        moderators: [mod._id],
        members: [user1._id],
        location: { type: 'Point', coordinates: [-122.419416, 37.774929], address: 'Market St, San Francisco, CA' },
      },
    ];

    const orgs = await Organization.insertMany(orgData);
    console.log(`Seeded ${orgs.length} organizations.`);

    // 4. Seed Items
    const itemsData = [
      {
        user: user1._id,
        type: 'lost',
        name: 'Midnight Black MacBook Pro 14"',
        category: catMap['Laptops'],
        subcategory: 'MacBook',
        brand: 'Apple',
        model: 'M3 Pro 2023',
        color: 'Space Black',
        description: 'Lost my MacBook Pro inside a dark gray felt sleeve. Left near the cafeteria 3rd floor lounge table.',
        identifyingFeatures: 'Small scratch near USB-C port, sticker of a GitHub Octocat on back cover.',
        images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800' }],
        location: { type: 'Point', coordinates: [-73.985130, 40.748817], address: '350 5th Ave, NY', area: 'Cafeteria Floor 3' },
        lostDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        approximateTime: '2:30 PM',
        reward: { offered: true, amount: 100, description: 'Cash reward upon safe return' },
        status: 'potential_match',
        organization: orgs[0]._id,
      },
      {
        user: user2._id,
        type: 'found',
        name: 'Space Gray / Black Apple Laptop',
        category: catMap['Laptops'],
        subcategory: 'MacBook',
        brand: 'Apple',
        model: 'MacBook Pro',
        color: 'Dark Gray / Black',
        description: 'Found a dark Apple laptop sitting on the cafeteria bench in a gray protective sleeve.',
        identifyingFeatures: 'Has coding stickers on the lid.',
        images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800' }],
        location: { type: 'Point', coordinates: [-73.985200, 40.748850], address: '350 5th Ave, NY', area: 'Cafeteria Floor 3' },
        foundDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        approximateTime: '3:00 PM',
        currentPossession: 'Left with Campus Security Reception Desk',
        status: 'potential_match',
        organization: orgs[0]._id,
      },
      {
        user: user1._id,
        type: 'lost',
        name: 'Blue Hydro Flask 32oz',
        category: catMap['Accessories'],
        brand: 'Hydro Flask',
        color: 'Pacific Blue',
        description: 'Dropped near the gym lockers. Has some dents on the bottom rim.',
        images: [{ url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=800' }],
        location: { type: 'Point', coordinates: [-73.986000, 40.749000], address: 'Gymnasium Area', area: 'Main Gym' },
        lostDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        user: user2._id,
        type: 'found',
        name: 'Leather Keychain with 3 Brass Keys',
        category: catMap['Keys'],
        color: 'Brown',
        description: 'Found on the park bench outside the central library with a miniature brass airplane keychain.',
        images: [{ url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800' }],
        location: { type: 'Point', coordinates: [-73.984000, 40.747000], address: 'Central Park West', area: 'Library Lawn' },
        foundDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        currentPossession: 'With finder',
        status: 'active',
      },
    ];

    const items = await Item.insertMany(itemsData);
    console.log(`Seeded ${items.length} items.`);

    // 5. Seed SmartMatch between the MacBook lost & found
    const match = await Match.create({
      lostItem: items[0]._id,
      foundItem: items[1]._id,
      similarityScore: 92,
      matchedFeatures: [
        { feature: 'Category & Brand', score: 100, detail: 'Exact match: Apple Laptop / MacBook Pro' },
        { feature: 'Color & Appearance', score: 95, detail: 'Both describe Space Black / Dark Gray with protective sleeve' },
        { feature: 'Location Proximity', score: 98, detail: 'Reported in exact same zone (Cafeteria Floor 3)' },
        { feature: 'Timeline', score: 90, detail: 'Lost at ~2:30 PM, found at ~3:00 PM on same day' },
      ],
      aiExplanation: 'High probability match detected. Both reports identify an Apple MacBook Pro located in the 3rd floor cafeteria around 2:30-3:00 PM in a gray protective sleeve. Please initiate verification to confirm.',
      status: 'pending',
      notifiedUsers: [user1._id, user2._id],
    });
    console.log('Seeded 1 AI SmartMatch.');

    // 6. Seed Notification
    await Notification.create({
      recipient: user1._id,
      type: 'match_found',
      title: '🔎 SmartMatch AI: Potential match found!',
      message: 'A found Apple laptop in Cafeteria Floor 3 matches your lost MacBook Pro report (92% match).',
      relatedItem: items[0]._id,
      relatedMatch: match._id,
      link: `/matches/${match._id}`,
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
