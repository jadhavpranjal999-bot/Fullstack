require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/simple_projecthub';
const SESSION_SECRET = process.env.SESSION_SECRET || 'simple_projecthub_secret_key_2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DEFAULT_WHATSAPP = process.env.DEFAULT_WHATSAPP || '919876543210';

// ---------------------------------------------------------
// Middlewares
// ---------------------------------------------------------
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set to false for local development
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// ---------------------------------------------------------
// MongoDB Connection & Schemas
// ---------------------------------------------------------
let isDbConnected = false;

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 3000
})
.then(async () => {
  isDbConnected = true;
  console.log('----------------------------------------------------');
  console.log('✅ Connected successfully to local MongoDB:');
  console.log(`   Database: simple_projecthub`);
  console.log(`   URI: ${MONGODB_URI}`);
  console.log('----------------------------------------------------');
  await seedInitialData();
})
.catch((err) => {
  isDbConnected = false;
  console.error('----------------------------------------------------');
  console.error('❌ MongoDB Connection Error:');
  console.error('   Could not connect to local MongoDB on port 27017.');
  console.error('   Error details:', err.message);
  console.error('   Please ensure MongoDB Community Server is started.');
  console.error('----------------------------------------------------');
});

mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('connected', () => {
  isDbConnected = true;
});

// Middleware to verify database connection before performing DB operations
const checkDbConnection = (req, res, next) => {
  if (!isDbConnected || mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database is currently unavailable. Please ensure MongoDB Community Server is running locally on port 27017.'
    });
  }
  next();
};

// --- Models ---
// 1. Project Schema
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  features: { type: [String], default: [] },
  imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80' },
  category: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// 2. Settings Schema (Stores Admin WhatsApp number, etc.)
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

const Setting = mongoose.model('Setting', settingSchema);

// 3. Enquiry Schema
const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  projectName: { type: String, trim: true, default: 'General' },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

// Initial Data Seeder (only if collections are empty)
async function seedInitialData() {
  try {
    // Seed WhatsApp setting if not present
    const existingWhatsApp = await Setting.findOne({ key: 'whatsappNumber' });
    if (!existingWhatsApp) {
      await Setting.create({ key: 'whatsappNumber', value: DEFAULT_WHATSAPP });
      console.log(`ℹ️ Default WhatsApp contact number set to: ${DEFAULT_WHATSAPP}`);
    }

    // Seed sample college projects if no projects exist
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      const sampleProjects = [
        {
          title: 'Campus Placement Portal',
          description: 'A comprehensive campus placement management platform where students can create profiles, upload resumes, apply for company drives, and track application rounds.',
          features: [
            'Student profile & resume builder',
            'Company drive postings with eligibility filters',
            'Interview scheduling and status tracker',
            'Admin dashboard for placement cell officers'
          ],
          imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
          category: 'Web App'
        },
        {
          title: 'AI Smart Study Planner',
          description: 'An intelligent study schedule generator that analyzes syllabus topics, deadlines, and student study pace to formulate balanced daily study routines.',
          features: [
            'AI-driven topic prioritization',
            'Pomodoro timer with study analytics',
            'Interactive revision checklists',
            'Progress graphs and exam countdown'
          ],
          imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
          category: 'AI/ML'
        },
        {
          title: 'IoT Smart Attendance System',
          description: 'A real-time attendance management system using RFID sensors and NodeMCU microcontrollers that syncs with an online dashboard for teachers and parents.',
          features: [
            'Hardware RFID card tap logging',
            'Instant SMS/Email alerts to parents',
            'Monthly attendance percentage calculator',
            'Export reports to Excel and PDF'
          ],
          imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          category: 'IoT'
        }
      ];
      await Project.insertMany(sampleProjects);
      console.log('ℹ️ Seeded 3 initial showcase projects into MongoDB.');
    }
  } catch (err) {
    console.error('Error during initial data check:', err.message);
  }
}

// ---------------------------------------------------------
// Auth Protection Middleware
// ---------------------------------------------------------
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Admin session required' });
};

// ---------------------------------------------------------
// PUBLIC ROUTES
// ---------------------------------------------------------

// Health & DB status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    dbConnected: isDbConnected && mongoose.connection.readyState === 1
  });
});

// Get current WhatsApp number
app.get('/api/settings', checkDbConnection, async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'whatsappNumber' });
    if (!setting) {
      setting = await Setting.create({ key: 'whatsappNumber', value: DEFAULT_WHATSAPP });
    }
    res.json({ whatsappNumber: setting.value });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// Get all projects (public)
app.get('/api/projects', checkDbConnection, async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    const projects = await Project.find(query).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project details (public)
app.get('/api/projects/:id', checkDbConnection, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: 'Invalid project ID or project not found' });
  }
});

// Submit user enquiry (public)
app.post('/api/enquiries', checkDbConnection, async (req, res) => {
  try {
    const { name, email, phone, projectName, message } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const newEnquiry = await Enquiry.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : '',
      projectName: projectName ? projectName.trim() : 'General',
      message: message.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Your enquiry has been submitted successfully!',
      enquiry: newEnquiry
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit enquiry' });
  }
});

// ---------------------------------------------------------
// ADMIN AUTH ROUTES
// ---------------------------------------------------------

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true, message: 'Logged in successfully as admin' });
  } else {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Check if currently authenticated
app.get('/api/admin/check', (req, res) => {
  res.json({
    authenticated: !!(req.session && req.session.isAdmin)
  });
});

// ---------------------------------------------------------
// PROTECTED ADMIN ROUTES
// ---------------------------------------------------------

// Add project
app.post('/api/admin/projects', requireAdmin, checkDbConnection, async (req, res) => {
  try {
    const { title, description, features, imageUrl, category } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Project description is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Process features: accept array or comma-separated string
    let parsedFeatures = [];
    if (Array.isArray(features)) {
      parsedFeatures = features.map(f => String(f).trim()).filter(Boolean);
    } else if (typeof features === 'string') {
      parsedFeatures = features.split('\n').map(f => f.trim()).filter(Boolean);
    }

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      features: parsedFeatures,
      imageUrl: (imageUrl && imageUrl.trim()) ? imageUrl.trim() : undefined,
      category: category.trim()
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project: ' + err.message });
  }
});

// Update project
app.put('/api/admin/projects/:id', requireAdmin, checkDbConnection, async (req, res) => {
  try {
    const { title, description, features, imageUrl, category } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Project title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Project description is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }

    let parsedFeatures = [];
    if (Array.isArray(features)) {
      parsedFeatures = features.map(f => String(f).trim()).filter(Boolean);
    } else if (typeof features === 'string') {
      parsedFeatures = features.split('\n').map(f => f.trim()).filter(Boolean);
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        description: description.trim(),
        features: parsedFeatures,
        imageUrl: (imageUrl && imageUrl.trim()) ? imageUrl.trim() : undefined,
        category: category.trim()
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ success: true, project: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project: ' + err.message });
  }
});

// Delete project
app.delete('/api/admin/projects/:id', requireAdmin, checkDbConnection, async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Update WhatsApp number
app.put('/api/admin/settings/whatsapp', requireAdmin, checkDbConnection, async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    if (!whatsappNumber || !String(whatsappNumber).trim()) {
      return res.status(400).json({ error: 'WhatsApp number is required' });
    }

    // Basic sanitize (keep digits only)
    const cleaned = String(whatsappNumber).replace(/[^0-9]/g, '');
    if (cleaned.length < 8 || cleaned.length > 15) {
      return res.status(400).json({ error: 'Please enter a valid phone number with country code (e.g. 919876543210)' });
    }

    const updatedSetting = await Setting.findOneAndUpdate(
      { key: 'whatsappNumber' },
      { value: cleaned },
      { upsert: true, new: true }
    );

    res.json({ success: true, whatsappNumber: updatedSetting.value });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update WhatsApp contact number' });
  }
});

// View all user enquiries
app.get('/api/admin/enquiries', requireAdmin, checkDbConnection, async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve enquiries' });
  }
});

// Delete an enquiry (admin cleanup)
app.delete('/api/admin/enquiries/:id', requireAdmin, checkDbConnection, async (req, res) => {
  try {
    const deleted = await Enquiry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

// ---------------------------------------------------------
// Start Server
// ---------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 SimpleProjectHub Backend running on http://localhost:${PORT}`);
});
