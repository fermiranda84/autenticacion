const express = require('express')
const bodyParser = require('body-parser')
const {Server: HttpServer} = require('http')
const {Server: IOServer} = require('socket.io')
const ProductosMock = require('./src/mocks/producto.mock')
const objProductosMock = new ProductosMock()
const UsuarioModel = require('./src/models/userModel')
const objUsuarioModel = new UsuarioModel()
const cookieParser = require('cookie-parser');
const session = require('express-session');
const urlConfig = require('./src/utils/config')
const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const LocalStrategy = require('passport-local').Strategy

const connectMongo = require('connect-mongo');
const MongoStore = connectMongo.create({
    mongoUrl: urlConfig.mongodb.url,
    ttl: 60
})


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.set('views', './public/views')
app.set('view engine', 'ejs')

const FACEBOOK_APP_ID = '656837248942149';
const FACEBOOK_APP_SECRET = '1251d006f64c444f63641fa7ead96ee7';

//Passport estrategia Facebook
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:8080/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'emails']
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    cb(null, profile);
  }
))

//Passport estrategia local
passport.use(new LocalStrategy(
    (username, password, cb)=>{
        

        objUsuarioModel.existeUsuario(username)
            .then((res) => {

                if (!res) {
                    console.log('Usuario no encontrado')
                    return cb(null, false);
                }
        
                if(!(res.password == password)){
                    console.log('Contrase;a invalida')
                    return cb(null, false);
                }
        
                return cb(null, res);
            })

            .catch((err) =>{console.log(err)})

    }
))



passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});



app.use(cookieParser());
app.use(session({
    store: MongoStore,
    secret: '123456789!@#$%^&*()',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: 'auto',
        maxAge: 600000
    }
}));

app.use(passport.initialize());
app.use(passport.session());


let listaProductos

app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}))

app.get('/auth/facebook/callback', passport.authenticate('facebook', 
{ 
    failureRedirect: '/error', 
    successRedirect: '/productos',
    authType: 'reauthenticate' 
}))

app.get('/api/productos-test', (req, res)=>{
    listaProductos = objProductosMock.popular()
    res.redirect(`../../productos`)
   
})

app.get('/', (req, res)=>{
    
    if(req.isAuthenticated()){
        res.redirect('./productos')
    } else {
        res.redirect('./login')
    }

})

app.get('/login', (req, res)=>{
    res.render('login');
})

app.post('/login', passport.authenticate('local', 
    {
        successRedirect: '/productos',
        failureRedirect: '/error'
    }
))

app.get('/error', (req, res)=>{
    res.render('error');
})


app.get('/registrar', (req, res)=>{
    res.render('registrar');
})

app.post('/registrar', (req, res)=>{
    const {username, password, email, foto } = req.body;
    
    objUsuarioModel.existeUsuario(username)
        .then((respuesta) =>{

            if (respuesta) {
                res.render('error')
            } else {
                const data = {username, password, email, foto}
                objUsuarioModel.registrarUsuario(data)
                res.redirect('/login')
            }

        })

        .catch((err) =>{console.log(err)})
});




app.get('/productos', (req, res)=>{
    
    if(req.isAuthenticated()){
        let datosUsuario

        if(req.user.displayName){
            
            datosUsuario = {
                nombre: req.user.displayName,
                foto: req.user.photos[0].value,
                email: req.user.emails[0].value,
            }
          

        }
        else {
            datosUsuario = {
                nombre: req.user.username,
                foto: req.user.foto,
                email: req.user.email,
            }
        }

        res.render('productos', {datos: datosUsuario})
    }
    
    else {
        res.redirect('/error')
    }
      
})



app.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/login')
});




io.on('connection', socket => {
    console.log(`Nuevo usuario conectado ${socket.id}`)

    socket.emit('productos', listaProductos)
 

    objProductosMock.listarMensajes()
        
        .then((respuesta)=>{
           
            socket.emit('mensajes', respuesta)
        })


    socket.on('mensajeNuevo', data =>{
       
        objProductosMock.insertarMensajes(data)
            .then(()=>{
                console.log("Mensaje insertado");
                return objProductosMock.listarMensajes();
            })

            .then((respuesta)=>{
                console.log("Mensajes seleccionados")
                io.sockets.emit('mensajes', respuesta);
            }) 

    })

  

})


const PORT = 8080
const server = httpServer.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`)
})
server.on('error', error => {
    console.log(`Error en servidor ${error}`)
})
