// Simple test script to verify API connectivity
console.log('Testing API connectivity...');

// Replace with your actual deployed backend URL
const BACKEND_URL = 'https://your-backend-url.com'; // TODO: Update this

async function testLogin() {
    try {
        console.log('Testing login endpoint...');
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpassword'
            })
        });
        
        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);
    } catch (error) {
        console.error('Login test failed:', error);
    }
}

async function testRegister() {
    try {
        console.log('Testing register endpoint...');
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'testpassword'
            })
        });
        
        console.log('Register response status:', response.status);
        const data = await response.json();
        console.log('Register response data:', data);
    } catch (error) {
        console.error('Register test failed:', error);
    }
}

// Run tests
testLogin();
testRegister();