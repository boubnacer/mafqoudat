const fetch = require('node-fetch');

async function testActualPostCreation() {
  try {
    console.log('🧪 Testing actual post creation via API...');
    
    // Test data that matches what you created
    const testData = {
      user: "68af89bb30464c5a97ca8fcf",
      country: "68a4b54ab46524c54c553cae", // This is the country from your post
      category: "68a4b54ab46524c54c553cc9",
      foundLost: "68a4b54ab46524c553cc3",
      city: "Custom City Test", // Custom city name
      exactLocation: "Test Location",
      exactDate: "2025-08-28",
      contact: "0000000000",
      description: "Test description for debugging"
    };

    console.log('📤 Sending data to API:');
    console.log(JSON.stringify(testData, null, 2));

    // Create FormData (like the client does)
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append("user", testData.user);
    formData.append("country", testData.country);
    formData.append("category", testData.category);
    formData.append("foundLost", testData.foundLost);
    formData.append("city", testData.city);
    formData.append("exactLocation", testData.exactLocation);
    formData.append("exactDate", testData.exactDate);
    formData.append("contact", testData.contact);
    formData.append("description", testData.description);
    formData.append("contactPreferences", JSON.stringify({
      phone: true,
      email: false,
      whatsapp: false
    }));
    formData.append("additionalContact", JSON.stringify({
      phone: "",
      email: "",
      whatsapp: ""
    }));

    console.log('\n📋 FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    // Try to send to API
    const baseUrl = process.env.REACT_APP_API_URL || "https://mafqoudat-production.up.railway.app";
    const response = await fetch(`${baseUrl}/posts`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
      }
    });

    console.log('\n📥 API Response:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseData = await response.text();
    console.log('Response Body:', responseData);

    if (response.ok) {
      console.log('\n✅ Post created successfully!');
      console.log('Now check the database to see if city and region fields are present');
    } else {
      console.log('\n❌ Post creation failed');
    }

  } catch (error) {
    console.error('❌ Error testing post creation:', error);
  }
}

testActualPostCreation();
