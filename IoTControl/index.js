let url = `${我是接口地址}/`;
let rule_search = `${url}api-portal/online-check-rule/search`;
let update_rule = `${url}api-portal/online-check-rule/saveOrUpdate`;
let device_list = `${url}api-portal/room/device`;
let room_search = `${url}api-portal/room/search`;
let model_server_search = `${url}api-device/protocol/current/services`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			page_options: ['设备管理', '设备联检', '设备巡检', '情景模式'],
			page_select: 0, // 页面选择
			page_loading: true, // 加载大页面时loading遮罩
			popup_loading: false, // 加载二级弹窗loading遮罩
		},
		place_id: '', //所选会议室
		place_list: [], //会议室列表
		device: {
			list: [], // 设备卡片列表
			list_empty: false, //设备列表为空时显示
		},
		joint: {
			options: ['联检规则', '联检记录'],
			select: 0, // 设备联检选择
			table1_height: 0, // 联检表格高度
			log_search: '', // 记录搜索
			table2_height: 0, // 记录表格高度
			add_rule_display: false, // 添加规则表单
			form: {
				name: '',
				date: [], // 日期范围 数组
				cycle_week: [], // 执行周期 数组
				select_time: '',
				isIndeterminate: false, //不全选样式
				checkAll: false, //全选
				device_selected: [], // 勾选的设备
				model_server_list: [], // 物模型服务列表
			},
			rule_list: [], // 联检规则表
		},
		polling: {
			options: ['巡检计划', '巡检规则', '巡检记录'],
			select: 0, // 设备巡检选择
			apply_place: '', // 应用会议室
			log_select: 0, //全部 待巡检 正常完成
			table3_height: 0, // 表格高度
		},
		tableData: [{ a: 1, b: 2, c: 3, d: 4 }],
		option1: [1, 2, 3, 4],
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.get_place_list();
	},
	methods: {
		// 获取会议室列表
		get_place_list() {
			this.request('post', room_search, this.token, { condition: {}, pageNum: 1, pageSize: 999999 }, (res) => {
				console.log('会议室列表', res);
				if (Object.entries(res.data.data).length == 0) {
					return;
				}
				this.place_list = res.data.data.data;
				this.place_id = this.place_list[0].id;
				this.page_switch(0);
			});
		},
		// 页面选择
		page_switch(page_index) {
			this.html.page_select = page_index;
			this.device.list = [];
			this.html.page_loading = true;
			this.request('post', `${device_list}/${this.place_id}`, this.token, { condition: {}, pageNum: 1, pageSize: 999999 }, (res) => {
				console.log('设备列表', res);
				this.html.page_loading = false;
				if (Object.entries(res.data.data).length == 0 || res.data.data.data == null) {
					this.device.list_empty = true;
					return;
				}
				this.device.list = res.data.data.data;
				for (let i = 0; i < this.device.list.length; i++) {
					this.$set(this.device.list[i], 'selected', false);
					this.$set(this.device.list[i], 'server_select', '');
				}
				this.device.list_empty = false;
			});
			if (page_index == 1) {
				this.joint_select(this.joint.select);
			} else if (page_index == 2) {
				this.polling_select(this.polling.select);
			}
		},
		// 联检选择
		joint_select(index) {
			this.html.page_loading = true;
			this.joint.select = index;
			if (index == 0) {
				this.request('post', rule_search, this.token, { condition: { placeId: this.place_id }, pageNum: 1, pageSize: 99999999 }, (res) => {
					console.log('联检规则表', res);
					this.html.page_loading = false;
					if (Object.entries(res.data.data).length == 0) {
						return;
					}
					this.joint.rule_list = res.data.data.data;
					this.$nextTick(() => {
						this.joint.table1_height = document.querySelector('.page2_1').clientHeight;
					});
				});
			} else if (index == 1) {
				this.$nextTick(() => {
					this.joint.table2_height = document.querySelector('.table2').clientHeight;
				});
			}
		},
		// 添加规则
		add_joint_rules() {
			this.joint.add_rule_display = true;
			this.html.popup_loading = false;
			this.clean_form(this.joint.form);
			for (let i = 0; i < this.device.list.length; i++) {
				this.device.list[i].selected = false;
				this.device.list[i].server_select = '';
			}
		},
		// 巡检选择
		polling_select(index) {
			this.polling.select = index;
			this.$nextTick(() => {
				this.polling.table3_height = document.querySelector('.table3').clientHeight;
			});
		},
		// 清空表单项
		clean_form(obj) {
			for (let key in obj) {
				switch (typeof obj[key]) {
					case 'string':
						obj[key] = '';
						break;
					case 'number':
						obj[key] = 0;
						break;
					case 'boolean':
						obj[key] = false;
						break;
					default:
						switch (obj[key].constructor) {
							case Array:
								if (typeof obj[key][0] == 'object') {
									for (let value of obj[key]) {
										this.clean_form(value);
									}
								} else {
									obj[key] = [];
								}
								break;
							case Object:
								this.clean_form(obj[key]);
								break;
							case Date:
								obj[key] = '';
								break;
						}
						break;
				}
			}
		},
		// 全选传入的数组
		check_all(check_flag) {
			this.joint.form.device_selected = check_flag ? this.device.list : [];
			this.joint.form.isIndeterminate = false;
		},
		// 多选改变时
		check_change(selected_array) {
			let count = selected_array.length;
			this.joint.form.checkAll = count == this.device.list.length;
			this.joint.form.isIndeterminate = count > 0 && count < this.device.list.length;
		},
		// 显示/隐藏下拉框时 加载物模型服务
		get_model_server(display, device_id) {
			if (display) {
				this.request('post', `${model_server_search}/${device_id}`, this.token, (res) => {
					console.log('物模型服务列表', res);
					if (res.data.data == null || res.data.data.length == 0) {
						return;
					}
					this.joint.form.model_server_list = res.data.data;
				});
			} else {
				this.joint.form.model_server_list = [];
			}
		},
		// 格式化开关状态
		format_status(row, col) {
			return row.status == 0 ? '关闭' : '开启';
		},
		// 规则提交
		joint_rule_submit(form, status, rule_id) {
			this.html.popup_loading = true;
			let t_s = form.date[0];
			let t_e = form.date[1];
			let data = {
				onlineCheckName: form.name,
				placeId: this.place_id,
				planDatetimeStart: `${t_s.getFullYear()}-${t_s.getMonth() + 1 < 10 ? '0' + (t_s.getMonth() + 1) : t_s.getMonth() + 1}-${t_s.getDate()} 06:00:00`,
				planDatetimeEnd: `${t_e.getFullYear()}-${t_e.getMonth() + 1 < 10 ? '0' + (t_e.getMonth() + 1) : t_e.getMonth() + 1}-${t_e.getDate()} 23:00:00`,
				status: status,
				executeTime: form.select_time.toString().split(' ')[4],
				executePeriodDays: JSON.stringify(form.cycle_week),
				devicesDTOList: [],
			};
			for (let i = 0; i < form.device_selected.length; i++) {
				let t = {
					deviceId: form.device_selected[i].id,
					deviceName: form.device_selected[i].deviceName,
					serviceIdentifier: form.server_select,
				};
				data.devicesDTOList.push(t);
			}
			if (typeof rule_id != 'undefined') {
				data.id = rule_id;
			}
			this.request('post', update_rule, this.token, data, () => {
				this.html.popup_loading = false;
				this.joint_select(0);
			});
		},
	},
});
