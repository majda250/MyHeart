require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-appointment:27017/appointmentdb';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://patient-service:3001';
const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://billing-service:3003';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Appointment Service connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String },
  doctorName: { type: String, required: true },
  specialty: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  reason: { type: String },
  status: { 
    type: String, 
    enum: ['Planifié', 'Confirmé', 'Terminé', 'Annulé'], 
    default: 'Planifié' 
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// Routes
// GET all appointments
app.get('/appointments', async (req, res) => {
  try {
    const { patientId } = req.query;
    const filter = patientId ? { patientId } : {};
    const appointments = await Appointment.find(filter).sort({ date: 1 });
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET appointment by ID
app.get('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé' });
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create appointment (synchronous REST call to billing)
app.post('/appointments', async (req, res) => {
  try {
    // Verify patient exists via REST call to patient-service
    let patientName = req.body.patientName || 'Patient';
    try {
      const patientResp = await axios.get(`${PATIENT_SERVICE_URL}/patients/${req.body.patientId}`, { timeout: 3000 });
      if (patientResp.data.success) {
        const p = patientResp.data.data;
        patientName = `${p.firstName} ${p.lastName}`;
      }
    } catch (e) {
      console.warn('⚠️ Could not reach patient-service:', e.message);
    }

    const appointment = new Appointment({ ...req.body, patientName });
    await appointment.save();

    // Notify billing service (synchronous REST)
    try {
      await axios.post(`${BILLING_SERVICE_URL}/bills`, {
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        patientName,
        doctorName: appointment.doctorName,
        specialty: appointment.specialty,
        amount: 500,
        description: `Consultation - ${appointment.specialty}`,
        date: appointment.date
      }, { timeout: 3000 });
      console.log('💰 Billing notified for appointment:', appointment._id);
    } catch (e) {
      console.warn('⚠️ Could not notify billing-service:', e.message);
    }

    res.status(201).json({ success: true, data: appointment, message: 'Rendez-vous créé avec succès' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update appointment
app.put('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!appointment) return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé' });
    res.json({ success: true, data: appointment, message: 'Rendez-vous mis à jour' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE appointment
app.delete('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé' });
    res.json({ success: true, message: 'Rendez-vous supprimé' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'appointment-service', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`📅 Appointment Service running on port ${PORT}`);
});
