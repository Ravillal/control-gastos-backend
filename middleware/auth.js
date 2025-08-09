const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt';

module.exports = function(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded.user;
        next(); 
    } catch (err) {
        res.status(401).json({ msg: 'El token no es válido' });
    }
};
