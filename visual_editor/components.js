// 通用方法及变量
const fn = {
	data() {
		return {
			total_w: 0,
			total_h: 0,
		};
	},
	mounted() {
		// 此处监听数据变化 根据路径判断是否赋值
		this.$bus.$on('get_value', (val) => {
			if (val.path == this.path) {
				this.value = val.value;
			}
		});
		this.$bus.$on('common_params', (...val) => {
			this.token = val[0];
			this.device_id = val[1];
			this.total_w = val[2];
			this.total_h = val[3];
		});
	},
	methods: {
		send_order(key, ...params) {
			let topic = 8;
			let body = {
				contentType: 0,
				contents: [{ deviceId: this.device_id, attributes: {} }],
			};
			if (this.obj.service.length > 0) {
				topic = 11;
				body.contentType = 2;
				body.contents[0].identifier = this.obj.service;
			}
			this.request('put', `${sendCmdtoDevice}/${topic}`, this.token, body);
		},
		// 设置组件样式
		style(obj_data) {
			// 计算百分比 取小数点后两位
			let h = Math.floor((obj_data.h / this.total_h) * 10000 + 0.5) / 100;
			let w = Math.floor((obj_data.w / this.total_w) * 10000 + 0.5) / 100;
			return {
				position: 'absolute',
				width: w + '%',
				height: h + '%',
				top: obj_data.y,
				left: obj_data.x,
				zIndex: obj_data.z_index,
			};
		},
	},
};
// 滑块组件
let slider = {
	template: `
    <div class="slider_box" :style="style(obj)">
      <span class="text center flex_shrink">{{value}} dB</span>
      <el-slider v-model="value" vertical class="slider" :show-tooltip="false" :min="obj.min" :max="obj.max" :step="step" @change="send_order()"></el-slider>
    </div>
  `,
	props: ['obj'],
	mixins: [common_functions, fn],
	data() {
		return {
			step: 0.1, //步长
			value: 0, //属性值
			path: obj.attribute[obj.attribute.length - 1].replace(/\.propertyValue/g, ''), //发送指令及回显匹配字段
		};
	},
};
let text = {
	template: `
    
  `,
};
