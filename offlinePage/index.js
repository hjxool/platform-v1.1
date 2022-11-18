new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		online_num: 16, //在线设备数
		offline_num: 10, //离线设备数
		normal_num: 16, //正常设备数
		abnormal_num: 10, //异常设备数
	},
	mounted() {
		// 初始化图表实例
		let dom = document.querySelectorAll('.body');
		for (let i = 1; i <= 5; i++) {
			this[`echart${i}`] = echarts.init(dom[i - 1]);
			this.init_echarts(i);
		}
		window.addEventListener('resize', this.resize);
	},
	methods: {
		// 视窗大小改变根元素字体大小
		resize() {
			let dom = document.documentElement;
			let w = dom.clientWidth;
			if (w >= 1000 && w <= 1920) {
				let t = w / 1920;
				let fontsize = t * 16;
				dom.style.fontSize = `${fontsize}px`;
			} else if (w < 1000) {
				dom.style.fontSize = `10px`;
			} else if (w > 1920) {
				dom.style.fontSize = `16px`;
			}
			// 更新图表
			for (let i = 1; i <= 5; i++) {
				this[`echart${i}`].resize();
			}
		},
		// 初始化图表
		init_echarts(type) {
			let option;
			let data;
			switch (type) {
				case 1:
					data = [
						{ value: this.online_num, name: '在线设备' },
						{ value: this.offline_num, name: '离线设备' },
					];
					option = {
						legend: {
							bottom: '5%',
							right: '10%',
							orient: 'vertical',
							textStyle: {
								color: '#fff',
							},
						},
						series: [
							{
								type: 'pie',
								radius: ['40%', '70%'],
								center: ['30%', '50%'],
								label: {
									show: false,
									position: 'center',
								},
								emphasis: {
									label: {
										show: true,
										fontSize: '20',
										fontWeight: 'bold',
										color: '#fff',
										formatter: '{c}',
									},
								},
								data: data,
							},
						],
						color: ['#FAFF75', '#01B4FF'],
					};
					this[`echart${type}`].setOption(option);
					break;
				case 2:
					data = [
						{ value: this.normal_num, name: '正常设备' },
						{ value: this.abnormal_num, name: '异常设备' },
					];
					option = {
						legend: {
							bottom: '5%',
							right: '10%',
							orient: 'vertical',
							textStyle: {
								color: '#fff',
							},
						},
						series: [
							{
								type: 'pie',
								radius: [0, '70%'],
								center: ['30%', '50%'],
								label: {
									show: false,
									position: 'outside',
								},
								emphasis: {
									label: {
										show: true,
										fontSize: '20',
										fontWeight: 'bold',
										color: '#fff',
										formatter: '{c}',
									},
								},
								labelLine: {
									show: true,
									lineStyle: {
										color: 'rgba(255,255,255,0.5)',
									},
								},
								data: data,
							},
						],
						color: ['#025AFF', '#D15465'],
					};
					this[`echart${type}`].setOption(option);
					break;
			}
		},
	},
});
