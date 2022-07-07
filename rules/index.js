let url = `${我是接口地址}/`;
let rule_add = `${url}api-device/rule/base/add`;
let rule_list = `${url}api-device/rule/base/list`;
let rule_delete = `${url}api-device/rule/base/delete`;
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
		},
		rule_list: [], //规则列表
		// 表单内容
		form: {
			exp: '', //规则表达式
			count: 0, //占位符个数
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
			if (!thro_flag) {
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
			for (let key in this.form) {
				this.form[key] = '';
			}
			this.request('get', `${product_detail}/${this.id}`, this.token, (res) => {
				this.request('post', `${property_list}/${res.data.data.currentModelId}`, this.token, (res) => {
					this.json_text = JSON.stringify(res.data.data);
					this.html.rule_config = true;
				});
			});
		},
		// 编辑规则
		edit_rule(list_data) {
			this.request('get', `${product_detail}/${this.id}`, this.token, (res) => {
				this.request('post', `${property_list}/${res.data.data.currentModelId}`, this.token, (res) => {
					this.json_text = JSON.stringify(res.data.data);
					this.html.rule_config = true;
				});
			});
		},
		// 删除规则
		delete_rule(list_data) {
			this.request('delete', `${rule_delete}/${list_data.id}`, this.token, () => {
				this.req_rule_list();
			});
		},
		// 检测规则表达式里的特殊符号 并动态生成元素
		identify_symbol(input, index) {
			if (index == undefined) {
				index = 0;
				this.form.count = 0;
			}
			index = input.indexOf('%s', index);
			if (index != -1) {
				this.form.count++;
				this.identify_symbol(input, index);
			}
		},
	},
});
