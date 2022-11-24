new Vue({
	el: '#index',
	data: {
		url: '',
	},
	mounted() {
		this.path = 候工链接.replace(/dlc/i, 'dlc2');
		if (!location.search) {
			this.token = window.sessionStorage.token;
			this.userName = window.sessionStorage.userName;
			this.id = window.sessionStorage.id;
			this.router = window.sessionStorage.router;
			this.device_name = window.sessionStorage.device_name;
		} else {
			this.get_token();
		}
		this.turn_to();
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
			let url = location.href.split('?')[0];
			history.replaceState('', '', url);
		},
		turn_to() {
			switch (this.router) {
				case 'model':
					location.href = `./model/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'DeviceStatus':
					location.href = `./status/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'RulesEngine':
					location.href = `./rules/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'RulesEngine2':
					location.href = `./device_rule/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'OperationAndMaintenance':
					location.href = `./door/index.html?id=${this.id}&token=${this.token}`;
					return;
				case 'MeetingReservation':
					location.href = `./meeting_reserve/index.html?token=${this.token}`;
					return;
				case 'MyBooking':
				case 'ConferenceRoomUsageStatistics':
					location.href = `./my_booking/index.html?token=${this.token}&type=${this.router}`;
					return;
				case 'workbench':
					location.href = `./workbench/index.html?token=${this.token}`;
					return;
				case 'IoTControl':
					location.href = `./IoTControl/index.html?token=${this.token}`;
					return;
				case 'yinxiangxitong':
					location.href = `./other/音响系统/index.html?token=${this.token}&id=${this.id}&device_name=${this.device_name}`;
					return;
				case 'yitiji':
					location.href = `./other/一体机/index.html?token=${this.token}&id=${this.id}&device_name=${this.device_name}`;
					return;
				case 'power_supply':
					location.href = `../湖山智慧设备/电源设备/index.html?token=${this.token}&id=${this.id}&type=${this.router}`;
					return;
				case 'Wisdom_Scene':
					location.href = `./powerScene/index.html?token=${this.token}`;
					return;
				case 'UpgradeManagement':
					location.href = `./upgradeManager/index.html?token=${this.token}`;
					return;
				case 'ProjectOverviewOffline':
					location.href = `./offlinePage/index.html?token=${this.token}`;
					return;
				case 'ADKXX':
					location.href = `./other/功放设备/index.html?token=${this.token}&id=${this.id}&device_name=${this.device_name}`;
					return;
				case 'ProjectOverviewOffline':
					location.href = `./offlinePage/index.html?token=${this.token}`;
					return;
				default:
					location.href = `${this.path}?token=${this.token}&type=${this.router}${this.id ? `&id=${this.id}` : ''}${this.device_name ? `&device_name=${this.device_name}` : ''}${
						this.userName ? `&userName=${this.userName}` : ''
					}`;
					return;
			}
		},
	},
});
