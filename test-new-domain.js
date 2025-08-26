async function testNewDomain() {
  console.log('🧪 Testing new domain CORS...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://backbread.onrender.com/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://www.banhmyson.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('Status:', response.status);
    console.log('CORS Headers:');
    console.log('Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
    console.log('Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
    console.log('Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNewDomain();
