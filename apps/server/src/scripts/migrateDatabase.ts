import mongoose from 'mongoose';

// Source (local) and destination (Atlas) URIs
const SOURCE_URI = 'mongodb://localhost:27018/rise_of_the_general';
const DEST_URI = 'mongodb+srv://haobui14:chivip59@rise-of-the-general.tufylr8.mongodb.net/rise_of_the_general';

async function migrateDatabase() {
  console.log('Starting database migration...\n');

  // Create two separate connections
  const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
  console.log('✓ Connected to source database (local)');

  const destConn = await mongoose.createConnection(DEST_URI).asPromise();
  console.log('✓ Connected to destination database (Atlas)\n');

  try {
    // Get all collections from source
    const collections = await sourceConn.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections to migrate:\n`);

    for (const collInfo of collections) {
      const collectionName = collInfo.name;
      console.log(`Migrating collection: ${collectionName}`);

      // Get source and destination collection
      const sourceCollection = sourceConn.db.collection(collectionName);
      const destCollection = destConn.db.collection(collectionName);

      // Count documents in source
      const count = await sourceCollection.countDocuments();
      console.log(`  - Found ${count} documents`);

      if (count === 0) {
        console.log(`  - Skipping empty collection\n`);
        continue;
      }

      // Clear destination collection (optional - remove if you want to keep existing data)
      await destCollection.deleteMany({});
      console.log(`  - Cleared destination collection`);

      // Copy all documents
      const documents = await sourceCollection.find({}).toArray();
      if (documents.length > 0) {
        await destCollection.insertMany(documents);
        console.log(`  - ✓ Migrated ${documents.length} documents\n`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- Source: ${SOURCE_URI}`);
    console.log(`- Destination: ${DEST_URI}`);
    console.log(`- Collections migrated: ${collections.length}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    await sourceConn.close();
    await destConn.close();
    console.log('\nConnections closed.');
  }
}

// Run migration
migrateDatabase().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
