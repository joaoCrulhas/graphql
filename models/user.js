import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  createdEvents: [{ type: Schema.Types.ObjectId, ref: 'Event' }]
});

// eslint-disable-next-line import/prefer-default-export
module.exports = mongoose.model('User', userSchema);

