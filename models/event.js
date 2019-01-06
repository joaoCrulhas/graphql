import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const eventSchema = new Schema({
  title: String,
  description: String,
  price: Number,
  date: Date,
  creator: { type: Schema.Types.ObjectId, ref: 'User' }
});

// eslint-disable-next-line import/prefer-default-export
module.exports = mongoose.model('Event', eventSchema);

