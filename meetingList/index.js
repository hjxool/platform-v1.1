let url = `${我是接口地址}/`;
let search_meeting_url = `${url}api-portal/meeting/search`;

new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			loading: true, //页面加载
			search: '', //模糊搜索
			date_options: {
				shortcuts: [
					{
						text: '最近一周',
						onClick(picker) {
							const end = new Date();
							const start = new Date();
							start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
							picker.$emit('pick', [start, end]);
						},
					},
					{
						text: '最近一个月',
						onClick(picker) {
							const end = new Date();
							const start = new Date();
							start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
							picker.$emit('pick', [start, end]);
						},
					},
					{
						text: '最近三个月',
						onClick(picker) {
							const end = new Date();
							const start = new Date();
							start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
							picker.$emit('pick', [start, end]);
						},
					},
				],
			},
			date: null, //日期范围
			status: '', //会议状态
			status_options: [
				// 状态类型
				{ value: -1, label: '驳回' },
				{ value: 0, label: '已撤回' },
				{ value: 1, label: '审核中' },
				{ value: 2, label: '审核通过' },
			],
			size: 20, //一页显示条数
		},
		total_size: 0, //总条数
		tableData: [], //表格数据
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		window.addEventListener('resize', this.table_height);
		this.get_data();
	},
	methods: {
		// 计算表格最大高度
		table_height() {
			let dom = document.querySelector('.body');
			return dom.offsetHeight;
		},
		// 跳转详情页
		turn_to(id) {
			location.href = `${候工链接}?token=${this.token}&type=meetingDetail&id=${id}&prePage=MeetingList`;
		},
		// 多条件查询
		get_data(type, current) {
			this.html.loading = true;
			if (type == 'page') {
				this.current_page = current;
			}
			let c = {
				queryType: 5,
			};
			if (this.html.status !== '') {
				c.auditStatus = this.html.status;
			}
			if (this.html.date != null) {
				let t1 = this.html.date[0];
				c.startTime = `${t1.getFullYear()}-${t1.getMonth() + 1 < 10 ? '0' + (t1.getMonth() + 1) : t1.getMonth() + 1}-${t1.getDate() < 10 ? '0' + t1.getDate() : t1.getDate()} 00:00:00`;
				let t2 = this.html.date[1];
				c.endTime = `${t2.getFullYear()}-${t2.getMonth() + 1 < 10 ? '0' + (t2.getMonth() + 1) : t2.getMonth() + 1}-${t2.getDate() < 10 ? '0' + t2.getDate() : t2.getDate()} 23:59:59`;
			}
			this.request('post', search_meeting_url, this.token, { condition: c, pageNum: this.current_page || 1, pageSize: this.html.size, keyword: this.html.search }, (res) => {
				console.log('会议列表', res);
				this.html.loading = false;
				if (res.data.head.code != 200) {
					return;
				}
				this.total_size = res.data.data.total;
				this.tableData = res.data.data.data;
			});
		},
	},
});
