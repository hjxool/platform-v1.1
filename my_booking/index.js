let url = `${我是接口地址}/`;
let calender_search = `${url}api-portal/meeting/calender/search`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	data: {
		html: {
			date: new Date(),
			time_option: 0, //切换显示时间周期
			time_display: ['日', '周', '月'],
			week_date: new Date(),
			month_date: new Date(),
			month_block: [], //月显示时当月1号所在周到月末所在周日期
			day_start: '', // 小于这个数的要显示为灰色
			day_end: '', // 大于这个数的显示为灰色
		},
		day_meeting: [], //日下的会议列表
		week_meeting: [], //周下的会议列表
		month_meeting: [], //月下的会议列表
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.time_display(0);
	},
	methods: {
		time_display(index) {
			this.html.time_option = index;
			if (index == 0) {
				let start_time = `${this.html.date.getFullYear()}-${this.html.date.getMonth() + 1}-${this.html.date.getDate()} 06:00:00`;
				let end_time = `${this.html.date.getFullYear()}-${this.html.date.getMonth() + 1}-${this.html.date.getDate()} 23:00:00`;
				this.request('post', `${calender_search}?startTime=${start_time}&endTime=${end_time}`, this.token, (res) => {});
			} else if (index == 1) {
			} else if (index == 2) {
				// 先获取当前年月 然后算当月的1号是周几 然后根据时间戳算周日的日期
				let d = this.html.month_date.getDate();
				let t;
				let t_start = this.html.month_date;
				if (d > 1) {
					// 当月1号时间戳
					t = this.html.month_date.getTime() - (d - 1) * 24 * 60 * 60 * 1000;
					t_start = new Date(t);
				}
				let w = t_start.getDay();
				let t3 = t_start.getTime() - w * 24 * 60 * 60 * 1000;
				let d_start = new Date(t3).getDate();
				this.html.month_block = [];
				for (let i = 0; i < w; i++) {
					this.html.month_block.push(d_start + i);
				}
				// 记录哪些数字显示灰色
				this.html.day_start = this.html.month_block.length;
				// 计算当月有多少天
				let y = this.html.month_date.getFullYear();
				let m = this.html.month_date.getMonth() + 1;
				let total = new Date(y, m, 0).getDate();
				for (let i = 1; i <= total; i++) {
					this.html.month_block.push(i);
				}
				this.html.day_end = this.html.month_block.length;
				// 表格是5 x 7的 所以用35 - month_block.length就是下个月要填入数组的个数
				let a = 35 - this.html.month_block.length;
				for (let i = 1; i <= a; i++) {
					this.html.month_block.push(i);
				}
			}
		},
		week_format() {
			let w = this.html.week_date.getDay();
			let time3 = this.html.week_date.getTime();
			let time4 = time3 - w * 24 * 60 * 60 * 1000;
			let time5 = new Date(time4);
			// 要算的是周六的日期 6-星期=间隔时间 算时间戳 在转换为日期格式
			let time = this.html.week_date.getTime() + (6 - w) * 24 * 60 * 60 * 1000;
			let time2 = new Date(time);
			return `${time5.getFullYear()}-${time5.getMonth() + 1}-${time5.getDate()} ~ ${time2.getFullYear()}-${time2.getMonth() + 1}-${time2.getDate()}`;
		},
	},
});
