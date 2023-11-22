const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handling Uncaught exceptions.
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down......');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection established!'));

// Create a document out of the Model

/*
const testTour = new Tour({
  name: 'The Forest Hiker',
  rating: 4.7,
  price: 497,
});

*/

// Create a new testTour
/*

const testTour = new Tour({
  name: 'The Park Camper',
  price: 997,
});

// Save the testTour document to the database (tours database)

testTour
  .save()
  .then((doc) => {
    // Save will return a promise
    console.log(doc); // doc is the new document saved to the database.
  })
  .catch((err) => {
    console.log('ERROR!:', err);
  });


*/

// console.log(app.get('env')); // Check the environment variable.
// Environment variable: Used to define the global environment on which the node app is running.
// console.log(process.env);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App listening on port ${port}.....`);
});

// Handling Unhandled Rejection
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down......');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
