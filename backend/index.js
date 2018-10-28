const ko = require('nekodb');

function ChatServer (dbfile, Router, getSelf, middlewareStyle) {
	ko.connect({
		client: 'nedb',
		filepath: dbfile
	});

	const User = ko.Model('User', {
		id: ko.Number,
		name: ko.String,
		searchname: ko.String,
		tags: [ ko.models.Tag ],
		activeConversation: ko.models.Conversation,
		$$hooks: {
			prevalidate (instance, next) {
				instance.searchname = instance.name.toLowerCase();
				next();
			}
		}
	})

	const Tag = ko.Model('Tag', {
		name: ko.String,
		searchname: ko.String,
		$$hooks: {
			prevalidate (instance, next) {
				instance.searchname = instance.name.toLowerCase();
				next();
			}
		}
	})

	const Conversation = ko.Model('Conversation', {
		users: [ User ],
		tag: [ Tag ],
		lastActivity: ko.Date,
	});
	
	const Message = ko.Model('Message', {
		convoId: Conversation,
		userId: User,
		message: ko.String,
		date: ko.Date.Now(),
	});

	this.models = { User, Tag, Conversation };


	function SelfRouter (Router, getSelf, middlewareStyle) {
		const router = new Router();
		router.get('/', Send(middlewareStyle, getSelf));
		return router;
	}

	function ConversationsRouter (Router, middlewareStyle) {
		const router = new Router();
		router.get('/:userId/', Send(middlewareStyle, async req => {
			const convos = await Conversation.find({ users: req.params.userId }).sort({ lastActivity: -1 });
			const result = {
				conversations: {},
				theresMore: false
			};
			for (const convo of convos) {
				result.conversations[convo._id] = await Message.find({ convoId: convo._id });
			}
			return result;
		}))

		router.post('/conversations/:convoId', Send(middlewareStyle, async req => {
			await Message.insertOne(req.body)
		}));

		// just return them all lol
		//router.get('/:userId/:lastId', Send(middlewareStyle, req => {
			//const convos = await Conversation.find({ users: req.params.userId }).sort({ lastActivity: -1 });
			//const result = {};
			//for (const convo of convos) {
				//result[convo._id] = await Message.find({ convoId: convo._id });
			//}
		//}))
	}

	function ConversationRouter (Router, middlewareStyle) {
		const router = new Router();
		router.get('/:wildcard', Send(middlewareStyle, async req => throw new Error('Not implemented yet')));
		return router;
	}

	this.routes = new Router();

	this.routes.use('/')
}

function Send (middlewareStyle, get) {
	// just do express for now...
	return function (req, res) {
		get(req).then(result => {
			res.send(result);
		}).catch(err => {
			res.status(500);
			res.send(result);
		})
	}
}
