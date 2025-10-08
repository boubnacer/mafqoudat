#!/usr/bin/env node

/**
 * Vercel Sync Diagnostic Tool
 * This script checks if your local changes match what's on GitHub
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Vercel Sync Diagnostic\n');
console.log('=' .repeat(60));

// Check 1: Git status
console.log('\n1️⃣  Checking Git Status...');
try {
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim() === '') {
    console.log('   ✅ Working directory is clean (no uncommitted changes)');
  } else {
    console.log('   ⚠️  You have uncommitted changes:');
    console.log(status);
    console.log('   Run: git add . && git commit -m "your message"');
  }
} catch (error) {
  console.log('   ❌ Error checking git status');
}

// Check 2: Remote sync
console.log('\n2️⃣  Checking GitHub Sync...');
try {
  execSync('git fetch origin', { encoding: 'utf-8' });
  const behind = execSync('git rev-list HEAD..origin/main --count', { encoding: 'utf-8' }).trim();
  const ahead = execSync('git rev-list origin/main..HEAD --count', { encoding: 'utf-8' }).trim();
  
  if (ahead === '0' && behind === '0') {
    console.log('   ✅ Local and GitHub are in sync');
  } else if (ahead !== '0') {
    console.log(`   ⚠️  You have ${ahead} commit(s) that haven't been pushed`);
    console.log('   Run: git push origin main');
  } else if (behind !== '0') {
    console.log(`   ⚠️  GitHub has ${behind} commit(s) you don\'t have locally`);
    console.log('   Run: git pull origin main');
  }
} catch (error) {
  console.log('   ❌ Error checking GitHub sync');
}

// Check 3: Recent commits
console.log('\n3️⃣  Recent Commits (last 5)...');
try {
  const commits = execSync('git log -5 --pretty=format:"%h - %ar : %s"', { encoding: 'utf-8' });
  console.log(commits);
} catch (error) {
  console.log('   ❌ Error fetching commits');
}

// Check 4: Vercel configuration
console.log('\n\n4️⃣  Checking Vercel Configuration...');

const vercelPaths = ['vercel.json', 'client/vercel.json'];
let vercelConfig = null;
let vercelConfigPath = null;

for (const path of vercelPaths) {
  if (fs.existsSync(path)) {
    console.log(`   ✅ Found vercel.json at: ${path}`);
    vercelConfigPath = path;
    try {
      vercelConfig = JSON.parse(fs.readFileSync(path, 'utf-8'));
    } catch (e) {
      console.log(`   ⚠️  vercel.json exists but has invalid JSON`);
    }
    break;
  }
}

if (!vercelConfig) {
  console.log('   ⚠️  No vercel.json found in root or client/ directory');
}

// Check 5: Client directory
console.log('\n5️⃣  Checking Client Directory...');
if (fs.existsSync('client/package.json')) {
  console.log('   ✅ client/package.json exists');
  const pkg = JSON.parse(fs.readFileSync('client/package.json', 'utf-8'));
  console.log(`   📦 Project: ${pkg.name}`);
  console.log(`   🔧 Build script: ${pkg.scripts?.build || 'NOT FOUND'}`);
} else {
  console.log('   ❌ client/package.json not found');
}

if (fs.existsSync('client/src/App.js')) {
  console.log('   ✅ client/src/App.js exists');
  // Check first line for force deployment comment
  const firstLine = fs.readFileSync('client/src/App.js', 'utf-8').split('\n')[0];
  if (firstLine.includes('Force deployment')) {
    console.log(`   ⚠️  Found force deployment comment: "${firstLine}"`);
    console.log('   This suggests Vercel hasn\'t been picking up changes');
  }
} else {
  console.log('   ❌ client/src/App.js not found');
}

// Check 6: Build directory
console.log('\n6️⃣  Checking Build Directory...');
if (fs.existsSync('client/build')) {
  console.log('   ✅ client/build directory exists');
  console.log('   💡 You may want to clear this and let Vercel build fresh');
} else {
  console.log('   ℹ️  No build directory (this is normal)');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📋 NEXT STEPS:\n');
console.log('1. Check your Vercel Dashboard at: https://vercel.com/dashboard');
console.log('2. Look for recent deployments in the last 4 hours');
console.log('3. If NO deployments found → GitHub integration is broken');
console.log('   → Go to Vercel Settings → Git → Reconnect repository');
console.log('');
console.log('4. If deployments FAILED → Check build logs for errors');
console.log('   → Verify Root Directory is set to "client"');
console.log('');
console.log('5. Check GitHub webhooks at:');
console.log('   https://github.com/boubnacer/mafqoudat/settings/hooks');
console.log('');
console.log('6. Force a manual redeploy in Vercel Dashboard');
console.log('   → Deployments tab → Latest → ⋯ → Redeploy');
console.log('\n' + '='.repeat(60));
console.log('\n📖 Full guide available in: VERCEL_SYNC_FIX.md\n');

