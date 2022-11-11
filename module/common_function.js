const common_functions = {
	methods: {
		// 获取地址栏token
		get_token() {
			let temp = location.search.substring(1).split('&');
			temp.forEach((e) => {
				if (e.indexOf('token') != -1) {
					this.token = e.split('=')[1];
					window.sessionStorage.token = this.token;
				} else if (e.indexOf('userName') != -1) {
					this.userName = e.split('=')[1];
					window.sessionStorage.userName = this.userName;
				} else if (e.indexOf('id') != -1) {
					this.id = e.split('=')[1];
					window.sessionStorage.id = this.id;
				} else if (e.indexOf('type') != -1) {
					this.router = e.split('=')[1];
					window.sessionStorage.router = this.router;
				} else if (e.indexOf('device_name') != -1) {
					this.device_name = decodeURIComponent(e.split('=')[1]);
					// cookie里只能存编码后的中文字符
					window.sessionStorage.device_name = e.split('=')[1];
				}
			});
			// let url = location.href.split('?')[0];
			// history.replaceState('', '', url);
		},
		//封装的请求方法
		request(method, url, token, data, func) {
			axios({
				method: method,
				url: url,
				data: typeof data === 'object' ? data : typeof data === 'function' ? ((func = data), null) : null,
				headers: {
					Authorization: `Bearer ${token}`,
					'content-type': 'application/json',
				},
			}).then((res) => {
				if (res.data.head.code == 200) {
					if (typeof func === 'function') {
						func(res);
					}
				} else {
					this.$alert(res.data.head.message, '提示', {
						confirmButtonText: '确定',
						callback: () => {
							if (typeof func === 'function') {
								func(res);
							}
						},
					});
				}
			});
		},
		// 获取任意节点到视窗顶的距离
		get_clientY(element) {
			let top = element.offsetTop;
			let parent_dom = element.offsetParent;
			// 不断遍历查找上一层父节点 直到为null body的父节点就是null
			while (parent_dom != null) {
				top += parent_dom.offsetTop;
				parent_dom = parent_dom.offsetParent;
			}
			return top;
		},
		// 获取任意节点到视窗顶的距离
		get_clientX(element) {
			let left = element.offsetLeft;
			let parent_dom = element.offsetParent;
			while (parent_dom != null) {
				left += parent_dom.offsetLeft;
				parent_dom = parent_dom.offsetParent;
			}
			return left;
		},
	},
};
