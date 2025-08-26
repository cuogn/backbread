async function testAdminLogin() {
  console.log('🧪 Testing Admin Login...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://backbread.onrender.com/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://www.banhmyson.com'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    console.log('Status:', response.status);
    console.log('CORS Headers:');
    console.log('Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
    } else {
      const errorText = await response.text();
      console.log('Error Response:', errorText);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAdminLogin();
