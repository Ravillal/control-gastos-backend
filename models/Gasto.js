const mongoose = require('mongoose');
const GastoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, required: true, enum: ['Pagado', 'Pendiente'], default: 'Pagado' },
    
    // NUEVO CAMPO: Para asociar un gasto a una tarjeta de crédito.
    // Es opcional; si es null, es un gasto en efectivo o débito.
    tarjeta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tarjeta',
        default: null
    }
});

module.exports = mongoose.model('Gasto', GastoSchema);