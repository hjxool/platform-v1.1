new Vue({
	el: '#index',
	data: {
		url: '',
	},
	mounted() {
		if (!location.search) {
			this.token = window.sessionStorage.token;
			this.userName = window.sessionStorage.userName;
			this.id = window.sessionStorage.id;
			this.router = window.sessionStorage.router;
			this.device_name = window.sessionStorage.device_name;
			this.turn_to();
		} else {
			this.get_token();
		}
	},
	methods: {
		get_token() {
			let temp = location.search.substring(1).split('&');
			temp.forEach((e) => {
				let key = e.split('=')[0];
				let value = e.split('=')[1];
				if (key.match(/^token$/) != null) {
					this.token = value;
					window.sessionStorage.token = this.token;
				} else if (key.match(/^userName$/) != null) {
					this.userName = value;
					window.sessionStorage.userName = this.userName;
				} else if (key.match(/^id$/) != null) {
					this.id = value;
					window.sessionStorage.id = this.id;
				} else if (key.match(/^type$/) != null) {
					this.router = value;
					window.sessionStorage.router = this.router;
				} else if (key.match(/^device_name$/) != null) {
					this.device_name = value;
					window.sessionStorage.device_name = this.device_name;
				}
			});
			this.turn_to();
			let url = location.href.split('?')[0];
			history.replaceState('', '', url);
		},
		turn_to() {
			switch (this.router) {
				case 'model':
					this.url = `./model/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'DeviceStatus':
					this.url = `./status/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'RulesEngine':
					this.url = `./rules/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'RulesEngine2':
					this.url = `./device_rule/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'OperationAndMaintenance':
					this.url = `./door/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'MeetingReservation':
					this.url = `./meeting_reserve/index.html?token=${this.token}`;
					return;
				case 'MyBooking':
				case 'ConferenceRoomUsageStatistics':
					this.url = `./my_booking/index.html?token=${this.token}&type=${this.router}`;
					return;
				case 'workbench':
					this.url = `./workbench/index.html?token=${this.token}`;
					return;
				case 'IoTControl':
					this.url = `./IoTControl/index.html?token=${this.token}`;
					return;
				case 'yinxiangxitong':
					document.title = '音响系统';
					this.url = `./other/音响系统/index.html?token=${this.token}&id=${this.id}&device_name=${this.device_name}`;
					return;
				case 'yitiji':
					document.title = '一体机';
					this.url = `./other/一体机/index.html?token=${this.token}&id=${this.id}&device_name=${this.device_name}`;
					return;
				case 'power_supply':
					document.title = '电源设备';
					this.url = `../湖山智慧设备/电源设备/index.html?token=${this.token}&id=${this.id}&type=${this.router}`;
					return;
				case 'Wisdom_Scene':
					this.url = `./powerScene/index.html?token=${this.token}`;
					return;
				default:
					this.url = `../dlc2/index.html?token=${this.token}&type=${this.router}${typeof this.id == 'string' ? `&id=${this.id}` : ''}${
						typeof this.device_name == 'string' ? `&device_name=${this.device_name}` : ''
					}${typeof this.userName == 'string' ? `&userName=${this.userName}` : ''}`;
					return;
			}
		},
	},
});
