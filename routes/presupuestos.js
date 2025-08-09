const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Presupuesto = require('../models/Presupuesto');

// OBTENER presupuestos para un mes y año del usuario logueado
router.get('/', auth, async (req, res) => {
    try {
        const { mes, anio } = req.query;
        if (!mes || !anio) return res.status(400).json({ msg: 'Mes y año son requeridos' });
        
        const presupuestos = await Presupuesto.find({ 
            user: req.user.id,
            mes: parseInt(mes), 
            anio: parseInt(anio) 
        });
        res.json(presupuestos);
    } catch (err) { res.status(500).send('Error en el Servidor'); }
});

// CREAR O ACTUALIZAR un presupuesto para el usuario logueado
router.post('/', auth, async (req, res) => {
    const { monto, categoria, mes, anio } = req.body;
    try {
        const filter = { user: req.user.id, categoria, mes, anio };
        const update = {
            $set: { monto: monto },
            $setOnInsert: { user: req.user.id, categoria, mes, anio }
        };
        
        const options = { 
            new: true, 
            upsert: true, 
            runValidators: true 
        };
        
        const presupuesto = await Presupuesto.findOneAndUpdate(filter, update, options);
        res.status(201).json(presupuesto);
    } catch (err) { 
        console.error("Error al guardar el presupuesto:", err.message);
        res.status(500).send('Error en el Servidor'); 
    }
});

// ELIMINAR UN PRESUPUESTO del usuario logueado
router.delete('/', auth, async (req, res) => {
    const { categoria, mes, anio } = req.body;
    try {
        const resultado = await Presupuesto.findOneAndDelete({ 
            user: req.user.id,
            categoria, 
            mes, 
            anio 
        });
        if (!resultado) {
            return res.status(200).json({ msg: 'No existía presupuesto para eliminar.' });
        }
        res.json({ msg: 'Presupuesto eliminado.' });
    } catch (err) {
        res.status(500).send('Error en el Servidor');
    }
});

module.exports = router;