import React, { useState, useEffect } from 'react';

// Main Application Component
export default function App() {
  // Navigation: 'home' | 'projects' | 'details' | 'about' | 'enquiry' | 'admin'
  const [currentView, setCurrentView] = useState('home');
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Data states
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [dbError, setDbError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('projects'); // 'projects' | 'whatsapp' | 'enquiries'
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  // Project form (Add / Edit)
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    features: '',
    imageUrl: '',
    category: 'Web App'
  });
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectFormMsg, setProjectFormMsg] = useState({ type: '', text: '' });

  // WhatsApp form state
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [whatsappMsg, setWhatsappMsg] = useState({ type: '', text: '' });

  // Enquiry form state
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    projectName: '',
    message: ''
  });
  const [enquiryStatus, setEnquiryStatus] = useState({ type: '', text: '' });

  // Fetch initial data
  useEffect(() => {
    checkServerAndDb();
    fetchSettings();
    fetchProjects();
    checkAdminAuth();
  }, []);

  // Check backend & DB status
  const checkServerAndDb = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (!data.dbConnected) {
        setDbError('MongoDB is not connected! Please ensure MongoDB Community Server is running on port 27017.');
      } else {
        setDbError('');
      }
    } catch (err) {
      setDbError('Cannot reach backend server. Make sure the server is running on http://localhost:5000');
    }
  };

  // Fetch dynamic WhatsApp number from MongoDB
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setWhatsappNumber(data.whatsappNumber || '');
        setNewWhatsapp(data.whatsappNumber || '');
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
    }
  };

  // Fetch projects from MongoDB
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        setDbError('');
      } else {
        const errData = await res.json();
        setDbError(errData.error || 'Failed to fetch projects from database.');
      }
    } catch (err) {
      setDbError('Unable to connect to database or backend server.');
    } finally {
      setLoadingProjects(false);
    }
  };

  // Check admin session
  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/admin/check', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.authenticated);
      }
    } catch (err) {
      setIsAdmin(false);
    }
  };

  // Helper to generate dynamic WhatsApp chat link
  const getWhatsAppLink = (projectTitle = '') => {
    const num = whatsappNumber || '919876543210';
    const text = projectTitle
      ? `Hello! I would like to order / inquire about the project: "${projectTitle}". Please provide details.`
      : `Hello! I have a question regarding projects on SimpleProjectHub.`;
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  };

  // Handle Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setIsAdmin(true);
        setLoginForm({ username: '', password: '' });
        fetchEnquiries();
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Error connecting to authentication service');
    }
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
      setIsAdmin(false);
      setCurrentView('home');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Fetch enquiries for Admin
  const fetchEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const res = await fetch('/api/admin/enquiries', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data);
      }
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  // Delete enquiry
  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setEnquiries(enquiries.filter(e => e._id !== id));
      }
    } catch (err) {
      alert('Failed to delete enquiry');
    }
  };

  // Save / Update Project
  const handleSaveProject = async (e) => {
    e.preventDefault();
    setProjectFormMsg({ type: '', text: '' });

    if (!projectForm.title || !projectForm.description) {
      setProjectFormMsg({ type: 'error', text: 'Title and description are required!' });
      return;
    }

    try {
      const url = editingProjectId ? `/api/admin/projects/${editingProjectId}` : '/api/admin/projects';
      const method = editingProjectId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm),
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok) {
        setProjectFormMsg({
          type: 'success',
          text: editingProjectId ? 'Project updated successfully!' : 'Project created successfully!'
        });
        setProjectForm({ title: '', description: '', features: '', imageUrl: '', category: 'Web App' });
        setEditingProjectId(null);
        fetchProjects();
      } else {
        setProjectFormMsg({ type: 'error', text: data.error || 'Failed to save project' });
      }
    } catch (err) {
      setProjectFormMsg({ type: 'error', text: 'Server error saving project' });
    }
  };

  // Start Editing Project
  const startEditProject = (p) => {
    setEditingProjectId(p._id);
    setProjectForm({
      title: p.title,
      description: p.description,
      features: Array.isArray(p.features) ? p.features.join('\n') : '',
      imageUrl: p.imageUrl || '',
      category: p.category || 'Web App'
    });
    setProjectFormMsg({ type: '', text: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Editing Project
  const cancelEditProject = () => {
    setEditingProjectId(null);
    setProjectForm({ title: '', description: '', features: '', imageUrl: '', category: 'Web App' });
    setProjectFormMsg({ type: '', text: '' });
  };

  // Delete Project with confirmation
  const handleDeleteProject = async (id, title) => {
    const confirmed = window.confirm(`Are you sure you want to permanently delete the project "${title}"?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchProjects();
        if (selectedProjectId === id) {
          setSelectedProjectId(null);
          setCurrentView('projects');
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete project');
      }
    } catch (err) {
      alert('Error connecting to server to delete project');
    }
  };

  // Update WhatsApp setting
  const handleUpdateWhatsApp = async (e) => {
    e.preventDefault();
    setWhatsappMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/settings/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber: newWhatsapp }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setWhatsappNumber(data.whatsappNumber);
        setWhatsappMsg({ type: 'success', text: `WhatsApp number updated to ${data.whatsappNumber}. All public order buttons updated!` });
      } else {
        setWhatsappMsg({ type: 'error', text: data.error || 'Failed to update WhatsApp number' });
      }
    } catch (err) {
      setWhatsappMsg({ type: 'error', text: 'Server error updating WhatsApp number' });
    }
  };

  // Submit Enquiry
  const handleSubmitEnquiry = async (e) => {
    e.preventDefault();
    setEnquiryStatus({ type: '', text: '' });
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiryForm)
      });
      const data = await res.json();
      if (res.ok) {
        setEnquiryStatus({ type: 'success', text: 'Thank you! Your enquiry has been received. We will get back to you shortly.' });
        setEnquiryForm({ name: '', email: '', phone: '', projectName: '', message: '' });
      } else {
        setEnquiryStatus({ type: 'error', text: data.error || 'Failed to submit enquiry' });
      }
    } catch (err) {
      setEnquiryStatus({ type: 'error', text: 'Cannot connect to server. Please try again later.' });
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedProject = projects.find(p => p._id === selectedProjectId);

  const categories = ['All', 'Web App', 'Mobile App', 'AI/ML', 'IoT', 'Cloud'];

  return (
    <div className="app-container">
      {/* Top Database Warning Banner if MongoDB is disconnected */}
      {dbError && (
        <div className="db-alert-banner">
          <span>⚠️ <strong>Database Alert:</strong> {dbError}</span>
          <button onClick={checkServerAndDb} className="btn-retry">Retry Connection</button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => { setCurrentView('home'); setSelectedProjectId(null); }}>
          <span className="brand-icon">📁</span>
          <span className="brand-name">SimpleProjectHub</span>
        </div>

        <nav className="nav-links">
          <button className={`nav-btn ${currentView === 'home' ? 'active' : ''}`} onClick={() => { setCurrentView('home'); setSelectedProjectId(null); }}>Home</button>
          <button className={`nav-btn ${currentView === 'projects' || currentView === 'details' ? 'active' : ''}`} onClick={() => { setCurrentView('projects'); setSelectedProjectId(null); }}>Projects</button>
          <button className={`nav-btn ${currentView === 'about' ? 'active' : ''}`} onClick={() => { setCurrentView('about'); setSelectedProjectId(null); }}>About</button>
          <button className={`nav-btn ${currentView === 'enquiry' ? 'active' : ''}`} onClick={() => { setCurrentView('enquiry'); setSelectedProjectId(null); }}>Enquiry</button>
          <button className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`} onClick={() => { setCurrentView('admin'); if (isAdmin) fetchEnquiries(); }}>
            {isAdmin ? 'Admin Dashboard' : 'Admin Login'}
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* VIEW 1: HOME */}
        {currentView === 'home' && (
          <div>
            <section className="hero-section">
              <span className="hero-tag">Academic & Final Year Projects</span>
              <h1 className="hero-title">Ready-to-Use Student Projects with Verified Source Code</h1>
              <p className="hero-subtitle">
                Explore fully working Web, Mobile, AI/ML, and IoT projects designed for students and colleges. Complete with documentation, viva questions, and instant WhatsApp support.
              </p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={() => setCurrentView('projects')}>Browse All Projects</button>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  <span>💬 Chat on WhatsApp</span>
                </a>
              </div>
            </section>

            {/* Highlights */}
            <section className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>100% Working Code</h3>
                <p>Every project is locally tested and verified with step-by-step installation guides.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📖</div>
                <h3>Report & Viva Guides</h3>
                <p>Get synopsis templates, architecture diagrams, and frequently asked viva questions.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📞</div>
                <h3>Direct WhatsApp Support</h3>
                <p>Instant answers to your queries and customized project assistance directly on WhatsApp.</p>
              </div>
            </section>

            {/* Featured Projects Preview */}
            <section className="section-featured">
              <div className="section-header">
                <h2>Featured Projects</h2>
                <button className="btn-link" onClick={() => setCurrentView('projects')}>View all ({projects.length}) &rarr;</button>
              </div>

              {loadingProjects ? (
                <div className="loading-box">Loading projects from MongoDB...</div>
              ) : projects.length === 0 ? (
                <div className="empty-box">No projects available yet. Log in to the Admin Dashboard to add your first project!</div>
              ) : (
                <div className="projects-grid">
                  {projects.slice(0, 3).map(p => (
                    <div key={p._id} className="project-card">
                      <div className="card-image-wrap">
                        <img src={p.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'} alt={p.title} className="card-image" />
                        <span className="card-category-badge">{p.category}</span>
                      </div>
                      <div className="card-body">
                        <h3 className="card-title">{p.title}</h3>
                        <p className="card-desc">{p.description.slice(0, 110)}...</p>
                        <div className="card-actions">
                          <button
                            className="btn-secondary"
                            onClick={() => { setSelectedProjectId(p._id); setCurrentView('details'); }}
                          >
                            View Details
                          </button>
                          <a
                            href={getWhatsAppLink(p.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp-sm"
                          >
                            💬 Order on WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VIEW 2: PROJECTS LIST */}
        {currentView === 'projects' && (
          <section className="page-container">
            <div className="page-header">
              <h1>Explore Projects</h1>
              <p>Browse through our collection of academic projects across domains.</p>
            </div>

            {/* Filters and Search Bar */}
            <div className="filter-bar">
              <div className="category-pills">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="search-wrap">
                <input
                  type="text"
                  placeholder="Search projects by title or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="search-clear-btn" onClick={() => setSearchQuery('')}>&times;</button>
                )}
              </div>
            </div>

            {/* Projects Grid */}
            {loadingProjects ? (
              <div className="loading-box">Loading projects from MongoDB...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="empty-box">
                <p>No projects match your search criteria.</p>
                <button className="btn-secondary" onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}>Reset Filters</button>
              </div>
            ) : (
              <div className="projects-grid">
                {filteredProjects.map(p => (
                  <div key={p._id} className="project-card">
                    <div className="card-image-wrap">
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'}
                        alt={p.title}
                        className="card-image"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'; }}
                      />
                      <span className="card-category-badge">{p.category}</span>
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{p.title}</h3>
                      <p className="card-desc">{p.description.slice(0, 120)}...</p>
                      
                      {p.features && p.features.length > 0 && (
                        <div className="card-feature-pills">
                          {p.features.slice(0, 2).map((feat, idx) => (
                            <span key={idx} className="feature-tag">✓ {feat}</span>
                          ))}
                        </div>
                      )}

                      <div className="card-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => { setSelectedProjectId(p._id); setCurrentView('details'); }}
                        >
                          View Details
                        </button>
                        <a
                          href={getWhatsAppLink(p.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp-sm"
                        >
                          💬 Order on WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* VIEW 3: PROJECT DETAILS */}
        {currentView === 'details' && selectedProject && (
          <section className="page-container">
            <button className="btn-back" onClick={() => setCurrentView('projects')}>
              &larr; Back to Projects
            </button>

            <div className="details-container">
              <div className="details-image-box">
                <img
                  src={selectedProject.imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80'}
                  alt={selectedProject.title}
                  className="details-image"
                />
                <div className="details-order-card">
                  <h3>Interested in this project?</h3>
                  <p>Get full source code, database scripts, and project documentation on WhatsApp.</p>
                  <a
                    href={getWhatsAppLink(selectedProject.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp full-width"
                  >
                    💬 Order on WhatsApp Now
                  </a>
                  <button
                    className="btn-secondary full-width"
                    style={{ marginTop: '0.75rem' }}
                    onClick={() => {
                      setEnquiryForm(prev => ({ ...prev, projectName: selectedProject.title }));
                      setCurrentView('enquiry');
                    }}
                  >
                    Submit an Enquiry
                  </button>
                </div>
              </div>

              <div className="details-info-box">
                <span className="details-badge">{selectedProject.category}</span>
                <h1 className="details-title">{selectedProject.title}</h1>

                <div className="details-section">
                  <h3>Project Overview</h3>
                  <p className="details-desc">{selectedProject.description}</p>
                </div>

                {selectedProject.features && selectedProject.features.length > 0 && (
                  <div className="details-section">
                    <h3>Key Features</h3>
                    <ul className="features-list">
                      {selectedProject.features.map((feat, idx) => (
                        <li key={idx}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="details-section">
                  <h3>What is Included</h3>
                  <div className="included-items-grid">
                    <div className="included-item">📦 Complete Source Code</div>
                    <div className="included-item">🗄️ Database Setup Script</div>
                    <div className="included-item">📄 Project Report & PPT Template</div>
                    <div className="included-item">🛠️ Installation & Run Support</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 4: ABOUT */}
        {currentView === 'about' && (
          <section className="page-container content-narrow">
            <div className="page-header">
              <h1>About SimpleProjectHub</h1>
              <p>Empowering engineering students with verified, beginner-friendly academic projects.</p>
            </div>

            <div className="about-card">
              <h2>Our Mission</h2>
              <p>
                SimpleProjectHub is designed to help college students build, understand, and present academic projects with confidence. We provide clean, tested, and explainable projects in modern technologies like Web Development, AI/ML, Cloud, and IoT.
              </p>

              <h2>Why Choose SimpleProjectHub?</h2>
              <div className="about-points">
                <div className="about-point">
                  <strong>Clear & Explainable Code:</strong> No convoluted abstractions. Every line of code is written so you can easily understand and defend it before your viva examiners.
                </div>
                <div className="about-point">
                  <strong>Local Database Support:</strong> Works directly with local MongoDB Community Server on your machine without requiring external cloud accounts or complex credentials.
                </div>
                <div className="about-point">
                  <strong>Direct WhatsApp Ordering:</strong> Connect directly with project mentors via WhatsApp for instant delivery and customization.
                </div>
              </div>

              <h2>Project Architecture</h2>
              <p>
                This platform is built using a clean <strong>MERN</strong> architecture:
              </p>
              <ul>
                <li><strong>Frontend:</strong> React.js with simple, responsive modern CSS.</li>
                <li><strong>Backend:</strong> Node.js and Express REST API with session-based administrative security.</li>
                <li><strong>Database:</strong> Local MongoDB with Mongoose schema definitions.</li>
              </ul>

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  💬 Contact Us on WhatsApp
                </a>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 5: ENQUIRY */}
        {currentView === 'enquiry' && (
          <section className="page-container content-narrow">
            <div className="page-header">
              <h1>Project Enquiry</h1>
              <p>Have questions about a project or need custom modifications? Send us a message.</p>
            </div>

            <div className="form-card">
              {enquiryStatus.text && (
                <div className={`alert-box ${enquiryStatus.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  {enquiryStatus.text}
                </div>
              )}

              <form onSubmit={handleSubmitEnquiry}>
                <div className="form-group">
                  <label>Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={enquiryForm.email}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Phone / WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Project Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Campus Placement Portal"
                    value={enquiryForm.projectName}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, projectName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Your Message / Requirements *</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Describe what you need help with (e.g. project setup, source code, report documentation)..."
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn-primary full-width">
                  Send Enquiry
                </button>
              </form>

              <div className="enquiry-or-divider">
                <span>OR</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#4b5563', marginBottom: '0.75rem' }}>Need immediate answers? Talk to us right now:</p>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  💬 Chat Instantly on WhatsApp
                </a>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 6: ADMIN (LOGIN or DASHBOARD) */}
        {currentView === 'admin' && (
          <section className="page-container">
            {!isAdmin ? (
              // Admin Login Form
              <div className="content-narrow">
                <div className="page-header">
                  <h1>Admin Login</h1>
                  <p>Restricted access for platform administrators.</p>
                </div>

                <div className="form-card">
                  {loginError && <div className="alert-box alert-error">{loginError}</div>}

                  <form onSubmit={handleLogin}>
                    <div className="form-group">
                      <label>Admin Username</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter username"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Admin Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      />
                    </div>

                    <button type="submit" className="btn-primary full-width">
                      Log In to Dashboard
                    </button>
                  </form>

                  <div className="login-tip">
                    <small>Default credentials in <code>server/.env</code>: username: <code>admin</code>, password: <code>admin123</code></small>
                  </div>
                </div>
              </div>
            ) : (
              // Admin Dashboard
              <div>
                <div className="admin-header">
                  <div>
                    <h1>Admin Control Panel</h1>
                    <p>Manage projects, configure WhatsApp contact, and review student enquiries.</p>
                  </div>
                  <button className="btn-secondary" onClick={handleLogout}>Log Out</button>
                </div>

                {/* Admin Tabs */}
                <div className="admin-tabs">
                  <button
                    className={`tab-btn ${adminTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setAdminTab('projects')}
                  >
                    📁 Manage Projects ({projects.length})
                  </button>
                  <button
                    className={`tab-btn ${adminTab === 'whatsapp' ? 'active' : ''}`}
                    onClick={() => setAdminTab('whatsapp')}
                  >
                    💬 WhatsApp Settings
                  </button>
                  <button
                    className={`tab-btn ${adminTab === 'enquiries' ? 'active' : ''}`}
                    onClick={() => { setAdminTab('enquiries'); fetchEnquiries(); }}
                  >
                    📬 Student Enquiries ({enquiries.length})
                  </button>
                </div>

                {/* TAB 1: PROJECTS MANAGEMENT */}
                {adminTab === 'projects' && (
                  <div className="admin-grid">
                    {/* Add / Edit Form */}
                    <div className="admin-card">
                      <h2>{editingProjectId ? '✏️ Edit Project' : '➕ Add New Project'}</h2>
                      
                      {projectFormMsg.text && (
                        <div className={`alert-box ${projectFormMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                          {projectFormMsg.text}
                        </div>
                      )}

                      <form onSubmit={handleSaveProject}>
                        <div className="form-group">
                          <label>Project Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Smart Attendance Portal"
                            value={projectForm.title}
                            onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Category *</label>
                          <select
                            value={projectForm.category}
                            onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                          >
                            <option value="Web App">Web App</option>
                            <option value="Mobile App">Mobile App</option>
                            <option value="AI/ML">AI/ML</option>
                            <option value="IoT">IoT</option>
                            <option value="Cloud">Cloud</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Image URL (Unsplash or direct image link)</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={projectForm.imageUrl}
                            onChange={(e) => setProjectForm({ ...projectForm, imageUrl: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Description *</label>
                          <textarea
                            rows="4"
                            required
                            placeholder="Detailed description of the project problem statement, solution, and tech stack..."
                            value={projectForm.description}
                            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                          ></textarea>
                        </div>

                        <div className="form-group">
                          <label>Features (One feature per line)</label>
                          <textarea
                            rows="3"
                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                            value={projectForm.features}
                            onChange={(e) => setProjectForm({ ...projectForm, features: e.target.value })}
                          ></textarea>
                        </div>

                        <div className="form-actions">
                          <button type="submit" className="btn-primary">
                            {editingProjectId ? 'Save Changes' : 'Create Project'}
                          </button>
                          {editingProjectId && (
                            <button type="button" className="btn-secondary" onClick={cancelEditProject}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Existing Projects Table */}
                    <div className="admin-card">
                      <h2>Existing Projects ({projects.length})</h2>
                      {projects.length === 0 ? (
                        <p className="empty-text">No projects found in database.</p>
                      ) : (
                        <div className="admin-table-wrap">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projects.map(p => (
                                <tr key={p._id}>
                                  <td>
                                    <strong>{p.title}</strong>
                                    <div className="table-subtext">{p.description.slice(0, 50)}...</div>
                                  </td>
                                  <td><span className="badge-tag">{p.category}</span></td>
                                  <td>
                                    <div className="table-actions">
                                      <button className="btn-sm btn-edit" onClick={() => startEditProject(p)}>Edit</button>
                                      <button className="btn-sm btn-delete" onClick={() => handleDeleteProject(p._id, p.title)}>Delete</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: WHATSAPP SETTINGS */}
                {adminTab === 'whatsapp' && (
                  <div className="content-narrow">
                    <div className="admin-card">
                      <h2>WhatsApp Contact Settings</h2>
                      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                        When you change this number, all public "Order on WhatsApp" buttons will immediately use this updated number.
                      </p>

                      {whatsappMsg.text && (
                        <div className={`alert-box ${whatsappMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                          {whatsappMsg.text}
                        </div>
                      )}

                      <form onSubmit={handleUpdateWhatsApp}>
                        <div className="form-group">
                          <label>WhatsApp Number (With Country Code, digits only)</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 919876543210"
                            value={newWhatsapp}
                            onChange={(e) => setNewWhatsapp(e.target.value)}
                          />
                          <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                            Example for India: <code>91</code> followed by 10-digit mobile number (e.g. <code>919876543210</code>)
                          </small>
                        </div>

                        <div className="current-number-preview">
                          <strong>Current Active Number:</strong> <code>{whatsappNumber || 'Not set'}</code>
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                          Save & Update Number
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB 3: USER ENQUIRIES */}
                {adminTab === 'enquiries' && (
                  <div className="admin-card">
                    <div className="section-header">
                      <h2>User Enquiries ({enquiries.length})</h2>
                      <button className="btn-secondary" onClick={fetchEnquiries}>Refresh</button>
                    </div>

                    {loadingEnquiries ? (
                      <div className="loading-box">Loading enquiries...</div>
                    ) : enquiries.length === 0 ? (
                      <p className="empty-text">No enquiries received yet.</p>
                    ) : (
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Name</th>
                              <th>Contact</th>
                              <th>Project</th>
                              <th>Message</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {enquiries.map(enq => (
                              <tr key={enq._id}>
                                <td>{new Date(enq.createdAt).toLocaleDateString()}</td>
                                <td><strong>{enq.name}</strong></td>
                                <td>
                                  <div>✉️ {enq.email}</div>
                                  {enq.phone && <div>📞 {enq.phone}</div>}
                                </td>
                                <td><span className="badge-tag">{enq.projectName || 'General'}</span></td>
                                <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap' }}>{enq.message}</td>
                                <td>
                                  <button className="btn-sm btn-delete" onClick={() => handleDeleteEnquiry(enq._id)}>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div>
            <div className="footer-logo">SimpleProjectHub</div>
            <p className="footer-desc">A lightweight, clean platform for final year and academic projects.</p>
          </div>
          <div className="footer-contact">
            <strong>Contact WhatsApp:</strong>
            <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="footer-wa-link">
              💬 +{whatsappNumber || '919876543210'}
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SimpleProjectHub. Built with React, Node.js & MongoDB.</p>
        </div>
      </footer>
    </div>
  );
}
