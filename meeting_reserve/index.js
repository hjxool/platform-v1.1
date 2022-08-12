// let url = `${我是接口地址}/`;
// let user_list = `${url}api-portal/place/tenant/findTenantList`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		token: '',
		html: {
			block_list: [], //会议室方块状态
		},
		input1: '',
		input2: '',
		place_list: [
			{
				name: '测试1',
				meeting: [
					{ start: '07:00', end: '11:30', status: 1 },
					{ start: '14:30', end: '15:00', status: 0 },
				],
			},
			{
				name: '测试2',
				meeting: [{ start: '10:00', end: '15:00', status: 1 }],
			},
		],
	},
	created() {
		this.fun3();
	},
	mounted() {
		// if (!location.search) {
		// 	this.token = sessionStorage.token;
		// } else {
		// 	this.get_token();
		// }
		// this.fun1();
		this.fun4();
		window.onresize = () => {
			this.fun4();
		};
		console.log();
		this.fun5();
	},
	methods: {
		fun1() {
			let time = new Date().toString().split(' ')[4];
			let time_list = time.split(':');
			let hour = +time_list[0];
			let minute = +time_list[1];
			this.boundary = (hour - 6) * 2;
			if (minute > 30) {
				this.boundary++;
			}
		},
		fun2(place_obj, time_index) {
			// time_index从0开始
			let array = place_obj.meeting;
			// 对单个场所下每个时间点 查找是否在任意一个会议时间段内
			for (let i = 0; i < array.length; i++) {
				let start = array[i].start.split(':');
				let start_hour = +start[0];
				let start_minute = +start[1];
				let start_index = (start_hour - 6) * 2;
				if (start_minute == 30) {
					start_index++;
				}
				let end = array[i].end.split(':');
				let end_hour = +end[0];
				let end_minute = +end[1];
				// 结束时间是分隔线之前 开始时间从分隔线之后
				let end_index = (end_hour - 6) * 2 - 1;
				if (end_minute == 30) {
					end_index++;
				}
				if (time_index >= start_index && time_index <= end_index) {
					// status 0表示待审批 1表示已预定
					if (array[i].status == 0) {
						return 1;
					} else if (array[i].status == 1) {
						return 2;
					}
				}
			}
			// 0表示空闲 1表示待审批 2表示已预定
			return 0;
		},
		fun3() {
			this.html.block_list = [];
			for (let i = 0; i < this.place_list.length; i++) {
				let t = [];
				for (let j = 0; j < 38; j++) {
					t[j] = this.fun2(this.place_list[i], j);
				}
				this.html.block_list.push(t);
			}
		},
		fun4() {
			let time = new Date().toString().split(' ')[4];
			let time_list = time.split(':');
			let hour = +time_list[0];
			let minute = +time_list[1];
			// 首先找到当前时间所在方格
			this.boundary = (hour - 6) * 2;
			// 计算分钟在一小时间隔中位置
			let per = minute / 60;
			let block_position = document.querySelectorAll('.time_box')[this.boundary].offsetLeft;
			let block_width = document.querySelector('.time_box').offsetWidth;
			let offset = per * (block_width * 2) + block_position;
			let dom = document.querySelector('.current_time');
			dom.style.left = `${offset}px`;
		},
		fun5() {
			let dom_list = document.querySelectorAll('.time_box');
			for (let i = 0; i < this.html.block_list.length; i++) {
				let start_num = 0;
				let t = this.html.block_list[i];
				for (let j = 0; j < t.length; j++) {
					if (t[j] != start_num && t[j] != 0) {
						start_num = t[j];
						let child = dom_list[i * 36 + j].children;
						for (let k = 0; k < child.length; k++) {
							if (child[k].style.display != 'none') {
								child[k].classList.add('color_start');
							}
						}
					} else if (t[j] != start_num && t[j] == 0) {
						start_num = t[j];
						let child = dom_list[i * 36 + j - 1].children;
						for (let k = 0; k < child.length; k++) {
							if (child[k].style.display != 'none') {
								child[k].classList.add('color_end');
							}
						}
					}
				}
			}
		},
	},
});
