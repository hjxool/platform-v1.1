// let url = 'http://192.168.30.200:9201/';
// let url = 'http://182.150.116.22:13001/';
let url = `${我是接口地址}/`;
let protocol_list = `${url}api-device/protocol/list`;
let protocol_view = `${url}api-device/protocol/view/`;
let protocol_newVersion = `${url}api-device/protocol/newVersion`;
let protocol_properties = `${url}api-device/protocol/properties`;
let protocol_property = `${url}api-device/protocol/property`;
let protocol_event = `${url}api-device/protocol/event`;
let protocol_service = `${url}api-device/protocol/service`;
let protocol_publish = `${url}api-device/protocol/publish`;
let protocol_units = `${url}api-device/protocol/units`;
let protocol_unit_add = `${url}api-device/protocol/unit`;
let protocol_unit_delete = `${url}api-device/protocol/delete`;
let product_model = `${url}api-device/product/model`;
let current_model = `${url}api-device/protocol/current`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data() {
		return {
			id: '',
			token: '',
			static_params: {
				loading: false, //请求未返回时加载遮罩
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
				unit_set_show: false, //属性单位配置弹窗显示
				unit_add_edit: '', //区分单位编辑和新增
				unit_button_ban: true, //禁用单位相关按钮
				// 属性单位表单
				unit_paramas: {
					unit_name: '',
					symbol: '',
					type: 0,
					typeName: '',
					remarks: '',
				},
				unit_type_options: ['自定义'],
				current_version: '', //当前启用物模型版本
			},
			//历史版本列表
			history_list: [],
			history_selected: '', //记录选择的是历史版本中的哪一个
			//物模型属性等列表——表格用
			protocol_list: [],
			//修改协议时的单行数据
			single_setting: {
				// id: '', //公共 id
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
				outputData: [], //事件/服务 属性数组
				inputData: [], //服务 属性数组
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
				min: { show: false, message: '' },
				max: { show: false, message: '' },
				step: { show: false, message: '' },
				unit_name: { show: false, message: '' },
				symbol: { show: false, message: '' },
				typeName: { show: false, message: '' },
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
	},
	methods: {
		// 页面加载时历史版本
		res_history_model(index) {
			this.request('post', protocol_list, this.token, { condition: this.id, pageNum: 1, pageSize: 999 }, (res) => {
				console.log('历史版本', res);
				// 加载完毕后再显示底部卡片
				if (res.data.data == null || res.data.data.data == null) {
					this.$message.info('无历史数据');
					return;
				}
				this.static_params.first_load = false;
				this.history_list = res.data.data.data;
				this.search_current_model();
				this.model_select(index);
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
		//#region
		// 取出属性列表 便于查询ID
		// copy_struct_array(target, source) {
		// 	if (source.constructor === Array && typeof source[0] != 'object') {
		// 		source.forEach((e) => {
		// 			target.push(e);
		// 		});
		// 	} else if (source.constructor === Array && typeof source[0] === 'object') {
		// 		source.forEach((e) => {
		// 			if (e != null) {
		// 				let t = {};
		// 				target.push(t);
		// 				this.copy_struct_array(t, e);
		// 			} else {
		// 				target.push(null);
		// 			}
		// 		});
		// 	} else if (source.constructor === Object) {
		// 		for (let key in source) {
		// 			if (typeof source[key] != 'object') {
		// 				target[key] = source[key];
		// 			} else {
		// 				if (source[key] != null) {
		// 					target[key] = {};
		// 					this.copy_struct_array(target[key], source[key]);
		// 				} else {
		// 					target[key] = null;
		// 				}
		// 			}
		// 		}
		// 	}
		// },
		//#endregion
		//#region
		// 构建属性树
		// property_tree(obj, target, parent_index) {
		// 	if (obj.dataType.type == 'array' || obj.dataType.type == 'struct') {
		// 		let properties;
		// 		switch (obj.dataType.type) {
		// 			case 'array':
		// 				properties = obj.dataType.specs.item.properties;
		// 				break;
		// 			case 'struct':
		// 				properties = obj.dataType.properties;
		// 				break;
		// 		}
		// 		for (let index = 0; index < properties.length; index++) {
		// 			let property = properties[index];
		// 			let temp = {
		// 				id: property.propertyId,
		// 				parent_index: `${parent_index}-${index}`,
		// 				type: '属性',
		// 				child: [],
		// 				data: {
		// 					name: property.name,
		// 					identifier: property.identifier,
		// 					dataType: property.dataType.type,
		// 					min: property.dataType.type != 'struct' ? property.dataType.specs.min : '',
		// 					max: property.dataType.type != 'struct' ? property.dataType.specs.max : '',
		// 					step: property.dataType.type != 'struct' ? property.dataType.specs.step : '',
		// 					unit: property.dataType.type != 'struct' ? (property.dataType.specs.unitName == null ? '' : `${property.dataType.specs.unitName} / ${property.dataType.specs.unit}`) : '',
		// 					size: property.dataType.type === 'array' ? property.dataType.specs.size : '',
		// 				},
		// 			};
		// 			target.push(temp);
		// 			// 找到child里的子节点 再往里遍历
		// 			this.property_tree(property, target[index].child, temp.parent_index);
		// 		}
		// 	}
		// },
		//#endregion
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
				if (key != 'inputData' && key != 'outputData') {
					temp[key] = this.single_setting[key];
				}
				if (row_data[key] != undefined) {
					temp[key] = row_data[key];
				}
			}
			// 给form_list数据增加id便于取消操作数据回滚
			if (row_data.id != undefined && row_data.id != '') {
				temp.id = row_data.id;
			}
			// 因为数组是对象有索引 修改父级数组后，模板中数组指针也永远改变了，所以每一层看的都是同样的数组
			if (row_data.struct_array != undefined) {
				temp.struct_array = row_data.struct_array;
				// 还需要准备一个临时的深拷贝响应数组，当取消删除操作时，用此临时数据替换源数组
				// 在准备好的数组push前，声明的非响应式数据在push之后都会变成响应式
				// temp.struct_array_replace = [];
				// this.copy_struct_array(temp.struct_array_replace, row_data.struct_array);
			}
			this.form_list.push(temp);
			this.$nextTick(() => {
				let dom = this.$refs.custom_center[0];
				dom.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
			});
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
				if (key != 'inputData' && key != 'outputData') {
					temp[key] = this.single_setting[key];
				}
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
		edit_child_json(row_data, child_index) {
			// 跟表格编辑查看不同的地方在于，表格数据是提取出来的，而子属性列表里的是原始格式数据
			console.log(row_data);
			// this.static_params.add_edit = 'edit_child';
			let count = 0;
			this.child_count_list.push(count);
			let temp = {};
			for (let key in this.single_setting) {
				if (key != 'inputData' && key != 'outputData') {
					temp[key] = this.single_setting[key];
				}
			}
			temp.inputData = [];
			temp.outputData = [];
			temp.type = '属性';
			//第一层数据因为是从protocol_list取值，所以索引无用不如id，但是里层嵌套的数组用索引取值更好
			temp.index = child_index;
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
					// temp.struct_array_replace = [];
					// this.copy_struct_array(temp.struct_array_replace, row_data.dataType.properties);
					break;
				case 'array':
					temp.itemType = row_data.dataType.specs.item.type;
					temp.size = row_data.dataType.specs.size;
					if (temp.itemType == 'struct') {
						temp.struct_array = row_data.dataType.specs.item.properties;
						// temp.struct_array_replace = [];
						// this.copy_struct_array(temp.struct_array_replace, row_data.dataType.specs.item.properties);
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
			this.$confirm(`此操作不可逆，删除后需刷新页面重新获取数据`, '提示', {
				confirmButtonText: '确定',
				cancelButtonText: '取消',
				type: 'info',
				center: true,
			}).then(() => {
				parent.struct_array.splice(child_index, 1);
			});
		},
		// 发布后查看子属性
		check_child_json(row_data) {
			let temp = {};
			for (let key in this.single_setting) {
				if (key != 'inputData' && key != 'outputData') {
					temp[key] = this.single_setting[key];
				}
			}
			temp.inputData = [];
			temp.outputData = [];
			temp.type = '属性';
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
				if (key != 'inputData' && key != 'outputData') {
					temp[key] = this.single_setting[key];
				}
			}
			temp.inputData = [];
			temp.outputData = [];
			temp.type = '属性';
			temp.dataType = 'int';
			// 数组要独一份创建
			// temp.struct_array = [];
			this.form_list.push(temp);
			this.$nextTick(() => {
				let dom = this.$refs.custom_center[0];
				dom.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
			});
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
		form_verify(value, flag, compare) {
			compare == undefined ? (compare = '') : compare;
			this.rules[flag].show = true;
			let reg;
			switch (flag) {
				case 'name':
					reg = /^[\u4E00-\u9FA5A-Za-z0-9_]+$/;
					if (!reg.test(value)) {
						this.rules[flag].message = '不能为空或者输入特殊字符';
						return false;
					}
					break;
				case 'identifier':
					reg = /^\w+$/;
					if (!reg.test(value)) {
						this.rules[flag].message = '不能为空或者输入特殊字符';
						return false;
					}
					break;
				case 'textLength':
					reg = /^\d+$/;
					if (!reg.test(value)) {
						this.rules[flag].message = '只能输入数字';
						return false;
					}
					break;
				case 'size':
					reg = /^[1-9][0-9]{0,4}$/;
					if (!reg.test(value)) {
						this.rules[flag].message = '不能为空且只能输入5位以内非0开头的整数数字';
						return false;
					}
					break;
				case 'max':
					if (Number(value) < Number(compare)) {
						this.$message.error('不能小于最小值');
						return false;
					}
					break;
				case 'unit_name':
					reg = /^[\u4E00-\u9FA5A-Za-z0-9_]+$/;
					if (!reg.test(value)) {
						this.rules[flag].message = '不能为空或者输入特殊字符';
						return false;
					}
					for (let obj of this.static_params.unit_options) {
						for (let item of obj.options) {
							if (value == item.name && value != compare) {
								this.rules[flag].message = '跟已有单位重名';
								return false;
							}
						}
					}
					break;
				case 'typeName':
					reg = /^.{1,}$/;
					if (!reg.test(value)) {
						this.rules[flag].message = '不能为空';
						return false;
					}
					for (let obj of this.static_params.unit_options) {
						if (value == obj.label && value != compare) {
							this.rules[flag].message = '跟已有类型重名';
							return false;
						}
					}
					break;
				default:
					reg = /^.{1,}$/;
					if (!reg.test(value)) {
						this.rules[flag].message = '不能为空';
						return false;
					}
					break;
			}
			this.rules[flag].show = false;
			return true;
		},
		// 提交表单
		submit_form(obj, index) {
			console.log('提交表单', obj);
			// 提交按钮传入的是form_list里的数据
			let result = [];
			result.push(this.form_verify(obj.name, 'name'));
			result.push(this.form_verify(obj.identifier, 'identifier'));
			if (obj.dataType == 'int' || obj.dataType == 'float' || obj.dataType == 'double') {
				result.push(this.form_verify(obj.max, 'max', obj.min));
			}
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
			// 先判断是否已经到了最近的编辑层,如果还没到，则往上一层级新增格式化数据
			if (this.child_count_list[this.child_count_list.length - 1] > 0) {
				let temp = this.format_params(obj);
				this.form_list[index - 1].struct_array.push(temp);
				this.form_list.pop();
				this.child_count_list[this.child_count_list.length - 1]--;
			} else {
				// 如果已经到了最近的编辑层 再判断是否是最外层的编辑或新增功能 同时删除后一个计数器
				if (this.form_list.length > 1) {
					// 在编辑和新增里 如果未到最外层这一部分是公共逻辑 进行的是往上找 修改上一层级数据
					let array = this.form_list[index - 1].struct_array;
					array[obj.index].name = obj.name;
					array[obj.index].identifier = obj.identifier;
					array[obj.index].dataType.type = obj.dataType;
					if (array[obj.index].dataType.specs != null) {
						if (array[obj.index].dataType.specs.item != null) {
							array[obj.index].dataType.specs.item.properties = [];
						}
					}
					array[obj.index].dataType.properties = [];
					switch (obj.dataType) {
						case 'text':
							// 如果原先数据是date等 specs就是null不能直接添加属性 而要用新对象直接覆盖
							// 而且本来specs里就没有什么固定内容
							array[obj.index].dataType.specs = { length: obj.textLength };
							break;
						case 'date':
							break;
						case 'struct':
							for (let i of obj.struct_array) {
								array[obj.index].dataType.properties.push(i);
							}
							break;
						case 'array':
							array[obj.index].dataType.specs = {
								size: obj.size,
								item: { type: obj.itemType },
							};
							array[obj.index].dataType.specs.item.properties = [];
							if (obj.itemType == 'struct') {
								for (let i of obj.struct_array) {
									array[obj.index].dataType.specs.item.properties.push(i);
								}
							}
							break;
						default:
							array[obj.index].dataType.specs = {
								min: obj.min == '' ? 0 : obj.min,
								max: obj.max == '' ? 0 : obj.max,
								step: obj.step == '' ? 0 : obj.step,
								unitName: obj.unit.split(' / ')[0] == '' ? null : obj.unit.split(' / ')[0],
								unit: obj.unit.split(' / ')[0] == '' ? null : obj.unit.split(' / ')[1],
							};
							break;
					}
					// 修改完后关闭一层表单
					this.form_list.pop();
					this.child_count_list.pop();
				} else {
					// 此时只有一个表单 就要开始区分是编辑还是新增功能
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
									this.child_count_list.pop();
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
											outputData: obj.outputData || [],
										},
									],
								};
								this.request('post', protocol_event, this.token, temp, () => {
									this.res_history_model(this.history_selected);
									this.form_list = [];
									this.child_count_list.pop();
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
											inputData: obj.inputData || [],
											outputData: obj.outputData || [],
										},
									],
								};
								this.request('post', protocol_service, this.token, temp, () => {
									this.res_history_model(this.history_selected);
									this.form_list = [];
									this.child_count_list.pop();
								});
								break;
						}
					} else if (this.static_params.add_edit === 'edit') {
						switch (obj.type) {
							case '属性':
								array = this.history_list[this.history_selected].properties;
								array.forEach((e) => {
									if (e.propertyId == obj.id) {
										e.name = obj.name;
										e.identifier = obj.identifier;
										e.dataType.type = obj.dataType;
										if (e.dataType.specs != null) {
											if (e.dataType.specs.item != null) {
												e.dataType.specs.item.properties = [];
											}
										}
										e.dataType.properties = [];
										switch (obj.dataType) {
											case 'text':
												e.dataType.specs = { length: obj.textLength };
												break;
											case 'date':
												break;
											case 'struct':
												for (let i of obj.struct_array) {
													e.dataType.properties.push(i);
												}
												break;
											case 'array':
												e.dataType.specs = {
													size: obj.size,
													item: { type: obj.itemType },
												};
												e.dataType.specs.item.properties = [];
												if (obj.itemType == 'struct') {
													for (let i of obj.struct_array) {
														e.dataType.specs.item.properties.push(i);
													}
												}
												break;
											default:
												e.dataType.specs = {
													min: obj.min == '' ? 0 : obj.min,
													max: obj.max == '' ? 0 : obj.max,
													step: obj.step == '' ? 0 : obj.step,
													unitName: obj.unit.split(' / ')[0] == '' ? null : obj.unit.split(' / ')[0],
													unit: obj.unit.split(' / ')[0] == '' ? null : obj.unit.split(' / ')[1],
												};
												break;
										}
										this.request('put', protocol_property, this.token, e, () => {
											this.res_history_model(this.history_selected);
											this.form_list = [];
											this.child_count_list.pop();
										});
									}
								});
								break;
							case '事件':
								this.history_list[this.history_selected].events.forEach((e) => {
									if (e.eventId == obj.id) {
										e.identifier = obj.identifier;
										e.name = obj.name;
										e.type = obj.dataType;
										e.outputData = obj.outputData || [];
										this.request('put', `${protocol_event}/${this.model_id}`, this.token, e, () => {
											this.res_history_model(this.history_selected);
											this.form_list = [];
											this.child_count_list.pop();
										});
									}
								});
								break;
							case '服务':
								this.history_list[this.history_selected].services.forEach((e) => {
									if (e.serviceId == obj.id) {
										e.identifier = obj.identifier;
										e.name = obj.name;
										e.method = obj.dataType;
										e.inputData = obj.inputData || [];
										e.outputData = obj.outputData || [];
										this.request('put', `${protocol_service}/${this.model_id}`, this.token, e, () => {
											this.res_history_model(this.history_selected);
											this.form_list = [];
											this.child_count_list.pop();
										});
									}
								});
								break;
						}
					}
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
						min: obj.min == '' ? 0 : obj.min,
						max: obj.max == '' ? 0 : obj.max,
						step: obj.step == '' ? 0 : obj.step,
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
			// if (obj.id != null && obj.id != '') {
			// 	temp.propertyId = obj.id;
			// }
			return temp;
		},
		// 切换数据类型时构造不同的参数
		format_type_data(obj) {
			if (obj.dataType == 'struct' || obj.dataType == 'array') {
				if (obj.struct_array == undefined) {
					this.$set(obj, 'struct_array', []);
				}
				if (obj.itemType == '' || obj.itemType == null) {
					obj.itemType = 'int';
				}
			}
			this.clean_verify();
		},
		// 格式化数组元素类型
		format_array_data(obj) {
			// 传入的是form_list对象
			if (obj.itemType == 'struct') {
				if (obj.struct_array == undefined) {
					this.$set(obj, 'struct_array', []);
				}
			}
		},
		// 增加子属性
		add_child_property() {
			// this.static_params.add_edit = 'child';
			this.child_count_list[this.child_count_list.length - 1]++;
			let temp = {};
			for (let key in this.single_setting) {
				if (key != 'inputData' && key != 'outputData') {
					temp[key] = this.single_setting[key];
				}
			}
			temp.inputData = [];
			temp.outputData = [];
			temp.type = '属性';
			temp.dataType = 'int';
			this.form_list.push(temp);
			this.clean_verify();
		},
		// 发布物模型
		publish_model() {
			this.request('get', `${protocol_publish}/${this.model_id}`, this.token, () => {
				this.res_history_model(this.history_selected);
			});
		},
		// 点击下拉框获取远程数据
		get_unit() {
			this.static_params.unit_type_options = ['自定义'];
			this.request('get', protocol_units, this.token, (res) => {
				this.static_params.unit_options = [];
				for (let [key, array] of Object.entries(res.data.data)) {
					let temp = {
						label: key,
						options: [],
					};
					for (let item of array) {
						let unit = {
							value: `${item.name} / ${item.symbol}`,
						};
						for (let key in item) {
							unit[key] = item[key];
						}
						temp.options.push(unit);
					}
					this.static_params.unit_options.push(temp);
					this.static_params.unit_type_options.push(key);
				}
			});
		},
		// 新增单位
		add_unit() {
			this.static_params.unit_add_edit = 'add';
			this.static_params.unit_set_show = true;
		},
		// 编辑单位
		edit_unit() {
			let t_name = this.form_list[this.form_list.length - 1].unit.split(' / ')[0];
			for (let v1 of this.static_params.unit_options) {
				for (let v2 of v1.options) {
					if (t_name == v2.name) {
						this.static_params.unit_paramas.unitId = v2.unitId;
						this.static_params.unit_paramas.unit_name = v2.name;
						this.static_params.unit_paramas.name_old = v2.name;
						this.static_params.unit_paramas.remarks = v2.remarks;
						this.static_params.unit_paramas.symbol = v2.symbol;
						this.static_params.unit_paramas.type = v2.type;
						if (v2.type == 0) {
							this.static_params.unit_paramas.typeName = v2.typeName;
							this.static_params.unit_paramas.typeName_old = v2.typeName;
						}
					}
				}
			}
			this.static_params.unit_add_edit = 'edit';
			this.static_params.unit_set_show = true;
		},
		// 删除单位
		del_unit() {
			this.static_params.loading = true;
			let t_name = this.form_list[this.form_list.length - 1].unit.split(' / ')[0];
			for (let v1 of this.static_params.unit_options) {
				for (let v2 of v1.options) {
					if (t_name == v2.name) {
						this.request('delete', `${protocol_unit_delete}/${v2.unitId}`, this.token, () => {
							this.get_unit();
							this.static_params.loading = false;
						});
					}
				}
			}
		},
		// 单位弹窗提交
		unit_submit() {
			let result = [];
			result.push(this.form_verify(this.static_params.unit_paramas.unit_name, 'unit_name', this.static_params.unit_paramas.name_old));
			result.push(this.form_verify(this.static_params.unit_paramas.symbol, 'symbol'));
			if (this.static_params.unit_paramas.type == 0) {
				result.push(this.form_verify(this.static_params.unit_paramas.typeName, 'typeName', this.static_params.unit_paramas.typeName_old));
			}
			for (let value of result) {
				if (!value) {
					return;
				}
			}
			this.static_params.loading = true;
			let t = {
				name: this.static_params.unit_paramas.unit_name,
				symbol: this.static_params.unit_paramas.symbol,
				type: Number(this.static_params.unit_paramas.type),
				remarks: this.static_params.unit_paramas.remarks,
			};
			if (t.type == 0) {
				t.typeName = this.static_params.unit_paramas.typeName;
			}
			if (this.static_params.unit_add_edit == 'add') {
				this.request('post', protocol_unit_add, this.token, t, () => {
					this.get_unit();
					this.clean_verify();
					this.clean_object(this.static_params.unit_paramas);
					this.static_params.unit_paramas.type = 0;
					this.static_params.unit_set_show = false;
					this.static_params.loading = false;
				});
			} else {
				t.unitId = this.static_params.unit_paramas.unitId;
				this.request('put', protocol_unit_add, this.token, t, () => {
					this.get_unit();
					this.clean_verify();
					this.clean_object(this.static_params.unit_paramas);
					this.static_params.unit_paramas.type = 0;
					this.static_params.unit_set_show = false;
					this.static_params.loading = false;
				});
			}
		},
		// 单位弹窗取消
		unit_cancel() {
			this.clean_verify();
			this.clean_object(this.static_params.unit_paramas);
			this.static_params.unit_paramas.type = 0;
			this.static_params.unit_set_show = false;
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
			this.clean_verify();
		},
		// 点击取消时删除卡片数组最后一个
		del_form(obj) {
			// 传入的是form_list数据
			this.form_list.pop();
			if (this.child_count_list[this.child_count_list.length - 1] > 0) {
				--this.child_count_list[this.child_count_list.length - 1];
			} else {
				this.child_count_list.pop();
			}
			this.clean_verify();
		},
		// 当前编辑弹窗消失时 清除验证提示
		clean_verify() {
			for (let key in this.rules) {
				this.rules[key].show = false;
			}
		},
		// 当选择的是系统单位时禁止删除和更新按钮
		ban_unit_button() {
			this.static_params.unit_button_ban = false;
			let t_name = this.form_list[this.form_list.length - 1].unit.split(' / ')[0];
			for (let v1 of this.static_params.unit_options) {
				for (let v2 of v1.options) {
					if (t_name == v2.name) {
						if (v2.sysDefault == 1) {
							this.static_params.unit_button_ban = true;
							return;
						}
					}
				}
			}
		},
		// 精度分类
		precision_sort(obj) {
			switch (obj.dataType) {
				case 'int':
					return 0;
				case 'float':
					return 2;
				case 'double':
					return 4;
			}
		},
		// 步长分类
		step_sort(obj) {
			switch (obj.dataType) {
				case 'int':
					return 1;
				case 'float':
					return 0.1;
				case 'double':
					return 0.01;
			}
		},
		// 启用当前物模型
		set_product_model() {
			this.request('put', `${product_model}/${this.id}/${this.model_id}`, this.token, () => {
				this.res_history_model(this.history_selected);
			});
		},
		// 页面加载时查询启用物模型版本
		search_current_model() {
			let flag = false;
			this.history_list.forEach((e) => {
				if (e.profile.isCurrentVersion == '1') {
					this.static_params.current_version = e.profile.version;
					flag = true;
				}
			});
			if (!flag) {
				this.static_params.current_version = '未设置启用模型';
			}
		},
	},
});
