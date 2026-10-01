#!/usr/bin/env node
/**
 * Utility to extract permanent Page Access Tokens and connected Instagram IDs
 * for all Facebook Pages managed by a Meta System User.
 *
 * Usage:
 *   node server/scripts/extractPageTokens.js <SYSTEM_USER_TOKEN>
 * or (if token is in server/.env):
 *   node server/scripts/extractPageTokens.js
 */
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const token = process.argv[2] || process.env.SYSTEM_USER_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

if (!token) {
  console.error('Error: Please provide a System User Token as an argument or set it in server/.env');
  console.error('Usage: node server/scripts/extractPageTokens.js <SYSTEM_USER_TOKEN>');
  process.exit(1);
}

async function run() {
  try {
    console.log('Fetching managed pages from Graph API...\n');
    const res = await axios.get(`https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`);
    const pages = res.data?.data || [];

    if (pages.length === 0) {
      console.log('No pages found for this token. Make sure the System User has been assigned pages in Business Manager.');
      return;
    }

    console.log(`Found ${pages.length} page(s):\n`);

    for (const page of pages) {
      console.log('================================================================');
      console.log(`Page Name: ${page.name}`);
      console.log(`Facebook Page ID: ${page.id}`);
      console.log(`Permanent Page Access Token:\n${page.access_token}`);

      // Fetch linked IG account
      try {
        const igRes = await axios.get(
          `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username,name}&access_token=${page.access_token}`
        );
        const ig = igRes.data?.instagram_business_account;
        if (ig) {
          console.log(`Connected Instagram ID: ${ig.id} (@${ig.username})`);
        } else {
          console.log('Connected Instagram: None (make sure Instagram is connected to this Page in Meta Business Suite)');
        }
      } catch (igErr) {
        console.log('Connected Instagram error:', igErr.response?.data?.error?.message || igErr.message);
      }
      console.log('================================================================\n');
    }
  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}

run();
