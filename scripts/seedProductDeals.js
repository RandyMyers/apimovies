const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ProductDeal = require('../models/ProductDeal');
const Site = require('../models/Site');

dotenv.config();

/**
 * Seed sample product deals / coupons for testing.
 * Uses real TMDB IDs: Stranger Things (TV 66732), The Dark Knight (155), Inception (27205).
 * Run: node server/scripts/seedProductDeals.js
 */
const seedProductDeals = async () => {
  try {
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/cinehub-social';
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const defaultSite = await Site.findOne({ slug: 'cinehub' }).select('_id').lean();
    const siteIds = defaultSite ? [defaultSite._id] : [];

    const deals = [
      {
        title: 'Stranger Things Official T-Shirt',
        shortDescription: 'Show your love for the Upside Down with this classic tee.',
        description: 'Official Stranger Things branded t-shirt. Cotton blend, unisex fit. Perfect for fans of the hit Netflix series. Multiple sizes available. Ships worldwide.',
        imageUrl: 'https://image.tmdb.org/t/p/w300/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
        linkUrl: 'https://www.amazon.com/s?k=stranger+things+t-shirt',
        type: 'product',
        tmdbMovieId: null,
        tmdbTvId: 66732,
        displayOrder: 1,
        isActive: true,
        siteIds,
        regions: [],
        startDate: null,
        endDate: null,
      },
      {
        title: '20% Off Stranger Things Merch',
        shortDescription: 'Limited-time discount on official merchandise.',
        description: 'Use our exclusive link to get 20% off Stranger Things apparel, posters, and collectibles. Valid at participating retailers. One use per customer.',
        imageUrl: 'https://image.tmdb.org/t/p/w300/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
        linkUrl: 'https://www.example.com/deals/stranger-things',
        type: 'coupon',
        tmdbMovieId: null,
        tmdbTvId: 66732,
        displayOrder: 2,
        isActive: true,
        siteIds,
        regions: ['US'],
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'The Dark Knight Poster & Collectibles',
        shortDescription: 'Iconic posters and collectibles from the Nolan trilogy.',
        description: 'High-quality The Dark Knight movie posters, art prints, and limited edition collectibles. Perfect for Batman and Christopher Nolan fans. Multiple designs available.',
        imageUrl: 'https://image.tmdb.org/t/p/w300/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        linkUrl: 'https://www.amazon.com/s?k=dark+knight+poster',
        type: 'product',
        tmdbMovieId: 155,
        tmdbTvId: null,
        displayOrder: 1,
        isActive: true,
        siteIds,
        regions: [],
        startDate: null,
        endDate: null,
      },
      {
        title: 'Inception Blu-ray & Digital Deal',
        shortDescription: 'Get the mind-bending classic on disc or digital.',
        description: 'Purchase Inception on Blu-ray or digital and get bonus features including behind-the-scenes documentaries. Christopher Nolan\'s dream heist thriller in the best quality.',
        imageUrl: 'https://image.tmdb.org/t/p/w300/9gk7adHYeDvHkCSEqAvQNLV5qSI.jpg',
        linkUrl: 'https://www.amazon.com/s?k=inception+blu+ray',
        type: 'deal',
        tmdbMovieId: 27205,
        tmdbTvId: null,
        displayOrder: 1,
        isActive: true,
        siteIds,
        regions: [],
        startDate: null,
        endDate: null,
      },
      {
        title: 'Movie Night Snack Box – 15% Off',
        shortDescription: 'Curated snacks for your next movie marathon.',
        description: 'Use code CINEHUB15 for 15% off our movie night snack box. Includes popcorn, candy, and drinks. Works on any movie or TV detail page – treat yourself!',
        imageUrl: 'https://image.tmdb.org/t/p/w300/8Y43POKnfKDEEP1f0vRgBzdT8.jpg',
        linkUrl: 'https://www.example.com/coupons/snack-box',
        type: 'coupon',
        tmdbMovieId: null,
        tmdbTvId: null,
        displayOrder: 10,
        isActive: true,
        siteIds: [],
        regions: [],
        startDate: null,
        endDate: null,
      },
    ];

    let created = 0;
    let skipped = 0;
    for (const d of deals) {
      const existing = await ProductDeal.findOne({
        title: d.title,
        linkUrl: d.linkUrl,
      });
      if (existing) {
        console.log(`⏭️  Skipping existing: ${d.title}`);
        skipped++;
        continue;
      }
      await ProductDeal.create(d);
      console.log(`✅ Created: ${d.title} (${d.type})`);
      created++;
    }

    console.log('\n✅ Product deals seeding completed.');
    console.log(`   Created: ${created} | Skipped: ${skipped}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding product deals:', error);
    process.exit(1);
  }
};

seedProductDeals();
