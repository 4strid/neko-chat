import React from 'react';

import ChatWindow from 

export default class Chat extends React.Component {
	state = {
		conversations: {
			'1': [{
				id: 0,
				message: 'hello!'
			}]
		},
		users: [{
			id: 2,
			online: true
		}, {
			id: 3,
			online: false
		}],
		activeConversation: '1'
	}

	render () {
		return (
			<div>
				<div style={{width: '40%'}}>
					<Conversations conversations={this.state.conversations} activeConversation: {this.state.activeConversation}/>
				</div>
				<div style={{width: '57%'}}>
					<ChatWindow messages={this.state.conversations[this.state.activeConversation]} />
				</div>
			</div>
		)
	}
}
