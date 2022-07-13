let url = `${我是接口地址}/`;
let rule_add = `${url}api-device/rule/base/add`;
let rule_list = `${url}api-device/rule/base/list`;
let rule_edit = `${url}api-device/rule/base/edit`;
let trigger_list = `${url}api-device/rule/conf/trigger/list`;
let action_list = `${url}api-device/rule/conf/action/list`;
let trigger_add = `${url}api-device/rule/conf/trigger/add`;
let trigger_delete = `${url}api-device/rule/conf/trigger/delete`;
let trigger_edit = `${url}api-device/rule/conf/trigger/edit`;
let event_add = `${url}api-device/rule/conf/action/add`;
let event_delete = `${url}api-device/rule/conf/action/delete`;
let event_edit = `${url}api-device/rule/conf/action/edit`;
let product_detail = `${url}api-device/product`;
let property_list = `${url}api-device/protocol/property/list`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		id: '',
		token: '',
		html: {
			loading: true, //页面加载
			rule_config: false, //规则配置页面
			trigger_config: false, //触发配置显示
			loading_rule_detail: false, //加载条件和事件列表
			event_config: false, //事件表单显示
			info_type_options: [
				{ name: '只落库', val: 0, ban: false },
				{ name: '消息定向推送', val: 1, ban: false },
				{ name: '发短信', val: 2, ban: true },
				{ name: '发邮件', val: 3, ban: true },
				{ name: '设备联动操作', val: 4, ban: true },
			],
		},
		rule_list: [], //规则列表
		trigger_and_event_list: [], //事件和条件列表
		// 触发条件表单
		form: {
			name: '',
			exp: '', //规则表达式
			condition: [], //占位符个数生成的输入元素
		},
		// 响应事件表单
		event_form: {
			name: '',
			template: '', //告警内容模板
			fields: [], //占位符生成的输入元素
			info_type: 0, //通知方式
			//通知方式1时用户填写内容
			type1: {
				username: '',
				password: '',
				host: '',
				port: '',
				topic: '',
				routingKey: '',
			},
		},
		protocol_tree: [], //物模型树
		tree_conf: {
			children: 'child',
			label: 'name',
		},
	},
	mounted() {
		if (!location.search) {
			this.id = sessionStorage.id;
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.req_rule_list();
		this.req_protocol();
		// 节流标识符
		this.thro_flag = false;
	},
	methods: {
		// 物模型树，每层记录路径和标识
		req_protocol() {
			this.request('get', `${product_detail}/${this.id}`, this.token, (res) => {
				this.request('post', `${property_list}/${res.data.data.currentModelId}`, this.token, (res) => {
					res.data.data.forEach((e) => {
						let tree = {};
						this.get_protocol_tree(tree, e);
						this.protocol_tree.push(tree);
					});
				});
			});
		},
		get_protocol_tree(target, source, path) {
			target.name = source.identifier;
			if (path == undefined) {
				target.path = source.identifier;
			} else {
				target.path = path + source.identifier;
			}
			switch (source.dataType.type) {
				case 'struct':
					target.type = '结构体';
					break;
				case 'array':
					target.type = '数组';
					break;
				default:
					target.type = source.dataType.type;
					break;
			}
			if (source.dataType.type == 'struct') {
				let a = source.dataType.properties;
				target.child = [];
				for (let i = 0; i < a.length; i++) {
					let t = {};
					this.get_protocol_tree(t, a[i], `${target.path}.`);
					target.child.push(t);
				}
			}
			if (source.dataType.type == 'array' && source.dataType.specs.item.type == 'struct') {
				let a = source.dataType.specs.item.properties;
				target.child = [];
				for (let i = 0; i < a.length; i++) {
					let t = {};
					this.get_protocol_tree(t, a[i], `${target.path}[num].`);
					target.child.push(t);
				}
			}
		},
		//#region
		// 节流
		// throttle(fun, delay, ...args) {
		// 	if (!this.thro_flag) {
		// 		setTimeout(() => {
		// 			fun(...args);
		// 			this.thro_flag = false;
		// 		}, delay);
		// 	}
		// 	this.thro_flag = true;
		// },
		//#endregion
		req_rule_list() {
			this.request('post', rule_list, this.token, { condition: { groupId: this.id }, pageNum: 1, pageSize: 999 }, (res) => {
				console.log('规则列表', res);
				if (res.data.data.data != null) {
					this.rule_list = res.data.data.data;
				}
				this.html.loading = false;
			});
		},
		// 新增规则按钮
		add_rules() {
			this.$prompt('请输入规则名称', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				inputPattern: /^[\u4E00-\u9FA5A-Za-z0-9_]+$/,
				inputErrorMessage: '不能为空或者输入特殊字符',
			}).then(({ value }) => {
				this.request('post', rule_add, this.token, { name: value, productId: this.id }, () => {
					this.html.loading = true;
					this.req_rule_list();
				});
			});
		},
		// 编辑规则
		edit_rule(list_data) {
			this.$prompt('请输入规则名称', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				inputValue: list_data.name,
				inputPattern: /^[\u4E00-\u9FA5A-Za-z0-9_]+$/,
				inputErrorMessage: '不能为空或者输入特殊字符',
			}).then(({ value }) => {
				this.request('put', rule_edit, this.token, { name: value, productId: this.id, id: list_data.id }, () => {
					this.html.loading = true;
					this.req_rule_list();
				});
			});
		},
		// 查看单条规则下的事件和条件
		check_rule(rule_id) {
			this.rule_id = rule_id;
			this.trigger_and_event_list = [];
			this.request('get', `${trigger_list}?ruleId=${rule_id}`, this.token, (res) => {
				console.log('触发条件列表', res);
				this.request('get', `${action_list}?ruleId=${rule_id}`, this.token, (res) => {
					console.log('响应事件列表', res);
					this.html.loading_rule_detail = false;
					if (res.data.data == null) {
						return;
					}
					res.data.data.forEach((e) => {
						let table = { type: '响应事件' };
						for (let key in e) {
							if (e[key] != null) {
								table[key] = e[key];
							}
						}
						this.trigger_and_event_list.push(table);
					});
				});
				if (res.data.data == null) {
					return;
				}
				res.data.data.forEach((e) => {
					let table = { type: '触发条件' };
					for (let key in e) {
						if (e[key] != null) {
							table[key] = e[key];
						}
					}
					this.trigger_and_event_list.push(table);
				});
			});
			this.html.rule_config = true;
			this.html.loading_rule_detail = true;
		},
		// 关闭页面任意
		close_page(flag) {
			switch (flag) {
				case 'rule_detail':
					this.html.rule_config = false;
					break;
			}
			flag = false;
		},
		// 清空对象
		clean_object(obj) {
			for (let key in obj) {
				switch (obj[key].constructor) {
					case String:
						obj[key] = '';
						break;
					case Number:
						obj[key] = 0;
						break;
					case Array:
						obj[key] = [];
						break;
					case Object:
						for (let key2 in obj[key]) {
							this.clean_object(obj[key][key2]);
						}
						break;
				}
			}
		},
		// 新增触发条件按钮
		add_trigger() {
			this.add_edit = 'add';
			this.clean_object(this.form);
			this.html.trigger_config = true;
		},
		// 新增响应事件按钮
		add_event() {
			this.add_edit = 'add';
			this.clean_object(this.event_form);
			this.html.event_config = true;
		},
		// 编辑条件或事件
		edit_trigger_event(list_data) {
			console.log('编辑', list_data);
			this.add_edit = 'edit';
			if (list_data.type == '触发条件') {
				this.form.id = list_data.nodeId;
				this.form.name = list_data.nodeName;
				this.form.exp = list_data.expression;
				this.form.condition = [];
				list_data.conditionFields.forEach((e) => {
					let t = { field: e };
					this.form.condition.push(t);
				});
				for (let i = 0; i < list_data.defaultValues.length; i++) {
					this.form.condition[i].default_value = list_data.defaultValues[i];
				}
				this.html.trigger_config = true;
			} else if (list_data.type == '响应事件') {
				this.event_form.id = list_data.nodeId;
				this.event_form.name = list_data.nodeName;
				this.event_form.template = list_data.template;
				this.event_form.fields = [];
				list_data.fields.forEach((e) => {
					let t = { field: e };
					this.event_form.fields.push(t);
				});
				this.event_form.info_type = 0;
				this.clean_object(this.event_form.type1);
				this.html.event_config = true;
			}
		},
		// 删除条件或事件
		del_trigger_event(list_data) {
			this.$confirm(`确认删除？`, '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'info',
				center: true,
			}).then(() => {
				if (list_data.type == '触发条件') {
					this.request('put', trigger_delete, this.token, { baseId: this.rule_id, nodeId: list_data.nodeId }, () => {
						this.check_rule(this.rule_id);
					});
				} else {
					this.request('put', event_delete, this.token, { baseId: this.rule_id, nodeId: list_data.nodeId }, () => {
						this.check_rule(this.rule_id);
					});
				}
			});
		},
		// 检测规则表达式里的特殊符号 并动态生成元素
		identify_symbol(input, flag, index) {
			if (index == undefined) {
				index = 0;
				if (flag == 'trigger') {
					this.form.condition = [];
				} else if (flag == 'event') {
					this.event_form.fields = [];
				}
			}
			index = input.indexOf('%s', index);
			if (index != -1) {
				if (flag == 'trigger') {
					let t = { field: '', default_value: '' };
					this.form.condition.push(t);
				} else if (flag == 'event') {
					let t = { field: '' };
					this.event_form.fields.push(t);
				}
				this.identify_symbol(input, flag, index + 2);
			}
		},
		//#region
		// 检查输入内容
		// form_verify(value, flag) {
		// 	this.html.verify[flag].show = true;
		// 	let reg;
		// 	switch (flag) {
		// 		case 'name':
		// 			reg = /^[\u4E00-\u9FA5A-Za-z0-9_]+$/;
		// 			if (!reg.test(value)) {
		// 				return false;
		// 			}
		// 			break;
		// 	}
		// 	this.html.verify[flag].show = false;
		// 	return true;
		// },
		//#endregion
		// 条件提交
		trigger_submit() {
			let t = {
				baseId: this.rule_id,
				name: this.form.name,
				expression: this.form.exp,
				conditionFields: [],
				defaultValues: [],
			};
			this.form.condition.forEach((e) => {
				t.conditionFields.push(e.field);
				t.defaultValues.push(e.default_value);
			});
			if (this.add_edit == 'add') {
				this.request('post', trigger_add, this.token, t, () => {
					this.html.trigger_config = false;
					this.check_rule(this.rule_id);
				});
			} else {
				t.nodeId = this.form.id;
				this.request('put', trigger_edit, this.token, t, () => {
					this.html.trigger_config = false;
					this.check_rule(this.rule_id);
				});
			}
		},
		// 事件提交
		event_submit() {
			let t = {
				baseId: this.rule_id,
				name: this.event_form.name,
				template: this.event_form.template,
				actionType: this.event_form.info_type,
				fields: [],
			};
			this.event_form.fields.forEach((e) => {
				t.fields.push(e.field);
			});
			if (this.event_form.info_type == 1) {
				t.extraParam = {};
				for (let key in this.event_form.type1) {
					t.extraParam[key] = this.event_form.type1[key];
				}
			}
			if (this.add_edit == 'add') {
				this.request('post', event_add, this.token, t, () => {
					this.html.event_config = false;
					this.check_rule(this.rule_id);
				});
			} else {
				t.nodeId = this.event_form.id;
				this.request('put', event_edit, this.token, t, () => {
					this.html.event_config = false;
					this.check_rule(this.rule_id);
				});
			}
		},
		// 复制内容
		copy_path(path) {
			// navigator.clipboard.writeText(path);
			let temp = document.createElement('textarea');
			temp.innerText = path;
			document.body.appendChild(temp);
			temp.select();
			document.execCommand('copy');
			document.body.removeChild(temp);
			this.$message.success('已复制到剪贴板');
		},
	},
});
