const fs = require('fs');
const path = require('path');

// Test post creation data
const testPostData = {
  user: "68af89bb30464c5a97ca8fcf",
  country: "68a4b54ab46524c54c553cae", // This is not Morocco!
  category: "68a4b54ab46524c54c553cc9",
  foundLost: "68a4b54ab46524c553cc3",
  city: "Test City", // Custom city name
  exactLocation: "Test Location",
  exactDate: "2025-08-28",
  contact: "0000000000",
  description: "Test description"
};

console.log('🔍 Debug Post Creation Data:');
console.log('City value:', testPostData.city);
console.log('Is city a valid ObjectId?', require('mongoose').Types.ObjectId.isValid(testPostData.city));
console.log('Country ID:', testPostData.country);

// Simulate the server-side logic
const mongoose = require('mongoose');

// Handle city validation
let cityId = null;

try {
  if (testPostData.city && mongoose.Types.ObjectId.isValid(testPostData.city)) {
    console.log('✅ City is a valid ObjectId');
    cityId = testPostData.city;
  } else {
    console.log('❌ City is NOT a valid ObjectId');
  }
} catch (cityError) {
  console.error('Error during city validation:', cityError);
}

// Prepare post data
const postData = {
  user: testPostData.user,
  category: testPostData.category,
  country: testPostData.country,
  contact: testPostData.contact,
  foundLost: testPostData.foundLost,
  exactLocation: testPostData.exactLocation,
  exactDate: new Date(testPostData.exactDate),
  description: testPostData.description || "",
};

console.log('\n📝 Post data before city handling:', postData);

// Handle city field
if (cityId) {
  console.log('✅ Setting city to ObjectId:', cityId);
  postData.city = cityId;
} else if (testPostData.city && !mongoose.Types.ObjectId.isValid(testPostData.city)) {
  console.log('✅ Setting region to custom city name:', testPostData.city);
  console.log('✅ Setting city to null');
  postData.region = testPostData.city;
  postData.city = null; // Explicitly set to null for custom cities
} else {
  console.log('❌ No city handling applied');
}

console.log('\n📝 Final post data:', postData);
console.log('\n🔍 Issues found:');
console.log('1. Country ID is not Morocco (68a4b54ab46524c54c553cae vs 68a4b54ab46524c54c553ca9)');
console.log('2. City field should be null for custom cities');
console.log('3. Region field should contain the custom city name');
