const {faker} = require('@faker-js/faker')


function generarProductos() {
    return {
        nombre: faker.commerce.product(),
        precio: faker.commerce.price(),
        foto: `${faker.image.food()}?random=${Math.round(Math.random() * 1000)}`
    }
}



module.exports = generarProductos
