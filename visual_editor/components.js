// 通用方法及变量
const fn = {
	props: ['obj', 'total_h', 'total_w', 'radio'],
	data() {
		return {
			value: this.obj.value || 0, //属性值
		};
	},
	beforeMount() {
		// 此处监听数据变化 根据路径判断是否赋值
		this.$bus.$on('get_value', (val) => {
			// 有回显数据时 传入的是一个数组 挨个对比路径 对上的取值
			for (let v of val) {
				if (v.path == this.path) {
					this.value = v.value;
					break;
				}
			}
		});
		this.$bus.$on('common_params', (...val) => {
			this.token = val[0];
			this.device_id = val[1];
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
			// this.request('put', `${sendCmdtoDevice}/${topic}`, this.token, body);
		},
		// 设置组件样式
		style(obj_data) {
			// 计算百分比 取小数点后两位
			// let h = Math.floor((obj_data.h / this.total_h) * 10000 + 0.5) / 100;
			// let w = Math.floor((obj_data.w / this.total_w) * 10000 + 0.5) / 100;
			// let top = Math.floor((obj_data.y / this.total_h) * 10000 + 0.5) / 100;
			// let left = Math.floor((obj_data.x / this.total_w) * 10000 + 0.5) / 100;
			return {
				position: 'absolute',
				// width: w + '%',
				// height: h + '%',
				// top: top + '%',
				// left: left + '%',
				width: obj_data.w * this.radio + 'px',
				height: obj_data.h * this.radio + 'px',
				top: obj_data.y * this.radio + 'px',
				left: obj_data.x * this.radio + 'px',
				zIndex: obj_data.z_index,
			};
		},
	},
	computed: {
		path() {
			let t = this.obj.attribute;
			if (t && t.length > 0) {
				return this.obj.attribute[this.obj.attribute.length - 1].replace(/\.propertyValue/g, '');
			} else {
				return null;
			}
		},
	},
};
// 滑块组件
let customSlider = {
	template: `
    <div class="slider_box" :style="style(obj)">
      <img src="./img/icon6.png" class="bg_img">
      <span class="text text_ellipsis flex_shrink" :title="value+' dB'">{{value}} dB</span>
      <div class="box1">
        <img src="./img/icon5.png" class="bg_img">
        <el-slider v-model="value" vertical :show-tooltip="false" :min="obj.min" :max="obj.max" :step="step"></el-slider>
      </div>
    </div>
  `,
	mixins: [common_functions, fn],
	data() {
		return {
			step: this.obj.step, //步长
		};
	},
};
// 文本框
let customText = {
	template: `
    <div :style="style(obj)">
      <span :style="color(obj)" :title="title">{{value}}</span>
    </div>
  `,
	data() {
		return {
			title: this.value,
		};
	},
	mixins: [common_functions, fn],
	mounted() {
		this.cut();
	},
	methods: {
		color(obj_data) {
			// let vw = Math.floor((obj_data.fontSize / this.total_w) * 100 * 10 + 0.5) / 10;
			return {
				color: obj_data.color,
				background: obj_data.background,
				fontSize: obj_data.fontSize + 'px',
				// fontSize: vw + 'vw',
				textAlign: obj_data.align,
			};
		},
		cut() {
			let row = Math.floor(this.obj.h / this.obj.fontSize) - 1;
			let col = Math.floor(this.obj.w / this.obj.fontSize) - 1;
			let total = col * row;
			if (this.value.length >= total) {
				//删最3个字符
				this.value = this.value.substring(0, total - 3) + '...';
			}
		},
	},
	watch: {
		value(oldv, newv) {
			if (oldv != newv) {
				this.cut();
			}
		},
	},
};
// 图片
let customImg = {
	template: `
    <div :style="style(obj)">
      <img class="bg_img" :src="obj.src" :style="{objectFit:obj.fls?'contain':''}">
    </div>
  `,
	mixins: [common_functions, fn],
};
// 按钮
let customButton = {
	template: `
    <div :style="style(obj)" class="center button_box">
      <span :style="size(obj)">{{value}}</span>
    </div>
  `,
	mixins: [common_functions, fn],
	methods: {
		size(obj_data) {
			let t = (203 / 22) * 16; //计算多少容器大小下 字体是16px
			let fz = (obj_data.w * this.radio) / t;
			return {
				color: '#fff',
				fontSize: fz + 'rem',
			};
		},
	},
};
// 开关
let customSwitch = {
	template: `
    <div :style="style(obj)" class="switch_box" @click="switch_fn">
      <img v-show="value" src="./img/icon3.png" class="bg_img" draggable="false">
      <img v-show="!value" src="./img/icon4.png" class="bg_img" draggable="false">
    </div>
  `,
	mixins: [common_functions, fn],
	methods: {
		switch_fn() {
			this.value = this.value ? 0 : 1;
		},
	},
};
// 进度条
let customProgress = {
	template: `
    <div class="progress_box" :style="style(obj)">
      <img src="./img/icon7.png" class="bg_img">
      <span class="text" style="margin: 20px 0 10px 0;">{{obj.max}}</span>
      <div class="progress">
        <div class="lump flex_shrink" v-for="i in total_num" :style="color(i)"></div>
      </div>
      <span class="text" style="margin: 10px 0 20px 0;">{{obj.min}}</span>
    </div>
  `,
	mixins: [common_functions, fn],
	data() {
		return {
			block_h: 12, //方块大小
		};
	},
	methods: {
		color(index) {
			// 10是单位，一个小方格大小+间隔=10
			let color;
			let max = Math.floor((this.total_height * 0.1) / this.block_h + 0.5);
			let mid = Math.floor((this.total_height * 0.2) / this.block_h + 0.5);
			let min = Math.floor((this.total_height * 0.3) / this.block_h + 0.5);
			if (index < max) {
				color = '#AB152E';
			} else if (index >= max && index < mid) {
				color = '#CB7E05';
			} else if (index >= mid && index < min) {
				color = '#1594FF';
			} else {
				color = '#1560FF';
			}
			// 显示效果时从下往上，但是节点渲染是从上往下，所以要用总数-基数
			let opacity = '0.5'; //单独维护的色块透明度
			if (index > this.render_num) {
				opacity = '1';
			}
			return { background: color, opacity: opacity };
		},
	},
	computed: {
		total_num() {
			return Math.floor(this.total_height / this.block_h);
		},
		render_num() {
			// 计算回显值占方块数
			let per = (this.value - this.obj.min) / (this.obj.max - this.obj.min);
			let n = Math.floor((this.total_height * per) / this.block_h + 0.5);
			return this.total_num - n;
		},
		total_height() {
			return this.obj.h * this.radio - 40;
		},
	},
	watch: {
		value() {
			if (this.value < this.obj.min) {
				this.value = this.obj.min;
			} else if (this.value > this.obj.max) {
				this.value = this.obj.max;
			}
		},
	},
};
