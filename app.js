require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const { exposeLocals } = require('./middleware/auth');

const app = express();
connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'hospital_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }
  })
);
app.use(flash());
app.use(exposeLocals);

app.use('/', require('./routes/authRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/doctor', require('./routes/doctorRoutes'));
app.use('/receptionist', require('./routes/receptionistRoutes'));
app.use('/patient', require('./routes/patientRoutes'));
app.use('/billing', require('./routes/billingRoutes'));
app.use('/pharmacy', require('./routes/pharmacyRoutes'));

app.use((req, res) => {
  res.status(404).render('error', { title: 'Page Not Found', message: 'The page you requested does not exist.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  req.flash('error', err.message || 'Something went wrong');
  res.status(500).render('error', { title: 'Server Error', message: err.message || 'Unexpected server error' });
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`Hospital Management System running at http://localhost:${port}`));

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the old server or set a different PORT in .env.`);
    process.exit(1);
  }
  throw error;
});
