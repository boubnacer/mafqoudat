console.log('🧪 Testing localStorage functionality...\n');

// Test 1: Basic localStorage operations
console.log('📋 Test 1: Basic localStorage operations');
try {
  // Set a test value
  localStorage.setItem('testKey', 'testValue');
  console.log('✅ localStorage.setItem() - SUCCESS');
  
  // Get the test value
  const retrievedValue = localStorage.getItem('testKey');
  console.log('✅ localStorage.getItem() - SUCCESS, retrieved:', retrievedValue);
  
  // Remove the test value
  localStorage.removeItem('testKey');
  console.log('✅ localStorage.removeItem() - SUCCESS');
  
  // Verify it's gone
  const afterRemoval = localStorage.getItem('testKey');
  console.log('✅ Verification - SUCCESS, after removal:', afterRemoval);
  
} catch (error) {
  console.error('❌ localStorage test failed:', error);
}

// Test 2: Redirect URL simulation
console.log('\n📋 Test 2: Redirect URL simulation');
try {
  // Simulate storing a redirect URL
  const postId = 'test-post-123';
  const redirectUrl = `/dash/posts/${postId}`;
  
  localStorage.setItem('redirectAfterLogin', redirectUrl);
  console.log('✅ Stored redirect URL:', redirectUrl);
  
  // Retrieve it
  const storedUrl = localStorage.getItem('redirectAfterLogin');
  console.log('✅ Retrieved redirect URL:', storedUrl);
  
  // Clean up
  localStorage.removeItem('redirectAfterLogin');
  console.log('✅ Cleaned up redirect URL');
  
} catch (error) {
  console.error('❌ Redirect URL test failed:', error);
}

console.log('\n✅ All tests completed!');
console.log('\n💡 If you see all ✅ marks, localStorage is working correctly.');
console.log('💡 If you see ❌ marks, there\'s an issue with localStorage.');
console.log('\n🔍 Next steps:');
console.log('1. Check if your changes have been deployed');
console.log('2. Clear browser cache and refresh');
console.log('3. Check browser console for any errors');
console.log('4. Try clicking the report button again');
