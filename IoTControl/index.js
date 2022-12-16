let url = `${我是接口地址}/`;
let rule_search = `${url}api-portal/online-check-rule/search`;
let update_rule = `${url}api-portal/online-check-rule/saveOrUpdate`;
let device_list = `${url}api-portal/room/device`;
let room_search = `${url}api-portal/room/search`;
let model_server_search = `${url}api-device/protocol/current/services`;
let joint_rule_enable = `${url}api-portal/online-check-rule/start`;
let joint_rule_disable = `${url}api-portal/online-check-rule/stop`;
let joint_rule_del = `${url}api-portal/online-check-rule/delete`;
let joint_rule_execute = `${url}api-portal/online-check-rule/execute`;
let record_search = `${url}api-portal/online-check-record/search`;
let all_device_url = `${url}api-device/device/search`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			page_select: '1', // 页面选择
			page_loading: true, // 加载大页面时loading遮罩
			popup_loading: false, // 加载二级弹窗loading遮罩
			page2_display: false, //设备等信息页面显示
		},
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
				select_time: '', // 选择时间 注意是Date对象
				isIndeterminate: false, //不全选样式
				checkAll: false, //全选
				search: '', //检索设备名称
				place_id: '', //选择展开的会议室
			},
			record_devices: [],
			rule_list: [], // 联检规则表
			record_list: [], // 联检记录表
			record_empty: false, //记录表为空
			device_list: [], //联检查询所有设备列表
		},
		polling: {
			apply_place: '', // 应用会议室
			log_select: 0, //全部 待巡检 正常完成
			table_height: 0, // 表格高度
		},
		tableData: [{ a: 1, b: 2, c: 3, d: 4 }],
		option1: [1, 2, 3, 4],
		joint_rules: {
			name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
			date: [{ type: 'array', required: true, message: '请选择日期', trigger: 'change' }],
			cycle_week: [{ type: 'array', required: true, message: '至少选择一个星期', trigger: 'change' }],
			select_time: [{ type: 'date', required: true, message: '请选择日期', trigger: 'change' }],
			device_selected: { show: false, message: '' },
		},
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
			this.html.page_loading = true;
			this.request('post', room_search, this.token, { condition: {}, pageNum: 1, pageSize: 999999 }, (res) => {
				console.log('会议室列表', res);
				this.html.page_loading = false;
				if (Object.entries(res.data.data).length == 0) {
					return;
				}
				this.place_list = res.data.data.data;
			});
		},
		// 场所一切换 设备列表就要更新
		place_change(place_id) {
			this.html.page_loading = true;
			this.place_id = place_id;
			this.device.list = [];
			this.request('post', `${device_list}/${this.place_id}`, this.token, { condition: {} }, (res) => {
				console.log('设备列表', res);
				this.html.page_loading = false;
				if (Object.entries(res.data).length == 0 || res.data.data == null) {
					this.$message('无设备信息');
					this.device.list_empty = true;
					return;
				}
				this.html.page2_display = true;
				this.device.list = res.data.data;
				this.device.list_empty = false;
			});
			let type = this.html.page_select.split('-')[0];
			if (type != 2) {
				this.page_switch(this.html.page_select);
			}
		},
		// 页面选择
		page_switch(page_index) {
			this.html.page_select = page_index;
			let type = page_index.split('-')[0];
			if (type == 2) {
				this.joint_select();
				this.get_user_all_device();
			} else if (type == 3) {
				this.polling_select();
			}
		},
		// 联检选择
		joint_select() {
			if (this.html.page_select == '2-1') {
				this.html.page_loading = true;
				this.joint.rule_list = [];
				this.request('post', rule_search, this.token, { condition: {}, pageNum: 1, pageSize: 100 }, (res) => {
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
		// 联检获取租户下所有设备列表
		get_user_all_device(input) {
			let data = {};
			data.condition = {};
			data.pageNum = 1;
			data.pageSize = 999;
			if (input) {
				data.keyword = input;
			}
			this.request('post', all_device_url, this.token, data, (res) => {
				console.log('所有设备', res);
				let data = res.data.data.data;
				if (data == null || data.length == 0) {
					return;
				}
				let array = [];
				this.joint.devices_length = data.length; // 记录下设备列表长度 勾选时会用
				for (let i = 0; i < data.length; i++) {
					data[i].server_select = ''; // 赋值给data中的响应式数据后会自动添加响应式
					data[i].server_list = [];
					data[i].selected = false; // 选中标识
					this.request('post', `${model_server_search}/${data[i].id}`, this.token, (res) => {
						if (res.data.data == null || res.data.data.length == 0) {
							return;
						}
						data[i].server_list = res.data.data;
					});
					if (i == 0) {
						let t = {
							name: data[i].placeName || '场所名为空',
							placeId: data[i].placeId,
							devices: [data[i]],
						};
						array.push(t);
					} else {
						let find = false;
						for (let val of array) {
							if (data[i].placeId == val.placeId) {
								find = true;
								val.devices.push(data[i]);
							}
						}
						if (!find) {
							let t = {
								name: data[i].placeName || '场所名为空',
								placeId: data[i].placeId,
								devices: [data[i]],
							};
							array.push(t);
						}
					}
				}
				this.joint.device_list = array;
			});
		},
		// 添加联检规则
		add_joint_rules() {
			this.joint.rule_id = null;
			this.joint.add_rule_display = true;
			this.html.popup_loading = false;
			this.joint_rules.device_selected.show = false; // 验证提示隐藏
			for (let key in this.joint.form) {
				if (typeof this.joint.form[key] == 'boolean') {
					this.joint.form[key] = false;
				} else if (typeof this.joint.form[key] == 'object') {
					if (this.joint.form[key].constructor == Date) {
						this.joint.form[key] = '';
					} else {
						this.joint.form[key] = [];
					}
				} else {
					this.joint.form[key] = '';
				}
			}
			for (let val of this.joint.device_list) {
				for (let val2 of val.devices) {
					val2.server_select = '';
					val2.selected = false;
				}
			}
		},
		// 编辑联检规则
		edit_joint_rule(rule_obj) {
			// 判断规则id是不是null来区分是编辑还是新增
			this.joint.rule_id = rule_obj.id;
			this.joint.add_rule_display = true;
			this.html.popup_loading = false;
			this.joint_rules.device_selected.show = false; // 验证提示隐藏
			this.joint.form.name = rule_obj.onlineCheckName;
			this.joint.form.date = [new Date(rule_obj.planDatetimeStart.split(' ')[0]), new Date(rule_obj.planDatetimeEnd.split(' ')[0])];
			// s注意传过来的数组元素是数字 而label是字符串
			this.joint.form.cycle_week = rule_obj.executePeriodDays ? JSON.parse(rule_obj.executePeriodDays) : [];
			// executeTime是时分秒 不能直接转换成Date对象
			let t = new Date();
			this.joint.form.select_time = new Date(`${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()} ${rule_obj.executeTime}`);
			for (let val of this.joint.device_list) {
				for (let val2 of val.devices) {
					val2.selected = false;
					val2.server_select = '';
					for (let val3 of rule_obj.devicesVOS) {
						if (val2.id == val3.deviceId) {
							val2.selected = true;
							val2.server_select = val3.serviceIdentifier;
						}
					}
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
			this.joint.device_selected = [];
			if (check_flag) {
				for (let val of this.joint.device_list) {
					for (let val2 of val.devices) {
						val2.selected = true;
						this.joint.device_selected.push(val2);
					}
				}
			} else {
				for (let val of this.joint.device_list) {
					for (let val2 of val.devices) {
						val2.selected = false;
					}
				}
			}
			this.joint.form.isIndeterminate = false;
		},
		// 多选改变时
		check_change(device_obj) {
			device_obj.selected = !device_obj.selected;
			this.joint.device_selected = [];
			for (let val of this.joint.device_list) {
				for (let val2 of val.devices) {
					if (val2.selected) {
						this.joint.device_selected.push(val2);
					}
				}
			}
			let count = this.joint.device_selected.length;
			this.joint.form.checkAll = count == this.joint.devices_length;
			this.joint.form.isIndeterminate = count > 0 && count < this.joint.devices_length;
		},
		// 格式化开关状态
		format_status(row, col) {
			return row.status == 0 ? '关闭' : '开启';
		},
		// 规则提交
		joint_rule_submit(form, status) {
			this.$refs.joint_form.validate((valid) => {
				let result = true;
				// 有一个false就不能通过 因此就找那一个false 而不需要对每一个结果进行遍历
				for (let value of this.joint.device_selected) {
					if (value.server_select.length == 0) {
						result = false;
						this.joint_rules.device_selected.show = true;
						this.joint_rules.device_selected.message = '所选设备必须选择物模型服务';
						break;
					}
				}
				if (this.joint.device_selected.length == 0) {
					result = false;
					this.joint_rules.device_selected.show = true;
					this.joint_rules.device_selected.message = '必须勾选设备';
				}
				if (result) {
					this.joint_rules.device_selected.show = false;
				}
				if (valid && result) {
					this.html.popup_loading = true;
					let t_s = form.date[0];
					let t_e = form.date[1];
					let data = {
						onlineCheckName: form.name,
						planDatetimeStart: `${t_s.getFullYear()}-${t_s.getMonth() + 1 < 10 ? '0' + (t_s.getMonth() + 1) : t_s.getMonth() + 1}-${t_s.getDate() < 10 ? '0' + t_s.getDate() : t_s.getDate()} 06:00:00`,
						planDatetimeEnd: `${t_e.getFullYear()}-${t_e.getMonth() + 1 < 10 ? '0' + (t_e.getMonth() + 1) : t_e.getMonth() + 1}-${t_e.getDate() < 10 ? '0' + t_e.getDate() : t_e.getDate()} 23:00:00`,
						status: status,
						executeTime: form.select_time.toString().split(' ')[4],
						executePeriodDays: JSON.stringify(form.cycle_week),
						devicesDTOList: [],
					};
					for (let i = 0; i < this.joint.device_selected.length; i++) {
						let t = {
							deviceId: this.joint.device_selected[i].id,
							deviceName: this.joint.device_selected[i].deviceName,
							serviceIdentifier: this.joint.device_selected[i].server_select,
						};
						data.devicesDTOList.push(t);
					}
					if (this.joint.rule_id != null) {
						data.id = this.joint.rule_id;
					}
					this.request('post', update_rule, this.token, data, (res) => {
						this.html.popup_loading = false;
						if (res.data.head.code == 200) {
							this.joint.add_rule_display = false;
							this.joint_select(0);
						}
					});
				}
			});
		},
		// 切换联检规则开关
		switch_joint_rule_status(rule_obj) {
			// change事件时状态值已经变了
			if (rule_obj.status == 1) {
				this.request('post', joint_rule_enable, this.token, [rule_obj.id], () => {
					this.joint_select();
				});
			} else if (rule_obj.status == 0) {
				this.request('post', joint_rule_disable, this.token, [rule_obj.id], () => {
					this.joint_select();
				});
			}
		},
		// 删除联检规则
		del_joint_rule(rule_obj) {
			this.request('post', joint_rule_del, this.token, [rule_obj.id], () => {
				this.joint_select(0);
			});
		},
		// 手动执行联检
		ex_joint_rule(rule_obj) {
			this.request('post', `${joint_rule_execute}/${rule_obj.id}`, this.token, (res) => {
				if (res.data.head.code == 200) {
					this.$message.success(`${res.data.head.message}`);
				} else {
					this.$message.error(`${res.data.head.message}`);
				}
			});
		},
		// 搜索联检记录
		search_record(input) {
			this.html.page_loading = true;
			this.joint.record_list = [];
			this.request('post', record_search, this.token, { condition: { onlineCheckName: input }, pageNum: 1, pageSize: 100 }, (res) => {
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
			this.joint.record_detail_display = true;
			this.joint.record_empty = false;
			this.joint.record_devices = [];
			if (row_data.deviceInfoRecords == null) {
				this.joint.record_empty = true;
				return;
			}
			for (let i = 0; i < row_data.deviceInfoRecords.length; i++) {
				let t4 = row_data.deviceInfoRecords[i];
				let t = {
					name: t4.deviceName || '',
					status: t4.statusDesc || '',
					items: [],
				};
				if (t4.itemRecords != null) {
					for (let k = 0; k < t4.itemRecords.length; k++) {
						let t3 = t4.itemRecords[k];
						let t2 = {
							property: t3.itemName || '',
							status: t3.qualified ? '是' : '否',
						};
						t.items.push(t2);
					}
				}
				this.joint.record_devices.push(t);
			}
		},
		// 联检记录禁用日期
		joint_date_options() {
			let t = new Date();
			return {
				disabledDate(time) {
					return time.getTime() < new Date(`${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`).getTime();
				},
			};
		},
		// 点击联检规则里的场所列表 折叠或显示
		click_joint_place(place_obj) {
			this.joint.form.place_id = this.joint.form.place_id == place_obj.placeId ? '' : place_obj.placeId;
		},

		// element card样式
		card_style() {
			return {
				display: 'flex',
				alignItems: 'center',
				height: '100%',
			};
		},
	},
});
