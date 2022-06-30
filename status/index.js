let url = `${我是接口地址}/`;
let device_status = `${url}api-device/device-anon/device/status`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		id: '',
		token: '',
		page: {
			loading: false, //页面初加载遮罩
		},
		card_list: [1], //窗口展示的卡片列表
	},
	mounted() {
		if (!location.search) {
			this.id = sessionStorage.id;
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.res_card_list();
	},
	methods: {
		// 页面一加载获取卡片数据
		res_card_list() {
			this.request('get', `${device_status}/${this.id}`, this.token, (res) => {
				console.log('设备状态', res);
			});
		},
	},
});
