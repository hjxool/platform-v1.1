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

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data() {
		return {
			id: '',
			token: '',
			static_params: {
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
				add_edit: '', //新建和编辑取值方式不同
				first_load: true, //第一次加载时隐藏卡片 不然会报错
			},
			//历史版本列表
			history_list: [],
			history_selected: '', //记录选择的是历史版本中的哪一个
			//物模型属性等列表——表格用
			protocol_list: [],
			//修改协议时的单行数据
			single_setting: {
				id: '', //公共 id
				type: '', //功能类型
				name: '', //公共 显示名
				identifier: '', //公共 标识
				dataType: '', //公共 数据类型/事件类型/调用方式
				min: '', //属性 小
				max: '', //属性 大
				step: '', //属性 步长
				unit: '', //属性 单位
				size: '', //属性 数组大小
				itemType: '', //属性 数组元素类型
				textLength: '', //属性 text类型
				outputData: '', //事件/服务 属性数组
				inputData: '', //服务 属性数组
				// struct_array: [], //属性 子属性数组
			},
			// 表单数组
			form_list: [],
			// 计算点下编辑后经过了几次新增
			child_count_list: [],
			// 自定义表单验证
			rules: {
				name: { show: false, message: '' },
				identifier: { show: false, message: '' },
				textLength: { show: false, message: '' },
				size: { show: false, message: '' },
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
		this.res_history_model(0);
		this.get_unit();
		// this.content = [];
		// this.test();
	},
	methods: {
		test() {
			this.request('get', `${protocol_view}1538794699296227328`, this.token, (res) => {
				console.log(res);
				let t = {
					attributes: {},
				};
				res.data.data.properties.forEach((e) => {
					this.test2(e, t.attributes);
				});
				this.content.push(t);
				res.data.data.services.forEach((e) => {
					let t2 = {
						identifier: e.identifier,
						attributes: {},
					};
					e.inputData.forEach((e2) => {
						this.test2(e2, t2.attributes);
					});
					this.content.push(t2);
				});
				console.log(this.content);
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
					if (obj.dataType.specs.item.type == 'struct') {
						let t = {};
						obj.dataType.specs.item.properties.forEach((e) => {
							this.test2(e, t);
						});
						target[obj.identifier].push(t);
					}
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
				if (res.data.data.data != null) {
					this.history_list = res.data.data.data;
					this.model_select(index);
					// 加载完毕后再显示底部卡片
					this.static_params.first_load = false;
				}
			});
		},
		// 选择查看版本
		model_select(index) {
			// 构造表格数据 只展示第一层
			this.protocol_list = [];
			this.history_selected = index;
			this.model_id = this.history_list[index].modelId;
			// 不需要记录id等不展示的属性，只需要能点编辑时找到在数组中位置
			this.history_list[index].events.forEach((e) => {
				let table = {
					id: e.eventId,
					type: '事件',
					name: e.name,
					identifier: e.identifier,
					dataType_text: `事件类型：${e.type == 'info' ? '信息' : e.type == 'alert' ? '告警' : '故障'}`,
					dataType: e.type,
					outputData: e.outputData == null ? [] : e.outputData,
				};
				this.protocol_list.push(table);
			});
			this.history_list[index].services.forEach((e) => {
				let table = {
					id: e.serviceId,
					type: '服务',
					name: e.name,
					identifier: e.identifier,
					dataType_text: `调用方式：${e.method == 'async' ? '异步调用' : '同步调用'}`,
					dataType: e.method,
					inputData: e.inputData == null ? [] : e.inputData,
					outputData: e.outputData == null ? [] : e.outputData,
				};
				this.protocol_list.push(table);
			});
			this.history_list[index].properties.forEach((e) => {
				let table = {
					id: e.propertyId,
					type: '属性',
					name: e.name,
					identifier: e.identifier,
					dataType_text: `数据类型：${e.dataType.type}`,
					dataType: e.dataType.type,
				};
				if (e.dataType.type == 'text') {
					table.textLength = e.dataType.specs.length;
				} else if (e.dataType.type == 'date') {
				} else if (e.dataType.type == 'struct') {
					// 这地方存的是源数据 在点编辑查看时要特殊处理 取值赋给展示数据
					table.struct_array = e.dataType.properties;
				} else if (e.dataType.type == 'array') {
					table.itemType = e.dataType.specs.item.type;
					table.size = e.dataType.specs.size;
					if (table.itemType == 'struct') {
						table.struct_array = e.dataType.specs.item.properties;
					}
				} else {
					table.min = e.dataType.specs.min;
					table.max = e.dataType.specs.max;
					table.step = e.dataType.specs.step;
					table.unit = e.dataType.specs.unitName == null ? '' : `${e.dataType.specs.unitName} / ${e.dataType.specs.unit}`;
				}
				this.protocol_list.push(table);
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
			}).then(() => {
				this.request('post', protocol_newVersion, this.token, this.history_list[this.history_selected], () => {
					this.request('post', protocol_list, this.token, { condition: this.id, pageNum: 1, pageSize: 999 }, this.res_history_model(0));
				});
			});
		},
		// 编辑查看模型中单条数据
		edit_protocol(row_data) {
			// protocol_list中每一行数据
			console.log(row_data);
			this.static_params.add_edit = 'edit';
			let count = 0;
			this.child_count_list.push(count);
			// 不要将展示页面和真实数据直接关联 修改完返回模板数据修改真实数据
			let temp = {};
			for (let key in this.single_setting) {
				temp[key] = this.single_setting[key];
				if (row_data[key] != undefined) {
					temp[key] = row_data[key];
				}
			}
			// 因为数组是对象有索引 修改父级数组后，模板中数组指针也永远改变了，所以每一层看的都是同样的数组
			if (row_data.struct_array != undefined) {
				temp.struct_array = row_data.struct_array;
			}
			this.form_list.push(temp);
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
							this.history_list[this.history_selected].properties.forEach((e) => {
								if (e.propertyId == row_data.id) {
									this.request('delete', `${protocol_property}/${e.propertyId}`, this.token, () => {
										this.res_history_model(this.history_selected);
									});
								}
							});
							break;
						case '事件':
							this.history_list[this.history_selected].events.forEach((e) => {
								if (e.eventId == row_data.id) {
									this.request('delete', `${protocol_event}/${this.model_id}/${e.eventId}`, this.token, () => {
										this.res_history_model(this.history_selected);
									});
								}
							});
							break;
						case '服务':
							this.history_list[this.history_selected].services.forEach((e) => {
								if (e.serviceId == row_data.id) {
									this.request('delete', `${protocol_service}/${this.model_id}/${e.serviceId}`, this.token, () => {
										this.res_history_model(this.history_selected);
									});
								}
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
			let temp = {};
			for (let key in this.single_setting) {
				temp[key] = this.single_setting[key];
				if (row_data[key] != undefined) {
					temp[key] = row_data[key];
				}
			}
			if (row_data.struct_array != undefined) {
				temp.struct_array = row_data.struct_array;
			}
			this.form_list.push(temp);
		},
		// 编辑子属性
		edit_child_json(row_data) {
			// 跟表格编辑查看不同的地方在于，表格数据是提取出来的，而子属性列表里的是原始格式数据
			console.log(row_data);
			this.static_params.add_edit = 'edit';
			let count = 0;
			this.child_count_list.push(count);
			let temp = {};
			for (let key in this.single_setting) {
				temp[key] = this.single_setting[key];
			}
			temp.type = '属性';
			if (row_data.propertyId != undefined && row_data.propertyId != '') {
				temp.id = row_data.propertyId;
			}
			temp.identifier = row_data.identifier;
			temp.name = row_data.name;
			temp.dataType = row_data.dataType.type;
			switch (temp.dataType) {
				case 'text':
					temp.textLength = row_data.dataType.specs.length;
					break;
				case 'date':
					break;
				case 'struct':
					temp.struct_array = row_data.dataType.properties;
					break;
				case 'array':
					temp.itemType = row_data.dataType.specs.item.type;
					temp.size = row_data.dataType.specs.size;
					if (temp.itemType == 'struct') {
						temp.struct_array = row_data.dataType.specs.item.properties;
					}
					break;
				default:
					temp.min = row_data.dataType.specs.min;
					temp.max = row_data.dataType.specs.max;
					temp.step = row_data.dataType.specs.step;
					temp.unit = row_data.dataType.specs.unitName == null ? '' : `${row_data.dataType.specs.unitName} / ${row_data.dataType.specs.unit}`;
					break;
			}
			this.form_list.push(temp);
		},
		// 删除子属性
		del_child_json(parent, child_index) {
			parent.struct_array.splice(child_index, 1);
		},
		// 发布后查看子属性
		check_child_json(row_data) {
			// 父级已经是check没必要再设置
			for (let key in row_data) {
				this.add_child_template[key] = row_data[key];
			}
			let temp = {};
			for (let key in this.single_setting) {
				temp[key] = this.single_setting[key];
			}
			temp.type = '属性';
			temp.id = row_data.propertyId;
			temp.identifier = row_data.identifier;
			temp.name = row_data.name;
			temp.dataType = row_data.dataType.type;
			switch (temp.dataType) {
				case 'text':
					temp.textLength = row_data.dataType.specs.length;
					break;
				case 'date':
					break;
				case 'struct':
					temp.struct_array = row_data.dataType.properties;
					break;
				case 'array':
					temp.itemType = row_data.dataType.specs.item.type;
					temp.size = row_data.dataType.specs.size;
					if (temp.itemType == 'struct') {
						temp.struct_array = row_data.dataType.specs.item.properties;
					}
					break;
				default:
					temp.min = row_data.dataType.specs.min;
					temp.max = row_data.dataType.specs.max;
					temp.step = row_data.dataType.specs.step;
					temp.unit = row_data.dataType.specs.unitName == null ? '' : `${row_data.dataType.specs.unitName} / ${row_data.dataType.specs.unit}`;
					break;
			}
			this.form_list.push(temp);
		},
		// 添加标准功能按钮
		add_protocol() {
			this.static_params.add_edit = 'add';
			let count = 0;
			this.child_count_list.push(count);
			let temp = {};
			for (let key in this.single_setting) {
				temp[key] = this.single_setting[key];
			}
			temp.type = '属性';
			temp.dataType = 'int';
			// 数组要独一份创建
			// temp.struct_array = [];
			this.form_list.push(temp);
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
		// 表单手动验证
		form_verify(value, flag) {
			let reg;
			switch (flag) {
				case 'name':
					reg = /^[A-Za-z0-9]+$/;
					break;
				case 'identifier':
					reg = /^[A-Za-z0-9]+$/;
					break;
				case 'textLength':
					reg = /^\d+$/;
					break;
				case 'size':
					reg = /^\d+$/;
					break;
			}
			if (!reg.test(value)) {
				this.rules[flag].show = true;
				switch (flag) {
					case 'name':
						this.rules[flag].message = '不能为空或者输入特殊字符';
						break;
					case 'identifier':
						this.rules[flag].message = '不能为空或者输入特殊字符';
						break;
					case 'textLength':
						this.rules[flag].message = '只能输入数字';
						break;
					case 'size':
						this.rules[flag].message = '不能为空且只能输入数字';
						break;
				}
				this.$refs[flag][this.$refs[flag].length - 1].$refs.input.style.borderColor = 'red';
				this.$refs[flag][this.$refs[flag].length - 1].$refs.input.placeholder = '';
				return false;
			} else {
				switch (flag) {
					case 'size':
						reg = /^\d{1,3}$/;
						if (!reg.test(value)) {
							this.rules[flag].message = '只能输入3位以内的数字';
							return false;
						}
						break;
				}
				this.rules[flag].show = false;
				this.$refs[flag][this.$refs[flag].length - 1].$refs.input.style.borderColor = '';
				return true;
			}
		},
		// 提交表单
		submit_form(obj, index) {
			let result = [];
			result.push(this.form_verify(obj.name, 'name'));
			result.push(this.form_verify(obj.identifier, 'identifier'));

			if (obj.dataType == 'text') {
				result.push(this.form_verify(obj.textLength, 'textLength'));
			}
			if (obj.dataType == 'struct' || obj.itemType == 'struct') {
				result.push(obj.struct_array.length > 0);
			}
			if (obj.dataType == 'array') {
				result.push(this.form_verify(obj.size, 'size'));
			}
			for (let value of result) {
				if (!value) {
					return;
				}
			}
			if (this.child_count_list[this.child_count_list.length - 1] > 0) {
				let temp = this.format_params(obj);
				this.form_list[index - 1].struct_array.push(temp);
				this.form_list.pop();
				this.child_count_list[this.child_count_list.length - 1]--;
			} else {
				if (this.static_params.add_edit === 'add') {
					let temp;
					switch (obj.type) {
						case '属性':
							let property = this.format_params(obj);
							temp = {
								modelId: this.model_id,
								properties: [property],
							};
							this.request('post', protocol_properties, this.token, temp, () => {
								this.res_history_model(this.history_selected);
								this.form_list = [];
							});
							break;
						case '事件':
							temp = {
								modelId: this.model_id,
								events: [
									{
										identifier: obj.identifier,
										name: obj.name,
										type: obj.dataType,
										outputData: obj.outputData,
									},
								],
							};
							this.request('post', protocol_event, this.token, temp, () => {
								this.res_history_model(this.history_selected);
								this.form_list = [];
							});
							break;
						case '服务':
							temp = {
								modelId: this.model_id,
								services: [
									{
										identifier: obj.identifier,
										name: obj.name,
										method: obj.dataType,
										inputData: obj.inputData,
										outputData: obj.outputData,
									},
								],
							};
							this.request('post', protocol_service, this.token, temp, () => {
								this.res_history_model(this.history_selected);
								this.form_list = [];
							});
							break;
					}
				} else {
					switch (obj.type) {
						case '属性':
							let array;
							if (this.form_list.length > 1) {
								array = this.form_list[index - 1].struct_array;
							} else {
								array = this.history_list[this.history_selected].properties;
							}
							let property;
							array.forEach((e) => {
								if (e.propertyId == obj.id) {
									e.name = obj.name;
									e.identifier = obj.identifier;
									e.dataType.type = obj.dataType;
									switch (obj.dataType) {
										case 'text':
											// 如果原先数据是date等 specs就是null不能直接添加属性 而要用新对象直接覆盖
											// 而且本来specs里就没有什么固定内容
											e.dataType.specs = { length: obj.textLength };
											break;
										case 'date':
											break;
										case 'struct':
											if (e.dataType.specs != null) {
												if (e.dataType.specs.item != null) {
													e.dataType.specs.item.properties = [];
												}
											}
											e.dataType.properties = [];
											for (let i of obj.struct_array) {
												e.dataType.properties.push(i);
											}
											break;
										case 'array':
											e.dataType.properties = [];
											e.dataType.specs = {
												size: obj.size,
												item: { type: obj.itemType },
											};
											if (obj.itemType == 'struct') {
												e.dataType.specs.item.properties = [];
												for (let i of obj.struct_array) {
													e.dataType.specs.item.properties.push(i);
												}
											}
											break;
										default:
											e.dataType.specs = {
												min: obj.min == '' ? null : obj.min,
												max: obj.max == '' ? null : obj.max,
												step: obj.step == '' ? null : obj.step,
												unitName: obj.unit.split(' / ')[0] == '' ? null : obj.unit.split(' / ')[0],
												unit: obj.unit.split(' / ')[0] == '' ? null : obj.unit.split(' / ')[1],
											};
											break;
									}
									property = e;
								}
							});
							if (this.form_list.length > 1) {
								this.form_list.pop();
							} else {
								this.request('put', protocol_property, this.token, property, () => {
									this.res_history_model(this.history_selected);
									this.form_list.pop();
								});
							}
							break;
						case '事件':
							this.history_list[this.history_selected].events.forEach((e) => {
								if (e.eventId == obj.id) {
									e.identifier = obj.identifier;
									e.name = obj.name;
									e.type = obj.dataType;
									e.outputData = obj.outputData;
									this.request('put', `${protocol_event}/${this.model_id}`, this.token, e, () => {
										this.res_history_model(this.history_selected);
										this.form_list.pop();
									});
								}
							});
							break;
						case '服务':
							this.history_list[this.history_selected].services.forEach((e) => {
								if (e.serviceId == obj.id) {
									e.identifier = obj.identifier;
									e.name = obj.name;
									e.type = obj.dataType;
									e.inputData = obj.inputData;
									e.outputData = obj.outputData;
									this.request('put', `${protocol_service}/${this.model_id}`, this.token, e, () => {
										this.res_history_model(this.history_selected);
										this.form_list.pop();
									});
								}
							});
							break;
					}
				}
				this.child_count_list.pop();
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
				case 'struct':
					dataType.properties = [];
					if (obj.struct_array.length > 0) {
						for (let i of obj.struct_array) {
							dataType.properties.push(i);
						}
					} else {
						return;
					}
					break;
				case 'array':
					dataType.specs = {
						size: obj.size,
						item: { type: obj.itemType },
					};
					if (obj.itemType == 'struct') {
						dataType.specs.item.properties = [];
						if (obj.struct_array.length > 0) {
							for (let i of obj.struct_array) {
								dataType.specs.item.properties.push(i);
							}
						} else {
							return;
						}
					}
					break;
				default:
					dataType.specs = {
						min: obj.min == '' ? null : obj.min,
						max: obj.max == '' ? null : obj.max,
						step: obj.step == '' ? null : obj.step,
						unitName: obj.unit.split(' / ')[0] == '' ? null : obj.unit.split(' / ')[0],
						unit: obj.unit.split(' / ')[0] == '' ? null : obj.unit.split(' / ')[1],
					};
					break;
			}
			let temp = {
				identifier: obj.identifier,
				name: obj.name,
				dataType: dataType,
			};
			if (obj.id != null && obj.id != '') {
				temp.propertyId = obj.id;
			}
			return temp;
		},
		// 切换数据类型时构造不同的参数
		format_type_data(obj) {
			if (obj.dataType == 'struct' || obj.dataType == 'array') {
				if (obj.struct_array == undefined) {
					obj.struct_array = [];
				}
				if (obj.itemType == '' || obj.itemType == null) {
					obj.itemType = 'int';
				}
			}
			for (let key in this.rules) {
				this.rules[key].show = false;
			}
		},
		// 增加子属性
		add_child_property() {
			// this.static_params.add_edit = 'child';
			this.child_count_list[this.child_count_list.length - 1]++;
			let temp = {};
			for (let key in this.single_setting) {
				temp[key] = this.single_setting[key];
			}
			temp.type = '属性';
			temp.dataType = 'int';
			this.form_list.push(temp);
			for (let key in this.rules) {
				this.rules[key].show = false;
			}
		},
		// 发布物模型
		publish_model() {
			this.request('get', `${protocol_publish}/${this.model_id}`, this.token, () => {
				this.res_history_model(this.history_selected);
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
			this.rules.struct.show = false;
		},
		// 点击下拉框获取远程数据
		get_unit() {
			this.request('get', protocol_units, this.token, (res) => {
				for (let [key, array] of Object.entries(res.data.data)) {
					let temp = {
						label: key,
						options: [],
					};
					for (let item of array) {
						let unit = { value: `${item.name} / ${item.symbol}` };
						temp.options.push(unit);
					}
					this.static_params.unit_options.push(temp);
				}
			});
		},
		// 清空表单 并设置初始值
		clean_form(obj) {
			for (let key in obj) {
				if (key != 'type') {
					obj[key] = '';
				}
			}
			switch (obj.type) {
				case '属性':
					obj.dataType = 'int';
					break;
				case '事件':
					obj.dataType = 'info';
					break;
				case '服务':
					obj.dataType = 'async';
					break;
			}
			for (let key in this.rules) {
				this.rules[key].show = false;
			}
		},
		// 点击取消时删除卡片数组最后一个
		del_form() {
			this.form_list.pop();
			for (let key in this.rules) {
				this.rules[key].show = false;
			}
		},
	},
});
