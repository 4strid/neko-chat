// todo: don't mutate state (i am in a rush so what can ya do)

import { Container } from 'unstated';

import axios from 'axios';

export default class ChatState extends Container {
	state = {
		ready: false,
		conversations: {
			'1': {
				messages: [{
				id: 0,
				senderName: 'Peter',
				message: 'hello!'
				}, {
					id: 2,
					message: 'goodbye!'
				}],
				unread: 1,
			}
		},
		users: [{
			id: 2,
			name: 'Bob'
			online: true
		}, {
			id: 3,
			name: 'Alice'
			online: false
		}],
		self: {
			name: 'Peter',
			activeConversation: '1',
			userId: 0
		},
		// unix timestamp
		lastActivity: 0,
		// did we skip some conversations?
		theresMore: false
	}

	componentDidMount () {
		const this.api = this.props.api || '/api/nekochat/'
		this.init();
	}

	async init () {
		const self = await this.fetchSelf();
		const users = await this.fetchUsers();
		const conversationsss = this.fetchConvos();
	}

	async fetchConvos (lastId) {
		const { conversations, theresMore } = await this.get('/conversations/', this.self.userId, (lastId || ''));
		const lastActivity = Math.max(...Object.values(conversations).map(convo => convo[convo.length - 1].date));
		return { conversations, theresMore, lastActivity };
	}

	// haha whoops this one also sets state
	// ... also well, it might not cause an update
	async fetchConvo (id) {
		const conversation = this.get('/conversation', id);
		const lastActivity = conversation[convo.length - 1].date;
		return this.setState(state => ({
			conversations: {
				[id]: conversation,
				...state.conversations,
			}
			lastActivity: Math.max(state.lastActivity, lastActivity),
		})
	}

	async fetchSelf () {
		return this.get('/self');
	}

	//async fetchActivity () {

	//}

	async postMessage (convoId, body) {
		const push = {[convoId]: {
			id: this.state.self.userId,
			name: this.state.self.name,
			message: body
		}};

		try {
			await this.post('/conversations/' + convoId, body);
		} catch (err) {
			push.error = err.message || 'Failed to send';
		}

		this.setState(state => {
			let { [convoId]: convo, ...rest } = state.conversations;
			convo = convo || [];
			convo.push(push);
			return ({
				[convoId]: convo,
				...rest
			});
		}
	}

	changeActiveConversation (id) {
		this.setState(state => {
			let { [convoId]: convo, ...rest } = state.conversations;
			convo = convo || [];
			return ({
				activeConversation: id,
				conversations: {
					[convoId]: convo,
					...rest
				},
			});
		})
	}

	// wooooo polling! who needs sockets anyway;
	async fetchUpdates () {
		this.setState(state => {
			const updates = await this.get('/updates', state.lastActivity);
			const newConvos = {};
			for (const update of updates) {
				const { convoId, ...message } = update;
				const newConvo = newConvos[convoId] || state.conversations[convoId] || newConvos[convoId] = {
					messages: [],
					unread: 0
				};
				newConvo.messages.push(message);
				newConvo.unread += 1;
			}
			const oldConvos = {};
			Object.keys(state.conversations).forEach(key => {
				if (key in newConvos) {
					continue;
				}
				oldConvos[key] = state.conversations[key];
			})
			return ({
				conversations: {
					...newConvos,
					...oldConvos
				}
			})
		})
	}

	async fetchUserUpdates () {
		this.setState(state => {
			// this is approximate
			const updates = await this.get('/users', state.lastActivity);
			for (const user of users) {
				const userOld = state.users.findIndex(u => u.id === user.id);
				if (userOld > -1) {
					state.users[userOld] = user;
					continue;
				}
				state.users.push(user);
			}
			return { users: state.users };
		})
	}

	async get (url, ...params) {
		const target = this.api + url + params.length ? '/' + params.join('/') : '';
		const response = await axios.get(target);
		return response.data;
	}

	async post (url, body) {
		const response = axios.post(this.api + url, body);
		return response.data;
	}
}
