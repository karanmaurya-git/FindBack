const mongoose = require('mongoose');
const { ensureDefaultCategories } = require('./ensureCategories');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error(
        'MongoDB connection string is missing. Please set MONGODB_URI or MONGO_URI in your .env file.'
      );
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Guarantee the 16 default item categories always exist, even if the
    // seed script was never run. This is idempotent and never touches
    // categories that already exist (e.g. ones added/edited by an admin).
    await ensureDefaultCategories();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
