let url = `${我是接口地址}/`;
let getChannelDetail = url + 'api-device/device/status'; //查询历史记录
let sendCmdtoDevice = url + 'api-device/device/operation'; // 下发指令

new Vue({
	el: '.index',
	mixins: [common_functions],
	data: {
		html: {
			config_select: 2,
			level_max: 0,
			level_min: -120,
			gain_max: 12,
			gain_min: -72,
		},
		configs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // 场景配置选择
		matrix: [], // 矩阵
		input: [], //输入
		output: [], //输出
		device_name: '', //显示在页面的设备名
	},
	mounted() {
		if (!location.search) {
			this.token = window.sessionStorage.token;
			this.id = window.sessionStorage.id;
			this.device_name = decodeURIComponent(window.sessionStorage.device_name);
		} else {
			this.get_token();
		}
		window.onresize = () => {
			this.button_h = document.querySelector('.slider_button').offsetHeight;
		};
		this.get_device_status();
	},
	methods: {
		// 获取页面参数
		get_device_status() {
			this.matrix = [];
			this.input = [];
			this.output = [];
			this.request('get', `${getChannelDetail}/${this.id}`, this.token, (res) => {
				console.log('一体机数据', res);
				if (res.data.data == null) {
					return;
				}
				let data = res.data.data.properties;
				for (let i = 0; i < data.input_gain.propertyValue.length; i++) {
					let t = data.input_gain.propertyValue[i];
					let t2 = data.input_level.propertyValue[i];
					let t3 = data.input_mute.propertyValue[i];
					let t4 = {
						gain: t,
						level: t2,
						mute: t3,
					};
					this.input.push(t4);
				}
				for (let i = 0; i < data.output_gain.propertyValue.length; i++) {
					let t = data.output_gain.propertyValue[i];
					let t2 = data.output_level.propertyValue[i];
					let t3 = data.output_mute.propertyValue[i];
					let t4 = {
						gain: t,
						level: t2,
						mute: t3,
					};
					this.output.push(t4);
				}
				for (let i = 0; i < data.mixer.propertyValue.length; i++) {
					let t = [];
					let t2 = data.mixer.propertyValue[i];
					let t3;
					if (t2 == 0) {
						for (let i = 0; i < 12; i++) {
							t.push('0');
						}
					} else {
						t3 = (t2 >>> 0).toString(2);
						for (let k = 0; k < 12; k++) {
							t.push(t3[k]);
						}
					}
					this.matrix.push(t);
				}
				this.html.config_select = data.scene_call.propertyValue;
				this.$nextTick(() => {
					// this.level_h = document.querySelector('.level').offsetHeight - 4; //图片偏差
					// this.gain_h = document.querySelector('.gain').offsetHeight - 5;
					this.button_h = document.querySelector('.slider_button').offsetHeight;
				});
			});
		},
		// 电平样式
		level(level) {
			let p = (level - this.html.level_min) / (this.html.level_max - this.html.level_min);
			return { height: `${p * 100}%` };
		},
		// 增益样式
		gain_cover(gain) {
			let p = (gain - this.html.gain_min) / (this.html.gain_max - this.html.gain_min);
			return { height: `${p * 100}%` };
		},
		gain_button(gain) {
			let p = (gain - this.html.gain_min) / (this.html.gain_max - this.html.gain_min);
			return { bottom: `calc(${p * 100}% - ${this.button_h / 2}px)` };
		},
		slider_turn_to(e, obj, dom, key) {
			// 是否是跳转操作 只有跳转发指令
			let flag = false;
			if (typeof dom == 'undefined') {
				flag = true;
				dom = document.querySelector('.gain');
			}
			let t = dom.offsetHeight - (e.clientY - dom.getBoundingClientRect().top);
			let p = t / dom.offsetHeight;
			obj.gain = p * (this.html.gain_max - this.html.gain_min) + this.html.gain_min;
			obj.gain = Math.floor(obj.gain * 10) / 10;
			if (obj.gain > this.html.gain_max) {
				obj.gain = this.html.gain_max;
			}
			if (obj.gain < this.html.gain_min) {
				obj.gain = this.html.gain_min;
			}
			if (flag) {
				this.send_order(key);
			}
		},
		slider_move(obj, key) {
			let dom = document.querySelector('.gain');
			document.onmousemove = (e) => {
				this.slider_turn_to(e, obj, dom);
			};
			document.onmouseup = () => {
				this.send_order(key);
				document.onmousemove = null;
				document.onmouseup = null;
			};
		},
		// 下发指令 设置属性
		send_order(key, ...params) {
			if (typeof key == undefined) {
				return;
			}
			let attributes = {};
			if (key == 'mixer') {
				this.matrix[params[1]].splice(params[2], 1, Number(params[0]) ? '0' : '1');
				let t = [];
				for (let i = 0; i < this.matrix.length; i++) {
					let t2 = this.matrix[i];
					let t3 = '';
					for (let k = 0; k < t2.length; k++) {
						if (k > 11) {
							t3 += '0';
						} else {
							t3 += t2[k];
						}
					}
					let t4 = parseInt(t3, 2) >> 0;
					t.push(t4);
				}
				attributes[key] = t;
			} else if (key == 'input_mute') {
				params[0].mute = params[0].mute ? 0 : 1;
				let t = [];
				for (let i = 0; i < this.input.length; i++) {
					t.push(this.input[i].mute);
				}
				attributes[key] = t;
			} else if (key == 'output_mute') {
				params[0].mute = params[0].mute ? 0 : 1;
				let t = [];
				for (let i = 0; i < this.output.length; i++) {
					t.push(this.output[i].mute);
				}
				attributes[key] = t;
			} else if (key == 'input_gain') {
				let t = [];
				for (let i = 0; i < this.input.length; i++) {
					t.push(this.input[i].gain);
				}
				attributes[key] = t;
			} else if (key == 'output_gain') {
				let t = [];
				for (let i = 0; i < this.output.length; i++) {
					t.push(this.output[i].gain);
				}
				attributes[key] = t;
			} else if (key == 'scene_call') {
				attributes[key] = this.html.config_select;
			} else if (key == 'scene_save') {
				attributes[key] = this.html.config_select;
			}
			this.request('put', `${sendCmdtoDevice}/8`, this.token, { contentType: 0, contents: [{ deviceId: this.id, attributes: attributes }] }, (res) => {
				if (key == 'scene_call') {
					this.get_device_status();
				}
			});
		},
	},
});
