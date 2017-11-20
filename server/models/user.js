const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		minlength: 1,
		trim: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not valid email address'
		}
	},
	username: {
		type: String,
		required: true,
		unique: true,
		minlength: 6,
		maxlength: 12,
		trim: true
	},
	password: {
		type: String,
		minlength: 6,
		required: true
	},
	tokens: [{
		access: {
			type: String,
			required: true
		},
		token: {
			type: String,
			required: true
		}
	}]
});

UserSchema.methods.toJSON = function() {
	var user = this;
	var UserObject = user.toObject();

	return _.pick(UserObject, ['_id', 'username']);
};

UserSchema.methods.generateAuthToken = function() {
	var user = this;
	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

	user.tokens.push({access, token});
	console.log('generateAuthToken');
	//console.log(user);
	//user.email = 'asdasd@gmail.com';
	return user.save().then((res) => {
		return token;
	});
};

UserSchema.methods.removeToken = function(token) {
	var user = this;
	console.log('removeToken');
	return user.update({
		$pull: {
			tokens: { token } 
		}
	});
};

UserSchema.statics.findByCredentials = function(req) {
	var User = this;
	return User.findOne({ username: req.username }).then((user) => {
		if(user) {
			console.log('bcrypt');
			return new Promise((resolve, reject) => {
				bcrypt.compare(req.password, user.password, (err, res) => {
					console.log(req.password, res);
					if(res) {
						resolve(user);
					}
					reject();					
				});
			});
			
		} else {
			return Promise.reject();
		}
		
	}).catch((e) => {
		console.log('Not found')
		return Promise.reject(e);
	});
	 
};

UserSchema.statics.findByToken = function (token) {
	var User = this;
	var decoded;
	try {
		decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch (e) {
		console.log(e);
		// return new Promise((resolve, reject) => {
		// 	reject(e);
		// });
		return Promise.reject(e);
	}

	return User.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
};

//mongoose middleware
UserSchema.pre('save', function(next) {
		var user = this;

		if(user.isModified('password')) {
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(user.password, salt, (err, hash) => {
					user.password = hash;
					next();
				});
			});
		} else {
			next();
		}
});
var User = mongoose.model('User', UserSchema);

module.exports = { User };
