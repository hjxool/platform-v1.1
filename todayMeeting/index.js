let url = `${我是接口地址}/`;
let search_meeting_url = `${url}api-portal/meeting/list`;
let user_url = `${url}api-auth/oauth/userinfo`; //获取当前登录用户信息
let cancel_url = `${url}api-portal/meeting/cancel`;

new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			table_h: 0, //表格最大高度
			size: 20, //表格显示数量
			loading: true, //页面加载
			cancel_display: true, //取消会议按钮显示
		},
		tableData: [],
		total_size: 0, //总条目
		current_user: '', //当前用户id
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.get_current_user();
		this.get_data(1);
		window.addEventListener('resize', this.resize);
	},
	methods: {
		// 获取当前登录用户名
		get_current_user() {
			this.request('get', user_url, this.token, (res) => {
				console.log('用户信息');
				if (res.data.head.code != 200) {
					this.$message('无法获取用户信息');
					this.html.cancel_display = false;
					return;
				}
				this.current_user = res.data.data.id;
			});
		},
		resize() {
			this.table_height();
		},
		// 计算表格最大高度
		table_height() {
			let dom = document.querySelector('.body');
			return dom.offsetHeight;
		},
		// 页数变化 查询数据
		get_data(current) {
			this.html.loading = true;
			let t = new Date();
			let d = `${t.getFullYear()}-${t.getMonth() + 1 < 10 ? '0' + (t.getMonth() + 1) : t.getMonth() + 1}-${t.getDate() < 10 ? '0' + t.getDate() : t.getDate()}`;
			let s = `${d} 00:00:00`;
			let e = `${d} 23:59:59`;
			this.request('post', search_meeting_url, this.token, { condition: { startTime: s, endTime: e }, pageNum: current, pageSize: this.html.size }, (res) => {
				console.log('会议列表', res);
				this.html.loading = false;
				if (res.data.head.code != 200) {
					return;
				}
				this.total_size = res.data.data.total;
				this.tableData = res.data.data.data;
			});
		},
		// 跳转详情页
		turn_to(id) {
			location.href = `${候工链接}?token=${this.token}&type=meetingDetail&id=${id}&prePage=MyBooking`;
		},
		// 取消会议
		cancel_meeting(meeting_id) {
			this.request('put', `${cancel_url}/${meeting_id}`, this.token, (res) => {
				this.get_data(1);
			});
		},
	},
});
