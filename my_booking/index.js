new Vue({
	el: '#index',
	data: {
		html: {
			date: new Date(),
			time_option: 0, //切换显示时间周期
			time_display: ['日', '周', '月'],
		},
	},
	mounted() {},
	methods: {
		time_display(index) {
			this.html.time_option = index;
		},
	},
});
