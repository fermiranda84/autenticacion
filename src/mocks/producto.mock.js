const Contenedor = require('../../contenedor')
const generarProductos = require('../utils/generarProductos')
const mongoose = require('mongoose');



class ProductosMock extends Contenedor {
    constructor () {
        super(
            'mensajes',
            new mongoose.Schema({

                author: {
                        id: String,
                        nombre: String,
                        apellido: String,
                        edad: Number,
                        alias: String,
                        avatar: String
                    },
                    text: String,
                    date: String
            })
        )
    }

    popular(cant = 5) {
        let listaPopular = [];
        for (let index = 0; index < cant; index++) {
            let nuevoProducto = generarProductos();
            listaPopular.push(nuevoProducto);
        }
        return listaPopular;
    }

    
}


module.exports = ProductosMock