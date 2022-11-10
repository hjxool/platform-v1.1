let url = `${我是接口地址}/`;
let firmware_list_url = `${url}api-device/firmware/page`;
let product_list_url = `${url}api-device/product/all`;
let edit_firmware_url = `${url}api-device/firmware`;
let upload_firmware_url = `${url}api-device/firmware/upload`;
let upgrade_url = `${url}api-device/firmware/update`;
let del_firmware_url = `${url}api-device/firmware/delete`;
let export_firmware_url = `${url}api-device/firmware/export`;
let device_list_url = `${url}api-device/device/byProduct`;

new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			search: '', //搜索框
			product_selected: '', //选择显示某产品下固件列表
			table_h: 0, //表格最大高度
			firmware_display: false, //创建固件版本弹窗
			popover_loading: false, //弹窗加载遮罩
			page_loading: false, //页面加载
			upgrade_display: false, //固件升级设备弹窗
			tips: '设备之前可能有传输中断的升级文件，选是则会把文件从头开始传',
		},
		product_list: [], //产品列表
		firmware_list: [], //固件列表
		firmware_total: 100, //固件信息条数
		firmware_form: {
			product: '', //产品id
			name: '', //固件名称
			ver: '', //md5
			file_name: '', //文件名
			load_text: '', //遮罩显示内容
		},
		firmware_rules: {
			product: [{ required: true, message: '请选择关联产品', trigger: 'change' }],
			name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
			file: { show: false, message: '必须选择文件' },
		},
		upgrade_form: {
			size: '', //文件传到设备切片大小
			force: false, //强制从第一片开始传
			not_all: false, //非全选
			checkAll: false, //全选
			list: [], //同产品的设备
			select_list: [], //勾选的设备
		},
		upgrade_rules: {
			size: [
				{ required: true, message: '请输入切片大小', trigger: 'blur' },
				{ pattern: /\d+/, message: '只能输入整数数字', trigger: 'blur' },
			],
			select: { show: false, message: '至少选择一台设备' },
		},
		add_or_edit: '', //区分新增还是编辑 同时影响页面渲染
	},
	mounted() {
		if (!location.search) {
			this.token = window.sessionStorage.token;
		} else {
			this.get_token();
		}
		this.get_product_list();
		this.get_firmware_list();
		// mounted只是挂载节点 元素还没渲染前大小都是0
		window.addEventListener('resize', this.table_height);
		this.$nextTick(this.table_height);
	},
	methods: {
		// 获取产品列表
		get_product_list() {
			this.request('post', product_list_url, this.token, { condition: {}, pageNum: 1, pageSize: 1000 }, (res) => {
				console.log('产品列表', res);
				if (res.data.head.code != 200) {
					return;
				}
				this.product_list = res.data.data.data;
			});
		},
		// 获取固件版本列表
		get_firmware_list(cur_page) {
			let data = {
				pageSize: 20,
				keyword: this.html.search,
				condition: {},
			};
			if (typeof cur_page === 'number') {
				data.pageNum = cur_page;
			} else {
				data.pageNum = 1;
			}
			if (this.html.product_selected) {
				data.condition.productId = this.html.product_selected;
			}
			this.html.page_loading = true;
			this.request('post', firmware_list_url, this.token, data, (res) => {
				console.log('固件列表', res);
				this.firmware_list = [];
				this.html.page_loading = false;
				if (res.data.head.code != 200) {
					return;
				}
				let data = res.data.data;
				this.firmware_total = data.total;
				this.firmware_list = data.data;
			});
		},
		// 表格最大高度
		table_height() {
			this.html.table_h = document.querySelector('.table_box').offsetHeight;
		},
		// 创建固件版本
		add_firmware() {
			this.add_or_edit = 'add';
			for (let key in this.firmware_form) {
				if (typeof this.firmware_form[key] == 'number') {
					this.firmware_form[key] = 0;
				} else {
					this.firmware_form[key] = '';
				}
			}
			this.firmware_rules.file.show = false;
			this.html.firmware_display = true;
		},
		// 编辑固件版本
		edit_firmware(row_obj) {
			this.add_or_edit = 'edit';
			this.firmware_form.name = row_obj.firmwareName;
			this.firmware_form.ver = row_obj.firmwareVersion;
			this.firmware_id = row_obj.id;
			this.firmware_form.product = row_obj.productId;
			this.firmware_form.file_name = row_obj.firmwareUrl;
			this.firmware_rules.file.show = false;
			this.html.firmware_display = true;
		},
		// 固件信息提交
		firm_sub(form_name) {
			this.$refs[form_name].validate((result) => {
				let result2 = true;
				if (this.add_or_edit == 'add' && select_file.files.length == 0) {
					result2 = false;
				}
				this.firmware_rules.file.show = !result2;
				if (result && result2) {
					this.html.popover_loading = true;
					if (this.add_or_edit == 'edit') {
						this.firmware_form.load_text = `等待服务器返回结果`;
						let data = {
							firmwareName: this.firmware_form.name,
							productId: this.firmware_form.product,
							id: this.firmware_id,
						};
						this.request('put', edit_firmware_url, this.token, data, (res) => {
							this.html.popover_loading = false;
							if (res.data.head.code == 200) {
								this.html.firmware_display = false;
								this.html.search = '';
								this.html.product_selected = '';
								this.get_firmware_list();
							}
						});
					} else {
						let file = select_file.files[0];
						let length = file.size;
						let size = 1024 * 1024 * 5;
						let slice_list = [];
						let total = Math.ceil(length / size);
						for (let i = 0; i < total; i++) {
							let t = file.slice(size * i, size * (i + 1));
							slice_list.push(t);
						}
						let index = 0;
						this.firmware_form.load_text = `开始上传`;
						setTimeout(() => {
							this.firmware_form.load_text = `上传进度：0%`;
						}, 500);
						this.slice_upload(index, total, slice_list, length);
						// let reader = new FileReader();
						// reader.readAsArrayBuffer(file);
						// reader.onload = (e) => {
						// let f_b = e.target.result;
						// let length = f_b.byteLength;
						// let size = 1024 * 1024 * 5;
						// let slice_list = [];
						// let total = Math.ceil(length / size);
						// for (let i = 0; i < total; i++) {
						// 	let t = f_b.slice(size * i, size * (i + 1));
						// 	slice_list.push(t);
						// }
						// let index = 0;
						// this.firmware_form.load_text = `开始上传`;
						// setTimeout(() => {
						// 	this.firmware_form.load_text = `上传进度：0%`;
						// }, 500);
						// 从这开始递归
						// this.slice_upload(index, total, slice_list, length);
						// };
					}
				}
			});
		},
		// 触发input
		select_file() {
			select_file.click();
		},
		// 选完文件后填充表单
		file_selected() {
			let file = select_file.files[0];
			this.firmware_form.ver = md5(file);
			this.firmware_form.file_name = file.name;
		},
		// 下来菜单点击事件
		other_operate(command, row_obj) {
			switch (command) {
				case 'export':
					axios({
						method: 'get',
						url: `${export_firmware_url}/${row_obj.id}`,
						responseType: 'blob',
						headers: {
							Authorization: `Bearer ${this.token}`,
							'Content-Type': 'application/x-download',
						},
					}).then((res) => {
						console.log('下载', res);
						if (res.data.head.code != 200) {
							return;
						}
						let a = document.createElement('a');
						a.href = res.data.data;
						a.target = '_blank';
						document.body.appendChild(a);
						a.click();
						document.body.removeChild(a);
					});
					// this.request('get', `${export_firmware_url}/${row_obj.id}`, this.token, (res) => {
					// 	console.log(res);
					// });
					break;
				case 'upgrade':
					this.firmware_id = row_obj.id;
					this.html.popover_loading = true;
					this.request('post', device_list_url, this.token, { productIds: [row_obj.productId] }, (res) => {
						console.log('同一产品设备', res);
						this.html.popover_loading = false;
						if (res.data.head.code != 200) {
							return;
						}
						this.upgrade_form.list = res.data.data;
					});
					for (let key in this.upgrade_form) {
						if (typeof this.upgrade_form[key] == 'string') {
							this.upgrade_form[key] = '';
						} else if (typeof this.upgrade_form[key] == 'boolean') {
							this.upgrade_form[key] = false;
						} else if (typeof this.upgrade_form[key] == 'object') {
							this.upgrade_form[key] = [];
						}
					}
					this.upgrade_rules.select.show = false;
					this.html.upgrade_display = true;
					break;
				case 'del':
					this.$confirm('确认删除该固件信息？', '提示', {
						confirmButtonText: '确定',
						cancelButtonText: '取消',
						type: 'info',
						center: true,
					}).then(() => {
						this.html.page_loading = true;
						this.request('delete', `${del_firmware_url}/${row_obj.id}`, this.token, (res) => {
							this.html.page_loading = false;
							if (res.data.head.code == 200) {
								this.html.search = '';
								this.html.product_selected = '';
								this.get_firmware_list();
							}
						});
					});
					break;
			}
		},
		// 升级设备表单全选
		check_all(val) {
			this.upgrade_form.select_list = [];
			if (val) {
				for (let val2 of this.upgrade_form.list) {
					this.upgrade_form.select_list.push(val2.id);
				}
			}
			this.upgrade_form.not_all = false;
		},
		// 勾选设备时
		check_change(array) {
			this.upgrade_form.checkAll = array.length == this.upgrade_form.list.length;
			this.upgrade_form.not_all = array.length > 0 && array.length < this.upgrade_form.list.length;
		},
		// 升级固件提交
		up_sub(form_name) {
			this.$refs[form_name].validate((result) => {
				let result2 = true;
				if (this.upgrade_form.select_list.length == 0) {
					result2 = false;
				}
				this.upgrade_rules.select.show = !result2;
				if (result && result2) {
					this.html.popover_loading = true;
					this.request(
						'post',
						upgrade_url,
						this.token,
						{
							chunkSizeKB: this.upgrade_form.size,
							deviceIds: this.upgrade_form.select_list,
							firmwareId: this.firmware_id,
							force: this.upgrade_form.force,
						},
						(res) => {
							this.html.popover_loading = false;
							if (res.data.head.code == 200) {
								this.html.upgrade_display = false;
							}
						}
					);
				}
			});
		},
		// 切片上传文件
		slice_upload(index, total, slice_list, length) {
			let form_obj = new FormData();
			// form_obj.append('file_chunksize', slice_list[index].byteLength);
			form_obj.append('file_chunksize', slice_list[index].size);
			form_obj.append('file_data', slice_list[index]);
			form_obj.append('file_index', index + 1);
			form_obj.append('file_md5', this.firmware_form.ver);
			form_obj.append('file_name', this.firmware_form.file_name);
			form_obj.append('file_size', length);
			let t = this.firmware_form.file_name.split('.');
			form_obj.append('file_suffix', t[t.length - 1]);
			form_obj.append('file_total', total);
			this.request('post', upload_firmware_url, this.token, form_obj, (res) => {
				let per = Math.floor(((index + 1) / total) * 100 * 10 + 0.5) / 10;
				this.firmware_form.load_text = `上传进度：${per}%`;
				index++;
				if (index < total) {
					this.slice_upload(index, total, slice_list, length);
				} else if (index == total) {
					this.firmware_form.load_text = `上传完成`;
					setTimeout(() => {
						this.firmware_form.load_text = `等待服务器返回结果`;
					}, 500);
					let data = {
						firmwareByteLength: res.data.data.firmwareByteLength,
						firmwareName: this.firmware_form.name,
						firmwareVersion: res.data.data.firmwareVersion,
						partCount: res.data.data.partCount,
						productId: this.firmware_form.product,
					};
					this.request('post', edit_firmware_url, this.token, data, (res) => {
						this.html.popover_loading = false;
						if (res.data.head.code == 200) {
							this.html.firmware_display = false;
							this.html.search = '';
							this.html.product_selected = '';
							this.get_firmware_list();
						}
					});
				}
			});
			form_obj = null;
		},
	},
});
