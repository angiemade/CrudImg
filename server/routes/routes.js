// Archivo de rutas para CRUD (routes.js)
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const diskstorage = multer.diskStorage({
    destination: path.join(__dirname, '../images'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-pps-' + file.originalname);
    }
});

const fileUpload = multer({
    storage: diskstorage
}).single('image');

router.get('/', (req, res) => {
    res.send('Welcome to my image app');
});

// GUARDAR/CREAR
router.post('/images/post', fileUpload, (req, res) => {
    const db = req.db;

    if (!req.file) {
        return res.status(400).send('No se ha subido ningún archivo');
    }

    const tipo = req.file.mimetype;
    const nombre = req.file.originalname;
    const datos = fs.readFileSync(path.join(__dirname, '../images/' + req.file.filename));

    db.query('INSERT INTO foto SET ?', [{ tipo, nombre, datos }], (err, rows) => {
        if (err) {
            return res.status(500).send('Error del servidor: ' + err.message);
        }

        res.send('¡Imagen guardada!');
    });
});

// MOSTRAR/LISTAR
router.get('/images/get', (req, res) => {
    const db = req.db;

    db.query('SELECT * FROM foto', (err, rows) => {
        if (err) {
            return res.status(500).send('Error del servidor: ' + err.message);
        }

        // Filtrar filas que tienen datos válidos (que no son null)
        const validRows = rows.filter(img => img.datos !== null);

        validRows.forEach(img => {
            const filePath = path.join(__dirname, '../dbimages/', img.id + '-pps.png');
            try {
                fs.writeFileSync(filePath, img.datos);
            } catch (err) {
                console.error('Error al escribir el archivo:', err.message);
            }
        });

        const imagedir = fs.readdirSync(path.join(__dirname, '../dbimages/'));
        res.json(imagedir);
    });
});

// ELIMINAR
router.delete('/images/delete/:id', (req, res) => {
    const db = req.db; // Utilizamos la conexión de la base de datos desde el request

    // Eliminar el registro de la base de datos por id
    db.query('DELETE FROM foto WHERE id=?', [req.params.id], (err, rows) => {
        if (err) {
            return res.status(500).send('Error del servidor: ' + err.message);
        }

        // Verificar la ruta del archivo y eliminarlo si existe
        const filePath = path.join(__dirname, '../dbimages/' + req.params.id + '-pps.png');
        console.log('Ruta del archivo a eliminar:', filePath); // Log de la ruta

        if (fs.existsSync(filePath)) {
            try {
                // Eliminar el archivo de la carpeta dbimages
                fs.unlinkSync(filePath);
                console.log('Archivo eliminado exitosamente:', filePath);
            } catch (err) {
                console.error('Error al intentar eliminar el archivo:', err.message);
                return res.status(500).send('Error al eliminar el archivo: ' + err.message);
            }
        } else {
            console.warn('El archivo no fue encontrado:', filePath);
        }

        // Enviar una respuesta indicando que la imagen ha sido eliminada
        res.send('Imagen eliminada');

        // Mostrar el resultado de la operación en la consola
        console.log('Registro eliminado, ID:', req.params.id);
    });
});

// EDITAR IMAGEN
router.put('/images/edit/:id', fileUpload, (req, res) => {
    const db = req.db;

    if (!req.file) {
        return res.status(400).send('No se ha subido ningún archivo');
    }

    const tipo = req.file.mimetype;
    const nombre = req.file.originalname;
    const datos = fs.readFileSync(path.join(__dirname, '../images/' + req.file.filename));

    // Actualizar el registro en la base de datos
    db.query('UPDATE foto SET ? WHERE id = ?', [{ tipo, nombre, datos }, req.params.id], (err, rows) => {
        if (err) {
            return res.status(500).send('Error del servidor: ' + err.message);
        }

        // Actualizar la imagen en el directorio `dbimages`
        const filePath = path.join(__dirname, '../dbimages/' + req.params.id + '-pps.png');
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath); // Eliminar el archivo existente
            } catch (err) {
                console.error('Error al eliminar el archivo anterior:', err.message);
            }
        }

        try {
            fs.writeFileSync(filePath, datos); // Escribir el nuevo archivo
        } catch (err) {
            console.error('Error al guardar el archivo actualizado:', err.message);
            return res.status(500).send('Error al guardar el archivo: ' + err.message);
        }

        res.send('¡Imagen actualizada!');
    });
});



module.exports = router;
