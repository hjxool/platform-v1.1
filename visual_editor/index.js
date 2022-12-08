let url = `${我是接口地址}/`;
let components_url = `${url}api-device/product/controlPanel/PC`;
let get_data_url = url + 'api-device/device/status'; //查询数据
let sendCmdtoDevice = url + 'api-device/device/operation'; // 下发指令
let user_info_url = `${url}api-auth/oauth/userinfo`; //获取用户信息

new Vue({
	el: '#index',
	mixins: [common_functions],
	components: {
		customSlider,
		customText,
		customImg,
		customButton,
		customSwitch,
		customProgress,
	},
	data: {
		html: {
			page_loading: true,
			total_w: 0, // 面板总宽
			total_h: 0, // 面板总高
		},
		bg: '', //总页面背景颜色
		component_list: [], //组件列表
		data_and_path: [], //对象数组 存储数据和路径
		radio: 0, //所有组件缩放比例
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
		this.get_components();
		window.addEventListener('resize', this.resize);
	},
	methods: {
		// 获取组件布局
		get_components() {
			this.request('get', `${components_url}/${this.product_id}`, this.token, (res) => {
				console.log('组件数据', res);
				if (res.data.head.code != 200 || !res.data.data) {
					this.$message('未配置产品可视化界面');
					return;
				}
				let data = res.data.data.panelParam;
				this.bg = data.mb.ys;
				this.component_list = data.data;
				// 组件初始化时就要传进去 挂载后传晚了
				this.html.total_h = data.mb.h;
				this.html.total_w = data.mb.w;
				// this.resize();
				this.$nextTick(() => {
					// component_list原本为空，组件尚未初始化，赋值后立即发送消息，组件收不到
					this.$bus.$emit('common_params', this.token, this.device_id);
					this.get_data(); // 组件初始化结束再去查值 触发事件
					this.get_user_info(); // 组件初始化后 建立连接 触发事件
				});
			});
		},
		// 获取数值
		get_data() {
			this.request('get', `${get_data_url}/${this.device_id}`, this.token, (res) => {
				console.log('数据', res);
				this.html.page_loading = false;
				if (res.data.head.code != 200) {
					return;
				}
				let data = res.data.data.properties;
				this.data_and_path = [];
				for (let val of Object.entries(data)) {
					this.get_path(val);
				}
				this.$bus.$emit('get_value', this.data_and_path);
			});
		},
		// 将原始数据放入处理成路径返回对比
		get_path(source, path) {
			// 判断是否是对象/数组
			if (typeof source[1].propertyValue == 'object') {
				let s = source[1].propertyValue;
				if (s.constructor == Array) {
					// 判断数组下是对象还是基础类型数据
					if (typeof s[0] == 'object') {
						for (let val of s) {
							let a = Object.entries(val);
							for (let k = 0; k < a.length; k++) {
								let val2 = a[k];
								this.get_path(val2, `${path || source[0]}[${k}].${val2[0]}`);
							}
						}
					} else {
						let target = {};
						target.path = path || source[0];
						target.value = s;
						this.data_and_path.push(target);
					}
				} else {
					// 对象
					for (let val of Object.entries(s)) {
						this.get_path(val, `${path || source[0]}.${val[0]}`);
					}
				}
			} else {
				// 基本类型数据直接赋值
				let target = {};
				target.path = path || source[0];
				target.value = source[1].propertyValue;
				this.data_and_path.push(target);
			}
		},
		// 获取用户信息包括 id 连接stomp用户名和密码
		get_user_info() {
			this.request('get', user_info_url, this.token, (res) => {
				console.log('用户', res);
				if (res.data.head.code != 200) {
					this.$message('无法获取用户信息');
					return;
				}
				let ws_name = res.data.data.mqUser;
				let ws_password = res.data.data.mqPassword;
				this.user_id = res.data.data.id;
				this.ws_link = new WebSocket(`${我是websocket地址}`);
				this.stomp_link = Stomp.over(this.ws_link);
				this.stomp_link.debug = null;
				this.stomp_link.connect(ws_name, ws_password, this.on_message, this.on_error, '/');
			});
		},
		// stomp连接成功的回调
		on_message() {
			this.stomp_link.subscribe(
				`/exchange/device-report/device-report.${this.device_id}`,
				(res) => {
					let data = JSON.parse(res.body);
					let data_list = Object.entries(data.contents[0].attributes);
					for (let val of data_list) {
						this.get_path(val);
					}
					this.$bus.$emit('get_value', this.data_and_path);
				},
				{ 'auto-delete': true }
			);
			this.stomp_link.subscribe(
				`/exchange/web-socket/tenant.user.${this.user_id}.#`,
				(res) => {
					let data = JSON.parse(res.body);
					// 0等待 1成功 2断开 3超时 4拒绝
					switch (data.replyType) {
						case 0:
							this.$message('等待连接');
							break;
						case 1:
							this.$message.success('连接成功');
							break;
						case 2:
							this.$message.error('断开连接');
							break;
						case 3:
							this.$message('连接超时');
							break;
						case 4:
							this.$message.error('连接被拒');
							break;
					}
				},
				{ 'auto-delete': true }
			);
		},
		// stomp连接失败的回调
		on_error(error) {
			// this.$message.error(error.headers.message);
		},
		// 面板整体尺寸调节
		resize() {
			let dom = document.documentElement;
			let c_w = dom.clientWidth;
			let c_h = dom.clientHeight;
			//#region
			// let width, height, flag;
			// let mb_scale = this.html.total_w / this.html.total_h; // 计算宽高比 当一边100%时 计算另一边像素单位长度
			// let c_scale = c_w / c_h;
			// 计算面板和视窗的比例 面板比例大于视窗比例 则说明宽满铺 否则高满铺
			// if (mb_scale > c_scale) {
			// flag = 1;
			// width = c_w + 'px';
			// height = c_w / mb_scale + 'px';
			// 	this.radio = Math.floor((c_w / this.html.total_w) * 100 + 0.5) / 100;
			// 	dom2.justifyContent = 'none';
			// 	dom2.alignItems = 'center';
			// } else if (mb_scale < c_scale) {
			// flag = 0;
			// height = c_h + 'px';
			// width = c_h * mb_scale + 'px';
			// 	this.radio = Math.floor((c_h / this.html.total_h) * 100 + 0.5) / 100;
			// 	dom2.justifyContent = 'center';
			// 	dom2.alignItems = 'none';
			// } else {
			// flag = 2;
			// width = c_w + 'px';
			// height = c_h + 'px';
			// 	this.radio = Math.floor((c_w / this.html.total_w) * 100 + 0.5) / 100;
			// 	dom2.alignItems = 'none';
			// 	dom2.justifyContent = 'none';
			// }
			// let dom2 = document.querySelector('body').style;
			// switch (flag) {
			// 	case 0:
			// 		dom2.justifyContent = 'center';
			// 		dom2.alignItems = 'none';
			// 		break;
			// 	case 1:
			// 		dom2.justifyContent = 'none';
			// 		dom2.alignItems = 'center';
			// 		break;
			// 	case 2:
			// 		dom2.alignItems = 'none';
			// 		dom2.justifyContent = 'none';
			// 		break;
			// }
			// 无论是高还是宽满铺 面板原始尺寸缩放到视窗大小 宽高缩放比例都是相同的 缩小是视窗小于面板
			// this.radio = Math.floor((c_w / this.html.total_w) * 100 + 0.5) / 100;
			// return { background: this.bg, width: this.html.total_w + 'px', height: this.html.total_h + 'px', transform: `scale(${radio})` };
			//#endregion
			if (this.html.total_w == 0) {
				return;
			}
			this.radio = Math.floor((c_w / this.html.total_w) * 100 + 0.5) / 100;
			let height = this.html.total_h * this.radio;
			return { background: this.bg, height: height + 'px' };
		},
	},
});
