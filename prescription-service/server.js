require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-prescription:27017/prescriptiondb';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Prescription Service connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Medication sub-schema
const medicationSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  dosage:    { type: String, required: true },
  frequency: { type: String, required: true },
  duration:  { type: String, required: true },
  instructions: { type: String }
});

// Prescription Schema
const prescriptionSchema = new mongoose.Schema({
  patientId:   { type: String, required: true },
  patientName: { type: String },
  doctorName:  { type: String, required: true },
  specialty:   { type: String },
  diagnosis:   { type: String, required: true },
  medications: [medicationSchema],
  status:      { type: String, enum: ['Active', 'Expirée', 'Annulée'], default: 'Active' },
  notes:       { type: String },
  issuedAt:    { type: Date, default: Date.now },
  expiresAt:   { type: Date }
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

// Routes
app.get('/prescriptions', async (req, res) => {
  try {
    const { patientId } = req.query;
    const filter = patientId ? { patientId } : {};
    const prescriptions = await Prescription.find(filter).sort({ issuedAt: -1 });
    res.json({ success: true, data: prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/prescriptions/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription non trouvée' });
    res.json({ success: true, data: prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/prescriptions', async (req, res) => {
  try {
    const prescription = new Prescription(req.body);
    await prescription.save();
    res.status(201).json({ success: true, data: prescription, message: 'Prescription créée' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/prescriptions/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!prescription) return res.status(404).json({ success: false, message: 'Prescription non trouvée' });
    res.json({ success: true, data: prescription });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/prescriptions/:id', async (req, res) => {
  try {
    await Prescription.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Prescription supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'prescription-service', timestamp: new Date() });
});

app.listen(PORT, () => console.log(`💊 Prescription Service running on port ${PORT}`));
