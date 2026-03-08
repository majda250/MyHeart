require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-billing:27017/billingdb';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Billing Service connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Bill Schema
const billSchema = new mongoose.Schema({
  appointmentId: { type: String },
  patientId:     { type: String, required: true },
  patientName:   { type: String },
  doctorName:    { type: String },
  specialty:     { type: String },
  description:   { type: String, required: true },
  amount:        { type: Number, required: true },
  status:        { type: String, enum: ['En attente', 'Payé', 'Annulé'], default: 'En attente' },
  paymentMethod: { type: String, enum: ['Carte', 'Espèces', 'Virement', 'Assurance'], default: null },
  date:          { type: Date, default: Date.now },
  paidAt:        { type: Date }
});

const Bill = mongoose.model('Bill', billSchema);

// Routes
app.get('/bills', async (req, res) => {
  try {
    const { patientId } = req.query;
    const filter = patientId ? { patientId } : {};
    const bills = await Bill.find(filter).sort({ date: -1 });
    res.json({ success: true, data: bills });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/bills/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    res.json({ success: true, data: bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/bills', async (req, res) => {
  try {
    const bill = new Bill(req.body);
    await bill.save();
    res.status(201).json({ success: true, data: bill, message: 'Facture créée' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/bills/:id/pay', async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      { status: 'Payé', paymentMethod, paidAt: new Date() },
      { new: true }
    );
    if (!bill) return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    res.json({ success: true, data: bill, message: 'Paiement enregistré' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/bills/:id', async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bill) return res.status(404).json({ success: false, message: 'Facture non trouvée' });
    res.json({ success: true, data: bill });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/bills/:id', async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Facture supprimée' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stats
app.get('/bills/stats/summary', async (req, res) => {
  try {
    const total = await Bill.countDocuments();
    const paid = await Bill.countDocuments({ status: 'Payé' });
    const pending = await Bill.countDocuments({ status: 'En attente' });
    const totalAmount = await Bill.aggregate([{ $group: { _id: null, sum: { $sum: '$amount' } } }]);
    const paidAmount = await Bill.aggregate([{ $match: { status: 'Payé' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]);
    res.json({
      success: true,
      data: {
        total, paid, pending,
        totalAmount: totalAmount[0]?.sum || 0,
        paidAmount: paidAmount[0]?.sum || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'billing-service', timestamp: new Date() });
});

app.listen(PORT, () => console.log(`💰 Billing Service running on port ${PORT}`));
