const mongoose = require('mongoose');
const dotenv = require('dotenv');
const BlogPost = require('../models/BlogPost');
const BlogCategory = require('../models/BlogCategory');
const BlogTag = require('../models/BlogTag');
const User = require('../models/User');

dotenv.config();

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const seedBlog = async () => {
  try {
    // Connect to MongoDB
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/cinehub-social';
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get or create a user (use first user or create admin user)
    let author = await User.findOne();
    if (!author) {
      // Create a default admin user for blog posts
      author = await User.create({
        email: 'admin@cinehub.com',
        username: 'CineHub Admin',
        password: 'admin123', // In production, this should be hashed
      });
      console.log('✅ Created admin user for blog posts');
    }

    // Create categories
    const categories = [
      { name: 'Movie Reviews', description: 'In-depth reviews of the latest movies' },
      { name: 'TV Show Reviews', description: 'Reviews and analysis of TV series' },
      { name: 'What to Watch', description: 'Weekly recommendations and guides' },
      { name: 'Behind the Scenes', description: 'Production insights and trivia' },
      { name: 'Actor Spotlights', description: 'Career retrospectives and interviews' },
      { name: 'Genre Deep Dives', description: 'Explorations of specific genres' },
    ];

    const createdCategories = {};
    for (const cat of categories) {
      const slug = generateSlug(cat.name);
      let category = await BlogCategory.findOne({ slug });
      if (!category) {
        category = await BlogCategory.create({
          name: cat.name,
          slug,
          description: cat.description,
        });
        console.log(`✅ Created category: ${cat.name}`);
      }
      createdCategories[cat.name] = category;
    }

    // Create tags
    const tags = [
      'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller',
      'Netflix', 'HBO', 'Disney+', 'Prime Video', 'Hulu',
      'Oscar Winners', 'Emmy Winners', 'Must Watch', 'Hidden Gems',
      'New Releases', 'Classic Films', 'TV Series', 'Documentaries',
    ];

    const createdTags = {};
    for (const tagName of tags) {
      const slug = generateSlug(tagName);
      let tag = await BlogTag.findOne({ slug });
      if (!tag) {
        tag = await BlogTag.create({ name: tagName, slug });
        console.log(`✅ Created tag: ${tagName}`);
      }
      createdTags[tagName] = tag;
    }

    // Create sample blog posts
    const blogPosts = [
      {
        title: 'Top 10 Must-Watch Movies on Netflix This Month',
        excerpt: 'Discover the best movies currently streaming on Netflix, from action-packed thrillers to heartwarming dramas.',
        content: `
          <h2>Introduction</h2>
          <p>Netflix continues to deliver an impressive lineup of movies this month. Whether you're in the mood for action, drama, or comedy, there's something for everyone.</p>
          
          <h2>1. The Dark Knight (2008)</h2>
          <p>Christopher Nolan's masterpiece featuring Christian Bale as Batman and Heath Ledger's iconic performance as the Joker. This film redefined the superhero genre.</p>
          
          <h2>2. Inception (2010)</h2>
          <p>A mind-bending sci-fi thriller that explores the world of dreams and reality. Leonardo DiCaprio leads an all-star cast in this visually stunning film.</p>
          
          <h2>3. The Shawshank Redemption (1994)</h2>
          <p>A timeless tale of hope and friendship set in a prison. This classic film continues to inspire audiences worldwide.</p>
          
          <h2>4. Parasite (2019)</h2>
          <p>Bong Joon-ho's Oscar-winning masterpiece that brilliantly blends dark comedy with social commentary. A must-watch for any film enthusiast.</p>
          
          <h2>5. The Matrix (1999)</h2>
          <p>Keanu Reeves stars in this groundbreaking sci-fi action film that revolutionized visual effects and storytelling in cinema.</p>
          
          <h2>Conclusion</h2>
          <p>These films represent some of the best content available on Netflix. Whether you're looking for entertainment or thought-provoking cinema, this list has you covered.</p>
        `,
        category: 'What to Watch',
        tags: ['Netflix', 'Must Watch', 'New Releases'],
        featuredImage: 'https://image.tmdb.org/t/p/w1280/1M876KPjulVwppEpldhdc8V4o68.jpg',
        seoTitle: 'Top 10 Must-Watch Movies on Netflix - Best Streaming Movies',
        seoDescription: 'Discover the best movies currently streaming on Netflix. Our curated list includes action, drama, and comedy films you don\'t want to miss.',
        seoKeywords: ['Netflix', 'movies', 'streaming', 'what to watch', 'best movies'],
      },
      {
        title: 'Breaking Bad: A Masterclass in Television Storytelling',
        excerpt: 'An in-depth analysis of Vince Gilligan\'s groundbreaking series and why it remains one of the greatest TV shows of all time.',
        content: `
          <h2>The Legacy of Breaking Bad</h2>
          <p>Breaking Bad, created by Vince Gilligan, stands as one of the most critically acclaimed television series in history. The show follows Walter White, a high school chemistry teacher turned methamphetamine manufacturer.</p>
          
          <h2>Character Development</h2>
          <p>One of the show's greatest strengths is its character development. Walter White's transformation from a mild-mannered teacher to a ruthless drug kingpin is both compelling and terrifying.</p>
          
          <h2>Cinematic Quality</h2>
          <p>Breaking Bad elevated television to cinematic quality. Each episode was crafted with meticulous attention to detail, from the cinematography to the writing.</p>
          
          <h2>Impact on Television</h2>
          <p>The success of Breaking Bad proved that television could match, and even exceed, the quality of feature films. It paved the way for other prestige dramas.</p>
          
          <h2>Conclusion</h2>
          <p>Breaking Bad remains essential viewing for anyone interested in exceptional storytelling, character development, and television as an art form.</p>
        `,
        category: 'TV Show Reviews',
        tags: ['TV Series', 'Must Watch', 'HBO'],
        featuredImage: 'https://image.tmdb.org/t/p/w1280/ggFHVNu6YYI5L9pJJf2YkHqkzlb.jpg',
        seoTitle: 'Breaking Bad Review - Why It\'s the Greatest TV Show',
        seoDescription: 'An in-depth analysis of Breaking Bad and why it remains one of the greatest television series of all time.',
        seoKeywords: ['Breaking Bad', 'TV shows', 'drama', 'Vince Gilligan', 'television'],
      },
      {
        title: 'The Evolution of Superhero Movies: From Comics to Blockbusters',
        excerpt: 'Explore how superhero movies have evolved from simple adaptations to billion-dollar franchises that dominate the box office.',
        content: `
          <h2>The Early Days</h2>
          <p>Superhero movies have come a long way since the early adaptations. Films like Superman (1978) and Batman (1989) laid the groundwork for what would become a dominant genre.</p>
          
          <h2>The Marvel Cinematic Universe</h2>
          <p>Marvel Studios revolutionized the genre with the creation of the Marvel Cinematic Universe. Starting with Iron Man (2008), they created an interconnected universe that spans multiple films and characters.</p>
          
          <h2>The Dark Knight Trilogy</h2>
          <p>Christopher Nolan's Dark Knight trilogy proved that superhero films could be serious, thought-provoking cinema. The Dark Knight (2008) remains one of the highest-rated films of all time.</p>
          
          <h2>Modern Superhero Cinema</h2>
          <p>Today, superhero movies dominate the box office. Films like Avengers: Endgame have broken numerous records, proving the genre's lasting appeal.</p>
          
          <h2>Conclusion</h2>
          <p>The evolution of superhero movies reflects broader changes in cinema and popular culture. These films have become a significant part of modern entertainment.</p>
        `,
        category: 'Genre Deep Dives',
        tags: ['Action', 'New Releases', 'Must Watch'],
        featuredImage: 'https://image.tmdb.org/t/p/w1280/4j0pH0s5N9p8lZ5x0Q2qJ3qJ3qJ.jpg',
        seoTitle: 'Evolution of Superhero Movies - From Comics to Blockbusters',
        seoDescription: 'Explore how superhero movies evolved from simple comic book adaptations to billion-dollar franchises.',
        seoKeywords: ['superhero movies', 'Marvel', 'DC', 'comics', 'blockbusters'],
      },
      {
        title: 'Hidden Gems: Underrated Movies You Need to Watch',
        excerpt: 'Discover amazing films that flew under the radar but deserve your attention. These hidden gems offer unique stories and exceptional filmmaking.',
        content: `
          <h2>Why Hidden Gems Matter</h2>
          <p>While blockbusters dominate the box office, some of the best films are those that didn't receive the attention they deserved. These hidden gems often offer more unique and personal stories.</p>
          
          <h2>1. The Fall (2006)</h2>
          <p>Tarsem Singh's visually stunning film about a stuntman who tells an epic story to a young girl. The film features breathtaking cinematography and a touching narrative.</p>
          
          <h2>2. Moon (2009)</h2>
          <p>Duncan Jones' sci-fi masterpiece starring Sam Rockwell. This thought-provoking film explores themes of identity and isolation in space.</p>
          
          <h2>3. The Secret Life of Walter Mitty (2013)</h2>
          <p>Ben Stiller's adaptation of James Thurber's story is a beautiful journey of self-discovery. The film's stunning visuals and heartfelt story make it a must-watch.</p>
          
          <h2>4. Coherence (2013)</h2>
          <p>A mind-bending sci-fi thriller that was made on a shoestring budget. The film proves that great storytelling doesn't require a massive budget.</p>
          
          <h2>Conclusion</h2>
          <p>These hidden gems prove that great cinema exists beyond the mainstream. Take a chance on these films and discover something truly special.</p>
        `,
        category: 'What to Watch',
        tags: ['Hidden Gems', 'Must Watch', 'Classic Films'],
        featuredImage: 'https://image.tmdb.org/t/p/w1280/5gJZV2Y8y6Y6X5Z5Z5Z5Z5Z5Z5Z.jpg',
        seoTitle: 'Hidden Gems: Underrated Movies You Need to Watch',
        seoDescription: 'Discover amazing underrated films that deserve your attention. These hidden gems offer unique stories and exceptional filmmaking.',
        seoKeywords: ['hidden gems', 'underrated movies', 'indie films', 'must watch'],
      },
      {
        title: 'Best Horror Movies of 2024: A Spine-Chilling Guide',
        excerpt: 'From psychological thrillers to supernatural horrors, here are the best horror movies that terrified audiences in 2024.',
        content: `
          <h2>The Horror Genre in 2024</h2>
          <p>2024 has been an exceptional year for horror films. The genre continues to evolve, offering everything from psychological thrillers to supernatural horrors.</p>
          
          <h2>1. Talk to Me (2023)</h2>
          <p>This Australian horror film took audiences by storm with its unique premise and terrifying execution. The film explores themes of grief and connection through a supernatural lens.</p>
          
          <h2>2. The Black Phone (2022)</h2>
          <p>Based on Joe Hill's short story, this film combines supernatural elements with real-world horror. Ethan Hawke delivers a chilling performance as the antagonist.</p>
          
          <h2>3. Nope (2022)</h2>
          <p>Jordan Peele's latest film blends horror with science fiction. The film's unique take on the UFO genre makes it a standout in modern horror cinema.</p>
          
          <h2>Conclusion</h2>
          <p>These films represent the best of modern horror cinema. Whether you're a horror aficionado or a casual viewer, these films are sure to leave an impression.</p>
        `,
        category: 'Genre Deep Dives',
        tags: ['Horror', 'New Releases', 'Must Watch'],
        featuredImage: 'https://image.tmdb.org/t/p/w1280/5gJZV2Y8y6Y6X5Z5Z5Z5Z5Z5Z5Z.jpg',
        seoTitle: 'Best Horror Movies of 2024 - Spine-Chilling Guide',
        seoDescription: 'Discover the best horror movies of 2024. From psychological thrillers to supernatural horrors, this guide has you covered.',
        seoKeywords: ['horror movies', '2024', 'thriller', 'scary movies', 'best horror'],
      },
      {
        title: 'Christopher Nolan: The Director Who Changed Cinema',
        excerpt: 'An exploration of Christopher Nolan\'s filmmaking career and how his innovative techniques have influenced modern cinema.',
        content: `
          <h2>Introduction to Christopher Nolan</h2>
          <p>Christopher Nolan has established himself as one of the most influential directors of the 21st century. His films combine complex narratives with stunning visuals.</p>
          
          <h2>Early Career</h2>
          <p>Nolan's career began with independent films like Following (1998) and Memento (2000). These early works showcased his unique storytelling style.</p>
          
          <h2>The Dark Knight Trilogy</h2>
          <p>Nolan's Batman trilogy redefined the superhero genre. The Dark Knight (2008) remains one of the most critically acclaimed films of all time.</p>
          
          <h2>Inception and Interstellar</h2>
          <p>Films like Inception (2010) and Interstellar (2014) demonstrate Nolan's ability to blend complex science with emotional storytelling.</p>
          
          <h2>Oppenheimer (2023)</h2>
          <p>Nolan's latest film, Oppenheimer, showcases his continued evolution as a filmmaker. The film's success at the Oscars proves his lasting impact.</p>
          
          <h2>Conclusion</h2>
          <p>Christopher Nolan's influence on modern cinema cannot be overstated. His films continue to inspire filmmakers and audiences alike.</p>
        `,
        category: 'Actor Spotlights',
        tags: ['Oscar Winners', 'Must Watch', 'Classic Films'],
        featuredImage: 'https://image.tmdb.org/t/p/w1280/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        seoTitle: 'Christopher Nolan: The Director Who Changed Cinema',
        seoDescription: 'Explore Christopher Nolan\'s filmmaking career and how his innovative techniques have influenced modern cinema.',
        seoKeywords: ['Christopher Nolan', 'directors', 'cinema', 'filmmaking', 'Oscar'],
      },
    ];

    // Clear existing blog posts (optional - comment out if you want to keep existing posts)
    // await BlogPost.deleteMany({});
    // console.log('✅ Cleared existing blog posts');

    // Create blog posts
    for (const postData of blogPosts) {
      const slug = generateSlug(postData.title);
      
      // Check if post already exists
      const existingPost = await BlogPost.findOne({ slug });
      if (existingPost) {
        console.log(`⏭️  Skipping existing post: ${postData.title}`);
        continue;
      }

      const category = createdCategories[postData.category];
      const tagObjects = postData.tags.map(tagName => createdTags[tagName]).filter(Boolean);

      const post = await BlogPost.create({
        authorId: author._id,
        title: postData.title,
        slug,
        excerpt: postData.excerpt,
        content: postData.content.trim(),
        featuredImage: postData.featuredImage,
        categoryId: category?._id || null,
        tags: tagObjects.map(t => t._id),
        status: 'published',
        publishedAt: new Date(),
        seoTitle: postData.seoTitle,
        seoDescription: postData.seoDescription,
        seoKeywords: postData.seoKeywords,
        viewCount: Math.floor(Math.random() * 1000), // Random view count for demo
      });

      console.log(`✅ Created blog post: ${postData.title}`);
    }

    console.log('\n✅ Blog seeding completed successfully!');
    console.log(`📝 Created ${blogPosts.length} blog posts`);
    console.log(`📁 Created ${categories.length} categories`);
    console.log(`🏷️  Created ${tags.length} tags`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding blog:', error);
    process.exit(1);
  }
};

// Run the seed function
seedBlog();

