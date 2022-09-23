let url = `${我是接口地址}/`;
let rule_search = `${url}api-portal/online-check-rule/search`;
let update_rule = `${url}api-portal/online-check-rule/saveOrUpdate`;
let device_list = `${url}api-portal/room/device`;
let room_search = `${url}api-portal/room/search`;
let model_server_search = `${url}api-device/protocol/current/services`;
let joint_rule_enable = `${url}api-portal/online-check-rule/start`;
let joint_rule_disable = `${url}api-portal/online-check-rule/stop`;
let joint_rule_del = `${url}api-portal/online-check-rule/delete`;
let record_search = `${url}api-portal/online-check-record/search`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			page_select: '1', // 页面选择
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
			table_height: 0, // 联检表格高度
			log_search: '', // 记录搜索
			add_rule_display: false, // 添加规则表单
			record_detail_display: false, //记录详情
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
			record_devices: [],
			rule_list: [], // 联检规则表
			record_list: [], // 联检记录表
		},
		polling: {
			apply_place: '', // 应用会议室
			log_select: 0, //全部 待巡检 正常完成
			table_height: 0, // 表格高度
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
				this.place_change();
			});
		},
		// 场所一切换 设备列表就要更新
		place_change() {
			this.html.page_loading = true;
			this.device.list = [];
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
			this.page_switch(this.html.page_select);
		},
		// 页面选择
		page_switch(page_index) {
			this.html.page_select = page_index;
			let type = page_index.split('-')[0];
			if (type == 2) {
				this.joint_select();
			} else if (type == 3) {
				this.polling_select();
			}
		},
		// 联检选择
		joint_select() {
			if (this.html.page_select == '2-1') {
				this.html.page_loading = true;
				this.request('post', rule_search, this.token, { condition: { placeId: this.place_id }, pageNum: 1, pageSize: 100 }, (res) => {
					console.log('联检规则表', res);
					this.html.page_loading = false;
					if (Object.entries(res.data.data).length == 0) {
						return;
					}
					this.joint.rule_list = res.data.data.data;
				});
			} else if (this.html.page_select == '2-2') {
				this.search_record('');
			}
			this.$nextTick(() => {
				this.joint.table_height = document.querySelector('.joint_table').clientHeight;
			});
		},
		// 添加联检规则
		add_joint_rules() {
			this.joint.rule_id = null;
			this.joint.add_rule_display = true;
			this.html.popup_loading = false;
			this.joint.form.date = [];
			for (let key in this.joint.form) {
				if (key != 'date') {
					this.joint.form[key] = '';
				}
			}
			for (let i = 0; i < this.device.list.length; i++) {
				this.device.list[i].selected = false;
				this.device.list[i].server_select = '';
			}
		},
		// 编辑联检规则
		edit_joint_rule(rule_obj) {
			// 判断规则id是不是null来区分是编辑还是新增
			this.joint.rule_id = rule_obj.id;
			this.joint.add_rule_display = true;
			this.html.popup_loading = false;
			this.joint.form.name = rule_obj.onlineCheckName;
			this.joint.form.date = [new Date(rule_obj.planDatetimeStart.split(' ')[0]), new Date(rule_obj.planDatetimeEnd.split(' ')[0])];
			this.joint.form.cycle_week = JSON.parse(rule_obj.executePeriodDays);
			this.joint.form.select_time = new Date(rule_obj.executeTime);
			for (let i = 0; i < this.device.list.length; i++) {
				let find = false;
				for (let j = 0; j < rule_obj.devicesVOS.length; j++) {
					if (this.device.list[i].id == rule_obj.devicesVOS[j].deviceId) {
						find = true;
						this.device.list[i].selected = true;
						this.device.list[i].server_select = rule_obj.devicesVOS[j].serviceIdentifier;
					}
				}
				if (!find) {
					this.device.list[i].selected = false;
					this.device.list[i].server_select = '';
				}
			}
		},
		// 巡检选择
		polling_select() {
			this.$nextTick(() => {
				this.polling.table_height = document.querySelector('.polling_table').clientHeight;
			});
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
		joint_rule_submit(form, status) {
			this.html.popup_loading = true;
			let t_s = form.date[0];
			let t_e = form.date[1];
			let data = {
				onlineCheckName: form.name,
				placeId: this.place_id,
				planDatetimeStart: `${t_s.getFullYear()}-${t_s.getMonth() + 1 < 10 ? '0' + (t_s.getMonth() + 1) : t_s.getMonth() + 1}-${t_s.getDate() < 10 ? '0' + t_s.getDate() : t_s.getDate()} 06:00:00`,
				planDatetimeEnd: `${t_e.getFullYear()}-${t_e.getMonth() + 1 < 10 ? '0' + (t_e.getMonth() + 1) : t_e.getMonth() + 1}-${t_e.getDate() < 10 ? '0' + t_e.getDate() : t_e.getDate()} 23:00:00`,
				status: status,
				executeTime: form.select_time.toString().split(' ')[4],
				executePeriodDays: JSON.stringify(form.cycle_week),
				devicesDTOList: [],
			};
			for (let i = 0; i < form.device_selected.length; i++) {
				let t = {
					deviceId: form.device_selected[i].id,
					deviceName: form.device_selected[i].deviceName,
					serviceIdentifier: form.device_selected[i].server_select,
				};
				data.devicesDTOList.push(t);
			}
			if (this.joint.rule_id != null) {
				data.id = this.joint.rule_id;
			}
			this.request('post', update_rule, this.token, data, () => {
				this.html.popup_loading = false;
				this.joint_select(0);
			});
		},
		// 切换联检规则开关
		switch_joint_rule_status(rule_obj) {
			// change事件时状态值已经变了
			if (rule_obj.status == 1) {
				this.request('post', joint_rule_enable, this.token, [rule_obj.id]);
			} else if (rule_obj.status == 0) {
				this.request('post', joint_rule_disable, this.token, [rule_obj.id]);
			}
		},
		// 删除联检规则
		del_joint_rule(rule_obj) {
			this.request('post', joint_rule_del, this.token, [rule_obj.id], () => {
				this.joint_select(0);
			});
		},
		// 搜索联检记录
		search_record(input) {
			this.html.page_loading = true;
			this.request('post', record_search, this.token, { condition: { placeId: this.place_id, onlineCheckName: input }, pageNum: 1, pageSize: 100 }, (res) => {
				console.log('联检记录表', res);
				this.html.page_loading = false;
				if (Object.entries(res.data.data).length == 0) {
					return;
				}
				this.joint.record_list = res.data.data.data;
			});
		},
		// 查看联检记录
		check_record(row_data) {
			this.joint.record_devices = [];
			for (let i = 0; i < row_data.deviceInfoRecords.length; i++) {
				let t4 = row_data.deviceInfoRecords[i];
				let t = {
					name: t4.deviceName || '',
					time: t4.checkTime || '',
					status: t4.statusDesc || '',
					item: [],
				};
				for (let k = 0; k < t4.itemRecords.length; k++) {
					let t3 = t4.itemRecords[k];
					let t2 = {
						describe: t3.itemDesc || '',
						value: t3.itemValue || '',
						status: t3.qualified || '',
					};
					t.item.push(t2);
				}
				this.joint.record_devices.push(t);
			}
		},
	},
});
