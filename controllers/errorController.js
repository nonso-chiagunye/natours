const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  // console.log(err);
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  // console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again!', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // B) RENDERED WEBSITE
  console.error('ERROR!', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown errors: don't leak error details
    // 1) Log the error
    console.error('ERROR!', err);
    // 2) Send generic error message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  if (err.isOperational) {
    // A) Operational, trusted error: send message to client
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  // B) Programming or other unknown errors: don't leak error details
  // 1) Log the error
  console.error('ERROR!', err);
  // 2) Send generic error message
  return res.status(err.statusCode).render({
    title: 'Something went wrong!',
    msg: 'Please try again later',
  });
};

// const sendErrorProd = (err, req, res) => {
//   const msg = err.isOperational
//     ? err.message
//     : 'this is unexpected -- please contact support';
//   !err.isOperational && console.error('error 🥵', err);

//   if (req.originalUrl.match(/^[/]api[/]v/)) {
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: msg,
//       stack: err.stack,
//     });
//   } else {
//     res.status(err.statusCode).render('error', {
//       status: err.status,
//       message: msg,
//     });
//   }
// };

module.exports = (err, req, res, next) => {
  // console.log(err.stack); // err.stack will show where the error happened
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.message = err.message || 'Something went wrong! Please try again later'; // What I added

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    console.log(err);
    let error = Object.assign(err);
    // error.message = err.message;
    // let error = { ...err, name: err.name };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    console.log(err.message);
    console.log(error.message);
    sendErrorProd(error, req, res);
  }
};
