const express = require('express');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrpyt = require('bcryptjs');

const Event = require('./models/event.js');
const User = require('./models/user');

const app = express();


app.use(express.json());

const events = eventsIds => {
    return Event.find({_id: {$in: eventsIds}})
        .then(events => {
            return events.map(event => {
                return {
                    ...event._doc,
                    _id: event.id,
                    creator: user.bind(this, event.creator)
                };
            });
        })
        .catch(err => {
            throw err;
        })
}

const user = userId => {
    return User.findById(userId)
    .then(user => {
        return {...user.doc, _id:user.id, 
            createdEvents: events.bind(this, user._doc.createdEvents)
        };
    })
    .catch(err => {
        throw err;
    });
};


app.use('/graphql', graphqlHttp({
    schema: buildSchema(` 
        type Booking {
            _id: ID!
            event: Event!
            user: User!
            createdAt: String!
            updatedAt: String!
        }
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: User!
        }
        type User {
            _id: ID!
            email: String!
            password: String
            createdEvents: [Event!]  
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {  
            events: [Event!]!
            bookings: [Booking!]!
        }
        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
            bookEvent(eventId: ID!): Booking!
            cancelBooking(bookingId: ID!): Event!
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }`
    ),
    //type and schema are both key words. 

    //resolver, names must match keys above.
    rootValue: {
        events: () => {
            return Event.find()  //you can pass in what you want, or nothing and retrieve everything. 
            .then(events => {
                return events.map(event => {
                    return {
                        ...event._doc,
                        _id: event.id,
                        creator: user.bind(this, event._doc.creator)  
                    };  //._doc leaves out the metadata
                })
            })
        },
        createEvent: args => {
            const event = new Event ({
                 title: args.eventInput.title,
                 description: args.eventInput.description,
                 price: +args.eventInput.price,  //adding the + in front of args makes sure it is a number 
                 date: new Date(args.eventInput.date),
                 creator: "5e864c54ca241d15644607c3"
            });
        
            let createdEvent;
           
            return event  //returning here makes this an async operation that will return a Promise.
           .save()
           .then(result => {
               createdEvent = {...result._doc};
               return User.findById('5e864c54ca241d15644607c3')               
           })
           .then(user => {
            if(!user){
                throw new Error('User not found.')
            }
            user.createdEvents.push(event); 
            return user.save();
           })

           .then(result => {
            return createdEvent;
           })

           .catch(err => {
               console.log(err);
               throw err;
           });
        },

        createUser: args => {
            return User.findOne({email: args.userInput.email})
                .then(user => {
                    if(user){
                        throw new Error('User already exists in the database.')
                    }
                    return bcrpyt.hash(args.userInput.password, 12)
                })
                .then(hashedPassword => {
                     const user = new User ({
                       email: args.userInput.email,
                       password: hashedPassword
                      });
                     return user.save();
                })
                .then(result => {
                 return {...result._doc, password: null} //this prevents the PW from being returned. 
                })
                .catch(err => {
                    throw err;
                })
            
        }

    },
    graphiql: true
}));

mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-gmwau.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    const PORT = 5000
    app.listen(PORT, () => console.log(`\n**SERVER LISTENING ON PORT ${PORT}**`));
})
.catch(err=>{
    console.log(err);
})
