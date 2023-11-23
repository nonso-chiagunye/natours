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
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express(); // express is a function. upon calling it will add a bunch of methods to app variable. eg is app.listen
app.enable('trust proxy'); // Trust proxies used by deployment platform
app.set('view engine', 'pug'); // Set pug as the template engine. Pug templates are actually called views in express.
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES

// IMPLEMENT CORS for Simple requests (GET / POST Requests)
app.use(cors());
// app.use(cors({
//   origin: 'https://www.example.com'  // Allow only a specific domain, example.com to create request to the API
// }))

app.options('*', cors()); // Allow preflight requests (DELETE, PATCH) in cors for all routes.

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
);

app.use(compression());

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Mounting a new Router on a Route

app.use('/', viewRouter); // This route is mounted on the root url.
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// ERROR HANDLING: Handling Request to any Route aside the ones defined above
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

// 4) START SERVER
module.exports = app;
