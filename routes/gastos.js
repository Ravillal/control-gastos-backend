const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Gasto = require('../models/Gasto');
const mongoose = require('mongoose');

// OBTENER GASTOS
router.get('/', auth, async (req, res) => {
    try {
        const { mes, anio, status } = req.query;
        if (!mes || !anio) return res.status(400).json({ msg: 'Por favor, proporciona mes y año.' });

        let query = { 
            user: req.user.id,
            date: { $gte: new Date(anio, mes - 1, 1), $lt: new Date(anio, mes, 1) } 
        };
        if (status && (status === 'Pagado' || status === 'Pendiente')) {
            query.status = status;
        }
        const gastos = await Gasto.find(query).sort({ date: -1 });
        res.json(gastos);
    } catch (err) { res.status(500).send('Error en el Servidor'); }
});

// CREAR GASTO
router.post('/', auth, async (req, res) => {
    const { description, amount, category, date, status, tarjeta } = req.body;
    try {
        const nuevoGasto = new Gasto({
            description, amount, category, date, status,
            tarjeta: tarjeta || null, 
            user: req.user.id
        });
        const gasto = await nuevoGasto.save();
        res.status(201).json(gasto);
    } catch (err) { res.status(500).send('Error en el Servidor'); }
});

// ACTUALIZAR GASTO
router.put('/:id', auth, async (req, res) => {
    const { description, amount, category, date, status, tarjeta } = req.body;
    const camposGasto = { description, amount, category, date, status, tarjeta: tarjeta || null };

    try {
        let gasto = await Gasto.findById(req.params.id);
        if (!gasto) return res.status(404).json({ msg: 'Gasto no encontrado' });
        if (gasto.user.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado' });
        
        gasto = await Gasto.findByIdAndUpdate(req.params.id, { $set: camposGasto }, { new: true });
        res.json(gasto);
    } catch (err) { res.status(500).send('Error del Servidor'); }
});

// ELIMINAR GASTO
router.delete('/:id', auth, async (req, res) => {
    try {
        const gasto = await Gasto.findById(req.params.id);
        if (!gasto) return res.status(404).json({ msg: 'Gasto no encontrado.' });
        if (gasto.user.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado' });

        await Gasto.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Gasto eliminado.' });
    } catch (err) { res.status(500).send('Error en el Servidor'); }
});

// REPORTE EVOLUCIÓN
router.get('/reportes/evolucion', auth, async (req, res) => {
    try {
        const { mes, anio } = req.query;
        if (!mes || !anio) return res.status(400).json({ msg: 'Mes y año son requeridos' });
        const startDate = new Date(anio, mes - 1, 1);
        const endDate = new Date(anio, mes, 1);
        
        const gastosPorDia = await Gasto.aggregate([
            { $match: { 
                user: new mongoose.Types.ObjectId(req.user.id),
                date: { $gte: startDate, $lt: endDate } 
            }},
            { $group: { _id: { $dayOfMonth: "$date" }, total: { $sum: "$amount" } } },
            { $sort: { _id: 1 } }
        ]);
        
        const diasDelMes = new Date(anio, mes, 0).getDate();
        const labels = Array.from({ length: diasDelMes }, (_, i) => `${String(i + 1).padStart(2, '0')}/${String(mes).padStart(2, '0')}`);
        const data = Array(diasDelMes).fill(0);
        gastosPorDia.forEach(g => { data[g._id - 1] = g.total; });
        res.json({ labels, data });
    } catch (err) { res.status(500).send('Error en el Servidor'); }
});

// ACTUALIZAR STATUS
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const gasto = await Gasto.findById(req.params.id);
        if (!gasto) return res.status(404).json({ msg: 'Gasto no encontrado.' });
        if (gasto.user.toString() !== req.user.id) return res.status(401).json({ msg: 'No autorizado' });

        const updatedGasto = await Gasto.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(updatedGasto);
    } catch (err) { res.status(500).send('Error en el Servidor'); }
});

module.exports = router;