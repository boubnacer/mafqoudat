# 🌍 GeoNames API Setup Guide

## 📋 **Prerequisites**

Before using the hybrid city search feature, you need to set up a GeoNames API account.

## 🚀 **Step 1: Create GeoNames Account**

1. **Visit GeoNames**: Go to [http://www.geonames.org/login](http://www.geonames.org/login)
2. **Sign Up**: Create a free account
3. **Activate**: Check your email and activate your account
4. **Login**: Login to your account

## 🔑 **Step 2: Get Your Username**

1. **Go to Account**: After logging in, go to your account page
2. **Find Username**: Your username will be displayed (e.g., "your_username")
3. **Copy Username**: Copy this username for the next step

## ⚙️ **Step 3: Configure Environment Variables** 

### **For Development:**
1. **Copy env.example**: `cp server/env.example server/.env`
2. **Edit .env file**: Add your GeoNames username:
   ```bash
   GEONAMES_USERNAME=your_actual_username
   GEONAMES_API_URL=http://api.geonames.org
   ```

### **For Production (Railway):**
1. **Go to Railway Dashboard**: Open your project
2. **Go to Variables**: Click on "Variables" tab
3. **Add Variables**:
   ```
   GEONAMES_USERNAME=your_actual_username
   GEONAMES_API_URL=http://api.geonames.org
   ```

## 🧪 **Step 4: Test the Implementation**

1. **Start your server**: `npm run dev` (in server directory)
2. **Run test script**: `node test-hybrid-search.js`
3. **Check results**: Verify that searches work in all three languages

## 📊 **API Limits (Free Tier)**

- **Daily Limit**: 1,000 requests per day
- **Monthly Limit**: 30,000 requests per month
- **Rate Limit**: No strict rate limiting
- **Cost**: Completely FREE

## 🔍 **How It Works**

### **Search Flow:**
1. **User searches** for a city in any language (Arabic, French, English)
2. **Database First**: Check your local database for the city
3. **API Fallback**: If not found locally, search GeoNames API
4. **Smart Caching**: Cache popular API results to database
5. **Return Results**: Combine local and API results

### **Example Searches:**
```bash
# English search
GET /api/cities/search?q=Casablanca&language=en&countryCode=MA

# Arabic search  
GET /api/cities/search?q=الدار البيضاء&language=ar&countryCode=MA

# French search
GET /api/cities/search?q=Casablanca&language=fr&countryCode=MA
```

## 🎯 **Benefits**

✅ **Complete Coverage**: Access to all cities worldwide  
✅ **Multilingual**: Support for Arabic, French, and English  
✅ **Fast Performance**: Local database for common cities  
✅ **Cost Effective**: Free for your traffic level  
✅ **Smart Caching**: Database grows organically  
✅ **Fallback Safe**: Works even if API is down  

## 🚨 **Troubleshooting**

### **"GeoNames username not configured" Error**
- Check that `GEONAMES_USERNAME` is set in your environment variables
- Restart your server after adding the variable

### **"Rate limit exceeded" Error**
- You've used your daily quota of 1,000 requests
- Wait 24 hours for the limit to reset
- Consider implementing more aggressive caching

### **API Timeout Errors**
- GeoNames API might be slow or down
- The system will fall back to local database results
- Check GeoNames status at [http://www.geonames.org/](http://www.geonames.org/)

### **No Results Found**
- Check that the country code is correct (MA, EG, DZ, etc.)
- Verify the city name spelling
- Try searching in different languages

## 📈 **Monitoring Usage**

Check your API usage:
```bash
GET /api/cities/geonames-stats
```

Response:
```json
{
  "success": true,
  "data": {
    "requestsUsed": 45,
    "requestsRemaining": 955,
    "hoursUntilReset": 18,
    "canMakeRequest": true
  }
}
```

## 🔧 **Advanced Configuration**

### **Custom API URL** (if needed):
```bash
GEONAMES_API_URL=https://secure.geonames.org
```

### **Rate Limiting** (optional):
The service includes built-in rate limiting to prevent exceeding free tier limits.

## 🎉 **You're Ready!**

Once configured, your users can search for any city in Arabic, French, or English, and the system will provide comprehensive results from both your local database and the GeoNames API.

**Happy searching! 🌍**
