# SimpleProjectHub

A clean, beginner-friendly MERN stack web platform for college students to browse, manage, and order final year and academic projects via WhatsApp.

---

## 🌟 Key Features

- **Public Website:**
  - **Home:** Hero introduction, feature highlights, and featured projects showcase.
  - **Projects:** Browse academic projects across categories (Web App, Mobile App, AI/ML, IoT, Cloud) with instant search and category filtering.
  - **Project Details:** Comprehensive view with detailed description, key feature bullet points, and project inclusions.
  - **Order on WhatsApp:** Every project includes an "Order on WhatsApp" button with dynamic phone number and prefilled project title.
  - **About:** Overview of the platform, mission, and technology stack.
  - **Enquiry Form:** Direct contact form for student queries, saved directly to MongoDB.

- **Admin Control Panel:**
  - Secure session-based authentication (`express-session`).
  - **Project Management:** Add new projects, edit existing projects, and delete projects with confirmation dialogs.
  - **Dynamic WhatsApp Setting:** Change the admin WhatsApp number in real-time. All public WhatsApp buttons instantly update without touching frontend code.
  - **Student Enquiries:** View all submitted enquiries with contact information and date.

- **Database Resilience:**
  - Works with local MongoDB (`simple_projecthub`).
  - Displays user-friendly error banners if MongoDB is stopped or not running on port 27017.
  - Automatically seeds default settings and sample projects on first run.

---

## 🛠️ Technology Stack

- **Frontend:** React (JavaScript, Vite) & Clean Custom CSS (Blue & White theme)
- **Backend:** Node.js & Express
- **Database:** Local MongoDB with Mongoose ODM
- **Authentication:** Session-based Admin Authentication (`express-session`)

---

## 📂 Project Structure

```text
SimpleProjectHub/
├── package.json              # Root package with install & dev scripts
├── .gitignore                # Ignores node_modules, .env, and build artifacts
├── README.md                 # Complete setup and execution guide
├── server/
│   ├── package.json          # Backend dependencies
│   ├── server.js             # Express API, MongoDB models, CRUD routes & auth
│   ├── .env                  # Local environment configuration
│   └── .env.example          # Template for environment variables
└── client/
    ├── package.json          # Frontend dependencies
    ├── index.html            # HTML entry point
    ├── vite.config.js        # Vite dev server with API proxy
    └── src/
        ├── main.jsx          # React DOM render root
        ├── App.jsx           # Main React component (Public pages + Admin)
        └── App.css           # Clean blue & white responsive styling
```

---

## 💻 Prerequisites for Any PC

To run this project on any Windows PC, make sure you have:
1. **Node.js** (v18.0.0 or later): [https://nodejs.org](https://nodejs.org)
2. **MongoDB Community Server**: [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Ensure MongoDB is running as a Windows Service or started manually on default port `27017`.

---

## 🚀 Setup & Running (Windows PowerShell)

Open **Windows PowerShell** and navigate to the project directory:

### Step 1: Install All Dependencies
Run this single command from the `SimpleProjectHub` root folder:
```powershell
npm run install:all
```
*(This automatically installs dependencies in the root, server, and client folders).*

### Step 2: Ensure Local MongoDB is Running
MongoDB runs by default on `mongodb://127.0.0.1:27017`.
To check if the MongoDB Windows service is running:
```powershell
Get-Service MongoDB
```
If it is stopped, start it with:
```powershell
net start MongoDB
```

### Step 3: Configure Environment Variables
Verify or adjust `server/.env` if needed:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/simple_projecthub
SESSION_SECRET=simple_projecthub_secret_key_college_2026
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
DEFAULT_WHATSAPP=919876543210
```

### Step 4: Run Frontend and Backend Together
From the `SimpleProjectHub` root folder, run:
```powershell
npm run dev
```

- **Frontend URL:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 🔐 Default Admin Credentials

- **URL:** Click **Admin Login** in the top navigation bar (or visit [http://localhost:5173](http://localhost:5173)).
- **Username:** `admin`
- **Password:** `admin123`

*(You can customize these credentials in `server/.env`).*

---

## 📦 How to Package and Send to Your Friend

1. Make sure to **exclude** `node_modules` folders before creating a ZIP file (this keeps the file size small and portable).
2. Never share your secret `.env` passwords; your friend will use `.env.example` to create their own `.env`.
3. Compress the `SimpleProjectHub` folder into `SimpleProjectHub.zip`.
4. Your friend simply extracts the ZIP, opens PowerShell in the folder, and runs:
   ```powershell
   npm run install:all
   npm run dev
   ```
