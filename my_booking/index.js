let url = `${我是接口地址}/`;
let calender_search = `${url}api-portal/meeting/calender/search`;
let meeting_search = `${url}api-portal/meeting/search`;
let meeting_edit = `${url}api-portal/meeting`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			date: new Date(),
			time_option: 0, //切换显示时间周期
			time_display: ['日', '周', '月', '列表'],
			week_date: new Date(),
			month_date: new Date(),
			month_block: [], //月显示时当月1号所在周到月末所在周日期
			day_start: '', // 小于这个数的要显示为灰色
			day_end: '', // 大于这个数的显示为灰色
			list_select: 0, //列表显示下筛选条件
			list_options: ['审核中', '审核通过', '驳回', '已撤回'],
		},
		day_meeting: [], //日下的会议列表
		week_meeting: [], //周下的会议列表
		month_meeting: [], //月下的会议列表
		list_meeting: [], //列表下的会议
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.time_display(this.html.time_option);
	},
	methods: {
		time_display(index) {
			this.html.time_option = index;
			if (index == 0) {
				this.day_meeting = [];
				let start_time = `${this.html.date.getFullYear()}-${this.html.date.getMonth() + 1}-${this.html.date.getDate()} 06:00:00`;
				let end_time = `${this.html.date.getFullYear()}-${this.html.date.getMonth() + 1}-${this.html.date.getDate()} 23:00:00`;
				this.request('post', calender_search, this.token, { queryType: 3, startTime: start_time, endTime: end_time }, (res) => {
					console.log('一天会议', res);
					if (res.data.data == null || typeof res.data.data == 'string' || Object.entries(res.data.data).length == 0) {
						return;
					}
					// 获取基础方格高度
					this.block_height = document.querySelector('.day').offsetHeight / 2;
					this.day_meeting = Object.entries(res.data.data)[0][1];
					for (let i = 0; i < this.day_meeting.length; i++) {
						this.day_meeting[i].startTime = this.day_meeting[i].startTime.split(' ')[1].substring(0, 5);
						this.day_meeting[i].endTime = this.day_meeting[i].endTime.split(' ')[1].substring(0, 5);
					}
				});
			} else if (index == 1) {
				this.week_meeting = [];
				let start_time = `${this.week_start.getFullYear()}-${this.week_start.getMonth() + 1}-${this.week_start.getDate()} 06:00:00`;
				let end_time = `${this.week_end.getFullYear()}-${this.week_end.getMonth() + 1}-${this.week_end.getDate()} 23:00:00`;
				this.request('post', calender_search, this.token, { queryType: 3, startTime: start_time, endTime: end_time }, (res) => {
					console.log('周会议', res);
					if (Object.entries(res.data.data).length == 0) {
						return;
					}
					this.block_height = document.querySelector('.week').offsetHeight / 2;
					// 先将页面渲染数组构造出来 再计算位置
					let t_a = [];
					let array = Object.entries(res.data.data);
					for (let i = 0; i < array.length; i++) {
						let t = new Date(array[i][0]).getDay();
						t_a.push(t);
					}
					for (let i = 0; i < 7; i++) {
						let flag = false;
						for (let j = 0; j < t_a.length; j++) {
							if (i == t_a[j]) {
								flag = true;
								this.week_meeting.push(array[j][1]);
								break;
							}
						}
						if (!flag) {
							this.week_meeting.push([]);
						}
					}
					for (let i = 0; i < this.week_meeting.length; i++) {
						let t = this.week_meeting[i];
						if (t.length != 0) {
							for (let j = 0; j < t.length; j++) {
								t[j].startTime = t[j].startTime.split(' ')[1].substring(0, 5);
								t[j].endTime = t[j].endTime.split(' ')[1].substring(0, 5);
							}
						}
					}
				});
			} else if (index == 2) {
				// 先获取当前年月 然后算当月的1号是周几 然后根据时间戳算周日的日期
				let d = this.html.month_date.getDate();
				let t_start = this.html.month_date;
				if (d > 1) {
					// 当月1号时间戳
					let t = this.html.month_date.getTime() - (d - 1) * 24 * 60 * 60 * 1000;
					t_start = new Date(t);
				}
				let w = t_start.getDay();
				let t3 = t_start.getTime() - w * 24 * 60 * 60 * 1000;
				let d_start = new Date(t3);
				this.html.month_block = [];
				for (let i = 0; i < w; i++) {
					let t = {
						day: d_start.getDate() + i,
						full_date: `${d_start.getFullYear()}-${d_start.getMonth() + 1 < 10 ? '0' + (d_start.getMonth() + 1) : d_start.getMonth() + 1}-${d_start.getDate() + i}`,
					};
					this.html.month_block.push(t);
				}
				// 记录哪些数字显示灰色
				this.html.day_start = this.html.month_block.length;
				// 计算当月有多少天
				let y = this.html.month_date.getFullYear();
				let m = this.html.month_date.getMonth() + 1;
				let total = new Date(y, m, 0).getDate();
				for (let i = 1; i <= total; i++) {
					let t = {
						day: i,
						full_date: `${y}-${m < 10 ? '0' + m : m}-${i < 10 ? '0' + i : i}`,
					};
					this.html.month_block.push(t);
				}
				this.html.day_end = this.html.month_block.length;
				// 表格是5 x 7的 所以用35 - month_block.length就是下个月要填入数组的个数
				let a = 35 - this.html.month_block.length;
				let t4 = t3 + this.html.month_block.length * 24 * 60 * 60 * 1000;
				let next_month_start = new Date(t4);
				for (let i = 1; i <= a; i++) {
					let t = {
						day: i,
						full_date: `${next_month_start.getFullYear()}-${next_month_start.getMonth() + 1 < 10 ? '0' + (next_month_start + 1) : next_month_start + 1}-${i < 10 ? '0' + i : i}`,
					};
					this.html.month_block.push(t);
				}
				// 发送请求 计算35个方格中开始到结束的日期
				this.month_meeting = [];
				let start_time = `${d_start.getFullYear()}-${d_start.getMonth() + 1}-${d_start.getDate()} 06:00:00`;
				let end_day = new Date(d_start.getTime() + 34 * 24 * 60 * 60 * 1000);
				let end_time = `${end_day.getFullYear()}-${end_day.getMonth() + 1}-${end_day.getDate()} 23:00:00`;
				this.request('post', calender_search, this.token, { queryType: 3, startTime: start_time, endTime: end_time }, (res) => {
					console.log('月会议', res);
					if (Object.entries(res.data.data).length == 0) {
						return;
					}
					let t = Object.entries(res.data.data);
					for (let i = 0; i < this.html.month_block.length; i++) {
						let flag = false;
						for (let j = 0; j < t.length; j++) {
							if (this.html.month_block[i].full_date == t[j][0]) {
								flag = true;
								this.month_meeting.push(t[j][1]);
								break;
							}
						}
						if (!flag) {
							this.month_meeting.push([]);
						}
					}
					for (let i = 0; i < this.month_meeting.length; i++) {
						let t = this.month_meeting[i];
						if (t.length != 0) {
							for (let j = 0; j < t.length; j++) {
								t[j].startTime = t[j].startTime.split(' ')[1].substring(0, 5);
							}
						}
					}
				});
			} else if (index == 3) {
				// 两个数组 一个是分类保存数据 一个用于页面展示
				this.list_meeting = [];
				this.request('post', meeting_search, this.token, { condition: { queryType: 1 }, pageNum: 1, pageSize: 999999 }, (res) => {
					console.log('我的预订', res);
					if (Object.entries(res.data.data).length == 0) {
						return;
					}
					let t = res.data.data.data;
					let under = [];
					let reject = [];
					let pass = [];
					let cancel = [];
					let t2;
					let t3;
					let t4;
					for (let i = 0; i < t.length; i++) {
						t2 = t[i].endTime.split(' ')[1].substring(0, 5);
						t3 = t[i].startTime.split(' ');
						t4 = t3[0].split('-');
						t[i].html_time = `${t4[0]}年${t4[1]}月${t4[2]}日 ${t3[1].substring(0, 5)} - ${t2}`;
						switch (t[i].auditStatus) {
							case -1:
								reject.push(t[i]);
								break;
							case 0:
								cancel.push(t[i]);
								break;
							case 1:
								under.push(t[i]);
								break;
							case 2:
								pass.push(t[i]);
								break;
						}
					}
					this.list_meeting.push(under, pass, reject, cancel);
				});
			}
		},
		// 格式化周的时间显示
		week_format() {
			let w = this.html.week_date.getDay();
			let time3 = this.html.week_date.getTime();
			let time4 = time3 - w * 24 * 60 * 60 * 1000;
			let time5 = new Date(time4);
			// 要算的是周六的日期 6-星期=间隔时间 算时间戳 在转换为日期格式
			let time = this.html.week_date.getTime() + (6 - w) * 24 * 60 * 60 * 1000;
			let time2 = new Date(time);
			this.week_start = time5;
			this.week_end = time2;
			return `${time5.getFullYear()}-${time5.getMonth() + 1}-${time5.getDate()} ~ ${time2.getFullYear()}-${time2.getMonth() + 1}-${time2.getDate()}`;
		},
		// 设置周中每天的会议方块位置 大小
		block_position(obj) {
			let t = {};
			// let start = obj.startTime.split(' ')[1].substring(0, 5).split(':');
			// let end = obj.endTime.split(' ')[1].substring(0, 5).split(':');
			let start = obj.startTime.split(':');
			let end = obj.endTime.split(':');
			let s = (Number(start[0]) - 6) * 2;
			if (start[1] == '30') {
				s++;
			}
			let s_p = s * this.block_height;
			t.top = `${s_p}px`;
			let e = (Number(end[0]) - 6) * 2 - 1;
			if (end[1] == '30') {
				e++;
			}
			let offset = e - s + 1;
			let h = offset * this.block_height;
			t.height = `${h}px`;
			return t;
		},
		// 不同日期下点击前/后一天 功能不一样
		pre_date(page_index) {
			switch (page_index) {
				case 0:
					this.html.date = new Date(this.html.date.getTime() - 24 * 60 * 60 * 1000);
					break;
				case 1:
					this.html.week_date = new Date(this.html.week_date.getTime() - 7 * 24 * 60 * 60 * 1000);
					this.week_format();
					break;
				case 2:
					let y = this.html.month_date.getFullYear();
					let m = this.html.month_date.getMonth() + 1;
					if (m == 1) {
						m = 12;
						y--;
					} else {
						m--;
					}
					this.html.month_date = new Date(`${y}-${m}`);
					break;
			}
			this.time_display(this.html.time_option);
		},
		next_date(page_index) {
			switch (page_index) {
				case 0:
					this.html.date = new Date(this.html.date.getTime() + 24 * 60 * 60 * 1000);
					break;
				case 1:
					this.html.week_date = new Date(this.html.week_date.getTime() + 7 * 24 * 60 * 60 * 1000);
					this.week_format();
					break;
				case 2:
					let y = this.html.month_date.getFullYear();
					let m = this.html.month_date.getMonth() + 1;
					if (m == 12) {
						m = 1;
						y++;
					} else {
						m++;
					}
					this.html.month_date = new Date(`${y}-${m}`);
					break;
			}
			this.time_display(this.html.time_option);
		},
		// 撤销预约
		cancel_review(meeting_id) {
			this.request('put', meeting_edit, this.token, { id: meeting_id, status: -1 }, () => {
				this.time_display(this.html.time_option);
			});
		},
	},
});
