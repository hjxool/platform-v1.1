let url = `${我是接口地址}/`;
// let room_list = `${url}api-portal/room/search/time`;
let room_list = `${url}api-portal/room/search/date`;
let meeting_reserve = `${url}api-portal/meeting`;
let user_list = `${url}api-portal/users`;
let upload_files = `${url}api-portal/meeting/upload/files`;

Vue.config.productionTip = false;
new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		token: '',
		html: {
			block_list: [], //会议室方块状态
			block_list2: [], //选中渲染列表
			year: '', //页面显示时间
			month: '',
			day: '',
			week: '',
			date: '',
			search_meeting: '', //搜索会议名
			new_meeting: false, //新增会议弹窗
			form_loading: false, // 提交表单时加载遮罩
			throttle_flag: false, //节流方法标识
			loading: true, //页面初始加载
			reserve_type: [], //预约方式选项
			week_options: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'], // 自定义星期选择
			bool_options: ['否', '是'],
			meeting_info_show: false, //会议信息显示
			meeting_infos: ['会议主题', '开始时间', '结束时间', '类型'],
			info_type: ['站内消息', '微信公众号', '微信小程序', '钉钉', '短信', '邮件', 'APP'], // 通知方式
			boundary_display: false, //只有当天需要计算边界线
		},
		place_list: [], // 会议室及会议列表
		// 新建会议表单
		new_meeting_form: {
			name: '', //会议名
			date: '', //日期
			time_start: '', //起始时间
			time_end: '', //结束时间
			method: 0, // 预约方式
			cus_week: [], //自定义周几 可多选
			reply: 0, //是否需要回复 0否 1是
			sendMessage: 1, //是否通知
			signIn: 1, //是否签到
			summary: 1, //会议纪要
			search_person: [], // 搜索用户名
			cycle_deadline: '', // 周期预约的截止日期
			// files: [], // 存多次上传文件回来的结果
			meetingReminds: [], // 提醒时间 数组
			guestList: [], //来宾列表
			description: '', //会议备注
		},
		// 会议信息
		meeting_info: {
			name: '',
			start_time: '',
			end_time: '',
			type: '',
		},
		col_index_start: null,
		col_index_end: null,
		block_width: 0, //时间方块宽度
		start_move: false, //按下鼠标 焦点方块消失
		conferee_list: [], //参会人员列表
		file: {
			url: upload_files, //上传地址
			list: [], //文件列表
		},
		// 新建预约会议验证规则
		new_rule: {
			name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
			date: [{ type: 'date', required: true, message: '请选择日期', trigger: 'change' }],
			time_start: [{ required: true, message: '必须选择时间', trigger: 'change' }],
			time_end: [{ required: true, message: '必须选择时间', trigger: 'change' }],
			cus_week: [{ required: true, message: '必须选择星期', trigger: 'change' }],
			search_person: [{ required: true, message: '必须选择与会人员', trigger: 'change' }],
		},
		mouse: {
			row_index: null, //鼠标所在行
			col_index: null, //鼠标所在列
			enter: false, //鼠标移入列表才显示定位
			focus: false,
			top: '', //指示条离顶部距离
			height: '', //指示条高度
			focus_top: '0px', //焦点距离父容器高度
		},
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		let time = new Date().toString().split(' ')[4];
		let time_list = time.split(':');
		let hour = +time_list[0];
		let minute = +time_list[1];
		// 首先找到当前时间所在方格
		this.boundary = (hour - 6) * 2;
		// 计算当前时间线所在的方格索引 小于这个索引的全部变灰
		if (minute >= 30) {
			this.boundary++;
		}
		// 小于当天的格子全部灰掉
		// 改变时间后 只有当天才能显示和计算边界值 格式化当天条件为 00点
		let t = new Date();
		this.current_day = new Date(`${t.getFullYear()}/${t.getMonth() + 1}/${t.getDate()}`).getTime();
		this.html.date = new Date(this.current_day);
		// 获取当前时间
		this.display_time(this.html.date);
		window.onresize = () => {
			this.get_boundary();
		};
		setInterval(() => {
			this.get_boundary();
		}, 600000);
		this.search_organiztion();
	},
	methods: {
		// 查询会议室及会议详情列表
		req_room_list(meeting_name) {
			let t2 = this.html.month < 10 ? '0' + this.html.month : this.html.month;
			let t3 = this.html.day < 10 ? '0' + this.html.day : this.html.day;
			let t4 = `${this.html.year}-${t2}-${t3}`;
			this.request('post', room_list, this.token, { roomName: meeting_name || '', startTime: `${t4} 06:00:00`, endTime: `${t4} 23:00:00` }, (res) => {
				console.log('会议室及会议', res);
				this.html.loading = false;
				if (res.data.head.code != 200) {
					this.$message('当前用户下无会议室');
					return;
				}
				this.place_list = res.data.data;
				this.block_status();
			});
		},
		select_day() {
			let dom = document.querySelector('#calendar');
			dom.focus();
		},
		// 查询每一个会议室下会议占用情况
		query_block_status(array, time_index) {
			// time_index从0开始
			// let array = Object.entries(place_obj.meetingList)[0][1];
			// 可能会有几种情况 变灰和灰色上同时有会议
			let result = 0;
			if (this.display_day < this.current_day) {
				result = 1;
			}
			if (this.html.boundary_display && time_index < this.boundary) {
				result = 1;
			}
			// 对单个场所下每个时间点 查找是否在任意一个会议时间段内
			for (let i = 0; i < array.length; i++) {
				let start = array[i].startTime.split(' ')[1].split(':');
				let start_hour = +start[0];
				let start_minute = +start[1];
				let start_index = (start_hour - 6) * 2;
				if (start_minute == 30) {
					start_index++;
				}
				let end = array[i].endTime.split(' ')[1].split(':');
				let end_hour = +end[0];
				let end_minute = +end[1];
				// 结束时间是分隔线之前 开始时间从分隔线之后
				let end_index = (end_hour - 6) * 2 - 1;
				if (end_minute == 30) {
					end_index++;
				}
				if (time_index >= start_index && time_index <= end_index) {
					// timeType 0表示已过期 1表示已预定 2表示空闲
					// if (array[i].timeType == 0) {
					// 	return 1;
					// } else if (array[i].timeType == 1) {
					// 	return 2;
					// }
					result = 2;
					break;
				}
			}
			// 0表示空闲 1表示已过期 2表示已预定
			return result;
		},
		// 组装二维矩阵 控制方块显示
		block_status() {
			this.html.block_list = [];
			this.html.block_list2 = [];
			// 当前选择时间
			this.display_day = this.html.date.getTime();
			for (let i = 0; i < this.place_list.length; i++) {
				let t = [];
				let t2;
				let t3 = [];
				if (this.place_list[i].meetingList != null) {
					t2 = Object.entries(this.place_list[i].meetingList)[0][1];
				} else {
					t2 = [];
				}
				for (let j = 0; j < 34; j++) {
					t[j] = this.query_block_status(t2, j);
					t3[j] = 0;
				}
				this.html.block_list.push(t);
				this.html.block_list2.push(t3);
			}
			this.$nextTick(() => {
				// this.add_exist_meeting_style();
				// vue在页面所需数组未请求回来时 不会渲染 因此找不到数组节点
				this.first_block_position = document.querySelector('.time_box').getBoundingClientRect().left;
				this.get_boundary();
			});
		},
		get_boundary() {
			if (this.html.boundary_display) {
				let time = new Date().toString().split(' ')[4];
				let time_list = time.split(':');
				let hour = +time_list[0];
				let minute = +time_list[1];
				// 首先找到当前时间所在方格
				let boundary = (hour - 6) * 2;
				// 计算分钟在一小时间隔中位置
				let per = minute / 60;
				// 只获取一次time_box数组 给鼠标焦点用
				this.time_box_array = document.querySelectorAll('.time_box');
				let block_position = this.time_box_array[boundary].offsetLeft;
				this.block_width = document.querySelector('.time_box').offsetWidth;
				let offset = per * (this.block_width * 2) + block_position;
				let dom = document.querySelector('.current_time');
				dom.style.left = `${offset}px`;
				let dom2 = document.querySelector('.meeting_boxs');
				// dom.style.height = `${100 * this.place_list.length}px`; // 100是一行高度
				this.mouse.top = dom.style.top = dom2.getBoundingClientRect().top + 'px';
				this.mouse.height = dom.style.height = dom2.clientHeight + 'px';
			}
		},
		// 获取选中时间
		display_time(date_obj) {
			this.html.year = date_obj.getFullYear();
			this.html.month = date_obj.getMonth() + 1;
			this.html.day = date_obj.getDate();
			switch (date_obj.getDay()) {
				case 0:
					this.html.week = '星期天';
					break;
				case 1:
					this.html.week = '星期一';
					break;
				case 2:
					this.html.week = '星期二';
					break;
				case 3:
					this.html.week = '星期三';
					break;
				case 4:
					this.html.week = '星期四';
					break;
				case 5:
					this.html.week = '星期五';
					break;
				case 6:
					this.html.week = '星期六';
					break;
			}
			if (date_obj.getTime() == this.current_day) {
				this.html.boundary_display = true;
			} else {
				this.html.boundary_display = false;
			}
			this.req_room_list();
		},
		// 鼠标点下时 只有在当前时间后的才能框选
		area_start(row_index, col_index) {
			if (this.html.block_list[row_index][col_index] == 0) {
				this.start_move = true;
				this.row_index = row_index;
				this.col_index_start = col_index;
				this.col_index_end = col_index;
				// 将色块状态改为3 表示选中 在取消创建会议时恢复状态为0
				this.html.block_list2[row_index].splice(col_index, 1, 3);
			}
		},
		// 鼠标滑动时 将开始的end样式去除 给末尾的添加end样式
		area_enter(row_index, col_index, event) {
			this.after_area_enter = true; //触发enter事件后mouse.row_index才有的值
			// 鼠标悬浮的行列高亮显示
			this.mouse.row_index = row_index; //记录下鼠标刚进入方块的旧值
			// this.mouse.row_index_old = this.mouse.row_index = row_index; //记录下鼠标刚进入方块的旧值
			this.mouse.col_index = col_index;
			// 如果是已按下鼠标的状态 则渲染块
			if (this.start_move) {
				if (col_index >= this.col_index_start) {
					// 再把鼠标所在的方块置为end
					this.col_index_end = col_index;
					this.html.block_list2 = [];
					for (let i = 0; i < this.place_list.length; i++) {
						let t = [];
						for (let k = 0; k < 34; k++) {
							t[k] = 0;
						}
						this.html.block_list2.push(t);
					}
					let l = this.col_index_end - this.col_index_start;
					for (let i = 0; i <= l; i++) {
						this.html.block_list2[this.row_index].splice(this.col_index_start + i, 1, 3);
					}
				}
			} else {
				// 否则视作鼠标普通悬浮状态 查询块信息
				this.query_meeting_info(event, row_index, col_index);
			}
		},
		// 鼠标悬浮时显示其下会议信息
		query_meeting_info(event, row_index, col_index) {
			if (!this.start_move) {
				this.html.meeting_info_show = false;
				// 先判断鼠标悬停处有没有会议 没有隐藏信息框 有则显示 过期的也不显示
				let t2 = this.html.block_list[row_index][col_index];
				if (t2 != 0 && t2 != 1) {
					let t = Object.entries(this.place_list[row_index].meetingList)[0][1];
					for (let i = 0; i < t.length; i++) {
						let start = t[i].startTime.split(' ')[1].split(':');
						let start_hour = +start[0];
						let start_minute = +start[1];
						let start_index = (start_hour - 6) * 2;
						if (start_minute == 30) {
							start_index++;
						}
						let end = t[i].endTime.split(' ')[1].split(':');
						let end_hour = +end[0];
						let end_minute = +end[1];
						let end_index = (end_hour - 6) * 2 - 1;
						if (end_minute == 30) {
							end_index++;
						}
						if (col_index >= start_index && col_index <= end_index) {
							let info = t[i];
							this.meeting_info.name = info.theme;
							this.meeting_info.start_time = info.startTime;
							this.meeting_info.end_time = info.endTime;
							switch (info.type) {
								case 0:
									this.meeting_info.type = '视频会议';
									break;
								case 1:
									this.meeting_info.type = '综合会议';
									break;
								case 2:
									this.meeting_info.type = '无纸化会议';
									break;
							}
							this.html.meeting_info_show = true;
							// 根据鼠标位置计算弹窗出现位置 当展示距离不够时 再相反位置出现
							let dom = document.querySelector('.meeting_info_box');
							let box_width = dom.offsetWidth;
							let box_height = dom.offsetHeight;
							if (event.clientX >= box_width) {
								dom.style.left = event.clientX - box_width + 'px';
							} else {
								dom.style.left = event.clientX + 'px';
							}
							let page = document.querySelector('#index');
							if (page.clientHeight - event.clientY >= box_height) {
								dom.style.top = event.clientY + 'px';
							} else {
								dom.style.top = event.clientY - box_height + 'px';
							}
							break;
						}
					}
				}
			}
		},
		// 鼠标滑动结束时 滑动事件条件置为false 并出现弹窗
		area_end() {
			if (this.start_move) {
				this.html.new_meeting = true;
				this.new_meeting_form.date = this.html.date;
				// 计算当前时间
				let t = Math.floor(this.col_index_start / 2) + 6;
				this.new_meeting_form.time_start = `${t}:00`;
				if (this.col_index_start % 2 != 0) {
					this.new_meeting_form.time_start = `${t}:30`;
				}
				let t2 = Math.floor((this.col_index_end + 1) / 2) + 6;
				this.new_meeting_form.time_end = `${t2}:00`;
				if ((this.col_index_end + 1) % 2 != 0) {
					this.new_meeting_form.time_end = `${t2}:30`;
				}
				this.change_reserve_type();
				this.new_meeting_form.name = '';
				this.new_meeting_form.method = 0;
				this.new_meeting_form.cus_week = [];
				this.new_meeting_form.reply = 0;
				this.new_meeting_form.sendMessage = 1;
				this.new_meeting_form.meetingReminds = [{ alert_time: '', type: 0 }];
				this.new_meeting_form.signIn = 1;
				this.new_meeting_form.summary = 1;
				this.new_meeting_form.search_person = [];
				this.new_meeting_form.cycle_deadline = '';
				this.new_meeting_form.files = [];
				this.html.form_loading = false;
				this.new_meeting_form.guestList = [];
			}
			this.start_move = false;
		},
		// 每次修改日期修改预定方式里的列表
		change_reserve_type() {
			// 获取选择的时间、星期和几号 并填入
			let curr_week;
			switch (this.new_meeting_form.date.getDay()) {
				case 0:
					curr_week = '天';
					break;
				case 1:
					curr_week = '一';
					break;
				case 2:
					curr_week = '二';
					break;
				case 3:
					curr_week = '三';
					break;
				case 4:
					curr_week = '四';
					break;
				case 5:
					curr_week = '五';
					break;
				case 6:
					curr_week = '六';
					break;
			}
			this.html.reserve_type = [
				'单次预约',
				`每天${this.new_meeting_form.time_start}~${this.new_meeting_form.time_end}`,
				`每周${curr_week}`,
				`每月${this.new_meeting_form.date.getDate()}号`,
				'每年(不可用)',
				`自定义`,
			];
		},
		// 提交新建会议表单 并刷新数据 关闭弹窗
		new_submit(form) {
			this.$refs.new_meeting.validate((result) => {
				let result2 = true;
				if (form.sendMessage == 1) {
					if (form.meetingReminds.length == 0) {
						result2 = false;
						this.$message.error('请添加提醒时间');
					} else {
						for (let i = 0; i < form.meetingReminds.length; i++) {
							if (!form.meetingReminds[i].alert_time) {
								this.$message.error('提醒时间不能为空');
								result2 = false;
								break;
							} else {
								for (let k = i + 1; k < form.meetingReminds.length; k++) {
									if (form.meetingReminds[i].alert_time == form.meetingReminds[k].alert_time) {
										this.$message.error('提醒时间不能重复');
										result2 = false;
										break;
									}
								}
								if (!result2) {
									break;
								}
							}
						}
					}
				}
				if (result && result2) {
					let data = {
						appointmentMode: form.method,
						reply: form.reply,
						roomId: this.place_list[this.row_index].id,
						sendMessage: form.sendMessage,
						signIn: form.signIn,
						summary: form.summary,
						theme: form.name,
						userIds: form.search_person,
						meetingFiles: form.files,
						meetingReminds: [],
						guestList: this.new_meeting_form.guestList,
						description: form.description,
					};
					if (form.method != 0) {
						// 周期截止
						let y = form.cycle_deadline.getFullYear();
						let m = form.cycle_deadline.getMonth() + 1 < 10 ? '0' + (form.cycle_deadline.getMonth() + 1) : form.cycle_deadline.getMonth() + 1;
						let d = form.cycle_deadline.getDate() < 10 ? '0' + form.cycle_deadline.getDate() : form.cycle_deadline.getDate();
						data.appointmentEndTime = `${y}-${m}-${d} 23:00:00`;
					}
					if (form.method == 5) {
						// 自定义周
						let t = form.cus_week.toString();
						data.appointmentPeriod = `${t}`;
					}
					// 开始结束时间
					let m = form.date.getMonth() + 1 < 10 ? '0' + (form.date.getMonth() + 1) : form.date.getMonth() + 1;
					let d = form.date.getDate() < 10 ? '0' + form.date.getDate() : form.date.getDate();
					data.endTime = `${form.date.getFullYear()}-${m}-${d} ${form.time_end}:00`;
					data.startTime = `${form.date.getFullYear()}-${m}-${d} ${form.time_start}:00`;
					// 提醒时间
					for (let i = 0; i < form.meetingReminds.length; i++) {
						let t2 = {};
						let t3 = form.meetingReminds[i];
						t2.remindTime = `${form.date.getFullYear()}-${m}-${d} ${t3.alert_time}:00`;
						t2.remindType = t3.type;
						data.meetingReminds.push(t2);
					}
					this.html.form_loading = true;
					this.request('post', meeting_reserve, this.token, data, (res) => {
						this.close_new();
						// this.col_index_start = this.col_index_end = null;
						this.req_room_list();
						// this.html.new_meeting = false;
						this.html.form_loading = false;
					});
				}
			});
		},
		close_new() {
			this.html.new_meeting = false;
			let l = this.col_index_end - this.col_index_start;
			for (let i = 0; i <= l; i++) {
				this.html.block_list2[this.row_index].splice(this.col_index_start + i, 1, 0);
			}
			this.col_index_start = this.col_index_end = null;
		},
		// 获取组织架构
		search_organiztion() {
			this.request('post', user_list, this.token, { condition: {}, pageNum: 1, pageSize: 9999999 }, (res) => {
				console.log('部门人员', res);
				if (res.data.head.code != 200) {
					return;
				}
				this.conferee_list = res.data.data.data;
			});
		},
		// 周期截止日期 配置项
		cycle_options() {
			return {
				disabledDate(curr_time) {
					return curr_time.getTime() < Date.now() - 86400000 || curr_time.getTime() > Date.now() + 86400000 * 90;
				},
			};
		},
		// 预约日期不能是当天之前的
		date_options() {
			return {
				disabledDate(curr_time) {
					return curr_time.getTime() < Date.now() - 86400000;
				},
			};
		},
		// 预约时间如果是当天，则不能选择当前时刻之前的
		// time_options(flag) {
		// 	let s = '06:00';
		// 	// 86400000是一天的毫秒数
		//   let t = {
		//     step: '00:30',
		// 		end: '23:00',
		//   }
		// 	if (Date.now() - this.new_meeting_form.date.getTime() < 86400000) {
		//     // 小于一天，认为是当天 获取当前时刻
		// 		if (flag == 'start') {
		// 		} else if (flag == 'end') {
		// 		}
		// 		let time = new Date().toString().split(' ')[4];
		// 		let time_list = time.split(':');
		// 		let hour = +time_list[0]; //+号使字符转变为数字
		// 		let minute = +time_list[1];
		// 		if (minute < 30) {
		// 			s = `${hour > 10 ? hour : '0' + hour}:30`;
		// 		} else {
		// 			s = `${++hour > 10 ? hour : '0' + hour}:00`;
		// 		}
		// 	}
		//   return t
		// 	return {
		// 		start: s,
		// 		// maxTime: this.new_meeting_form.time_end,
		// 	};
		// },
		// 删除上传文件时
		file_del(file, file_list) {
			let promise = this.$confirm(`确认删除 ${file.name} ？`);
			let index;
			for (let i = 0; i < file_list.length; i++) {
				if (file_list[i].uid == file.uid) {
					index = i;
					break;
				}
			}
			this.new_meeting_form.files.splice(index, 1);
			return promise;
		},
		// 上传文件返回的数据
		upload_result(res, file_list) {
			console.log('上传结果', res);
			this.new_meeting_form.files.push(res.data);
		},
		// 上传文件头部
		upload_header() {
			return {
				Authorization: `Bearer ${this.token}`,
				// 'content-type': 'application/json',
			};
		},
		// 鼠标移出位置时关闭弹窗
		close_meeting_info_box(event) {
			if (this.place_list.length == 0) {
				return;
			}
			if (event.clientX < this.first_block_position) {
				this.html.meeting_info_show = false;
				return;
			}
			let dom1 = document.querySelector('.time_line_box');
			let t = dom1.getBoundingClientRect().bottom;
			if (event.clientY < t) {
				this.html.meeting_info_show = false;
				return;
			}
			let dom2 = document.querySelectorAll('.place');
			let dom3 = dom2[dom2.length - 1];
			let t2 = dom3.getBoundingClientRect().bottom;
			if (event.clientY > t2) {
				this.html.meeting_info_show = false;
				return;
			}
		},
		// 添加提醒时间、方式
		add_alert_time() {
			if (this.new_meeting_form.meetingReminds.length < 3) {
				let t = {
					alert_time: '',
					type: 0,
				};
				this.new_meeting_form.meetingReminds.push(t);
			}
		},
		// 删除提醒
		del_alert_time(index) {
			this.new_meeting_form.meetingReminds.splice(index, 1);
		},
		// 改变是否提醒 清空数组
		change_info() {
			if (this.new_meeting_form.sendMessage == 0) {
				this.new_meeting_form.meetingReminds = [];
			}
		},
		// 上传来宾信息
		upload_click() {
			upload.click();
		},
		upload_visitor(e) {
			let file = e.target.files[0];
			let reader = new FileReader();
			reader.readAsBinaryString(file);
			reader.onload = (e2) => {
				try {
					let binary = e2.target.result;
					this.new_meeting_form.guestList = []; //在当前表单下有可能重复上传文件 每次要清空之前的列表
					let excel = XLSX.read(binary, { type: 'binary' });
					for (let sheet in excel.Sheets) {
						if (Object.prototype.hasOwnProperty.call(excel.Sheets, sheet)) {
							let single_sheet = XLSX.utils.sheet_to_json(excel.Sheets[sheet]);
							// 生成的是对象数组
							for (let val of single_sheet) {
								let t = Object.entries(val);
								let visitor = {
									guestName: t[0][1],
									guestPhone: t[1][1],
								};
								this.new_meeting_form.guestList.push(visitor);
							}
						}
					}
				} catch (err) {
					this.$message('只能上传Excel文件');
				}
			};
		},
		// 下载excel模板
		download() {
			axios({
				method: 'get',
				url: `${url}api-file/files/view/9ECD2E6B3A604EC5ADBD1A9852CFA67D.xlsx`,
				responseType: 'blob',
			}).then((res) => {
				// let b = new Blob([res.data], { type: 'application/vnd.ms-excel' });
				let a = document.createElement('a');
				a.href = URL.createObjectURL(res.data);
				a.target = '_blank';
				a.download = '模板';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			});
		},
		// 表单卡片样式
		form_style() {
			return {
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
				maxHeight: '86vh',
			};
		},
		// 鼠标焦点样式显示
		mouse_focus(event, top) {
			if (this.html.block_list[this.mouse.row_index][this.mouse.col_index] == 0) {
				this.mouse.focus = true;
				this.mouse.focus_top = this.block_top - top + 'px';
			} else {
				this.mouse.focus = false;
			}
		},
		// 鼠标焦点列样式
		mouse_position() {
			if (!this.mouse.enter || !this.time_box_array) {
				return;
			}
			let left = this.time_box_array[this.mouse.col_index].offsetLeft;
			return {
				width: this.block_width + 'px',
				height: this.mouse.height,
				top: this.mouse.top,
				left: left + 2 + 'px',
			};
		},
		// 鼠标焦点样式显示
		mouse_focus_show(event) {
			if (!this.after_area_enter) {
				return;
			}
			let top = document.querySelector('.time_line_box').getBoundingClientRect().bottom;
			let dom = document.querySelector('.meeting_boxs').getBoundingClientRect();
			let bottom = dom.bottom;
			let right = dom.right;
			if (event.clientX > this.first_block_position && event.clientX < right && event.clientY > top && event.clientY < bottom) {
				this.mouse.enter = true;
				// 在面板滑动时要计算行的值 列由时间块的mouseenter事件定位 mouseenter第一次定位行列肯定是准的
				// 但是在指示条滑动鼠标时 行发生变化 要计算这个值需要之前定位到的行值 与当前鼠标位置
				// this.block_top = this.time_box_array[this.mouse.row_index * 34 + this.mouse.col_index].getBoundingClientRect().top;
				//#region
				if (!this.block_top || this.mouse.row_index != this.mouse.row_index_old) {
					// 当行没有变化就不计算block_top减轻计算量;
					this.block_top = this.time_box_array[this.mouse.row_index * 34 + this.mouse.col_index].getBoundingClientRect().top;
					this.mouse.row_index_old = this.mouse.row_index;
				}
				//#endregion
				// 有两种情况 一种鼠标坐标小于block_top-10 行减少1
				// 另一种鼠标坐标比block_top大100 行增加1
				if (event.clientY <= this.block_top - 10) {
					--this.mouse.row_index;
				} else if (event.clientY - this.block_top >= 100) {
					++this.mouse.row_index;
				}
				// 指示条始终显示 但是焦点块只有在鼠标没有按下的时候才能显示
				if (!this.start_move) {
					this.mouse_focus(event, top);
					this.query_meeting_info(event, this.mouse.row_index, this.mouse.col_index);
				} else {
					this.mouse.focus = false;
				}
			} else {
				this.mouse.enter = false;
			}
		},
		// 鼠标指示条出现后 无法滚动因此要获取节点手动滚动
		focus_wheel(e) {
			let dom = document.querySelector('.meeting_boxs');
			let max = dom.scrollHeight - dom.clientHeight;
			if (e.wheelDelta < 0) {
				if (dom.scrollTop === max) {
					return;
				}
				this.mouse.focus = false;
				if (dom.scrollTop + 100 > max) {
					dom.scrollTop = max;
				} else {
					dom.scrollTop += 100;
					this.mouse.row_index++;
				}
			} else {
				if (dom.scrollTop === 0) {
					return;
				}
				this.mouse.focus = false;
				if (dom.scrollTop - 100 < 0) {
					dom.scrollTop = 0;
				} else {
					dom.scrollTop -= 100;
					this.mouse.row_index--;
				}
			}
		},
		// 浮动指示条上触发事件中转变量
		mouse_down() {
			this.area_start(this.mouse.row_index, this.mouse.col_index);
		},
	},
	computed: {
		// 由表单获取的来宾列表计算生成的文本
		guestList() {
			let text = '';
			let count = 0;
			for (let val of this.new_meeting_form.guestList) {
				count++;
				let t;
				if (count == this.new_meeting_form.guestList.length) {
					t = '';
				} else {
					t = '、';
				}
				text += `${val.guestName}(${val.guestPhone})${t}`;
			}
			return text;
		},
	},
});
