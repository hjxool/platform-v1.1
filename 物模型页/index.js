let url = 'http://192.168.30.200:9201/';
let protocol_list = `${url}api-device/protocol/list`;
let protocol_view = `${url}api-device/protocol/view/`;
let protocol_newVersion = `${url}api-device/protocol/newVersion`;
let protocol_properties = `${url}api-device/protocol/properties`;
let protocol_property = `${url}api-device/protocol/property`;
let protocol_event = `${url}api-device/protocol/event`;
let protocol_service = `${url}api-device/protocol/service`;
let protocol_publish = `${url}api-device/protocol/publish`;
let protocol_units = `${url}api-device/protocol/units`;

new Vue({
	el: '#index',
	mixins: [common_functions],
	data() {
		return {
			id: '',
			token: '',
			static_params: {
				setting_select: '0', //选择的设置类别
				form_show: false, //填写表单显示
				shadow: false, //遮盖显示
				shadow_second: false, //二级遮盖
				// 用于新建的响应式空数据
				setting: {
					event: {
						identifier: '',
						name: '',
						dataType: '',
						outputData: '',
					},
					property: {
						identifier: '',
						name: '',
						dataType: '',
						min: '',
						max: '',
						step: '',
						unit: '',
						textLength: '',
						size: '',
						itemType: '',
					},
					server: {
						identifier: '',
						name: '',
						dataType: '',
						inputData: '',
						outputData: '',
					},
				},
				// 数据类型种类
				type_options: [
					{ value: 'int', name: 'int' },
					{ value: 'float', name: 'float' },
					{ value: 'double', name: 'double' },
					{ value: 'text', name: 'text' },
					{ value: 'date', name: 'date' },
					{ value: 'struct', name: 'struct', disabled: true },
					{ value: 'array', name: 'array', disabled: true },
				],
				// 数组元素类型
				array_type_options: [
					{ value: 'int', name: 'int' },
					{ value: 'float', name: 'float' },
					{ value: 'double', name: 'double' },
					{ value: 'text', name: 'text' },
					{ value: 'struct', name: 'struct' },
				],
				// 事件类型
				event_type_options: [
					{ value: 'info', name: '信息' },
					{ value: 'alert', name: '告警' },
					{ value: 'error', name: '故障' },
				],
				// 服务类型
				server_type_options: [
					{ value: 'async', name: '异步调用' },
					{ value: 'sync', name: '同步调用' },
				],
				// 单位种类
				unit_options: [],
				// unit_loading: false, //下拉框点击时加载获取数据
				add_edit: '', //新建和编辑取值方式不同
				add_edit_json: '', //新建和编辑子属性
				add_child: false, //是否点了子属性
				// 表单验证规则
				form_rules: {
					name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
					identifier: [{ required: true, message: '请输入标识', trigger: 'blur' }],
					dataType: [{ required: true, message: '请选择数据类型', trigger: 'blur' }],
					itemType: [{ required: true, message: '请选择元素类型', trigger: 'blur' }],
					size: [
						{ required: true, message: '请输入数组长度', trigger: 'blur' },
						{ pattern: /^\d+$/, message: '只能输入大于0的整数', trigger: 'blur' },
					],
					textLength: [{ required: true, message: '请输入数据长度', trigger: 'blur' }],
					struct_array: [{ required: true, message: '请创建对象', trigger: 'blur' }],
				},
				tabs_selected: '', //标签页选中
				first_load: true, //第一次加载时隐藏卡片 不然会报错
				// 自定义验证 提示框显示
				rules: {
					textLength: {
						message: '',
						show: false,
					},
					size: {
						message: '',
						show: false,
					},
					struct: {
						show: false,
					},
				},
			},
			//历史版本列表
			history_list: [],
			history_selected: '', //记录选择的是历史版本中的哪一个
			//物模型属性等列表——表格用
			protocol_list: [],
			// protocol_tree: [],
			//修改协议时的单行数据
			single_setting: {
				type: '', //功能类型
				name: '', //公共 显示名
				identifier: '', //公共 标识
				dataType: '', //公共 数据类型/事件类型/调用方式
				parent_index: '', //公共 层级索引
				min: '', //属性 小
				max: '', //属性 大
				step: '', //属性 步长
				unit: '', //属性 单位
				size: '', //属性 数组大小
				itemType: '', //属性 数组元素类型
				textLength: '', //属性 text类型
				outputData: '', //事件/服务 属性数组
				inputData: '', //服务 属性数组
			},
			// 树控件规则 因为不用默认的格式去取label
			// 而是自己封的行内容，因此只需要定child
			tree_props: {
				children: 'child',
			},
			// 显示用子参数数组
			struct_array: [],
			// 二级弹窗模板
			add_child_template: {
				identifier: '',
				name: '',
				dataType: '',
				min: '',
				max: '',
				step: '',
				unit: '',
				textLength: '',
			},
		};
	},
	mounted() {
		if (!location.search) {
			this.id = sessionStorage.id;
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		this.static_params.tabs_selected = '0';
		this.res_history_model(this.static_params.tabs_selected);
		this.get_unit();
		this.content = [];
		this.test();
	},
	methods: {
		test() {
			this.request('get', `${protocol_view}1538794699296227328`, this.token, (res) => {
				console.log(res);
				res.data.data.properties.forEach((e) => {
					let t = {
						identifier: e.identifier,
						attributes: {},
					};
					this.test2(e, t.attributes);
					this.content.push(t);
				});
				// res.data.data.services
			});
		},
		test2(obj, target) {
			switch (obj.dataType.type) {
				case 'struct':
					target[obj.identifier] = {};
					obj.dataType.properties.forEach((e) => {
						this.test2(e, target[obj.identifier]);
					});
					break;
				case 'array':
					target[obj.identifier] = [];
					break;
				default:
					target[obj.identifier] = '';
					break;
			}
		},
		// 页面加载时历史版本
		res_history_model(index) {
			this.request('post', protocol_list, this.token, { condition: this.id, pageNum: 1, pageSize: 999 }, (res) => {
				console.log('历史版本', res);
				this.history_list = res.data.data.data;
				this.model_select(index);
				// 加载完毕后再显示底部卡片
				this.static_params.first_load = false;
			});
		},
		// 选择查看版本
		model_select(index) {
			//#region
			// this.protocol_list = [];
			// this.protocol_tree = [];
			// // 保留当前点击的历史版本索引
			// this.history_selected = Number(index);
			// // 需要保存物模型ID
			// this.model_id = this.history_list[index].modelId;
			// // 事件集合
			// let event_index = 0;
			// this.history_list[index].events.forEach((element) => {
			// 	this.protocol_list.push(element);
			// 	let parent = {
			// 		id: element.eventId,
			// 		parent_index: event_index.toString(),
			// 		type: '事件',
			// 		data: {
			// 			name: element.name,
			// 			identifier: element.identifier,
			// 			dataType: element.type,
			// 			outputData: element.outputData,
			// 		},
			// 	};
			// 	this.protocol_tree.push(parent);
			// 	event_index++;
			// });
			// // 服务
			// let server_index = 0;
			// this.history_list[index].services.forEach((element) => {
			// 	this.protocol_list.push(element);
			// 	let parent = {
			// 		id: element.serviceId,
			// 		parent_index: server_index.toString(),
			// 		type: '服务',
			// 		data: {
			// 			name: element.name,
			// 			identifier: element.identifier,
			// 			dataType: element.method,
			// 			inputData: element.inputData,
			// 			outputData: element.outputData,
			// 		},
			// 	};
			// 	this.protocol_tree.push(parent);
			// 	server_index++;
			// });
			// // 属性
			// // 属性只能从顶层发因此要标记最外层父级
			// let parent_index = 0;
			// this.history_list[index].properties.forEach((element) => {
			// 	// 组成列表 方便查询
			// 	this.get_property(element);
			// 	// 构建树
			// 	let origin = {
			// 		id: element.propertyId,
			// 		parent_index: parent_index.toString(),
			// 		type: '属性',
			// 		child: [],
			// 		data: {
			// 			name: element.name,
			// 			identifier: element.identifier,
			// 			dataType: element.dataType.type,
			// 			min: element.dataType.type != 'struct' ? element.dataType.specs.min : '',
			// 			max: element.dataType.type != 'struct' ? element.dataType.specs.max : '',
			// 			step: element.dataType.type != 'struct' ? element.dataType.specs.step : '',
			// 			unit: element.dataType.type != 'struct' ? (element.dataType.specs.unitName == null ? '' : `${element.dataType.specs.unitName} / ${element.dataType.specs.unit}`) : '',
			// 			size: element.dataType.type === 'array' ? element.dataType.specs.size : '',
			// 		},
			// 	};
			// 	this.property_tree(element, origin.child, parent_index);
			// 	this.protocol_tree.push(origin);
			// 	parent_index++;
			// });
			//#endregion

			// 构造表格数据 只展示第一层
			this.protocol_list = [];
			this.history_selected = Number(index);
			this.model_id = this.history_list[index].modelId;
			// 不需要记录id等不展示的属性，只需要能点编辑时找到在数组中位置
			let event_index = 0;
			this.history_list[index].events.forEach((e) => {
				let table = {
					parent_index: event_index,
					type: '事件',
					name: e.name,
					identifier: e.identifier,
					dataType: e.type,
					data: {
						outputData: e.outputData == null ? [] : e.outputData,
					},
				};
				this.protocol_list.push(table);
				event_index++;
			});
			let server_index = 0;
			this.history_list[index].services.forEach((e) => {
				let table = {
					parent_index: server_index,
					type: '服务',
					name: e.name,
					identifier: e.identifier,
					dataType: e.method,
					data: {
						inputData: e.inputData == null ? [] : e.inputData,
						outputData: e.outputData == null ? [] : e.outputData,
					},
				};
				this.protocol_list.push(table);
				server_index++;
			});
			let property_index = 0;
			this.history_list[index].properties.forEach((e) => {
				let table = {
					parent_index: property_index,
					type: '属性',
					name: e.name,
					identifier: e.identifier,
					dataType: e.dataType.type,
					data: {},
				};
				if (e.dataType.type == 'text') {
					table.data.textLength = e.dataType.specs.length;
				} else if (e.dataType.type == 'date') {
				} else if (e.dataType.type == 'struct') {
					// 这地方存的是源数据 在点编辑查看时要特殊处理 取值赋给展示数据
					table.data.struct_array = e.dataType.properties;
				} else if (e.dataType.type == 'array') {
					table.data.itemType = e.dataType.specs.item.type;
					table.data.size = e.dataType.specs.size;
					if (table.data.itemType == 'struct') {
						table.data.struct_array = e.dataType.specs.item.properties;
					}
				} else {
					table.data.min = e.dataType.specs.min;
					table.data.max = e.dataType.specs.max;
					table.data.step = e.dataType.specs.step;
					table.data.unit = e.dataType.specs.unitName == null ? '' : `${e.dataType.specs.unitName} / ${e.dataType.specs.unit}`;
				}
				this.protocol_list.push(table);
				property_index++;
			});
		},
		// 取出属性列表 便于查询ID
		get_property(obj) {
			this.protocol_list.push(obj);
			switch (obj.dataType.type) {
				case 'array':
					switch (obj.dataType.specs.item.type) {
						case 'struct':
							obj.dataType.specs.item.properties.forEach((e) => {
								this.get_property(e);
							});
							break;
					}
					break;
				case 'struct':
					obj.dataType.properties.forEach((e) => {
						this.get_property(e);
					});
					break;
			}
		},
		// 构建属性树
		property_tree(obj, target, parent_index) {
			if (obj.dataType.type == 'array' || obj.dataType.type == 'struct') {
				let properties;
				switch (obj.dataType.type) {
					case 'array':
						properties = obj.dataType.specs.item.properties;
						break;
					case 'struct':
						properties = obj.dataType.properties;
						break;
				}
				for (let index = 0; index < properties.length; index++) {
					let property = properties[index];
					let temp = {
						id: property.propertyId,
						parent_index: `${parent_index}-${index}`,
						type: '属性',
						child: [],
						data: {
							name: property.name,
							identifier: property.identifier,
							dataType: property.dataType.type,
							min: property.dataType.type != 'struct' ? property.dataType.specs.min : '',
							max: property.dataType.type != 'struct' ? property.dataType.specs.max : '',
							step: property.dataType.type != 'struct' ? property.dataType.specs.step : '',
							unit: property.dataType.type != 'struct' ? (property.dataType.specs.unitName == null ? '' : `${property.dataType.specs.unitName} / ${property.dataType.specs.unit}`) : '',
							size: property.dataType.type === 'array' ? property.dataType.specs.size : '',
						},
					};
					target.push(temp);
					// 找到child里的子节点 再往里遍历
					this.property_tree(property, target[index].child, temp.parent_index);
				}
			}
		},
		// 新建物模型
		new_ver_model() {
			this.$confirm('确认以当前所选物模型版本新建物模型？', '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'info',
				center: true,
			})
				.then(() => {
					this.request('post', protocol_newVersion, this.token, this.history_list[this.history_selected], () => {
						this.static_params.tabs_selected = '0';
						this.request('post', protocol_list, this.token, { condition: this.id, pageNum: 1, pageSize: 999 }, this.res_history_model(this.static_params.tabs_selected));
					});
				})
				.catch(() => {
					this.$message.info('已取消操作');
				});
		},
		// 编辑查看模型中单条数据
		edit_protocol(row_data) {
			// protocol_list中每一行数据
			console.log(row_data);
			this.static_params.add_edit = 'edit';
			// 不要将展示页面和真实数据直接关联 修改完返回模板数据修改真实数据
			for (let key in this.single_setting) {
				if (row_data[key] != undefined) {
					this.single_setting[key] = row_data[key];
				} else if (row_data.data[key] != undefined) {
					this.single_setting[key] = row_data.data[key];
				}
			}
			this.struct_array = [];
			// 结构体数组单独替换显示
			if (row_data.dataType == 'struct' || row_data.data.itemType == 'struct') {
				let index = 0;
				row_data.data.struct_array.forEach((e) => {
					let temp = {
						id: e.propertyId,
						index: index,
						identifier: e.identifier,
						name: e.name,
						dataType: e.dataType.type,
					};
					switch (e.dataType.type) {
						case 'text':
							temp.textLength = e.dataType.specs.length;
							break;
						case 'date':
							break;
						default:
							temp.min = e.dataType.specs.min;
							temp.max = e.dataType.specs.max;
							temp.step = e.dataType.specs.step;
							temp.unit = e.dataType.specs.unitName != null ? `${e.dataType.specs.unitName} / ${e.dataType.specs.unit}` : '';
							break;
					}
					this.struct_array.push(temp);
					index++;
				});
			}
			this.static_params.form_show = true;
			this.shadow_target = 'form_show';
			this.static_params.shadow = true;
		},
		// 删除属性等协议
		delete_protocol(row_data) {
			console.log(row_data);
			this.$confirm(`此操作将删除当前${row_data.type}`, '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'info',
				center: true,
			})
				.then(() => {
					switch (row_data.type) {
						case '属性':
							//#region
							// 根据层级索引删除数组中的元素
							// let count = 0;
							// let cursor = row_data.parent_index.split('-');
							// let delete_index = (obj) => {
							// 	switch (obj.dataType.type) {
							// 		case 'struct':
							// 			count++;
							// 			// 当已经到最下一级了即用当前数组删除下一级
							// 			if (cursor[count + 1] != undefined) {
							// 				// 下一级还有时才取下一级的值
							// 				delete_index(obj.dataType.properties[cursor[count]]);
							// 			} else {
							// 				obj.dataType.properties.splice(cursor[count], 1);
							// 			}
							// 			break;
							// 		case 'array':
							// 			count++;
							// 			if (cursor[count + 1] != undefined) {
							// 				delete_index(obj.dataType.specs.item.properties[cursor[count]]);
							// 			} else {
							// 				obj.dataType.specs.item.properties.splice(cursor[count], 1);
							// 			}
							// 			break;
							// 		default:
							// 			this.request('delete', `${protocol_property}/${obj.propertyId}`, this.token, () => {
							// 				this.res_history_model(this.history_selected);
							// 			});
							// 			return;
							// 	}
							// };
							// delete_index(this.history_list[this.history_selected].properties[cursor[count]]);
							// // count对于delete_index是全局变量，改变以后count的值在当前作用域内已经被永久改变了
							// let temp = this.history_list[this.history_selected].properties[cursor[0]];
							// this.request('put', protocol_property, this.token, temp, () => {
							// 	this.res_history_model(this.history_selected);
							// });
							//#endregion
							let property_id = this.history_list[this.history_selected].properties[row_data.parent_index].propertyId;
							this.request('delete', `${protocol_property}/${property_id}`, this.token, () => {
								this.static_params.tabs_selected = `${this.history_selected}`;
								this.res_history_model(this.static_params.tabs_selected);
							});
							break;
						case '事件':
							let event_id = this.history_list[this.history_selected].events[row_data.parent_index].eventId;
							this.request('delete', `${protocol_event}/${this.model_id}/${event_id}`, this.token, () => {
								this.static_params.tabs_selected = `${this.history_selected}`;
								this.res_history_model(this.static_params.tabs_selected);
							});
							break;
						case '服务':
							let server_id = this.history_list[this.history_selected].services[row_data.parent_index].serviceId;
							this.request('delete', `${protocol_service}/${this.model_id}/${server_id}`, this.token, () => {
								this.static_params.tabs_selected = `${this.history_selected}`;
								this.res_history_model(this.static_params.tabs_selected);
							});
							break;
					}
				})
				.catch(() => {
					this.$message.info('已取消操作');
				});
		},
		// 已发布后查看物模型
		check_protocol(row_data) {
			console.log(row_data);
			this.static_params.add_edit = 'check';
			for (let key in this.single_setting) {
				if (row_data[key] != undefined) {
					this.single_setting[key] = row_data[key];
				} else if (row_data.data[key] != undefined) {
					this.single_setting[key] = row_data.data[key];
				}
			}
			this.struct_array = [];
			if (row_data.dataType == 'struct' || row_data.data.itemType == 'struct') {
				// 查看的时候不需要索引 因为不会操作数据
				row_data.data.struct_array.forEach((e) => {
					let temp = {
						id: e.propertyId,
						identifier: e.identifier,
						name: e.name,
						dataType: e.dataType.type,
					};
					switch (e.dataType.type) {
						case 'text':
							temp.textLength = e.dataType.specs.length;
							break;
						case 'date':
							break;
						default:
							temp.min = e.dataType.specs.min;
							temp.max = e.dataType.specs.max;
							temp.step = e.dataType.specs.step;
							temp.unit = e.dataType.specs.unitName != null ? `${e.dataType.specs.unitName} / ${e.dataType.specs.unit}` : '';
							break;
					}
					this.struct_array.push(temp);
				});
			}
			this.static_params.form_show = true;
			this.shadow_target = 'form_show';
			this.static_params.shadow = true;
		},
		// 编辑子属性
		edit_child_json(row_data) {
			console.log(row_data);
			this.static_params.add_edit_json = 'edit';
			for (let key in row_data) {
				// 里面多了一个不需要展示的索引属性以及id
				this.add_child_template[key] = row_data[key];
			}
			this.static_params.add_child = true;
			this.shadow_second_target = 'add_child';
			this.static_params.shadow_second = true;
		},
		// 删除子属性
		del_child_json(row_data) {
			this.struct_array.splice(row_data.index, 1);
		},
		// 发布后查看子属性
		check_child_json(row_data) {
			// 父级已经是check没必要再设置
			for (let key in row_data) {
				this.add_child_template[key] = row_data[key];
			}
			this.static_params.add_child = true;
			this.shadow_second_target = 'add_child';
			this.static_params.shadow_second = true;
		},
		// 添加标准功能按钮
		add_protocol() {
			this.static_params.add_edit = 'add';
			// 每次新建都清空对象中的数据
			this.clean_object(this.static_params.setting);
			this.struct_array = [];
			this.static_params.form_show = true;
			this.shadow_target = 'form_show';
			this.static_params.shadow = true;
		},
		// 隐藏遮盖
		hidden_shadow() {
			this.static_params.shadow = false;
			this.static_params[this.shadow_target] = false;
		},
		hidden_shadow_second() {
			this.static_params.shadow_second = false;
			this.static_params[this.shadow_second_target] = false;
		},
		// 迭代清空对象
		clean_object(obj) {
			if (obj.constructor === Array && typeof obj[0] != 'object') {
				obj = [];
			} else if (obj.constructor === Array && typeof obj[0] === 'object') {
				for (let item of obj) {
					this.clean_object(item);
				}
			} else if (obj.constructor === Object) {
				for (let key in obj) {
					if (typeof obj[key] != 'object') {
						obj[key] = '';
					} else {
						this.clean_object(obj[key]);
					}
				}
			}
		},
		// 提交表单
		submit_form() {
			if (this.static_params.add_edit === 'add') {
				// 如果是新建 则遍历查找选项下是否有填写的值 有则一起发送
				let flag = [];
				for (let key in this.static_params.setting.property) {
					if (this.static_params.setting.property[key].length > 0) {
						flag.push('属性');
						break;
					}
				}
				for (let key in this.static_params.setting.event) {
					if (this.static_params.setting.event[key].length > 0) {
						flag.push('事件');
						break;
					}
				}
				for (let key in this.static_params.setting.server) {
					if (this.static_params.setting.server[key].length > 0) {
						flag.push('服务');
						break;
					}
				}
				// 标记 只在最后一个请求发送完再刷新列表 找flag中最后一个元素是多少
				let last_res = flag[flag.length - 1];
				flag.forEach((e) => {
					if (e == '属性') {
						let property = this.static_params.setting.property;
						let dataType = {
							type: property.dataType,
						};
						switch (property.dataType) {
							case 'text':
								dataType.specs = { length: property.textLength };
								break;
							case 'date':
								break;
							case 'struct':
								dataType.properties = [];
								if (this.form_verify(this.struct_array, 'struct')) {
									for (let i of this.struct_array) {
										let temp = this.format_params(i);
										dataType.properties.push(temp);
									}
								} else {
									return;
								}
								break;
							case 'array':
								dataType.specs = {
									size: property.size,
									item: { type: property.itemType },
								};
								if (property.itemType == 'struct') {
									dataType.specs.item.properties = [];
									if (this.form_verify(this.struct_array, 'struct')) {
										for (let i of this.struct_array) {
											let temp = this.format_params(i);
											dataType.specs.item.properties.push(temp);
										}
									} else {
										return;
									}
								}
								break;
							default:
								dataType.specs = {
									min: property.min == '' ? null : property.min,
									max: property.max == '' ? null : property.max,
									step: property.step == '' ? null : property.step,
									unitName: property.unit.split(' / ')[0] == '' ? null : property.unit.split(' / ')[0],
									unit: property.unit.split(' / ')[0] == '' ? null : property.unit.split(' / ')[1],
								};
								break;
						}
						let temp = {
							modelId: this.model_id,
							properties: [
								{
									identifier: property.identifier,
									name: property.name,
									dataType: dataType,
								},
							],
						};
						this.request('post', protocol_properties, this.token, temp, () => {
							if (last_res == '属性') {
								this.static_params.tabs_selected = `${this.history_selected}`;
								this.res_history_model(this.static_params.tabs_selected);
								this.hidden_shadow();
							}
						});
					}
					if (e == '事件') {
						let event = this.static_params.setting.event;
						let temp = {
							modelId: this.model_id,
							events: [
								{
									identifier: event.identifier,
									name: event.name,
									type: event.dataType,
									outputData: event.outputData,
								},
							],
						};
						this.request('post', protocol_event, this.token, temp, () => {
							if (last_res == '事件') {
								this.static_params.tabs_selected = `${this.history_selected}`;
								this.res_history_model(this.static_params.tabs_selected);
								this.hidden_shadow();
							}
						});
					}
					if (e == '服务') {
						let server = this.static_params.setting.server;
						let temp = {
							modelId: this.model_id,
							services: [
								{
									identifier: server.identifier,
									name: server.name,
									method: server.dataType,
									inputData: server.inputData,
									outputData: server.outputData,
								},
							],
						};
						this.request('post', protocol_service, this.token, temp, () => {
							if (last_res == '服务') {
								this.static_params.tabs_selected = `${this.history_selected}`;
								this.res_history_model(this.static_params.tabs_selected);
								this.hidden_shadow();
							}
						});
					}
				});
			} else {
				//#region
				// 属性独有 添加节点时是查找往数组里加 编辑时是查找修改
				// if (this.static_params.add_child) {
				// 	// 定位到父级 protocol_list中已经遍历取出了所有层级的属性
				// 	this.protocol_list.forEach((e) => {
				// 		if (e.propertyId === this.single_setting.id) {
				// 			let temp = {
				// 				identifier: this.single_setting.identifier,
				// 				name: this.single_setting.name,
				// 				dataType: {
				// 					type: this.single_setting.dataType,
				// 					specs:
				// 						this.single_setting.dataType != 'struct' && this.single_setting.dataType != 'date'
				// 							? {
				// 									min: this.single_setting.min,
				// 									max: this.single_setting.max,
				// 									step: this.single_setting.step,
				// 									unitName: this.single_setting.unit.split(' / ')[0],
				// 									unit: this.single_setting.unit.split(' / ')[1],
				// 									size: this.single_setting.size,
				// 							  }
				// 							: {},
				// 				},
				// 			};
				// 			switch (this.parent_type_select) {
				// 				case 'struct':
				// 					e.dataType.properties.push(temp);
				// 					break;
				// 				case 'array':
				// 					e.dataType.specs.item.properties.push(temp);
				// 					break;
				// 			}
				// 		}
				// 	});
				// }else{
				//   let temp = {};
				// switch (this.single_setting.type) {
				// 	case '属性':
				// 		this.protocol_list.forEach((e) => {
				// 			if (e.propertyId === this.single_setting.id) {
				// 				e.identifier = this.single_setting.identifier;
				// 				e.name = this.single_setting.name;
				// 				e.dataType.type = this.single_setting.dataType;
				// 				if (this.single_setting.dataType != 'struct' && this.single_setting.dataType != 'date') {
				// 					e.dataType.specs.min = this.single_setting.min;
				// 					e.dataType.specs.max = this.single_setting.max;
				// 					e.dataType.specs.step = this.single_setting.step;
				// 					e.dataType.specs.unitName = this.single_setting.unit.split(' / ')[0];
				// 					e.dataType.specs.unit = this.single_setting.unit.split(' / ')[1];
				// 					e.dataType.specs.size = this.single_setting.size;
				// 				} else {
				// 					e.specs = {};
				// 				}
				// 			}
				// 		});
				// 		// 修改属性时，要找到对应的最外层属性，将以整个对象发过去，而不是只发里层的属性对象
				// 		temp = this.history_list[this.history_selected].properties[this.single_setting.parent_index.split('-')[0]];
				// 		this.request('put', protocol_property, this.token, temp, () => {
				// 			this.res_history_model(this.history_selected);
				// 			this.hidden_shadow();
				// 		});
				// 		break;
				// 	case '事件':
				// 		this.protocol_list.forEach((e) => {
				// 			if (e.eventId === this.single_setting.id) {
				// 				e.identifier = this.single_setting.identifier;
				// 				e.name = this.single_setting.name;
				// 				e.type = this.single_setting.dataType;
				// 				e.outputData = this.single_setting.outputData;
				// 			}
				// 		});
				// 		temp = this.history_list[this.history_selected].events[this.single_setting.parent_index];
				// 		this.request('put', `${protocol_event}/${this.model_id}`, this.token, temp, () => {
				// 			this.res_history_model(this.history_selected);
				// 			this.hidden_shadow();
				// 		});
				// 		break;
				// 	case '服务':
				// 		this.protocol_list.forEach((e) => {
				// 			if (e.serviceId === this.single_setting.id) {
				// 				e.identifier = this.single_setting.identifier;
				// 				e.name = this.single_setting.name;
				// 				e.type = this.single_setting.dataType;
				// 				e.inputData = this.single_setting.inputData;
				// 				e.outputData = this.single_setting.outputData;
				// 			}
				// 		});
				// 		temp = this.history_list[this.history_selected].services[this.single_setting.parent_index];
				// 		this.request('put', `${protocol_service}/${this.model_id}`, this.token, temp, () => {
				// 			this.res_history_model(this.history_selected);
				// 			this.hidden_shadow();
				// 		});
				// 		break;
				// }
				// }
				//#endregion
				console.log(this.struct_array);
				let temp;
				switch (this.single_setting.type) {
					case '属性':
						temp = this.history_list[this.history_selected].properties[this.single_setting.parent_index];
						temp.name = this.single_setting.name;
						temp.identifier = this.single_setting.identifier;
						temp.dataType.type = this.single_setting.dataType;
						switch (this.single_setting.dataType) {
							case 'text':
								// 如果原先数据是date等 specs就是null不能直接添加属性 而要用新对象直接覆盖
								// 而且本来specs里就没有什么固定内容
								temp.dataType.specs = { length: this.single_setting.textLength };
								break;
							case 'date':
								break;
							case 'struct':
								if (temp.dataType.specs != null) {
									if (temp.dataType.specs.item != null) {
										temp.dataType.specs.item.properties = [];
									}
								}
								temp.dataType.properties = [];
								if (this.form_verify(this.struct_array, 'struct')) {
									for (let i of this.struct_array) {
										let element = this.format_params(i);
										temp.dataType.properties.push(element);
									}
								} else {
									return;
								}
								break;
							case 'array':
								temp.dataType.properties = [];
								temp.dataType.specs = {
									size: this.single_setting.size,
									item: { type: this.single_setting.itemType },
								};
								if (this.single_setting.itemType == 'struct') {
									temp.dataType.specs.item.properties = [];
									if (this.form_verify(this.struct_array, 'struct')) {
										for (let i of this.struct_array) {
											let element = this.format_params(i);
											temp.dataType.specs.item.properties.push(element);
										}
									} else {
										return;
									}
								}
								break;
							default:
								temp.dataType.specs = {
									min: this.single_setting.min == '' ? null : this.single_setting.min,
									max: this.single_setting.max == '' ? null : this.single_setting.max,
									step: this.single_setting.step == '' ? null : this.single_setting.step,
									unitName: this.single_setting.unit.split(' / ')[0] == '' ? null : this.single_setting.unit.split(' / ')[0],
									unit: this.single_setting.unit.split(' / ')[0] == '' ? null : this.single_setting.unit.split(' / ')[1],
								};
								break;
						}
						this.request('put', protocol_property, this.token, temp, () => {
							this.static_params.tabs_selected = `${this.history_selected}`;
							this.res_history_model(this.static_params.tabs_selected);
							this.hidden_shadow();
						});
						break;
					case '事件':
						temp = this.history_list[this.history_selected].events[this.single_setting.parent_index];
						temp.identifier = this.single_setting.identifier;
						temp.name = this.single_setting.name;
						temp.type = this.single_setting.dataType;
						temp.outputData = this.single_setting.outputData;
						this.request('put', `${protocol_event}/${this.model_id}`, this.token, temp, () => {
							this.static_params.tabs_selected = `${this.history_selected}`;
							this.res_history_model(this.static_params.tabs_selected);
							this.hidden_shadow();
						});
						break;
					case '服务':
						temp = this.history_list[this.history_selected].services[this.single_setting.parent_index];
						temp.identifier = this.single_setting.identifier;
						temp.name = this.single_setting.name;
						temp.type = this.single_setting.dataType;
						temp.inputData = this.single_setting.inputData;
						temp.outputData = this.single_setting.outputData;
						this.request('put', `${protocol_service}/${this.model_id}`, this.token, temp, () => {
							this.static_params.tabs_selected = `${this.history_selected}`;
							this.res_history_model(this.static_params.tabs_selected);
							this.hidden_shadow();
						});
						break;
				}
			}
		},
		// 根据传入的数据构造可发送的参数格式
		format_params(obj) {
			let dataType = {
				type: obj.dataType,
			};
			switch (obj.dataType) {
				case 'text':
					dataType.specs = { length: obj.textLength };
					break;
				case 'date':
					break;
				default:
					dataType.specs = {
						min: obj.min,
						max: obj.max,
						step: obj.step,
						unitName: obj.unit.split(' / ')[0],
						unit: obj.unit.split(' / ')[1],
					};
					break;
			}
			let temp = {
				identifier: obj.identifier,
				name: obj.name,
				dataType: dataType,
			};
			if (obj.id != null) {
				temp.propertyId = obj.id;
			}
			return temp;
		},
		// 增加子属性
		add_child_property() {
			//#region
			// if (this.single_setting.dataType == 'struct' || this.single_setting.dataType == 'array') {
			// 	let dom;
			// 	this.protocol_list.forEach((e) => {
			// 		if (e.propertyId === this.single_setting.id) {
			// 			dom = e;
			// 		}
			// 	});
			// 	// 添加子属性时看看是否超出数组大小限制
			// 	if (dom.dataType.specs.item != null) {
			// 		if (this.single_setting.dataType == 'array' && dom.dataType.specs.item.properties.length + 1 > dom.dataType.specs.size) {
			// 			this.$alert('数组长度超限', '提示', { confirmButtonText: '确定' });
			// 			return;
			// 		}
			// 	}
			// 	// 记录上一级所选的数据类型 因为不同类型添加方式不同
			// 	this.parent_type_select = this.single_setting.dataType;
			// 	// 标记是添加子属性还是保存当前属性
			// 	this.static_params.add_child = true;
			// 	// 创建子属性时发送保存请求
			// 	this.protocol_list.forEach((e) => {
			// 		if (e.propertyId === this.single_setting.id) {
			// 			e.identifier = this.single_setting.identifier;
			// 			e.name = this.single_setting.name;
			// 			e.dataType.type = this.single_setting.dataType;
			// 		}
			// 	});
			// 	let temp = this.history_list[this.history_selected].properties[this.single_setting.parent_index.split('-')[0]];
			// 	this.request('put', protocol_property, this.token, temp);
			// 	// 创建空模板 并保留上一层id
			// 	for (let key in this.single_setting) {
			// 		if (key != 'id' && key != 'parent_index' && key != 'type') {
			// 			this.single_setting[key] = '';
			// 		}
			// 	}
			// }
			//#endregion

			this.static_params.add_edit_json = 'add';
			this.clean_object(this.add_child_template);
			this.static_params.add_child = true;
			this.shadow_second_target = 'add_child';
			this.static_params.shadow_second = true;
		},
		// 切换表单的model配置项
		ui_model_switch() {
			if (this.static_params.add_edit == 'add') {
				switch (this.static_params.setting_select) {
					case '0':
						return this.static_params.setting.property;
					case '1':
						return this.static_params.setting.event;
					case '2':
						return this.static_params.setting.server;
				}
			} else if (this.static_params.add_edit == 'edit') {
				return this.single_setting;
			}
		},
		// 发布物模型
		publish_model() {
			this.request('get', `${protocol_publish}/${this.model_id}`, this.token, () => {
				this.static_params.tabs_selected = `${this.history_selected}`;
				this.res_history_model(this.static_params.tabs_selected);
			});
		},
		// 子参数添加到struct_array
		submit_struct_array() {
			// 因为数据都是一层，且有的有有的没有，故直接用新对象替换
			let temp = {
				identifier: this.add_child_template.identifier,
				name: this.add_child_template.name,
				dataType: this.add_child_template.dataType,
			};
			switch (this.add_child_template.dataType) {
				case 'text':
					temp.textLength = this.add_child_template.textLength;
					break;
				case 'date':
					break;
				default:
					temp.min = this.add_child_template.min == '' ? null : this.add_child_template.min;
					temp.max = this.add_child_template.max = '' ? null : this.add_child_template.max;
					temp.step = this.add_child_template.step = '' ? null : this.add_child_template.step;
					temp.unit = this.add_child_template.unit = '' ? null : this.add_child_template.unit;
					break;
			}
			if (this.static_params.add_edit_json == 'add') {
				temp.index = this.struct_array.length;
				this.struct_array.push(temp);
			} else if (this.static_params.add_edit_json == 'edit') {
				temp.id = this.add_child_template.id;
				temp.index = this.add_child_template.index;
				this.struct_array[this.add_child_template.index] = temp;
			}
			this.static_params.rules.struct.show = false;
			this.hidden_shadow_second();
		},
		// 表单手动验证
		form_verify(value, flag) {
			let reg;
			switch (flag) {
				case 'textLength':
					reg = /^\d+$/;
					if (!reg.test(value)) {
						this.static_params.rules.textLength.show = true;
						this.static_params.rules.textLength.message = '数据长度不能为空';
						this.$refs.textLength.$refs.input.style.borderColor = 'red';
						this.$refs.textLength.$refs.input.placeholder = '';
					} else {
						this.static_params.rules.textLength.show = false;
						this.$refs.textLength.$refs.input.style.borderColor = '';
					}
					break;
				case 'size':
					reg = /^\d+$/;
					if (!reg.test(value)) {
						this.static_params.rules.size.show = true;
						this.static_params.rules.size.message = '元素个数不能为空';
						this.$refs.size.$refs.input.style.borderColor = 'red';
						this.$refs.size.$refs.input.placeholder = '';
					} else {
						let reg = /^\d{1,3}$/;
						if (!reg.test(value)) {
							this.static_params.rules.size.message = '只能输入3位以内的数字';
						} else {
							this.static_params.rules.size.show = false;
							this.$refs.size.$refs.input.style.borderColor = '';
						}
					}
					break;
				case 'struct':
					if (value.length > 0) {
						return true;
					} else {
						this.static_params.rules.struct.show = true;
						return false;
					}
					break;
			}
		},
		// 点击下拉框获取远程数据
		get_unit() {
			this.request('get', protocol_units, this.token, (res) => {
				for (let [key, array] of Object.entries(res.data.data)) {
					for (let item of array) {
						let unit = { value: `${item.name} / ${item.symbol}` };
						this.static_params.unit_options.push(unit);
					}
				}
			});
		},
	},
});
