var { User } = require('./../models/user');

var authenticate = (req, res, next) => {
	var token = req.header('x-auth');

	User.findByToken(token).then((user) => {
		if(!user) {
			return res.status(401).send(e);
		}
		req.token = token;
		req.user = user;
		next();
	}).catch((e) => {
		res.status(401).send(e);
	});
};

module.exports = { authenticate };