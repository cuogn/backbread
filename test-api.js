// Simple API test script
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000';

const testEndpoints = async () => {
  console.log('🧪 Testing Backend API Endpoints...\n');

  const endpoints = [
    { name: 'Health Check', url: '/health' },
    { name: 'API Info', url: '/api' },
    { name: 'Products', url: '/api/products?page=1&limit=5' },
    { name: 'Categories', url: '/api/categories' },
    { name: 'Branches', url: '/api/branches' },
    { name: 'Payment Methods', url: '/api/payment-methods' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await fetch(`${API_BASE_URL}${endpoint.url}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        
        if (endpoint.name === 'Products' && data.data?.products) {
          console.log(`   - Found ${data.data.products.length} products`);
          console.log(`   - Total items: ${data.data.pagination?.total_items || 0}`);
        } else if (data.data && Array.isArray(data.data)) {
          console.log(`   - Found ${data.data.length} items`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: HTTP ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎯 API Test Complete!');
};

// Run tests
if (require.main === module) {
  testEndpoints().catch(console.error);
}

module.exports = { testEndpoints };
