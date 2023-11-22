// const fs = require('fs');
const path = require('path'); // Path is a built-in module used to manipulate paths.
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express(); // express is a function. upon calling it will add a bunch of methods to app variable. eg is app.listen
app.set('view engine', 'pug'); // Set pug as the template engine. Pug templates are actually called views in express.
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES

// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP Headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // Allow 100 request from the same IP in (windwMs) hrs
  windowMs: 60 * 60 * 1000, // 1hr
  message: 'Too many requests from this IP, please try again in an hour',
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // Middleware
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data Sanitization against NoSQL Injection
app.use(mongoSanitize()); // Looks at the req body, req query string and req.params and filter out all the $s and .s

// Data Sanitization against XSS Attack
app.use(xss()); // Will clean any user input from a malicious html code. Assuming an attacker want to insert some malicious html code, with some js code attached to it,

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
); // Clears up the query string

// Create our own Middleware

// app.use((req, res, next) => {
//   console.log('Hello from the Middleware');
//   next();
// });

// Define Middleware that gets request time

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// Define Routes
// Routing: Determines how an application responds to a certain http request, to a certain url and the http method used for that request.
/*
app.get('/', (req, res) => {
  res.status(200).send('Hello from the server side!');
});
*/
/*
app.get('/', (req, res) => {
  res
    .status(200)
    .json({ message: 'Hello from the server side!', app: 'Natour' });
});

app.post('/', (req, res) => {
  res.send('You can post here');
});
*/
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );

/*
// Making a GET Request (Get all tours)
app.get('/api/v1/tours', (req, res) => {
  // req, res are route handlers
  res.status(200).json({
    status: 'success',
    results: tours.length, // Important if we are sending an array of multiple Objects
    data: {
      tours: tours,
    },
  });
});

// Responding to URL Parameters (Getting specific tour)

app.get('/api/v1/tours/:id', (req, res) => {
  // console.log(req.params);
  const id = req.params.id * 1; // Convert to number
  const tour = tours.find((el) => el.id === id);

  // if (id > tours.length - 1) {
  //   return res.status(404).json({
  //     status: 'Not Found',
  //     message: 'Invalid ID',
  //   });
  // }

  if (!tour) {
    return res.status(404).json({
      status: 'Not Found',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',

    data: {
      tour,
    },
  });
});

// Making a POST Request

app.post('/api/v1/tours', (req, res) => {
  // console.log(req.body);

  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );

  // res.send('Done!');
});

// Handling PATCH Request

app.patch('/api/v1/tours/:id', (req, res) => {
  if (req.params.id * 1 >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here.....>',
    },
  });
});

// Handling Delete Request

app.delete('/api/v1/tours/:id', (req, res) => {
  if (req.params.id * 1 >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    // 204 is delete success code
    status: 'success',
    data: null,
  });
});

*/

// 2) ROUTE HANDLERS
// Refactoring

/*

const getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestAt: req.requestTime,
    results: tours.length,
    data: {
      tours: tours,
    },
  });
};

const getTour = (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: 'Not Found',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',

    data: {
      tour,
    },
  });
};

const createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

const updateTour = (req, res) => {
  if (req.params.id * 1 >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here.....>',
    },
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

*/
/*

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

*/
/*
app.get('/api/v1/tours', getAllTours);
app.get('/api/v1/tours/:id', getTour);
app.post('/api/v1/tours', createTour);
app.patch('/api/v1/tours/:id', updateTour);
app.delete('/api/v1/tours/:id', deleteTour);

*/

// 3) ROUTES
/*


tourRouter.route('/api/v1/tours').get(getAllTours).post(createTour);
tourRouter
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

// Implementing Users Route

app.route('/api/v1/users').get(getAllUsers).post(createUser);

app.route('/api/v1/users').get(getUser).patch(updateUser).delete(deleteUser);

*/

// const tourRouter = express.Router();
// const userRouter = express.Router();

// tourRouter.route('/').get(getAllTours).post(createTour);
// tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

// Implementing Users Route

// userRouter.route('/').get(getAllUsers).post(createUser);

// userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

// Mounting a new Router on a Route

app.use('/', viewRouter); // This route is mounted on the root url.
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// ERROR HANDLING: Handling Request to any Route aside the ones defined above
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
// app.use((err, req, res, next) => {
//   console.log(err.stack); // err.stack will show where the error happened
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//   });
// });

app.use(globalErrorHandler);

// 4) START SERVER
module.exports = app;
