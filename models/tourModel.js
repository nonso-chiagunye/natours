const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

// Creating Mongoose Schema

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // The error message
      unique: true,
      trim: true, // Remove all the white space in the beginning and end of the string.
      maxlength: [40, 'A tour name must have less than or equal 40 characters'],
      minlength: [10, 'A tour name must have more than or equal 10 characters'],
      // validate: [validator.isAlpha, 'Tour names must only contain characters'],
    },
    slug: String, //
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5, // The default value if no rating is specified
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'], // The error message
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only works for current document on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) must be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true, // Remove all the white space in the beginning and end of the string.
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // Hides this field. Used eg password field
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON - Used to specify geospartial data.
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // Creates embedded document
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array,  // Embed users (guides) in tour document
    guides: [
      // Referencing users (guides) in tour document
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true }, // Make defined virtual properties (fields that are not stored in the db, but calculated using some other values) to be included in the output
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 }); // Simple index
tourSchema.index({ price: 1, ratingsAverage: -1 }); // Compound index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Define virtual property (Properties that appear in output but not persistent on db)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // The name of the field in the Review model
  localField: '_id', // The name of the field in the current model.
});

// pre DOCUMENT MIDDLEWARE: Runs on .save() and .create() commands. (Acts before the document is saved to the db)
// We can have multiple pre or post document middleware for the same hook. eg save() hook
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// RESPONSIBLE FOR PERFORMING THE EMBEDDING

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);  // Embed users (guides) in tour document.

//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document.....');
//   next();
// });

// post DOCUMENT MIDDLEWARE: Runs on .save() and .create() commands. (Acts AFTER the document is saved to the db)

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE

// tourSchema.pre('find', function (next) {
//   this.find({ secretTour: { $ne: true } }); // Do not display secretTours
//   next();
// });

// Using regex, any query that starts with find
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // Do not display secretTours

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  // populate() adds reference to user (guide) in the tour document. This only works in the query and not in the actual db.
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  // console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs); // Do not display secretTours
  next();
});

// AGGREGATION MIDDLEWARE

tourSchema.pre('aggregate', function (next) {
  const things = this.pipeline()[0];

  if (Object.keys(things)[0] !== '$geoNear') {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  }

  // console.log(this.pipeline());
  next();
});

// Create a Model out of the Schema

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
