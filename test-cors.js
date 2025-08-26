const testCORS = async () => {
  // Dynamic import for node-fetch
  const fetch = (await import('node-fetch')).default;

  const testUrls = [
    'http://localhost:5000',
    'https://backbread.onrender.com'
  ];

  const testOrigins = [
    'https://son-bread.vercel.app',
    'https://www.banhmyson.com',  // Add new domain
    'http://localhost:3000',
    'https://backbread.onrender.com'
  ];

  console.log('🧪 Testing CORS Configuration...\n');

  for (const baseUrl of testUrls) {
    console.log(`📍 Testing ${baseUrl}:`);
    
    for (const origin of testOrigins) {
      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          headers: {
            'Origin': origin,
            'Content-Type': 'application/json'
          }
        });

        const corsHeader = response.headers.get('access-control-allow-origin');
        const status = response.status;

        console.log(`  ${origin}: ${status} ${corsHeader ? `(CORS: ${corsHeader})` : '(No CORS header)'}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`    ✅ Health check: ${data.message}`);
        }
      } catch (error) {
        console.log(`  ${origin}: ❌ Error - ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('🎯 CORS Test Complete!');
};

// Run test if called directly
if (require.main === module) {
  testCORS().catch(console.error);
}

module.exports = testCORS;
