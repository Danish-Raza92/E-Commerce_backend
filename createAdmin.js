// =============================================
// Danii.Store — Create Admin Account Script
// =============================================
// Run: node createAdmin.js
// Yeh script aapka pehla admin account banayega

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// Yahan apna admin info set karo:
const ADMIN_NAME     = 'Muhammad Danish';
const ADMIN_EMAIL    = 'admin@danii.store';   // <-- apna email
const ADMIN_PASSWORD = 'Admin@12345';          // <-- apna strong password

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    const User = require('./models/User');

    // Check if admin already exists
    const exists = await User.findOne({ email: ADMIN_EMAIL });
    if (exists) {
      if (exists.role === 'admin') {
        console.log(`✅ Admin already exists: ${exists.email}`);
      } else {
        exists.role = 'admin';
        await exists.save();
        console.log(`✅ Upgraded ${exists.email} to admin!`);
      }
      process.exit(0);
    }

    // Create new admin
    const salt     = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const admin = new User({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password,
      role:     'admin'
    });
    admin.password = password; // skip pre-save hook (already hashed)

    // Use direct insert to avoid double-hashing
    await User.collection.insertOne({
      name:      ADMIN_NAME,
      email:     ADMIN_EMAIL,
      password,
      phone:     '',
      addresses: [],
      wishlist:  [],
      role:      'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('🎉 Admin account created!');
    console.log('─────────────────────────');
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`🌐 Login at: https://e-commerce-frontend-theta-orpin.vercel.app/admin.html`);
    console.log('─────────────────────────');
    console.log('⚠️  Change your password after first login!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
