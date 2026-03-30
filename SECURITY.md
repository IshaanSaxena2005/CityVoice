# Security Guidelines for CityVoice

## 🔒 Important Security Practices

### Environment Variables
- **NEVER commit `.env` files to GitHub**
- This project uses `.env.example` as a template
- Copy `.env.example` to `.env` and fill in your actual values
- Keep your `.env` file private and local only

### Setup Instructions

1. Clone the repository
2. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```
3. Generate a secure JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
4. Update `.env` with your generated secret and any other custom configurations

### What's Protected?

The following files/folders are ignored by Git:
- `.env` - Contains sensitive credentials
- `node_modules/` - Dependencies
- `uploads/` - User uploaded files
- OS files (`.DS_Store`, `Thumbs.db`)

### Security Features Implemented

✅ Helmet.js for HTTP security headers  
✅ CORS protection  
✅ Rate limiting (100 requests per 15 minutes)  
✅ bcrypt password hashing  
✅ JWT token authentication  
✅ File upload restrictions (type & size limits)  
✅ Input validation  

### For Production Deployment

- Use strong, randomly generated secrets
- Set up proper database (not in-memory storage)
- Enable HTTPS
- Configure proper CORS origins
- Use environment variables for all secrets
- Regular security audits
