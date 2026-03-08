require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-lab:27017/labdb';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Lab Service connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Lab Result sub-schema
const resultSchema = new mongoose.Schema({
  testName:    { type: String, required: true },
  value:       { type: String, required: true },
  unit:        { type: String },
  normalRange: { type: String },
  status:      { type: String, enum: ['Normal', 'Anormal', 'Critique'], default: 'Normal' }
});

// Lab Report Schema (NoSQL - flexible structure for unstructured data)
const labReportSchema = new mongoose.Schema({
  patientId:   { type: String, required: true },
  patientName: { type: String },
  doctorName:  { type: String, required: true },
  testType:    { type: String, required: true },
  labTechnician: { type: String },
  results:     [resultSchema],
  summary:     { type: String },
  status:      { type: String, enum: ['En attente', 'En cours', 'Complété'], default: 'En attente' },
  priority:    { type: String, enum: ['Normal', 'Urgent', 'Critique'], default: 'Normal' },
  attachments: [{ filename: String, data: String }], // base64 for demo
  requestedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

const LabReport = mongoose.model('LabReport', labReportSchema);

// Routes
app.get('/lab-reports', async (req, res) => {
  try {
    const { patientId } = req.query;
    const filter = patientId ? { patientId } : {};
    const reports = await LabReport.find(filter).sort({ requestedAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/lab-reports/:id', async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Rapport non trouvé' });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/lab-reports', async (req, res) => {
  try {
    const report = new LabReport(req.body);
    await report.save();
    res.status(201).json({ success: true, data: report, message: 'Rapport de laboratoire créé' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/lab-reports/:id', async (req, res) => {
  try {
    if (req.body.status === 'Complété') req.body.completedAt = new Date();
    const report = await LabReport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!report) return res.status(404).json({ success: false, message: 'Rapport non trouvé' });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/lab-reports/:id', async (req, res) => {
  try {
    await LabReport.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Rapport supprimé' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'lab-service', timestamp: new Date() });
});

app.listen(PORT, () => console.log(`🔬 Lab Service running on port ${PORT}`));
