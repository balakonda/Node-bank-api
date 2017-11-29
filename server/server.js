require('./config/config.js');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const mongoose = require('./db/mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');

var { Todo } = require('./models/todo');
var { Bank } = require('./models/bank-accounts');
var { User } = require('./models/user');
var { Statement } = require('./models/statement');
var { Transfer } = require('./models/transfer');
var { authenticate } = require('./middleware/authenticate');

var app = express();

var PORT = process.env.PORT;

app.use(bodyParser.json());

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Auth");
  	next();
});


app.post('/todos', authenticate, (req, res) => {
	console.log(req.body);
	var todo = new Todo({
		text: req.body.text,
		completed: req.body.completed,
		completedAt: req.body.completedAt,
		_creator: req.user._id
	});
	console.log(todo);
	todo.save().then((doc) => {
		console.log(doc)
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	});
});

app.post('/transfer', authenticate, (req, res) => {
	var body = _.pick(req.body, ['accno', 'acctype', 'ifsc', 'name', 'email', 'amount']);
	var transfer = new Transfer({
		accountNo: body.accno,
		accountType: body.acctype,
		ifsc: body.ifsc,
		recipientName: body.name,
		recipientEmail: body.email,
		amount: body.amount,
		_creator: req.user._id
	});
	transfer.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	});
});

app.get('/transferList', authenticate, (req, res) => {
	Transfer.find({
		_creator: req.user._id
	}).then((transferList) => {
		res.send({ transferList });
	}).catch((e) => {
		res.status(400).send(e);
	})
});

app.post('/statement', authenticate, (req, res) => {
	var body = _.pick(req.body, ['transactionType', 'transactionDt', 'amount']);
	var statement = new Statement({
		transactionType: body.transactionType,
		transactionDt: body.transactionDt,
		amount: body.amount,
		_creator: req.user._id
	});
	statement.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	});
});

app.get('/statement', authenticate, (req, res) => {
	Statement.find({
		_creator: req.user._id
	}).then((statements) => {
		res.send({ statements });
	}).catch((e) => {
		res.status(400).send(e);
	})
});

app.post('/bankaccount', authenticate, (req, res) => {
	var body = _.pick(req.body, ['accountNo', 'accountType', 'balance']);
	var bank = new Bank({
		accountNo: body.accountNo,
		accountType: body.accountType,
		balance: body.balance,
		_creator: req.user._id
	});
	bank.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	});
});

app.get('/bankaccount', authenticate, (req, res) => {
	Bank.find({
		_creator: req.user._id
	}).then((banks) => {
		res.send({ banks });
	}).catch((e) => {
		res.status(400).send(e);
	})
});

app.get('/todos', authenticate, (req, res) => {
	console.log(req.body);
	Todo.find({
		_creator: req.user._id
	}).then((todos) => {
		res.send({ todos });
	}, (e) => {
		res.status(400).send(e);
	});
});

app.get('/todos/:id', (req, res) => {
	if(ObjectId.isValid(req.params.id)) {
		Todo.findOne({
			_id: req.params.id,
			_creator: req.user._id
		}).then((todo) => {
			if(todo) {
				res.send({ todo });
			} else {
				res.status(400).send({message: 'Invalid Object'});
			}
		}).catch((e) => {
			res.status(400).send(e);
		});
	} else {
		res.status(404).send();
	}
});

app.delete('/todos/:id', (req, res) => {
	if(ObjectId.isValid(req.params.id)) {
		Todo.findOneAndRemove({
			_id: req.params.id,
			_creator: req.user._id
		}).then((todo) => {
			if(todo) {
				res.send({todo});
			} else {
				res.status(400).send({message: 'Invalid Object'});
			}
		}).catch((e) => res.status(400).send(e));
	} else {
		res.status(404).send();
	}
});

app.patch('/todos/:id', (req, res) => {
	var id = req.params.id;
	var body = _.pick(req.body, ['text', 'completed']);

	if(_.isBoolean(body.completed) && body.completed) {
		body.completedAt = new Date().getTime();
	} else {
		body.completed = false;
		body.completedAt = null;
	}

	if(!ObjectId.isValid(id)) {
		return res.status(400).send({message: 'Invalid Object'});
	}


	Todo.findOneAndUpdate({
			_id: req.params.id,
			_creator: req.user._id
		}, {$set: body}, {new: true}).then((todo) => {
		if(todo) {
			res.send({todo});
		} else {
			res.status(400).send({message: 'Invalid Object'});
		}
	}).catch((e) => res.status(404).send(e));

});

//Users Register
app.post('/users/register', (req, res) => {

	var body = _.pick(req.body, ['username', 'email', 'password']);
	var user = new User(body);

	user.save().then((res) => {
		res.send(user);
	}).catch((e) => {
		res.status(400).send(e);
	});
});

//Users
app.post('/users', (req, res) => {

	var body = _.pick(req.body, ['username', 'password']);
	var user = new User(body);

	user.save().then((res) => {
		console.log(res);
		return user.generateAuthToken();
	}).then((token) => {
		console.log('token');
		console.log(res);
		res.header('x-auth', token).send(user);
	}).catch((e) => {
		res.status(400).send(e);
	});
});

app.get('/users/me', authenticate, (req, res) => {
	res.send(req.user);
});

app.post('/users/login', (req, res) => {
	var body = _.pick(req.body, ['username', 'password']);

	User.findByCredentials(body).then((user) => {
		return user.generateAuthToken().then((token) => {
			console.log('x-auth');
			res.header('x-auth', token).send({user, token});
		});
	}).catch((e) => {
		res.status(400).send(e);
	});
});

app.delete('/users/me/token', authenticate, (req, res) => {
	req.user.removeToken(req.token).then(() => {
		res.send();
	}).catch((e) => {
		res.status(400).send();
	})
	res.send(req.user);
});

app.listen(PORT, () => {
	console.log(`Started at ${PORT}`);
})

module.exports = { app };

// var newTodo = new Todo({
// 	text: 'New Cook1'
// });

// newTodo.save().then((res) => {
// 	console.log(res);
// }, (err) => {
// 	console.log(err);
// });
