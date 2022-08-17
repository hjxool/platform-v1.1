let url = `${我是接口地址}/`;
let user_list = `${url}api-portal/place/tenant/findTenantList`;
let place_list = `${url}api-portal/place`;
let device_list = `${url}api-portal/place/device`;
let place_add_device = `${url}api-portal/place/add`;
let place_del_device = `${url}api-portal/place/delete`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		token: '',
		html: {
			user_focus: 0, //选中的租户
			place_focus: 0, //选中的场所
			option: [
				{ name: '设备管理', src_light: './img/设备明.png', src_dark: './img/设备暗.png' },
				{ name: '场景管理', src_light: './img/场景明.png', src_dark: './img/场景暗.png' },
			], //场所选项样式
			option_focus: 0, //场景/设备选项
			product_type: ['直连设备', '网关', '网关子设备'], //产品类型
			search_device: '', //搜索租户下设备
			user_device_show: false, //租户下可分配设备列表
			product_focus: -1, //可分配设备列表下选中的产品
			load_user_device: false, //查找租户下设备时遮罩
		},
		user_list: [], //租户列表
		place_list: [], //场所列表
		device_list: [], // 设备列表
		product_list: [], // 根据产品分类的设备列表
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.req_user_list();
	},
	methods: {
		// 租户列表
		req_user_list() {
			this.request('get', user_list, this.token, (res) => {
				console.log('租户', res);
				if (typeof res.data.data == 'object' && res.data.data != null) {
					this.user_list = res.data.data;
					this.req_place_list(this.html.user_focus);
				}
			});
		},
		// 租户下场所列表
		req_place_list(index) {
			// 存储租户id
			this.user_id = this.user_list[index].tenantId;
			if (index == this.html.user_focus) {
				this.html.user_focus = -1;
			} else {
				this.request('post', `${place_list}/${this.user_id}/findAll`, this.token, (res) => {
					console.log('场所', res);
					if (res.data.data != null && typeof res.data.data == 'object' && res.data.data.length > 0) {
						this.html.user_focus = index;
						this.place_list = res.data.data;
						this.select_place(0);
					} else {
						this.html.user_focus = -1;
						this.$message.info('该租户下无场所');
					}
				});
			}
		},
		// 选中场所 查看场景或设备
		select_place(index) {
			if (this.place_list.length > 0) {
				this.place_id = this.place_list[index].id;
				this.html.place_focus = index;
				if (this.html.option_focus == 0) {
					this.req_device_list();
				}
			}
		},
		// 场所下设备列表
		req_device_list() {
			this.request('post', `${device_list}/${this.user_id}/${this.place_id}`, this.token, { condition: {}, pageNum: 1, pageSize: 99999 }, (res) => {
				console.log('设备', res);
				if (typeof res.data.data == 'object' && res.data.data != null) {
					this.device_list = res.data.data.data;
				}
			});
		},
		// 新增场所
		add_place(index, user_id) {
			this.$prompt('请输入场所名称', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
			}).then(({ val }) => {
				this.request('post', `${place_list}/${user_id}/add`, this.token, { placeName: val, placeType: 1 }, () => {
					if (index == this.user_focus) {
						this.refresh_place_list();
					} else {
						this.req_place_list(index);
					}
				});
			});
		},
		// 编辑场所
		edit_place(user_id, place_id) {
			this.$prompt('请输入场所名称', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
			}).then(({ val }) => {
				this.request('post', `${place_list}/${user_id}/update`, this.token, { id: place_id, placeName: val, placeType: 1 }, () => {
					this.refresh_place_list();
				});
			});
		},
		// 删除场所
		del_place(place_id) {
			this.$confirm('确定删除场所?', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'info',
				center: true,
			}).then(() => {
				this.request('delete', `${place_list}/${this.user_id}/${place_id}`, this.token, () => {
					this.req_place_list(this.html.user_focus);
				});
			});
		},
		// 获取场所列表并保持选中的场所
		refresh_place_list() {
			this.request('post', `${place_list}/${this.user_id}/findAll`, this.token, (res) => {
				console.log('场所', res);
				if (typeof res.data.data == 'object' && res.data.data != null) {
					this.place_list = res.data.data;
				}
			});
		},
		// 切换选项查看场所信息
		option_switch(index) {
			this.html.option_focus = index;
			if (index == 0) {
				this.req_device_list();
			}
		},
		// 获取租户下所有可分配设备
		req_user_device(input) {
			if (typeof this.user_id == 'undefined') {
				this.$message.info('请选择租户');
				return;
			}
			if (this.html.user_focus == -1) {
				let t;
				for (let i = 0; i < this.user_list.length; i++) {
					if (this.user_id == this.user_list[i].tenantId) {
						t = i;
						break;
					}
				}
				this.html.user_focus = t;
			}
			this.html.load_user_device = true;
			this.product_list = [];
			let req = { condition: {}, pageNum: 1, pageSize: 9999 };
			if (typeof input == 'string') {
				req.keyword = input;
			} else {
				this.html.search_device = '';
			}
			this.request('post', `${place_list}/${this.user_id}/findAllDevice`, this.token, req, (res) => {
				console.log('可分配设备', res);
				if (typeof res.data.data.data == 'object' && res.data.data.data != null) {
					if (res.data.data.data.length == 0) {
						return;
					}
					let t = res.data.data.data;
					let find = false;
					for (let i = 0; i < t.length; i++) {
						if (i == 0 && t[i].statusValue != 0) {
							let t2 = {
								name: t[i].productName,
								devices: [t[i]],
							};
							// 添加一个选中属性
							if (t[i].placeIds != null) {
								t2.devices[0].check = t[i].placeIds.indexOf(this.place_id) == -1 ? false : true;
							}
							this.product_list.push(t2);
						} else {
							for (let j = 0; j < this.product_list.length; j++) {
								if (t[i].productName == this.product_list[j].name && t[i].statusValue != 0) {
									if (t[i].placeIds != null) {
										t[i].check = t[i].placeIds.indexOf(this.place_id) == -1 ? false : true;
									}
									this.product_list[j].devices.push(t[i]);
									find = true;
									break;
								} else {
									find = false;
								}
							}
							if (!find && t[i].statusValue != 0) {
								let t2 = {
									name: t[i].productName,
									devices: [t[i]],
								};
								if (t[i].placeIds != null) {
									t2.devices[0].check = t[i].placeIds.indexOf(this.place_id) == -1 ? false : true;
								}
								this.product_list.push(t2);
							}
						}
					}
					this.html.user_device_show = true;
				} else {
					if (typeof input != 'string') {
						this.$message.info('租户下无可分配设备');
					}
				}
				this.html.load_user_device = false;
			});
		},
		// 添加或删除场所中设备
		edit_place_device(device) {
			if (device.check) {
				this.request('put', `${place_del_device}/${this.user_id}/${this.place_id}`, this.token, [device.id], () => {
					this.req_device_list();
					device.check = false;
				});
			} else {
				this.request('put', `${place_add_device}/${this.user_id}/${this.place_id}`, this.token, [device.id], () => {
					this.req_device_list();
					device.check = true;
				});
			}
		},
		// 点击页面判断并关闭所有弹窗
		close_message_box(e) {
			if (this.html.user_device_show && e.target.id != 'user_device') {
				let dom = document.querySelector('.user_device_layout');
				let p = dom.getBoundingClientRect();
				if (e.clientX < p.left || e.clientX > p.right || e.clientY < p.top || e.clientY > p.bottom) {
					this.html.user_device_show = false;
				}
			}
		},
		// 拖拽设备
		drag_device(device) {
			this.device_id = device.id;
		},
		// 拖拽放开时清除设备id等
		drop(e) {
			if (e.target.id != 'del_area') {
				this.device_id = '';
			}
		},
		// 拖拽删除场所设备
		del_device() {
			if (this.device_id) {
				this.$confirm('确定删除设备?', '提示', {
					confirmButtonText: '确定',
					cancelButtonText: '取消',
					type: 'info',
					center: true,
				}).then(() => {
					this.request('put', `${place_del_device}/${this.user_id}/${this.place_id}`, this.token, [this.device_id], () => {
						this.req_device_list();
						this.device_id = '';
					});
				});
			}
		},
		// 可分配设备产品点击
		product_click(index) {
			this.html.product_focus = index == this.html.product_focus ? -1 : index;
		},
	},
});
