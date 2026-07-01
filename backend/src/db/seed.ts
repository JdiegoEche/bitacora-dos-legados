import { db } from './connection';
import { coffeeBeans, brewSessions, tastingNotes } from './schema';

async function seed() {
  console.log('🌱 Seeding database…');

  // Insert sample coffee beans
  const beans = await db
    .insert(coffeeBeans)
    .values([
      {
        name: 'Ethiopia Yirgacheffe',
        roaster: 'Counter Culture',
        origin: 'Ethiopia',
        roastLevel: 'light',
      },
      {
        name: 'Colombia La Esperanza',
        roaster: 'Intelligentsia',
        origin: 'Colombia',
        roastLevel: 'medium',
      },
      {
        name: 'House Blend',
        roaster: 'Stumptown',
        origin: null,
        roastLevel: 'medium-dark',
      },
    ])
    .returning();

  const [ethiopia, colombia, houseBlend] = beans;

  // Insert sample brew sessions
  const brews = await db
    .insert(brewSessions)
    .values([
      {
        coffeeBeanId: ethiopia.id,
        grindSize: 'medium-fine',
        waterTemp: 93,
        brewTime: 150,
        method: 'V60',
        grinder: 'Comandante C40',
        clicks: '22',
        coffeeDose: 15,
        waterDose: 250,
        notes: 'Bright and clean, floral notes came through nicely.',
        rating: 4,
      },
      {
        coffeeBeanId: colombia.id,
        grindSize: 'medium',
        waterTemp: 88,
        brewTime: 120,
        method: 'Aeropress',
        grinder: 'Eureka Mignon',
        clicks: '3',
        coffeeDose: 14,
        waterDose: 200,
        notes: 'Smooth body, good for a quick morning brew.',
        rating: 5,
      },
      {
        coffeeBeanId: houseBlend.id,
        grindSize: 'coarse',
        waterTemp: 96,
        brewTime: 240,
        method: 'French Press',
        grinder: null,
        clicks: null,
        coffeeDose: 30,
        waterDose: 500,
        notes: 'Full-bodied and rich. Classic comfort brew.',
        rating: 3,
      },
    ])
    .returning();

  const [v60, aeropress, frenchPress] = brews;

  // Insert sample tasting notes for the V60 brew
  await db.insert(tastingNotes).values([
    {
      brewSessionId: v60.id,
      aroma: 'Floral with hints of jasmine',
      flavor: 'Blueberry and dark chocolate',
      body: 'Medium, tea-like',
      acidity: 'Bright, citric',
      rating: 4,
      freeText: 'Excellent light roast — very aromatic.',
    },
    {
      brewSessionId: v60.id,
      aroma: 'Sweet, honey-like',
      flavor: 'Stone fruit',
      body: 'Light',
      acidity: 'Mild',
      rating: 3,
      freeText: 'Lost some brightness as it cooled.',
    },
  ]);

  // Insert a tasting note for the Aeropress brew
  await db.insert(tastingNotes).values([
    {
      brewSessionId: aeropress.id,
      aroma: 'Nutty and caramel',
      flavor: 'Toffee with a hint of apple',
      body: 'Smooth, medium-full',
      acidity: 'Low',
      rating: 5,
      freeText: 'Perfect everyday Aeropress recipe.',
    },
  ]);

  console.log('✅ Seed complete:');
  console.log(`   - ${beans.length} coffee beans`);
  console.log(`   - ${brews.length} brew sessions`);
  console.log('   - 3 tasting notes');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
