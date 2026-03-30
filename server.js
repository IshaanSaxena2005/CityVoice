const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret - MUST be set in environment variable in production
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('⚠️  WARNING: JWT_SECRET not set in environment variables!');
    console.error('⚠️  Please set JWT_SECRET in your .env file or environment');
    console.error('⚠️  Using a default secret for development only - NOT SECURE FOR PRODUCTION!');
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Allow inline scripts
                "https://cdn.tailwindcss.com", // Tailwind CSS
                "https://unpkg.com", // Leaflet maps
                "https://cdnjs.cloudflare.com" // Font Awesome
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'", // Allow inline styles
                "https://cdn.tailwindcss.com",
                "https://unpkg.com",
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: [
                "'self'",
                "data:", // Allow data URLs
                "https://via.placeholder.com", // Placeholder images
                "https://*.tile.openstreetmap.org", // Map tiles
                "https://*.openstreetmap.org" // Map attribution
            ],
            fontSrc: [
                "'self'",
                "https://cdnjs.cloudflare.com" // Font Awesome fonts
            ],
            connectSrc: [
                "'self'",
                "https://nominatim.openstreetmap.org", // Geocoding if needed
                "https://unpkg.com" // Allow Leaflet source maps
            ]
        }
    }
}));
app.use(cors({
    origin: true, // Allow same origin
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use('/api', (req, res, next) => {
    console.log(`🚀 API Request: ${req.method} ${req.path}`);
    next();
});

// Static files
app.use('/uploads', express.static('uploads'));

// Serve frontend files (HTML, CSS, JS)
app.use(express.static('./', {
    index: 'index.html'
}));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images and videos are allowed'));
        }
    }
});

// In-memory storage (replace with database in production)
let reports = [];
let users = [];
let tickets = [];

// Utility function to generate ticket ID
function generateTicketId() {
    const prefix = 'CIV';
    const number = String(tickets.length + 1).padStart(3, '0');
    return `${prefix}-${number}`;
}

// JWT Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
}

// Routes

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
    console.log('📝 Registration attempt:', req.body);
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }
        
        if (password.length < 6) {
            console.log('❌ Password too short');
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }
        
        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: Date.now(),
            name,
            email,
            password: hashedPassword, // Store hashed password
            joinDate: new Date().toISOString().split('T')[0],
            reportsCount: 0,
            resolvedCount: 0,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        console.log('✅ User registered successfully:', email);
        
        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, name: newUser.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Return user without password
        const { password: _, ...userResponse } = newUser;
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userResponse,
            token
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    console.log('🔓 Login attempt:', req.body.email);
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('❌ Missing login credentials');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Find user
        const user = users.find(u => u.email === email);
        
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        console.log('✅ Login successful for:', email);
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Return user without password
        const { password: _, ...userResponse } = user;
        
        res.json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Get user profile (protected route)
app.get('/api/auth/profile/:userId', authenticateToken, (req, res) => {
    try {
        // If userId is 0, just verify the token and return the authenticated user
        if (req.params.userId === '0') {
            const user = users.find(u => u.id === req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Count user's reports
            const userReports = reports.filter(r => r.reportedBy === user.email);
            const resolvedReports = userReports.filter(r => r.status === 'resolved');
            
            // Update user stats
            user.reportsCount = userReports.length;
            user.resolvedCount = resolvedReports.length;
            
            // Return user without password
            const { password: _, ...userResponse } = user;
            
            return res.json({
                success: true,
                user: userResponse
            });
        }
        
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own profile
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Count user's reports
        const userReports = reports.filter(r => r.reportedBy === user.email);
        const resolvedReports = userReports.filter(r => r.status === 'resolved');
        
        // Update user stats
        user.reportsCount = userReports.length;
        user.resolvedCount = resolvedReports.length;
        
        // Return user without password
        const { password: _, ...userResponse } = user;
        
        res.json({
            success: true,
            user: userResponse
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CityVoice API is running' });
});

// Get all reports
app.get('/api/reports', (req, res) => {
    try {
        const { status, category, limit = 50 } = req.query;
        let filteredReports = [...reports];

        if (status) {
            filteredReports = filteredReports.filter(report => report.status === status);
        }

        if (category) {
            filteredReports = filteredReports.filter(report => report.category === category);
        }

        filteredReports = filteredReports.slice(0, parseInt(limit));

        res.json({
            success: true,
            data: filteredReports,
            total: filteredReports.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching reports',
            error: error.message
        });
    }
});

// Create new report (protected route)
app.post('/api/reports', authenticateToken, upload.array('files', 5), (req, res) => {
    try {
        const { category, description, latitude, longitude } = req.body;

        if (!category || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Category, latitude, and longitude are required'
            });
        }

        const ticketId = generateTicketId();
        const files = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        })) : [];

        const newReport = {
            id: Date.now(),
            ticketId,
            category,
            description: description || '',
            location: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            },
            files,
            status: 'pending',
            priority: 'medium',
            upvotes: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reportedBy: req.user.email,
            userId: req.user.id
        };

        reports.push(newReport);
        tickets.push({
            id: ticketId,
            reportId: newReport.id,
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: {
                ticketId,
                report: newReport
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating report',
            error: error.message
        });
    }
});

// Get specific report
app.get('/api/reports/:id', (req, res) => {
    try {
        const report = reports.find(r => r.id === parseInt(req.params.id));
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching report',
            error: error.message
        });
    }
});

// Update report status (protected route)
app.patch('/api/reports/:id/status', authenticateToken, (req, res) => {
    try {
        const { status } = req.body;
        const reportIndex = reports.findIndex(r => r.id === parseInt(req.params.id));

        if (reportIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check if user owns this report
        if (reports[reportIndex].userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (!['pending', 'progress', 'resolved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        reports[reportIndex].status = status;
        reports[reportIndex].updatedAt = new Date().toISOString();

        res.json({
            success: true,
            message: 'Report status updated',
            data: reports[reportIndex]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating report status',
            error: error.message
        });
    }
});

// Upvote report
app.post('/api/reports/:id/upvote', (req, res) => {
    try {
        const reportIndex = reports.findIndex(r => r.id === parseInt(req.params.id));

        if (reportIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        reports[reportIndex].upvotes += 1;
        reports[reportIndex].updatedAt = new Date().toISOString();

        res.json({
            success: true,
            message: 'Report upvoted',
            data: {
                upvotes: reports[reportIndex].upvotes
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error upvoting report',
            error: error.message
        });
    }
});

// Get analytics/statistics
app.get('/api/analytics', (req, res) => {
    try {
        const totalReports = reports.length;
        const pendingReports = reports.filter(r => r.status === 'pending').length;
        const progressReports = reports.filter(r => r.status === 'progress').length;
        const resolvedReports = reports.filter(r => r.status === 'resolved').length;
        const resolvedPercentage = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

        const categoryStats = reports.reduce((acc, report) => {
            acc[report.category] = (acc[report.category] || 0) + 1;
            return acc;
        }, {});

        const hotspots = Object.keys(categoryStats).length;

        res.json({
            success: true,
            data: {
                totalReports,
                pendingReports,
                progressReports,
                resolvedReports,
                resolvedPercentage,
                hotspots,
                categoryStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics',
            error: error.message
        });
    }
});

// AI simulation endpoint for issue detection
app.post('/api/ai/detect', upload.single('image'), (req, res) => {
    try {
        // Simulate AI detection
        const categories = ['pothole', 'water', 'streetlight', 'garbage'];
        const confidence = [0.85, 0.92, 0.78, 0.95];
        
        const randomIndex = Math.floor(Math.random() * categories.length);
        const detectedCategory = categories[randomIndex];
        const detectedConfidence = confidence[randomIndex];

        res.json({
            success: true,
            data: {
                category: detectedCategory,
                confidence: detectedConfidence,
                suggestions: [
                    `Detected: ${detectedCategory}`,
                    `Confidence: ${Math.round(detectedConfidence * 100)}%`
                ]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing image',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 10MB.'
            });
        }
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API route not found'
    });
});

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 CityVoice API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📱 API base URL: http://localhost:${PORT}/api`);
});

module.exports = app;