// backend/routes/gastosRecurrentes.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GastoRecurrente = require('../models/GastoRecurrente');
const Gasto = require('../models/Gasto');
const User = require('../models/User');

// OBTENER todos los gastos recurrentes del usuario
router.get('/', auth, async (req, res) => {
    try {
        const gastos = await GastoRecurrente.find({ user: req.user.id }).sort({ description: 1 });
        res.json(gastos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el Servidor');
    }
});

// CREAR un nuevo gasto recurrente
router.post('/', auth, async (req, res) => {
    const { description, category, amount, diaDeGeneracion, estaActivo } = req.body;
    try {
        const nuevoGasto = new GastoRecurrente({
            user: req.user.id,
            description,
            category,
            amount: amount || null,
            diaDeGeneracion,
            estaActivo
        });
        await nuevoGasto.save();
        res.status(201).json(nuevoGasto);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Ya existe un gasto recurrente con esa descripción.' });
        }
        res.status(500).send('Error en el Servidor');
    }
});

// ACTUALIZAR un gasto recurrente
router.put('/:id', auth, async (req, res) => {
    const { description, category, amount, diaDeGeneracion, estaActivo } = req.body;
    try {
        let gasto = await GastoRecurrente.findById(req.params.id);
        if (!gasto) return res.status(404).json({ msg: 'Gasto recurrente no encontrado.' });
        if (gasto.user.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado.' });

        const updatedFields = { description, category, amount: amount || null, diaDeGeneracion, estaActivo };
        gasto = await GastoRecurrente.findByIdAndUpdate(req.params.id, { $set: updatedFields }, { new: true });
        res.json(gasto);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el Servidor');
    }
});

// ELIMINAR un gasto recurrente
router.delete('/:id', auth, async (req, res) => {
    try {
        let gasto = await GastoRecurrente.findById(req.params.id);
        if (!gasto) return res.status(404).json({ msg: 'Gasto recurrente no encontrado.' });
        if (gasto.user.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado.' });

        await GastoRecurrente.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Gasto recurrente eliminado.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el Servidor');
    }
});

// GENERAR GASTOS RECURRENTES
router.post('/generar', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const hoy = new Date();
        const anioActual = hoy.getFullYear();
        const mesActual = hoy.getMonth() + 1;
        const periodoActual = `${anioActual}-${mesActual}`;

        if (user.ultimoPeriodoRecurrenteGenerado === periodoActual) {
            return res.json({ msg: 'Los gastos recurrentes para este mes ya fueron generados.' });
        }

        const gastosParaGenerar = await GastoRecurrente.find({ user: req.user.id, estaActivo: true });

        const nuevosGastos = [];
        for (const recurrente of gastosParaGenerar) {
            const fechaDeGasto = new Date(anioActual, mesActual - 1, recurrente.diaDeGeneracion);
            
            const gastoExistente = await Gasto.findOne({
                user: req.user.id,
                description: recurrente.description,
                date: {
                    $gte: new Date(anioActual, mesActual - 1, 1),
                    $lt: new Date(anioActual, mesActual, 1)
                }
            });

            if (!gastoExistente) {
                nuevosGastos.push({
                    user: req.user.id,
                    description: recurrente.description,
                    amount: recurrente.amount || 0,
                    category: recurrente.category,
                    date: fechaDeGasto,
                    status: 'Pendiente'
                });
            }
        }

        if (nuevosGastos.length > 0) {
            await Gasto.insertMany(nuevosGastos);
        }

        user.ultimoPeriodoRecurrenteGenerado = periodoActual;
        await user.save();

        res.json({ msg: `Se generaron ${nuevosGastos.length} gastos nuevos.` });

    } catch (err) {
        console.error('Error al generar gastos recurrentes:', err.message);
        res.status(500).send('Error en el Servidor');
    }
});

module.exports = router;