const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Tarjeta = require('../models/Tarjeta');
const Gasto = require('../models/Gasto');

// --- API PARA GESTIONAR TARJETAS---
// OBTENER todas las tarjetas del usuario
router.get('/', auth, async (req, res) => {
    try {
        const tarjetas = await Tarjeta.find({ user: req.user.id }).sort({ nombre: 1 });
        res.json(tarjetas);
    } catch (err) {
        res.status(500).send('Error en el Servidor');
    }
});

// CREAR una nueva tarjeta
router.post('/', auth, async (req, res) => {
    const { nombre, diaCierre, diaVencimiento } = req.body;
    try {
        const nuevaTarjeta = new Tarjeta({
            user: req.user.id,
            nombre,
            diaCierre,
            diaVencimiento
        });
        await nuevaTarjeta.save();
        res.status(201).json(nuevaTarjeta);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Ya tienes una tarjeta con ese nombre.' });
        }
        res.status(500).send('Error en el Servidor');
    }
});

// ACTUALIZAR una tarjeta
router.put('/:id', auth, async (req, res) => {
    try {
        let tarjeta = await Tarjeta.findById(req.params.id);
        if (!tarjeta) return res.status(404).json({ msg: 'Tarjeta no encontrada.' });
        if (tarjeta.user.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado.' });

        tarjeta = await Tarjeta.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(tarjeta);
    } catch (err) {
        res.status(500).send('Error en el Servidor');
    }
});

// ELIMINAR una tarjeta
router.delete('/:id', auth, async (req, res) => {
    try {
        let tarjeta = await Tarjeta.findById(req.params.id);
        if (!tarjeta) return res.status(404).json({ msg: 'Tarjeta no encontrada.' });
        if (tarjeta.user.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado.' });
        await Gasto.updateMany({ user: req.user.id, tarjeta: req.params.id }, { $set: { tarjeta: null } });

        await Tarjeta.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Tarjeta eliminada.' });
    } catch (err) {
        res.status(500).send('Error en el Servidor');
    }
});

router.get('/resumen', auth, async (req, res) => {
    try {
        const tarjetas = await Tarjeta.find({ user: req.user.id });
        const hoy = new Date();
        const anioActual = hoy.getFullYear();
        const mesActual = hoy.getMonth(); // 0-11

        const resumenes = [];

        for (const tarjeta of tarjetas) {
            // Lógica para determinar el período del resumen actual
            let fechaInicio, fechaFin;

            if (hoy.getDate() <= tarjeta.diaCierre) {
                fechaFin = new Date(anioActual, mesActual, tarjeta.diaCierre, 23, 59, 59);
                fechaInicio = new Date(anioActual, mesActual - 1, tarjeta.diaCierre + 1);
            } else {
                fechaFin = new Date(anioActual, mesActual + 1, tarjeta.diaCierre, 23, 59, 59);
                fechaInicio = new Date(anioActual, mesActual, tarjeta.diaCierre + 1);
            }
            
            const gastosDelPeriodo = await Gasto.find({
                user: req.user.id,
                tarjeta: tarjeta._id,
                date: { $gte: fechaInicio, $lte: fechaFin }
            });

            const total = gastosDelPeriodo.reduce((sum, gasto) => sum + gasto.amount, 0);
            let anioVencimiento = fechaFin.getFullYear();
            let mesVencimiento = fechaFin.getMonth();

            if (tarjeta.diaVencimiento < tarjeta.diaCierre) {
                mesVencimiento += 1;
            }
            
            const fechaVencimiento = new Date(anioVencimiento, mesVencimiento, tarjeta.diaVencimiento);

            resumenes.push({
                tarjetaId: tarjeta._id,
                nombre: tarjeta.nombre,
                total: total,
                fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
                fechaInicioPeriodo: fechaInicio.toISOString().split('T')[0],
                fechaFinPeriodo: fechaFin.toISOString().split('T')[0]
            });
        }

        res.json(resumenes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el Servidor');
    }
});


module.exports = router;
