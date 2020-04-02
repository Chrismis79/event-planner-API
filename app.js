const express = require('express');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('mongoose');

const app = express();


app.use(express.json());

app.use('/graphql', graphqlHttp({
    schema: buildSchema(` 
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {  
            events: [Event!]!
        }
        type RootMutation {
            createEvent(eventInput: EventInput): Event
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
            return Event.find()
            .then(events => {
                return events.map(event => {
                    return {...event._doc};
                })
            })
        },
        createEvent: args => {
            const event = new Event ({
                 title: args.eventInput.title,
                 description: args.eventInput.description,
                 price: +args.eventInput.price,  //adding the + in front of args makes sure it is a number 
                 date: new Date(args.eventInput.date)
            });
           return event  //returning here makes this an async operation that will return a Promise.
           .save()
           .then(result => {
               console.log(result);
               return {...result._doc};
           })
           .catch(err => {
               console.log(err);
               throw err;
           });
            
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
