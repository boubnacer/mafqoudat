const mongoose = require('mongoose');

// Simulate the exact data from the user's post
const reqBody = {
  user: "68af89bb30464c5a97ca8fcf",
  country: "68a4b54ab46524c54c553cae",
  category: "68a4b54ab46524c54c553cc9",
  foundLost: "68a4b54ab46524c553cc3",
  city: "Custom City Name", // This is what should be sent
  exactLocation: "الحديقة",
  exactDate: "2025-08-28",
  contact: "0000000000",
  description: "",
  contactPreferences: JSON.stringify({
    phone: true,
    email: false,
    whatsapp: false
  }),
  additionalContact: JSON.stringify({
    phone: "",
    email: "",
    whatsapp: ""
  })
};

console.log('🧪 Testing city handling logic with actual data:');
console.log('City value from request:', reqBody.city);
console.log('Is city a valid ObjectId?', mongoose.Types.ObjectId.isValid(reqBody.city));

// Extract variables like the server does
const { 
  user, 
  country, 
  category, 
  contact, 
  foundLost,
  city,
  exactLocation,
  exactDate,
  description,
  contactPreferences,
  additionalContact
} = reqBody;

console.log('\n📝 Extracted city value:', city);

// Handle city validation (simulating server logic)
let cityId = null;

console.log('🔍 DEBUG: City validation - city value:', city);
console.log('🔍 DEBUG: City validation - is city valid ObjectId?', city && mongoose.Types.ObjectId.isValid(city));

try {
  if (city && mongoose.Types.ObjectId.isValid(city)) {
    console.log('🔍 DEBUG: City is valid ObjectId, checking if exists in database');
    // We can't actually check the database here, but we can simulate
    console.log('🔍 DEBUG: City ObjectId not found in database (simulated)');
  } else {
    console.log('🔍 DEBUG: City is not a valid ObjectId or is null/undefined');
  }
} catch (cityError) {
  console.error('Error during city validation:', cityError);
}

// Prepare post data
const postData = {
  user,
  category,
  country,
  contact,
  foundLost,
  exactLocation,
  exactDate: new Date(exactDate),
  description: description || "",
};

console.log('\n🔍 DEBUG: Post data before city handling:', postData);

// Handle city field
if (cityId) {
  console.log('🔍 DEBUG: Setting city to ObjectId:', cityId);
  postData.city = cityId;
} else if (city && !mongoose.Types.ObjectId.isValid(city)) {
  console.log('🔍 DEBUG: Setting region to custom city name:', city);
  console.log('🔍 DEBUG: Setting city to null');
  // For custom city names, we need to either:
  // 1. Create a new city record, or
  // 2. Store in region field and handle in aggregation
  // For now, store in region field and we'll handle this in the aggregation
  postData.region = city;
  // Also store a reference to indicate this is a custom city
  postData.city = null; // Explicitly set to null for custom cities
} else {
  console.log('🔍 DEBUG: No city handling applied - cityId:', cityId, 'city:', city);
}

console.log('\n🔍 DEBUG: Final post data:', postData);

console.log('\n📊 Summary:');
console.log('- City field should be null:', postData.city === null);
console.log('- Region field should contain custom city name:', postData.region === city);
console.log('- Both conditions should be true for custom cities');

console.log('\n🔍 The issue might be:');
console.log('1. The city field is not being sent from the client');
console.log('2. The city field is being sent but not processed correctly');
console.log('3. The city field is being processed but not saved to database');
