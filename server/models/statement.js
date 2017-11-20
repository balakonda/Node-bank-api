const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');

var StatementSchema = new mongoose.Schema({
	transactionType: {
		type: String,
		required: true,
		enum: ['Cr', 'Dr'],
	},
	transactionDt: {
		type: Date,
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	_creator: {
		required: true,
		type: mongoose.Schema.Types.ObjectId
	}
});

var Statement = mongoose.model('Statement', StatementSchema);

module.exports = { Statement };