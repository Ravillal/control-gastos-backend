const mongoose = require('mongoose');

const PresupuestoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    monto: { type: Number, required: true },
    categoria: { type: String, required: true },
    mes: { type: Number, required: true, min: 1, max: 12 },
    anio: { type: Number, required: true }
});


PresupuestoSchema.index({ user: 1, categoria: 1, mes: 1, anio: 1 }, { unique: true });

module.exports = mongoose.model('Presupuesto', PresupuestoSchema);