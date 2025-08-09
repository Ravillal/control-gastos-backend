const mongoose = require('mongoose');

const GastoRecurrenteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        default: null
    },
    diaDeGeneracion: {
        type: Number,
        required: true,
        min: 1,
        max: 28
    },
    estaActivo: {
        type: Boolean,
        default: true
    }
});

GastoRecurrenteSchema.index({ user: 1, description: 1 }, { unique: true });

module.exports = mongoose.model('GastoRecurrente', GastoRecurrenteSchema);