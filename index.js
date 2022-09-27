new Vue({
	el: '#index',
	data() {
		return {
			id: '',
			token: '',
			router: '',
		};
	},
	mounted() {
		this.get_token();
	},
	methods: {
		get_token() {
			let temp = location.search.substring(1).split('&');
			temp.forEach((e) => {
				let key = e.split('=')[0];
				let value = e.split('=')[1];
				if (key.indexOf('token') != -1) {
					this.token = value;
					window.sessionStorage.token = this.token;
				} else if (key.indexOf('userName') != -1) {
					this.userName = value;
					window.sessionStorage.userName = this.userName;
				} else if (key.indexOf('id') != -1) {
					this.id = value;
					window.sessionStorage.id = this.id;
				} else if (key.indexOf('type') != -1) {
					this.router = value;
					window.sessionStorage.router = this.router;
				}
			});
		},
		turn_to() {
			let url;
			switch (this.router) {
				case 'model':
					url = `./model/index.html?id=${this.id}&token=${this.token}`;
					return url;
				case 'DeviceStatus':
					url = `./status/index.html?id=${this.id}&token=${this.token}`;
					return url;
				case 'RulesEngine':
					url = `./rules/index.html?id=${this.id}&token=${this.token}`;
					return url;
				case 'RulesEngine2':
					url = `./device_rule/index.html?id=${this.id}&token=${this.token}`;
					return url;
				case 'OperationAndMaintenance':
					url = `./door/index.html?id=${this.id}&token=${this.token}`;
					return url;
				case 'MeetingReservation':
					url = `./meeting_reserve/index.html?token=${this.token}`;
					return url;
				case 'MyBooking':
				case 'ConferenceRoomUsageStatistics':
					url = `./my_booking/index.html?token=${this.token}&type=${this.router}`;
					return url;
				case 'workbench':
					url = `./workbench/index.html?token=${this.token}`;
					return url;
				case 'IoTControl':
					url = `./IoTControl/index.html?token=${this.token}`;
					return url;
			}
		},
	},
});
