let url = `${我是接口地址}/`;
let components_url = `${url}api-device/product/controlPanel`;
let get_data_url = url + 'api-device/device/status'; //查询数据
let sendCmdtoDevice = url + 'api-device/device/operation'; // 下发指令

new Vue({
	el: '#index',
	mixins: [common_functions],
	components: {
		slider,
	},
	data: {
		bg: '', //总页面背景颜色
		component_list: [], //组件列表
		html: {
			page_loading: true,
		},
	},
	beforeCreate() {
		Vue.prototype.$bus = this;
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
			this.device_id = sessionStorage.device_id;
			this.product_id = sessionStorage.product_id;
		} else {
			this.get_token();
		}
		this.device_id = '1597506606210191360';
		this.product_id = '1594885284367122432';
		this.get_components();
	},
	methods: {
		// 获取组件布局
		get_components() {
			this.request('get', `${components_url}/${this.product_id}`, this.token, (res) => {
				console.log('组件数据', res);
				if (res.data.head.code != 200) {
					return;
				}
				let data = res.data.data.panelParam;
				this.bg = data.mb.ys;
				this.component_list = data.data;
				this.get_data();
				this.$nextTick(() => {
					// component_list原本为空，组件尚未初始化，赋值后立即发送消息，组件收不到
					this.$bus.$emit('common_params', this.token, this.device_id, data.mb.w, data.mb.h);
				});
			});
		},
		// 获取数值
		get_data() {
			this.request('get', `${get_data_url}/${this.id}`, this.token, (res) => {
				console.log('数据', res);
				this.html.page_loading = false;
			});
		},
	},
});
