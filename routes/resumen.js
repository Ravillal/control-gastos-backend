const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ResumenMensual = require('../models/ResumenMensual');

// OBTENER resumen del usuario logueado
router.get('/', auth, async (req, res) => {
    try {
        const { mes, anio } = req.query;
        const resumen = await ResumenMensual.findOne({ 
            user: req.user.id,
            mes, 
            anio 
        });
        if (!resumen) return res.json({ ingreso: 0 });
        res.json(resumen);
    } catch (err) { res.status(500).send('Error en el Servidor'); }
});

// CREAR O ACTUALIZAR resumen del usuario logueado
router.post('/', auth, async (req, res) => {
    const { mes, anio, ingreso } = req.body;
    try {
        const filter = { user: req.user.id, mes, anio };
        const update = {
            $set: { ingreso: ingreso },
            $setOnInsert: { user: req.user.id, mes, anio }
        };
        
        const options = { 
            new: true,
            upsert: true, 
            runValidators: true
        };

        const resumen = await ResumenMensual.findOneAndUpdate(filter, update, options);
        res.json(resumen);
    } catch (err) { 
        console.error("Error al guardar el resumen:", err.message);
        res.status(500).send('Error en el Servidor'); 
    }
});

module.exports = router;