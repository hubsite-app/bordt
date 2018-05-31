const mongoose = require('mongoose');

var VehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    trim: true,
    unique: true
  },
  vehicleCode: {
    type: string,
    trim: true,
    required: true
  },
  vehicleType: {
    type: String,
    trim: true,
    required: true
  },
  sourceCompany: {
    type: String,
    trim: true,
    minlength: 1
  }
});

var Vehicle = mongoose.model('Vehicle', VehicleSchema);

module.exports = {Vehicle};