// backend/routes/alertas.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Tarjeta = require('../models/Tarjeta');
const Gasto = require('../models/Gasto');

// @route   GET /api/alertas
// @desc    Obtiene un resumen de todas las alertas importantes para el usuario.
router.get('/', auth, async (req, res) => {
    try {
        const alertas = [];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // --- ALERTA DE VENCIMIENTO DE TARJETAS ---
        const resumenesTarjetas = await fetchResumenes(req.user.id);

        for (const resumen of resumenesTarjetas) {
            const fechaVencimiento = new Date(resumen.fechaVencimiento);
            fechaVencimiento.setDate(fechaVencimiento.getDate() + 1);
            const diffTiempo = fechaVencimiento.getTime() - hoy.getTime();
            const diasRestantes = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));
            if (diasRestantes <= 7) {
                alertas.push({
                    tipo: 'tarjeta',
                    mensaje: `El resumen de ${resumen.nombre} ${diasRestantes < 0 ? 'venció hace' : 'vence en'} ${Math.abs(diasRestantes)} ${Math.abs(diasRestantes) === 1 ? 'día' : 'días'}.`,
                    diasRestantes: diasRestantes,
                    monto: resumen.total,
                    fechaVencimiento: resumen.fechaVencimiento,
                    nombre: resumen.nombre
                });
            }
        }

        // --- ALERTA DE GASTOS PENDIENTES ---
        const anioActual = hoy.getFullYear();
        const mesActual = hoy.getMonth(); // 0-11

        const inicioMes = new Date(anioActual, mesActual, 1);
        const finMes = new Date(anioActual, mesActual + 1, 0);

        const gastosPendientes = await Gasto.countDocuments({
            user: req.user.id,
            status: 'Pendiente',
            date: { $gte: inicioMes, $lte: finMes }
        });

        if (gastosPendientes > 0) {
            alertas.push({
                tipo: 'gastos_pendientes',
                mensaje: `Tienes ${gastosPendientes} gasto${gastosPendientes > 1 ? 's' : ''} pendiente${gastosPendientes > 1 ? 's' : ''} de pago este mes.`,
                cantidad: gastosPendientes
            });
        }

        res.json({ alertas });

    } catch (err) {
        console.error('Error al generar alertas:', err.message);
        res.status(500).send('Error en el Servidor');
    }
});

// Función auxiliar para obtener los resúmenes de tarjeta
async function fetchResumenes(userId) {
    const tarjetas = await Tarjeta.find({ user: userId });
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth(); // 0-11

    const resumenes = [];

    for (const tarjeta of tarjetas) {
        let fechaInicio, fechaFin;

        if (hoy.getDate() <= tarjeta.diaCierre) {
            fechaFin = new Date(anioActual, mesActual, tarjeta.diaCierre, 23, 59, 59);
            fechaInicio = new Date(anioActual, mesActual - 1, tarjeta.diaCierre + 1);
        } else {
            fechaFin = new Date(anioActual, mesActual + 1, tarjeta.diaCierre, 23, 59, 59);
            fechaInicio = new Date(anioActual, mesActual, tarjeta.diaCierre + 1);
        }
        
        const gastosDelPeriodo = await Gasto.find({
            user: userId,
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
            nombre: tarjeta.nombre,
            total: total,
            fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        });
    }
    return resumenes;
}


module.exports = router;