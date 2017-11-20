const mongoose = require('mongoose');
const validator = require('validator');
const _ = require('lodash');

var BankAccountSchema = new mongoose.Schema({
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
	balance: {
		type: Number,
		required: true
	},
	_creator: {
		required: true,
		type: mongoose.Schema.Types.ObjectId
	}
});

var Bank = mongoose.model('Bank', BankAccountSchema);

module.exports = { Bank };