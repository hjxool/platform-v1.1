new Vue({
	el: '#index',
	data() {
		return {
			id: '',
			token: '',
			router: '',
		};
	},
	mounted() {
		this.get_token();
	},
	methods: {
		get_token() {
			let temp = location.search.substring(1).split('&');
			temp.forEach((e) => {
				let key = e.split('=')[0];
				let value = e.split('=')[1];
				if (key.indexOf('token') != -1) {
					this.token = value;
					window.sessionStorage.token = this.token;
				} else if (key.indexOf('userName') != -1) {
					this.userName = value;
					window.sessionStorage.userName = this.userName;
				} else if (key.indexOf('id') != -1) {
					this.id = value;
					window.sessionStorage.id = this.id;
				} else if (key.indexOf('type') != -1) {
					this.router = value;
				}
			});
		},
		turn_to() {
			switch (this.router) {
				case 'model':
					let url = `./物模型页/index.html?id=${this.id}&token=${this.token}`;
					return url;
			}
		},
	},
});
