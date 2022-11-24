new Vue({
	el: '#index',
	data: {
		html: {
			page: 0,
		},
		channel: [
			{ v: 0, a: 0, delay: 1, status: 0 },
			{ v: 0, a: 0, delay: 1, status: 0 },
			{ v: 0, a: 0, delay: 1, status: 0 },
			{ v: 0, a: 0, delay: 1, status: 0 },
			{ v: 0, a: 0, delay: 1, status: 0 },
			{ v: 0, a: 0, delay: 1, status: 0 },
			{ v: 0, a: 0, delay: 1, status: 0 },
			{ v: 0, a: 0, delay: 1, status: 0 },
		],
		timing_switch: 0, //时序开关
	},
	mounted() {
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
