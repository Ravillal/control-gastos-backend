const mongoose = require('mongoose');

const ResumenMensualSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    anio: { type: Number, required: true },
    mes: { type: Number, required: true }, 
    ingreso: { type: Number, required: true },
});

ResumenMensualSchema.index({ user: 1, anio: 1, mes: 1 }, { unique: true });

module.exports = mongoose.model('ResumenMensual', ResumenMensualSchema);
