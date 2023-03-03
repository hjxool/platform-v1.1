let url = `${我是接口地址}/`;
let material_search_url = `${url}api-file/doc/catalogue/shareMaterial/search`;
let upload_file_url = `${url}api-file/doc/file/chunk/create`;
let del_material_url = `${url}api-file/doc/file/delete`;

new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			search: '', // 搜索框
			page_loading: false, // 页面加载
			load_text: '', // 加载提示文字
		},
		table: {
			h: 0,
			data: [], //表格数据
			total: 0, // 数据总数
			page_size: 10, //单页显示数量
		},
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.get_data(1);
		this.resize();
		window.onresize = () => {
			this.resize();
		};
	},
	methods: {
		resize() {
			// 计算根节点子体大小
			let dom = document.documentElement;
			let width = dom.clientWidth;
			let ratio = Math.floor((width / 1920) * 100 + 0.5) / 100;
			dom.style.fontSize = ratio * 20 + 'px';
			this.$nextTick(() => {
				this.table.h = document.querySelector('.body').clientHeight;
			});
		},
		get_data(page) {
			this.html.page_loading = true;
			this.request('post', material_search_url, this.token, { pageNum: page, pageSize: this.table.page_size, keyword: this.html.search }, (res) => {
				console.log('素材', res);
				this.html.page_loading = false;
				if (res.data.head.code != 200) {
					this.table.total = 0;
					return;
				}
				let data = res.data.data;
				this.table.total = data.total;
				this.table.data = data.data;
			});
		},
		select_file() {
			select_file.click();
		},
		upload_file() {
			Upload({
				id: 'select_file',
				small_file_slice_size: 5,
				large_file_slice_size: 50,
				upload_url: `${upload_file_url}/-1`,
				token: this.token,
				fail_count: 3,
				uploadStart: () => {
					this.html.page_loading = true;
					this.html.load_text = '读取完成，准备开始上传';
				},
				uploadFail: (index) => {
					this.html.load_text = `重试第${index}次`;
					if (index == 3) {
						this.html.page_loading = false;
					}
				},
				uploadProgress: (cur, total) => {
					let per = Math.floor((cur / total) * 1000 + 0.5) / 10;
					this.html.load_text = `上传进度：${per}%`;
				},
				uploadSuccess: () => {
					this.html.load_text = `上传成功`;
					setTimeout(() => {
						this.html.page_loading = false;
					}, 1000);
				},
				readStart: () => {
					this.html.page_loading = true;
					this.html.load_text = '当前文件较大，读取中请耐心等待...';
				},
				readProgress: (cur, total) => {
					this.html.load_text = `读取进度：${cur}/${total}`;
				},
			});
		},
		// 删除素材
		del_material(row_obj) {
			this.request('post', del_material_url, this.token, [row_obj.id], (res) => {
				this.get_data(1);
			});
		},
		// 不是图片不能预览
		is_img(url) {
			let a = url.split('.');
			let t = a[a.length - 1];
			if (t === 'jpg' || t === 'png') {
				return true;
			} else {
				return false;
			}
		},
	},
});
