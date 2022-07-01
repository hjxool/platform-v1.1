let url = `${我是接口地址}/`;
let device_status = `${url}api-device/device-anon/device/status`;
let device_status_history = `${url}api-device/device-anon/device/status/history`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		id: '',
		token: '',
		html: {
			loading: true, //页面初加载遮罩
			// first_load_echarts: true, //第一次加载图表初始设置
		},
		card_list: [], //弹窗属性值卡片列表
		page_list: [], //弹窗页面数据数组
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
				this.card_list = [];
				if (res.data.data.properties === null || res.data.data.properties === {}) {
					this.$alert('未设置属性！', '提示', {
						confirmButtonText: '确定',
					});
					return;
				}
				for (let [key, value] of Object.entries(res.data.data.properties)) {
					// 单个卡片或者属性最外层
					let card = {};
					this.card_tree(card, value, 'properties', key);
					this.card_list.push(card);
				}
				this.html.loading = false;
			});
		},
		// 遍历是否有子属性 没有则添加单位和值 有则增加child数组
		card_tree(target, source, path1, path2) {
			target.path = `${path1}.${path2}`;
			target.name = source.propertyName;
			if (source.propertyValue.constructor === Array && typeof source.propertyValue[0] != 'object') {
				target.is_floor = true;
				target.value = source.propertyValue;
				target.unit = source.unit == null ? '未设置' : source.unit;
				target.unit_name = source.unit == null ? '' : source.unitName;
			} else if (source.propertyValue.constructor === Array && typeof source.propertyValue[0] === 'object') {
				// 不是最底层则不展示单位 用v-if控制
				target.is_floor = false;
				target.child = [];
				let index = 0;
				source.propertyValue.forEach((e) => {
					// 数组有多个对象 对象下没有propertyName等参数 所以自己构建描述对象 再遍历对象下的对象
					let card = {
						path: `${target.path}.propertyValue[${index}]`,
					};
					card.name = index;
					card.is_floor = false;
					card.child = [];
					for (let key in e) {
						let card2 = {};
						this.card_tree(card2, e[key], card.path, key);
						card.child.push(card2);
					}
					target.child.push(card);
					index++;
				});
			} else if (source.propertyValue.constructor === Object) {
				target.is_floor = false;
				target.child = [];
				for (let key in source.propertyValue) {
					let card = {};
					this.card_tree(card, source.propertyValue[key], `${target.path}.propertyValue`, key);
					target.child.push(card);
				}
			} else {
				target.is_floor = true;
				target.value = source.propertyValue;
				target.unit = source.unit == null ? '未设置' : source.unit;
				target.unit_name = source.unit == null ? '' : source.unitName;
			}
		},
		// 返回上一级
		back() {
			let dom = this.$refs.detail;
			dom[dom.length - 1].className = 'detail fold';
			setTimeout(() => {
				this.page_list.pop();
			}, 300);
		},
		// 具有子属性的点击进入下一级页面
		next_page(child_array) {
			let page = {
				child_array: child_array,
				is_history: false,
			};
			this.page_list.push(page);
			this.$nextTick(() => {
				let dom = this.$refs.detail;
				dom[dom.length - 1].className = 'detail unfold';
			});
		},
		// 刷新按钮
		refresh() {
			// this.res_card_list();
		},
		// 查询历史详情
		get_history(card_obj) {
			this.request('post', device_status_history, this.token, { condition: { deviceId: this.id, fieldPath: card_obj.path }, pageNum: 1, pageSize: 999 }, (res) => {
				console.log('历史记录', res);
				let page = {
					is_history: true,
				};
				this.page_list.push(page);
				this.time_list = [];
				this.history_value = [];
				this.propertyName = res.data.data.data[0].propertyName;
				if (res.data.data.data[0].unit != null) {
					this.unit = `${res.data.data.data[0].unit}/${res.data.data.data[0].unitName}`;
				} else {
					this.unit = '未设置';
				}
				res.data.data.data.forEach((e) => {
					this.time_list.push(e.created);
					this.history_value.push(e.propertyValue);
				});
				this.$nextTick(() => {
					this.init_echarts();
				});
			});
		},
		// echarts初始设置
		init_echarts() {
			this.history = echarts.init(document.getElementById('history'));
			let option = {
				grid: {
					show: true,
				},
				tooltips: {
					trigger: 'axis',
					formatter: (value) => {
						let text = `
              日期：${value[0].axisValue.split(' ')[0]}<br>
              时间：${value[0].axisValue.split(' ')[1]}>br>
              ${this.propertyName}：${value[0].data} ${this.unit}
            `;
						return text;
					},
				},
				xAxis: {
					type: 'category',
					data: this.time_list,
					axisTick: {
						show: false,
					},
				},
				yAxis: {
					type: 'value',
					boundaryGap: ['0%', '20%'],
				},
				series: [
					{
						type: 'line',
						data: this.history_value,
						smooth: true, //平滑显示
						symbol: 'none', //线段上的装饰点
						cursor: 'none',
					},
				],
			};
			this.history.setOption(option);
		},
	},
});
