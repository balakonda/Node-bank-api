const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');

var TransferSchema = new mongoose.Schema({
	accountNo: {
		type: Number,
		required: true,
		unique: true,
		minlength: 12,
		maxlenth: 12,
		validate : {
		    validator : Number.isInteger,
		    message   : '{VALUE} is not an integer value'
		}
	},
	accountType: {
		type: String,
		required: true,
		enum: ['Savings', 'Current'],
		trim: true
	},
	amount: {
		type: Number,
		required: true,
		min: [0.1, 'The value of path `{PATH}` (`{VALUE}`) should be greater than {MIN}.']
	},
	ifsc: {
		type: String,
		required: true,
		minlength: [11, 'The value of path `{PATH}` (`{VALUE}`) less than the allowed length ({MINLENGTH}).'],
		maxlenth: [11, 'The value of path `{PATH}` (`{VALUE}`) exceeds the maximum allowed length ({MAXLENGTH}).']
	},
	recipientName: {
		type: String,
		required: true,
		minlength: 1
	},
	recipientEmail: {
		type: String,
		required: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not valid email address'
		}
	},
	_creator: {
		required: true,
		type: mongoose.Schema.Types.ObjectId
	}
});

var Transfer = mongoose.model('Transfer', TransferSchema);

module.exports = { Transfer };
