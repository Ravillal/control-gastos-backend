const mongoose = require('mongoose');

const TarjetaSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    // Día del mes en que cierra el resumen de la tarjeta (ej: 25)
    diaCierre: {
        type: Number,
        required: true,
        min: 1,
        max: 31
    },
    // Día del mes en que vence el pago del resumen (ej: 4)
    diaVencimiento: {
        type: Number,
        required: true,
        min: 1,
        max: 31
    }
});

// Índice para que un usuario no pueda tener dos tarjetas con el mismo nombre.
TarjetaSchema.index({ user: 1, nombre: 1 }, { unique: true });

module.exports = mongoose.model('Tarjeta', TarjetaSchema);