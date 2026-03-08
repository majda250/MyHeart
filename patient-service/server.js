require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-patient:27017/patientdb';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Patient Service connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Patient Schema
const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Homme', 'Femme', 'Autre'], required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String },
  bloodType: { type: String },
  allergies: [String],
  medicalHistory: [String],
  createdAt: { type: Date, default: Date.now }
});

const Patient = mongoose.model('Patient', patientSchema);

// Routes
// GET all patients
app.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET patient by ID
app.get('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient non trouvé' });
    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create patient
app.post('/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json({ success: true, data: patient, message: 'Patient créé avec succès' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update patient
app.put('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient non trouvé' });
    res.json({ success: true, data: patient, message: 'Patient mis à jour' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE patient
app.delete('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient non trouvé' });
    res.json({ success: true, message: 'Patient supprimé' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'patient-service', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🏥 Patient Service running on port ${PORT}`);
});
