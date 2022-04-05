const mongoose = require('mongoose')
const urlConfig = require('./src/utils/config')
const { normalize, schema} = require('normalizr')
const util = require('util')

const URL = urlConfig.mongodb.url

mongoose.connect(URL)




class Contenedor {

    constructor(nombreColeccion, esquema){
        this.mensajes = mongoose.model(nombreColeccion, esquema)
        this.usuario = mongoose.model(nombreColeccion, esquema)
    }

    

    async insertarMensajes(data){
            try {
                const mensaje = {
                    author: {
                        id: data.id,
                        nombre: data.nombre,
                        apellido: data.apellido,
                        edad: data.edad,
                        alias: data.alias,
                        avatar: data.avatar
                    },
                    text: data.text,
                    date: data.date
                }
                const obj = new this.mensajes(mensaje)
                const save = await obj.save()
                return save
            
        } catch (error) {
            console.error(error)
        }
    }

    async listarMensajes() {
        try {

            let mensajesMongo = await this.mensajes.find({})
            const originalData = {
                id: 'mensajes',
                mensajes: mensajesMongo,
            }

            originalData.tamano = JSON.stringify(originalData).length
           
          const originalDatatoString = JSON.stringify(originalData)
          const originalDatatoObject = JSON.parse(originalDatatoString)
          
        
            const user = new schema.Entity('users');

        
            const article = new schema.Entity('articles', {
                author: user
            }, {idAttribute: '_id'});

            const posts = new schema.Entity('posts', {
                mensajes: [article]
            });

           

            const normalizedData = normalize(originalDatatoObject, posts);
            
            

            return normalizedData
            
        } catch (error) {
            console.error(error)
        }
    }

    async registrarUsuario (data) {

        try {
            const usuario = {
                
                username: data.username,
                password: data.password,
                email: data.email,
                foto: data.foto
            }
            const obj = new this.usuario(usuario)
            const save = await obj.save()
            return save
        
        } catch (error) {
            console.error(error)
        }


    }

    async existeUsuario(data) {

        try {

            let usuarioMongo = await this.usuario.findOne({username : data})
            return usuarioMongo
        }

        catch(err) {console.log(err)}
        

    }


}

module.exports = Contenedor;
