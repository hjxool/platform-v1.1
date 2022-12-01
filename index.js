new Vue({
	el: '#index',
	mounted() {
		this.path = 候工链接.replace(/dlc/i, 'dlc2');
		this.get_type();
		this.turn_to();
	},
	methods: {
		get_type() {
			let temp = location.search.substring(1).split('&');
			for (let val of temp) {
				let t = val.split('=');
				if (t[0].match(/^type$/) != null) {
					this.router = t[1];
				}
			}
		},
		turn_to() {
			let path;
			switch (this.router) {
				case 'model':
					path = 'model';
					break;
				case 'DeviceStatus':
					path = 'status';
					break;
				case 'RulesEngine':
					path = 'rules';
					break;
				case 'RulesEngine2':
					path = 'device_rule';
					break;
				case 'OperationAndMaintenance':
					path = 'door';
					break;
				case 'MeetingReservation':
					path = 'meeting_reserve';
					break;
				case 'MyBooking':
				case 'ConferenceRoomUsageStatistics':
					path = 'my_booking';
					break;
				case 'workbench':
					path = 'workbench';
					break;
				case 'IoTControl':
					path = 'IoTControl';
					break;
				case 'yinxiangxitong':
					path = 'other/音响系统';
					break;
				case 'yitiji':
					path = 'other/一体机';
					break;
				case 'power_supply':
					location.href = `../湖山智慧设备/电源设备/index.html${location.search}`;
					return;
				case 'Wisdom_Scene':
					path = 'powerScene';
					break;
				case 'UpgradeManagement':
					path = 'upgradeManager';
					break;
				case 'ProjectOverviewOffline':
					location.href = `./offlinePage/index.html?token=${this.token}`;
					path = 'offlinePage';
					break;
				case 'ADKXX':
					path = 'other/功放设备';
					break;
				case 'AKEXX':
					path = 'other/时序器';
					break;
				case 'ProjectOverviewOffline':
					path = 'offlinePage';
					break;
				case 'Visual_Preview':
					path = 'visual_editor';
					break;
				default:
					location.href = `${this.path}${location.search}`;
					return;
			}
			location.href = `./${path}/index.html${location.search}`;
		},
	},
});
