const mongoose = require('mongoose');
const Post = require('../models/Post');
const City = require('../models/City');
require('dotenv').config();

/**
 * Dry-run audit of Post.city field integrity.
 *
 * post.city is a Mixed-typed field (see models/Post.js), so historically it
 * could have been written as a real City ObjectId, a raw API city-code
 * string (e.g. "DAKHLA"), null/absent, or - if the silent city-resolution
 * failure this script accompanies ever misfired - some other garbage value.
 * Posts whose city doesn't resolve to a real City document are invisible to
 * city-filtered browsing, so this categorizes every post by city field state
 * without writing anything.
 *
 * Usage:
 *   node server/scripts/audit-post-cities.js
 */

const SAMPLE_LIMIT = 5;

const isLikelyObjectId = (value) => {
  if (value instanceof mongoose.Types.ObjectId) return true;
  if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) return true;
  return false;
};

const describeValue = (value) => {
  if (typeof value === 'string') return value.length > 40 ? `${value.slice(0, 40)}...` : value;
  try {
    const json = JSON.stringify(value);
    return json.length > 40 ? `${json.slice(0, 40)}...` : json;
  } catch (error) {
    return String(value);
  }
};

async function auditPostCities() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mafqoudat');
    console.log('✅ Connected to MongoDB');

    const totalPosts = await Post.countDocuments({});
    console.log(`📊 Scanning ${totalPosts} posts...`);

    const cityDocs = await City.find({}).select('_id').lean();
    const existingCityIds = new Set(cityDocs.map((c) => c._id.toString()));
    console.log(`📊 ${existingCityIds.size} City documents in database\n`);

    const categories = {
      valid_existing: { label: 'Valid ObjectId -> existing City', count: 0, samples: [] },
      valid_missing: { label: 'Valid ObjectId -> missing City (dangling ref)', count: 0, samples: [] },
      null_absent: { label: 'null / absent', count: 0, samples: [] },
      other_garbage: { label: 'Other / garbage (non-ObjectId) value', count: 0, samples: [] }
    };

    const cursor = Post.find({}).select('_id city').lean().cursor();
    for (let post = await cursor.next(); post != null; post = await cursor.next()) {
      const city = post.city;

      if (city === null || city === undefined) {
        categories.null_absent.count++;
        if (categories.null_absent.samples.length < SAMPLE_LIMIT) {
          categories.null_absent.samples.push(post._id.toString());
        }
        continue;
      }

      if (isLikelyObjectId(city)) {
        const cityIdStr = city.toString();
        if (existingCityIds.has(cityIdStr)) {
          categories.valid_existing.count++;
          if (categories.valid_existing.samples.length < SAMPLE_LIMIT) {
            categories.valid_existing.samples.push(`post=${post._id} city=${cityIdStr}`);
          }
        } else {
          categories.valid_missing.count++;
          if (categories.valid_missing.samples.length < SAMPLE_LIMIT) {
            categories.valid_missing.samples.push(`post=${post._id} city=${cityIdStr}`);
          }
        }
        continue;
      }

      categories.other_garbage.count++;
      if (categories.other_garbage.samples.length < SAMPLE_LIMIT) {
        categories.other_garbage.samples.push(`post=${post._id} city=${describeValue(city)} (${typeof city})`);
      }
    }

    console.log('📋 Post.city field audit');
    console.log('='.repeat(72));
    const rows = Object.values(categories);
    const labelWidth = Math.max(...rows.map((r) => r.label.length)) + 2;
    for (const row of rows) {
      const pct = totalPosts > 0 ? ((row.count / totalPosts) * 100).toFixed(1) : '0.0';
      console.log(`${row.label.padEnd(labelWidth)} ${String(row.count).padStart(6)}  (${pct}%)`);
    }
    console.log('-'.repeat(72));
    console.log(`${'Total'.padEnd(labelWidth)} ${String(totalPosts).padStart(6)}`);
    console.log('='.repeat(72));

    for (const row of rows) {
      if (row.samples.length === 0) continue;
      console.log(`\n${row.label} - sample of ${row.samples.length}:`);
      row.samples.forEach((s) => console.log(`  - ${s}`));
    }

    if (categories.valid_missing.count > 0) {
      console.log(`\n⚠️  ${categories.valid_missing.count} post(s) reference a City ObjectId that no longer exists.`);
    }
    if (categories.other_garbage.count > 0) {
      console.log(`⚠️  ${categories.other_garbage.count} post(s) have a non-ObjectId city value (API city codes and/or genuine garbage - inspect samples above).`);
    }

    console.log('\n🔍 Dry run only - no data was modified.');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  auditPostCities()
    .then(() => {
      console.log('✅ Audit script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Audit script failed:', error);
      process.exit(1);
    });
}

module.exports = auditPostCities;
