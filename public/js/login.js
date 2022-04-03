const socket = io.connect()

function loginUsuario() {
    const nombre = document.getElementById('nombre')
    const nombreError = document.getElementById('nombreError')


    if(nombre.value == '') {
        nombreError.innerHTML = 'Por favor, ingresá tu nombre'
      
    }

    else {
        socket.emit('loginNuevo', {isLoged: true})
        window.location.replace(`../productos`)
        
    }

    
    
}