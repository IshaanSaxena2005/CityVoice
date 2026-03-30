require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET || 'Not set');
console.log('PORT:', process.env.PORT || 'Not set');