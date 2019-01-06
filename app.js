/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import Debug from 'debug';
import express from 'express';
import logger from 'morgan';
import path from 'path';
import { buildSchema } from 'graphql';
import expressGraphql from 'express-graphql';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import nodemonconfig from './nodemon.json';
import EventModel from './models/event';
import UserModel from './models/user';

// import favicon from 'serve-favicon';

import index from './routes/index';

const ObjectId = require('mongoose').Types.ObjectId;

const saltRounds = 12;

ObjectId.prototype.valueOf = function () {
  return this.toString();
};

const app = express();
const debug = Debug('academind-graphql:app');
const eventsArray = [];

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/graphql', expressGraphql({
  schema: buildSchema(`

    type User {
      _id: ID
      email: String!
      name: String!
      password: String
      createdEvents: [Event!]
    }
  
    type Event {
      _id: ID!,
      title: String!
      description: String!
      price: Float!
      date: String!
      creator: User!
    }
    
    input UserInput {
      email: String!
      name: String!
      password: String!
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    
    type RootQuery {
      events: [Event!]!,
      users: [User!]!,
    }

    type RootMutation {
      createEvent(eventInput: EventInput): Event
      createUser(userInput: UserInput): User
    }

    schema { 
      query: RootQuery,
      mutation: RootMutation
    }
  `),
  rootValue: {
    async events() {
      const events = await EventModel.find().populate('creator');
      events.map((event) => {
        const idString = event._id.toString();
        event._id = idString;
        return event;
      });
      console.log(events);
      return events;
    },
    createEvent(args) {
      const eventObj = new EventModel({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: args.eventInput.price,
        date: new Date(args.eventInput.date),
        creator: '5c2b8373aba3f53eda0649b3'
      });
      return eventObj.save()
        .then((result) => {
          const UserDOC = UserModel.findById('5c2b8373aba3f53eda0649b3', (err, user) => {
            if (err) return (err);
            user.createdEvents.push(eventObj);
            user.save((error, updatedUser) => {
              if (error) return (err);
              return (updatedUser);
            });
          });
          // eslint-disable-next-line no-underscore-dangle
          return { ...result._doc };
        })
        .catch((err) => {
          throw err;
        });
    },
    async users() {
      const users = await UserModel.find().populate('createdEvents');
      return users;
    },
    async createUser(args) {
      const user = await UserModel.findOne({ email: args.userInput.email }, 'email');
      if (typeof user.email === 'string') {
        throw new Error('User already exist');
      }

      return bcrypt.hash(args.userInput.password, saltRounds)
        .then((hash) => {
          const userobj = new UserModel({
            email: args.userInput.email,
            password: hash,
            name: args.userInput.name,
          });
          return userobj.save();
        })
        .then(res => ({ ...res._doc, password: null, _id: res.id }))
        .catch((err) => {
          throw err;
        });
    }
  },
  graphiql: true
}));

app.use('/', index);
// console.log(nodemonconfig.env.MONGO_USER);


mongoose.connect(`mongodb://${nodemonconfig.env.MONGO_USER}:${nodemonconfig.env.MONGO_PASSWORD}@ds145584.mlab.com:45584/graphql`, (err) => {
  if (!err) console.log('connected');
});


// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
/* eslint no-unused-vars: 0 */
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.json(err);
});

// Handle uncaughtException
process.on('uncaughtException', (err) => {
  debug('Caught exception: %j', err);
  process.exit(1);
});

export default app;
