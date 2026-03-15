const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'admin@cinehub.com';
const ADMIN_USERNAME = process.env.ADMIN_SEED_USERNAME || 'Admin';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'Admin123!';

const seedAdminUser = async () => {
  try {
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/cinehub-social';
    await mongoose.connect(MONGO_URL);
    console.log('✅ Connected to MongoDB');

    let user = await User.findOne({ email: ADMIN_EMAIL });

    if (user) {
      user.role = 'admin';
      user.username = ADMIN_USERNAME;
      if (ADMIN_PASSWORD) {
        user.password = ADMIN_PASSWORD;
      }
      await user.save();
      console.log(`✅ Updated existing user to admin: ${user.email}`);
    } else {
      user = await User.create({
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        role: 'admin',
      });
      console.log(`✅ Created admin user: ${user.email}`);
    }

    console.log('');
    console.log('   Login to the admin dashboard with:');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdminUser();
