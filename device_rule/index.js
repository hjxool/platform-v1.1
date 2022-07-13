let url = `${我是接口地址}/`;
let rule_list = `${url}api-device/rule/device/list`;
let rule_del = `${url}api-device/rule/device`;
let rule_add = `${url}api-device/rule/device/add`;
let trigger_list = `${url}api-device/rule/device/conf/trigger/list`;
let event_list = `${url}api-device/rule/device/conf/action/list`;
let save_node = `${url}api-device/rule/device/conf/add`;
let del_node = `${url}api-device/rule/device/conf`;
let current_protocol = `${url}api-device/protocol/current`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		id: '',
		token: '',
		html: {
			loading: true, //页面加载
			rule_config: false, //节点表单显示
			loading_rule_detail: true, //事件等节点表单
			trigger_form: false, //条件表单显示
			event_form: false, //事件表单显示
		},
		rule_list: [], //设备规则列表
		rule_selected: [], //选中的规则
		node_list: [], //事件等列表
		node_selected: [], //选中的事件等
		// 条件表单
		trigger_form: {
			name: '',
			exp: '',
			field: [],
			params: [],
		},
		// 事件表单
		event_form: {
			name: '',
			template: '',
			field: [],
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
	},
	methods: {
		// 物模型树，每层记录路径和标识
		req_protocol() {
			this.request('post', `${current_protocol}/${this.id}`, this.token, (res) => {
				res.data.data.properties.forEach((e) => {
					let tree = {};
					this.get_protocol_tree(tree, e);
					this.protocol_tree.push(tree);
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
		req_rule_list() {
			this.request('get', `${rule_list}?deviceId=${this.id}`, this.token, (res) => {
				console.log('规则列表', res);
				this.html.loading = false;
				if (res.data.data == null) {
					return;
				}
				this.rule_list = res.data.data;
				this.$nextTick(() => {
					this.rule_list.forEach((e) => {
						if (e.enabled == 1) {
							this.$refs.rule_list.toggleRowSelection(e, true);
						}
					});
				});
			});
		},
		// 多选规则
		select_rules(val) {
			this.rule_selected = val;
		},
		// 多选节点
		select_node(val) {
			this.node_selected = val;
		},
		// 删除规则
		del_rule(rule_list) {
			this.$confirm(`确认删除？`, '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'info',
				center: true,
			}).then(() => {
				this.request('delete', `${rule_del}?deviceId=${this.id}&ruleId=${rule_list.ruleId}`, this.token, () => {
					this.req_rule_list();
				});
			});
		},
		// 保存并修改每条规则状态
		save_rule() {
			let selected = [];
			this.rule_selected.forEach((e) => {
				selected.push(e.ruleId);
			});
			this.rule_list.forEach((e) => {
				if (selected.indexOf(e.ruleId) != -1) {
					this.request('post', rule_add, this.token, { deviceId: this.id, enabled: 1, ruleId: e.ruleId });
				} else {
					this.request('post', rule_add, this.token, { deviceId: this.id, enabled: 0, ruleId: e.ruleId });
				}
			});
		},
		// 编辑查看规则下节点
		edit_rule(rule_id) {
			this.rule_id = rule_id;
			this.node_list = [];
			this.request('get', `${trigger_list}?deviceId=${this.id}&ruleId=${rule_id}`, this.token, (res) => {
				console.log('条件列表', res);
				this.request('get', `${event_list}?deviceId=${this.id}&ruleId=${rule_id}`, this.token, (res) => {
					console.log('事件列表', res);
					this.html.loading_rule_detail = false;
					if (res.data.data == null || res.data.data == []) {
						return;
					}
					res.data.data.forEach((e) => {
						let t = {
							type: '响应事件',
						};
						for (let key in e) {
							if (key != 'defaultConfField') {
								t[key] = e[key] || 0;
							}
						}
						//#region
						// let count = 0;
						// t2.template.split('%s').forEach((e) => {
						// 	let t3 = { before: e, input: t2.fields[count], show: false };
						// 	t.exp.push(t3);
						// 	count++;
						// });
						// this.joint_params(t.exp, t2.fields, 0);
						// t.key1 = t2.template;
						// t.key2 = t2.fields;
						//#endregion
						t.conf = JSON.parse(e.defaultConfField).conf;
						t.exp = this.joint_params(t.conf.template, t.conf.fields, 0);
						this.node_list.push(t);
					});
					this.html.rule_config = true;
					this.$nextTick(() => {
						this.node_list.forEach((e) => {
							if (e.enabled == 1) {
								this.$refs.node_list.toggleRowSelection(e, true);
							}
						});
						console.log('nodelist', this.node_list);
					});
				});
				if (res.data.data == null || res.data.data == []) {
					return;
				}
				res.data.data.forEach((e) => {
					let t = {
						type: '触发条件',
					};
					for (let key in e) {
						if (key != 'defaultConfField') {
							t[key] = e[key] || 0;
						}
					}
					//#region
					// let count = 0;
					// t2.exp.split('%s').forEach((e) => {
					// 	let t3 = { before: e, input: t2.defaultValues[count], show: false };
					// 	t.exp.push(t3);
					// 	count++;
					// });
					// this.joint_params(t.exp, t2.defaultValues, 0);
					//#endregion
					t.conf = JSON.parse(e.defaultConfField).conf;
					t.exp = this.joint_params(t.conf.exp, t.conf.defaultValues, 0);
					this.node_list.push(t);
				});
			});
		},
		//#region
		// joint_params(target, array, index) {
		// 	target[index].after = array[index];
		// 	if (index + 1 < array.length) {
		// 		this.joint_params(target, array, index + 1);
		// 	}
		// },
		//#endregion
		joint_params(input, array, index) {
			input = input.replace('%s', array[index]);
			if (index + 1 < array.length) {
				this.joint_params(input, array, index + 1);
			}
			return input;
		},
		// 更改事件和条件状态
		save_node() {
			let selected = [];
			this.node_selected.forEach((e) => {
				selected.push(e.nodeId);
			});
			let t = [];
			this.node_list.forEach((e) => {
				let t2 = {
					confId: e.nodeId,
					deviceId: this.id,
					ruleId: this.rule_id,
				};
				if (e.type == '触发条件') {
					t2.condition = {
						defaultValues: e.conf.defaultValues,
					};
				} else if (e.type == '响应事件') {
					t2.condition = {
						template: e.conf.template,
						fields: e.conf.fields,
					};
				}
				if (selected.indexOf(e.nodeId) != -1) {
					t2.enabled = true;
				} else {
					t2.enabled = false;
				}
				t.push(t2);
			});
			this.request('post', save_node, this.token, t);
		},
		// 编辑节点
		edit_node(node_list, node_index) {
			this.node_index = node_index;
			if (node_list.type == '触发条件') {
				this.trigger_form.name = node_list.nodeName | '';
				this.trigger_form.exp = node_list.conf.exp || '';
				this.trigger_form.field = node_list.conf.conditionFields || [];
				this.trigger_form.params = [];
				node_list.conf.defaultValues.forEach((e) => {
					let t = { value: e };
					this.trigger_form.params.push(t);
				});
				this.html.trigger_form = true;
			} else if (node_list.type == '响应事件') {
				this.event_form.name = node_list.nodeName | '';
				this.event_form.template = node_list.conf.template || '';
				this.event_form.field = [];
				node_list.conf.fields.forEach((e) => {
					let t = { value: e };
					this.event_form.field.push(t);
				});
				this.html.event_form = true;
			}
		},
		// 条件保存
		trigger_submit() {
			for (let i = 0; i < this.trigger_form.params.length; i++) {
				if (this.trigger_form.params[i].value != '') {
					this.node_list[this.node_index].conf.defaultValues[i] = this.trigger_form.params[i].value;
				}
			}
			this.html.trigger_form = false;
		},
		// 检测规则表达式里的特殊符号 并动态生成元素
		identify_symbol(input, flag, index) {
			if (index == undefined) {
				index = 0;
				if (flag == 'trigger') {
					this.trigger_form.field = [];
					this.trigger_form.params = [];
				} else if (flag == 'event') {
					this.event_form.field = [];
				}
			}
			index = input.indexOf('%s', index);
			if (index != -1) {
				if (flag == 'trigger') {
					let t = { value: '' };
					this.trigger_form.params.push(t);
				} else if (flag == 'event') {
					let t = { value: '' };
					this.event_form.fields.push(t);
				}
				this.identify_symbol(input, flag, index + 2);
			}
		},
		// 事件保存
		event_submit() {
			if (this.event_form.template != '') {
				this.node_list[this.node_index].conf.template = this.event_form.template;
			}
			let t1 = this.node_list[this.node_index].conf.fields;
			let t2 = this.event_form.field;
			if (t1.length > t2.length) {
				for (let i = 0; i < t2.length; i++) {
					if (t2[i].value != '') {
						t1[i] = t2[i].value;
					}
				}
				t1.splice(t2 - 1);
			} else if (t1.length < t2.length) {
				for (let i = 0; i < t2.length; i++) {
					if (i < t1.length) {
						if (t2[i].value != '') {
							t1[i] = t2[i].value;
						}
					} else {
						t1[i] = t2[i].value;
					}
				}
			} else {
				for (let i = 0; i < t2.length; i++) {
					if (t2[i].value != '') {
						t1[i] = t2[i].value;
					}
				}
			}
			this.html.event_form = false;
		},
		// 删除节点
		del_node(node_list) {
			this.$confirm(`确认删除？`, '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'info',
				center: true,
			}).then(() => {
				this.request('delete', `${del_node}?deviceId=${this.id}&nodeId=${node_list.nodeId}`, this.token, () => {
					this.edit_rule(this.rule_id);
				});
			});
		},
		// 关闭页面
		close_page() {
			this.html.rule_config = false;
		},
	},
});
