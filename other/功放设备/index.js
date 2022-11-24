let url = `${我是接口地址}/`;
let get_data_url = url + 'api-device/device/status'; //查询数据
let sendCmdtoDevice = url + 'api-device/device/operation'; // 下发指令

new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			page: 0,
			gain_min: -120,
			gain_max: 0,
			page_loading: false, //页面加载
		},
		device_name: '', //设备名
		status: [
			{ title: '通道', value: ['CH1', 'CH2', 'CH3', 'CH4'] },
			{ title: '电压', value: ['0.0', '0.0', '0.0', '0.0'] },
			{ title: '电流', value: ['0.0', '0.0', '0.0', '0.0'] },
			{ title: '温度', value: ['0.0', '0.0', '0.0', '0.0'] },
			{ title: '故障', value: [1, 1, 1, 0] },
		],
		input: [
			{ gain: -10.2, mute: 0 },
			{ gain: -10.2, mute: 1 },
			{ gain: -10.2, mute: 0 },
			{ gain: -10.2, mute: 0 },
		],
		output: [
			{ gain: -10.2, mute: 0 },
			{ gain: -10.2, mute: 0 },
			{ gain: -10.2, mute: 0 },
			{ gain: -10.2, mute: 1 },
		],
	},
	mounted() {
		document.title = '功放设备';
		if (!location.search) {
			this.token = sessionStorage.token;
			this.id = window.sessionStorage.id;
			this.device_name = decodeURIComponent(window.sessionStorage.device_name);
		} else {
			this.get_token();
		}
		this.switch_page(this.html.page);
		window.onresize = this.resize;
	},
	methods: {
		resize() {
			let dom = document.documentElement;
			let w = dom.clientWidth;
			if (w > 1000 && w <= 1920) {
				let t = w / 1920;
				let fontSize = Math.ceil(t * 16);
				dom.style.fontSize = `${fontSize}px`;
			} else if (w > 1920) {
				dom.style.fontSize = `16px`;
			} else {
				dom.style.fontSize = `10px`;
			}
		},
		// 切换页面显示选项卡
		switch_page(index) {
			this.html.page = index;
			this.html.page_loading = true;
			switch (index) {
				case 0:
					this.get_data();
					break;
			}
		},
		// 获取状态数据
		get_data() {
			this.request('get', `${get_data_url}/${this.id}`, this.token, (res) => {
				console.log('状态数据', res);
				this.html.page_loading = false;
				if (res.data.head.code != 200) {
					return;
				}
				let data = res.data.data.properties;
				let num = data.CH_NUM.propertyValue; //通道数量
				for (let val of this.status) {
					let temp;
					switch (val.title) {
						case '通道':
							val.value = [];
							for (let i = 1; i <= num; i++) {
								val.value.push(`CH${i}`);
							}
							break;
						case '电压':
							val.value = [];
							for (let i = 1; i <= num; i++) {
								val.value.push(data[`V${i}`].propertyValue);
							}
							break;
						case '电流':
							break;
						case '温度':
							break;
						case '故障':
							break;
					}
				}
			});
		},
		// 增益样式
		gain_cover(gain) {
			let p = (gain - this.html.gain_min) / (this.html.gain_max - this.html.gain_min);
			return { height: `${p * 100}%` };
		},
		gain_button(gain) {
			let p = (gain - this.html.gain_min) / (this.html.gain_max - this.html.gain_min);
			return { bottom: `calc(${p * 100}% - ${19 / 2}px)` };
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
				// this.send_order(key);
			}
		},
		slider_move(obj, key) {
			let dom = document.querySelector('.gain');
			document.onmousemove = (e) => {
				this.slider_turn_to(e, obj, dom);
			};
			document.onmouseup = () => {
				// this.send_order(key);
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
			if (key == 'MIXS') {
				this.matrix[params[1]].splice(params[2], 1, Number(params[0]) ? '0' : '1');
				let t = [];
				for (let i = 0; i < this.matrix.length; i++) {
					let t4 = [];
					for (let val of this.matrix[i]) {
						t4.push(val);
					}
					// 将数组反转 合并成字符串 用parseInt舍去前面的0 转换为number类型 再转进制
					let t2 = parseInt(t4.reverse().join(''));
					let t3 = parseInt(t2, 2) >> 0;
					t.push(t3, 0);
				}
				attributes[key] = t;
				console.log(this.matrix);
			} else if (key == 'INMS') {
				params[0].mute = params[0].mute ? 0 : 1;
				let t = [];
				for (let i = 0; i < this.input.length; i++) {
					t.push(this.input[i].mute);
				}
				attributes[key] = t;
			} else if (key == 'OUTMS') {
				params[0].mute = params[0].mute ? 0 : 1;
				let t = [];
				for (let i = 0; i < this.output.length; i++) {
					t.push(this.output[i].mute);
				}
				attributes[key] = t;
			} else if (key == 'INGS') {
				let t = [];
				for (let i = 0; i < this.input.length; i++) {
					t.push(this.input[i].gain * 100);
				}
				attributes[key] = t;
			} else if (key == 'OUTGS') {
				let t = [];
				for (let i = 0; i < this.output.length; i++) {
					t.push(this.output[i].gain * 100);
				}
				attributes[key] = t;
			} else if (key == 'SCALL') {
				attributes[key] = [this.html.config_select];
			} else if (key == 'SSAVE') {
				attributes[key] = [this.html.config_select];
			}
			this.request('put', `${sendCmdtoDevice}/8`, this.token, { contentType: 0, contents: [{ deviceId: this.id, attributes: attributes }] }, (res) => {
				if (key == 'SCALL') {
					this.get_device_status();
				}
			});
		},
	},
});
