const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/controlGastosDB';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB...'))
    .catch(err => console.error('❌ No se pudo conectar a MongoDB...', err));

// --- Rutas de la API ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/resumen', require('./routes/resumen'));
app.use('/api/presupuestos', require('./routes/presupuestos'));
app.use('/api/gastos-recurrentes', require('./routes/gastosRecurrentes'));
app.use('/api/tarjetas', require('./routes/tarjetas'));
app.use('/api/alertas', require('./routes/alertas'));


app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
