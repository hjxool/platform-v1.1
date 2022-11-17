new Vue({
	el: '#index',
	mixins: [common_functions],
	mounted() {
		window.onresize = this.resize;
	},
	methods: {
		resize() {
			let dom = document.documentElement;
			let w = dom.clientWidth;
			if (w > 1000) {
				let t = w / 1920;
				let fontsize = t * 16;
				dom.style.fontSize = `${fontsize}px`;
			} else {
				dom.style.fontSize = `10px`;
			}
		},
	},
});
