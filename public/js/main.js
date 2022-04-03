const socket = io.connect()


//Funcion para enviar mensajes desde el formulario
function enviarMensaje() {
    const email = document.getElementById('email')
    const nombre = document.getElementById('nombre')
    const apellido = document.getElementById('apellido')
    const edad = document.getElementById('edad')
    const alias = document.getElementById('alias')
    const avatar = document.getElementById('avatar')
    const mensaje = document.getElementById('mensaje')
    const emailError = document.getElementById('emailError')

    let today = new Date();
    let dd = today.getDate()
    let mm = today.getMonth() + 1
    let yyyy = today.getFullYear()

    let seconds = today.getSeconds()
    let minutes = today.getMinutes()
    let hour = today.getHours()

    today = `[${dd}/${mm}/${yyyy} ${hour}:${minutes}:${seconds}]`

    if(email.value == '') {
        emailError.innerHTML = 'Por favor, ingresá un correo electronico'
    }

    else {
        socket.emit('mensajeNuevo', {id: email.value, date: today, text: mensaje.value, nombre: nombre.value, apellido: apellido.value, edad: edad.value, alias: alias.value, avatar: avatar.value})
    }
    
    return false
}

//recibo productos del servidor y cargo la plantilla EJS para mostrarlos con un fetch
socket.on('productos', productos => {
    makeTablaProductos(productos)
        .then(html => {
            document.getElementById('tablaProductos').innerHTML = html
        })
})

function makeTablaProductos(productos) {
    return fetch('./plantillas/historial.ejs')
        .then(res => res.text())
        .then(plantilla => {
            const template = ejs.compile(plantilla)
            const html = template({productos})
            return html
        })
}


//recibo los mensajes del servidor y cargo la plantilla EJS para mostrarlos con un fetch
socket.on('mensajes', mensajes => {

    const user = new normalizr.schema.Entity('users');

    const article = new normalizr.schema.Entity('articles', {
        author: user
    }, {idAttribute: '_id'});

    const posts = new normalizr.schema.Entity('posts', {
        mensajes: [article]
    })

    const denormalizedData = normalizr.denormalize(mensajes.result, posts, mensajes.entities)

    const tamanoOriginal = denormalizedData.tamano
    const tamanoNormalizado = JSON.stringify(mensajes).length
            
    const compresion = (100-((tamanoNormalizado*100)/tamanoOriginal)).toFixed(2)

    denormalizedData.compresion = compresion
                    

    makeHistorialMensajes(denormalizedData)
        .then(html => {
            document.getElementById('historialMensajes').innerHTML = html
        })
})

function makeHistorialMensajes(mensajes) {
    return fetch('./plantillas/historialMensajes.ejs')
        .then(res => res.text())
        .then(plantilla => {
            const template = ejs.compile(plantilla)
            const html = template({mensajes})
            return html
        })
}


function logoutUsuario() {
  
    window.location.replace(`../logout`)
        
}


