const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdEvents: [
        {
            type: Schema.Types.ObjectId,  //this connects the created event to the user. Like a foreign key.
            ref: 'Event'  // allows or relation between models, pass in the name of the model you want to connect, 'Event'
        }
    ]
});

module.exports = mongoose.model('User', userSchema);