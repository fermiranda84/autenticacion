const express = require('express')
const bodyParser = require('body-parser')
const {Server: HttpServer} = require('http')
const {Server: IOServer} = require('socket.io')
const ProductosMock = require('./src/mocks/producto.mock')
const objProductosMock = new ProductosMock();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const urlConfig = require('./src/utils/config')
const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy

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
));

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

app.get('/productos', (req, res)=>{
    
    if(req.isAuthenticated()){
        
        const datosUsuario = {
            nombre: req.user.displayName,
            foto: req.user.photos[0].value,
            email: req.user.emails[0].value,
        }
        res.render('productos', {datos: datosUsuario});
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

    socket.on('loginNuevo', data =>{
       
       isLoged = data.isLoged

    })

    

})


const PORT = 8080
const server = httpServer.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`)
})
server.on('error', error => {
    console.log(`Error en servidor ${error}`)
})
