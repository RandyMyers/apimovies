const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const setAdmin = async () => {
  try {
    // Connect to MongoDB
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/cinehub-social';
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get email from command line argument
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Please provide an email address');
      console.log('Usage: node scripts/setAdmin.js <email>');
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    // Set user as admin
    user.role = 'admin';
    await user.save();

    console.log(`✅ User ${user.username} (${user.email}) has been set as admin`);
    console.log(`   Role: ${user.role}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin:', error);
    process.exit(1);
  }
};

// Run the function
setAdmin();

