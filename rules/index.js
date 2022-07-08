let url = `${我是接口地址}/`;
let rule_add = `${url}api-device/rule/base/add`;
let rule_list = `${url}api-device/rule/base/list`;
let rule_edit = `${url}api-device/rule/base/edit`;
let trigger_list = `${url}api-device/rule/conf/trigger/list`;
let action_list = `${url}api-device/rule/conf/action/list`;
let trigger_add = `${url}api-device/rule/conf/trigger/add`;
let trigger_delete = `${url}api-device/rule/conf/trigger/delete`;

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
		},
		rule_list: [], //规则列表
		trigger_and_event_list: [], //事件和条件列表
		// 表单内容
		form: {
			name: '',
			exp: '', //规则表达式
			condition: [], //占位符个数生成的输入元素
		},
		json_text: '', //物模型JSON
	},
	mounted() {
		if (!location.search) {
			this.id = sessionStorage.id;
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.req_rule_list();
		// 节流标识符
		this.thro_flag = false;
	},
	methods: {
		// 节流
		throttle(fun, delay, args) {
			if (!this.thro_flag) {
				setTimeout(() => {
					fun(args);
					this.thro_flag = false;
				}, delay);
			}
			this.thro_flag = true;
		},
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
					res.data.data.forEach((e) => {
						let table = { type: '响应事件' };
						for (let key in e) {
							if (e[key] != null) {
								table[key] = e[key];
							}
						}
						this.trigger_and_event_list.push(table);
					});
					this.html.loading_rule_detail = false;
				});
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
			flag = false;
		},
		// 新增触发条件按钮
		add_trigger() {
			this.request('get', `${product_detail}/${this.id}`, this.token, (res) => {
				this.request('post', `${property_list}/${res.data.data.currentModelId}`, this.token, (res) => {
					this.json_text = JSON.stringify(res.data.data);
					this.html.trigger_config = true;
				});
			});
			this.add_edit = 'add';
			for (let key in this.form) {
				switch (this.form[key].constructor) {
					case String:
						this.form[key] = '';
						break;
					case Number:
						this.form[key] = 0;
						break;
					case Array:
						this.form[key] = [];
						break;
					case Object:
						this.form[key] = {};
						break;
				}
			}
		},
		// 编辑条件或事件
		edit_trigger_event(list_data) {
			this.add_edit = 'edit';
			if (list_data.type == '触发条件') {
				this.request('get', `${product_detail}/${this.id}`, this.token, (res) => {
					this.request('post', `${property_list}/${res.data.data.currentModelId}`, this.token, (res) => {
						this.json_text = JSON.stringify(res.data.data);
						this.html.trigger_config = true;
					});
				});
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
			} else if (list_data.type == '响应事件') {
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
				}
			});
		},
		// 检测规则表达式里的特殊符号 并动态生成元素
		identify_symbol(input, index) {
			if (index == undefined) {
				index = 0;
				this.form.condition = [];
			}
			index = input.indexOf('%s', index + 2);
			if (index != -1) {
				let t = { field: '', default_value: '' };
				this.form.condition.push(t);
				this.identify_symbol(input, index);
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
		// 提交规则新增修改
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
					this.check_rule(this.rule_id);
				});
				this.html.trigger_config = false;
			} else {
			}
		},
	},
});
