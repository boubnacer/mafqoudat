async function testDashboardSimple() {
  try {
    console.log('🧪 Testing dashboard API after city field fix...');
    
    const baseUrl = "https://mafqoudat-production.up.railway.app";
    const countryId = "68a4b54ab46524c54c553ca9"; // Morocco
    
    console.log('📡 Making API request...');
    const response = await fetch(`${baseUrl}/dependencies/dashboard?countryId=${countryId}`);
    
    console.log('📥 API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n📊 Dashboard Summary:');
      console.log('Total Founds:', data.totalFounds);
      console.log('Total Losts:', data.totalLosts);
      console.log('Recent Founds Count:', data.recentFounds?.length || 0);
      console.log('Recent Losts Count:', data.recentLosts?.length || 0);
      console.log('Trending Posts Count:', data.trendingPosts?.length || 0);
      
      // Check the latest posts for city names
      if (data.recentFounds && data.recentFounds.length > 0) {
        console.log('\n🏙️ Recent Founds City Names:');
        data.recentFounds.forEach((post, index) => {
          console.log(`Post ${index + 1}:`);
          console.log(`  - cityName: "${post.cityName}"`);
          console.log(`  - city: "${post.city}"`);
          console.log(`  - categoryname: "${post.categoryname}"`);
          console.log(`  - exactLocation: "${post.exactLocation}"`);
        });
      }
      
      if (data.trendingPosts && data.trendingPosts.length > 0) {
        console.log('\n🔥 Trending Posts City Names:');
        data.trendingPosts.forEach((post, index) => {
          console.log(`Post ${index + 1}:`);
          console.log(`  - cityName: "${post.cityName}"`);
          console.log(`  - city: "${post.city}"`);
          console.log(`  - categoryName: "${post.categoryName}"`);
          console.log(`  - exactLocation: "${post.exactLocation}"`);
        });
      }
      
      console.log('\n✅ Dashboard API test completed!');
      console.log('💡 Check if city names are now showing correctly instead of "Casablanca"');
      
    } else {
      console.log('❌ Dashboard API failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard:', error);
  }
}

testDashboardSimple();
