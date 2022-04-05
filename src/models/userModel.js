const Contenedor = require('../../contenedor')
const mongoose = require('mongoose');



class userModel extends Contenedor {
    constructor () {
        super(
            'usuarios',
            new mongoose.Schema({

                    username: String,
                    password: String,
                    email: String,
                    foto: String,

            })
        )
    }


    
}


module.exports = userModel