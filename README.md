# 🏥 CarePoint - Hospital Management System

CarePoint is a feature-rich, enterprise-grade **Hospital Management System (HMS)** built on the classic **Model-View-Controller (MVC)** architectural pattern. Utilizing **Node.js, Express, MongoDB, and EJS**, this application delivers an all-in-one platform for managing healthcare operations. 

It provides customized workspaces and portals for five distinct user roles: **Admins, Doctors, Receptionists, Pharmacists, and Patients**. Each role has full dashboard access with dedicated workflows, real-time inventory management, A4-optimized print layouts, secure session-based authentication, and automated email notifications.

---

## 🚀 Key Features by User Role

### 👑 1. Administrative Portal
* **Resource Management:** Full CRUD operations on Doctors, Departments, Receptionists, Pharmacists, Patients, and Rooms.
* **Analytics Dashboard:** Graphical summary and statistics for hospital status (active admissions, appointments, medicine stock alerts, and financial summaries).
* **System Settings:** Customize hospital branding name, contact details, and core config from the settings panel.

### 🩺 2. Clinical (Doctor) Workspace
* **Schedule Control:** Define and modify active consultation availability days and time slots.
* **Patient Management:** View assigned patients, log medical history, and record clinical diagnoses.
* **E-Prescriptions:** Issue digital prescriptions detailing drug names, dosage schedules (Morning/Afternoon/Night), durations, and intake instructions.
* **Document Access:** View and reference patient medical reports directly from the patient’s clinical file.

### 📋 3. Receptionist Desk
* **Patient Registration:** Register new patients and maintain detailed health files (UHID, Aadhaar, blood group, emergency contacts).
* **Appointment Scheduling:** Book, update, and manage appointments for any doctor or department.
* **Admissions & Bed Management:** Allocate available rooms (ICU, Deluxe, Private, General Ward) and assign beds.
* **Integrated Billing:** Auto-calculate registration charges, consultation fees, test charges, and room rates based on patient history.

### 💊 4. Pharmacy (Medicine Shop)
* **Inventory Control:** Monitor medicine batches, expiration dates, unit/piece pricing, and track stock limits.
* **Low-Stock Alerting:** Instant visual warnings for medicines falling below safety levels.
* **POS Billing System:** Dispense medicine directly to walk-in clients or registered patients, generating pharmacy bills.

### 👤 5. Patient Hub
* **Online Booking:** Schedule appointments with preferred doctors.
* **Medical Portfolio:** Instant access to active prescriptions, diagnoses, and uploaded laboratory/radiology reports.
* **Invoice Center:** View billing history and download official print-ready payment receipts.

---

## 🛠️ Technology Stack

* **Backend Engine:** Node.js, Express.js
* **Database & ORM:** MongoDB, Mongoose ORM
* **Frontend Rendering:** EJS (Embedded JavaScript) Templates, Bootstrap 5, FontAwesome 6, SweetAlert2
* **Storage & Uploads:** Multer (Local storage for doctor profile photos & lab reports)
* **Email dispatch:** Nodemailer (SMTP integration for notifications)
* **Security:** Bcrypt (Password hashing), Express Session (Secure session state)
* **Document Engine:** PDFKit (Used for internal structure) & CSS A4-Print Styling

---

## 📂 Project Structure

The project strictly follows the **MVC (Model-View-Controller)** pattern:

```text
Hospital-Management-System/
├── config/                  # Database connections & mailer setup
├── controllers/             # Express controllers containing business logic
├── data/                    # JSON templates, seeders & clearing utilities
├── middleware/              # Auth checkers, upload rules & local variable exposures
├── models/                  # Mongoose schemas (User, Patient, Bill, Room, etc.)
├── public/                  # Static assets
│   ├── css/                 # Custom styling & print layouts
│   ├── js/                  # Form validations & SweetAlert scripts
│   └── images/              # Logo and UI elements
├── routes/                  # Express route definitions (admin, auth, billing, doctor, etc.)
├── uploads/                 # User-uploaded files (profile photos & lab reports)
├── views/                   # EJS template directories grouped by role
│   ├── admin/               # Admin dashboard templates
│   ├── auth/                # Login & Registration pages
│   ├── doctor/              # Doctor schedule & clinical dashboards
│   ├── patient/             # Patient billing, booking, and history
│   ├── pharmacy/            # POS pharmacy billing workspace
│   ├── print/               # High-fidelity A4 document print templates
│   └── partials/            # Resusable headers, footers, and navigation sidebars
├── .env                     # App configuration and secret keys
├── app.js                   # Application entry point
├── package.json             # Core dependency metadata
└── README.md                # System documentation
```

---

## 💾 Installation & Setup

Follow these steps to set up and run the project locally.

### 📋 Prerequisites
* Make sure you have [Node.js](https://nodejs.org/) installed.
* Make sure you have [MongoDB](https://www.mongodb.com/) installed and running locally on port `27017` (or use MongoDB Atlas connection string).

### ⚙️ Step-by-Step Guide

1. **Clone & Navigate:**
   ```bash
   cd "Hospital Management"
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and define the following variables:
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/hospital_management_system
   SESSION_SECRET=your_secret_session_key
   HOSPITAL_NAME="CarePoint Hospital"

   # Mail Configuration (Nodemailer SMTP)
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=your_smtp_username
   EMAIL_PASS=your_smtp_password
   EMAIL_FROM="CarePoint Hospital <no-reply@carepoint.local>"
   ```

4. **Seed Sample Database:**
   Populate your MongoDB database with pre-configured departments, rooms, doctors, patients, billing details, and login accounts:
   ```bash
   npm run seed
   ```

5. **Launch Application:**
   * Run in Production mode:
     ```bash
     npm start
     ```
   * Run in Development mode (reloads automatically on change via Nodemon):
     ```bash
     npm run dev
     ```

6. **Access Portal:**
   Open your browser and navigate to: **`http://localhost:3000`**

---

## 🔑 Demo Access Credentials

The database seeder automatically initializes the system with these test credentials:

| Role | Email Address | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@carepoint.local` | `Admin@123` | Control panel, CRUD models, system configs |
| **Doctor** | `doctor@carepoint.local` | `Doctor@123` | Doctor workspace, scheduling, prescribing |
| **Receptionist** | `reception@carepoint.local` | `Reception@123` | Patient registrations, room assignments, billing |
| **Pharmacist** | `pharmacy@carepoint.local` | `Pharmacy@123` | POS billing desk, medicine stock control |
| **Patient** | `patient@carepoint.local` | `Patient@123` | Personal profile, book appointments, invoices |

---

## 📑 Specialized A4 Print Templates

CarePoint features A4-optimized print views utilizing custom CSS (`/public/css/print-docs.css`) with print-page breaks. These are designed to mimic official medical documents when printing (or saving as PDF via `Ctrl + P` / clicking print button):

* **Prescription Slip (`Rx`):** Professional layout featuring diagnosis notes, doctor seal, and formatted drug charts.
* **Diagnostic Lab Report:** Displays patient details, report type (MRI, ECG, Blood test, etc.), medical notes, and diagnostic signatures.
* **Hospitalization Invoice:** Itemized list of registration, consultation, bed charges, GST, discount, and final amount paid/due.
* **Pharmacy Receipt:** Custom POS bill detailing medication names, units purchased, rates, and customer receipt info.
* **Discharge Summary:** Detailed record of hospitalization containing admission date, discharge status, doctor notes, and expected summary.
* **Appointment Pass:** Compact ticket highlighting date, department, appointment number, and consulting physician.

---

## 🧹 Maintenance Commands

* **Checking Syntax Integrity:**
  ```bash
  npm run check
  ```

* **Wiping Default Test Data:**
  If you wish to remove the seed data (but preserve the core administrative account), run:
  ```bash
  npm run clear-defaults
  ```
#   h o s p i t a l  
 