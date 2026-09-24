#!/usr/bin/env node
/**
 * Quick test: generates category social images for single and multi-category
 * scenarios and writes them to disk so you can visually verify them.
 *
 * Usage:
 *   node scripts/testDynamicCategoryImage.js
 */

const path = require('path');
const fs = require('fs');
const { generateCategoryImage } = require('../services/dynamicCategoryImage');

const OUTPUT_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'category-social', 'test');

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const tests = [
    { name: 'single-pets', codes: ['PETS'] },
    { name: 'dual-pets-keys', codes: ['PETS', 'KEYS'] },
    { name: 'triple-pets-keys-electronics', codes: ['PETS', 'KEYS', 'ELECTRONICS'] },
  ];

  for (const { name, codes } of tests) {
    console.log(`Generating ${name} (${codes.join(', ')})...`);
    const buffer = await generateCategoryImage(codes);
    if (buffer) {
      const file = path.join(OUTPUT_DIR, `${name}.jpg`);
      fs.writeFileSync(file, buffer);
      console.log(`  ✓ Written to ${file} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } else {
      console.error(`  ✗ generateCategoryImage returned null for ${name}`);
    }
  }

  console.log('\nDone! Check the test images in', OUTPUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
