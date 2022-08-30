let url = `${我是接口地址}/`;
let room_list = `${url}api-portal/room/search/time`;
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
			year: '', //页面显示时间
			month: '',
			day: '',
			week: '',
			date: '',
			search_meeting: '', //搜索会议名
			new_meeting: false, //新增会议弹窗
			throttle_flag: false, //节流方法标识
			loading: true, //页面初始加载
			reserve_type: [], //预约方式选项
			week_options: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'], // 自定义星期选择
			bool_options: ['否', '是'],
			meeting_info_show: false, //会议信息显示
			meeting_infos: ['会议主题', '开始时间', '结束时间', '类型'],
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
		conferee_list: [], //参会人员列表
		file: {
			url: upload_files, //上传地址
			list: [], //文件列表
		},
	},
	mounted() {
		if (!location.search) {
			this.token = sessionStorage.token;
		} else {
			this.get_token();
		}
		// 获取当前时间
		this.display_time(new Date());
		window.onresize = () => {
			this.get_boundary();
		};
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
				if (res.data == null || res.data.data == null) {
					this.$message.info('当前用户下无会议室');
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
		query_block_status(place_obj, time_index) {
			// time_index从0开始
			let array = place_obj.meetingList;
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
					if (array[i].timeType == 0) {
						return 1;
					} else if (array[i].timeType == 1) {
						return 2;
					}
				}
			}
			// 0表示空闲 1表示已过期 2表示已预定
			return 0;
		},
		// 组装二维矩阵 控制方块显示
		block_status() {
			this.html.block_list = [];
			for (let i = 0; i < this.place_list.length; i++) {
				let t = [];
				for (let j = 0; j < 38; j++) {
					t[j] = this.query_block_status(this.place_list[i], j);
				}
				this.html.block_list.push(t);
			}
			this.$nextTick(() => {
				// this.add_exist_meeting_style();
				this.get_boundary();
				// vue在页面所需数组未请求回来时 不会渲染 因此找不到数组节点
				this.first_block_position = document.querySelector('.time_box').getBoundingClientRect().left;
			});
		},
		get_boundary() {
			let time = new Date().toString().split(' ')[4];
			let time_list = time.split(':');
			let hour = +time_list[0];
			let minute = +time_list[1];
			// 首先找到当前时间所在方格
			let boundary = (hour - 6) * 2;
			// 计算分钟在一小时间隔中位置
			let per = minute / 60;
			let block_position = document.querySelectorAll('.time_box')[boundary].offsetLeft;
			this.block_width = document.querySelector('.time_box').offsetWidth;
			let offset = per * (this.block_width * 2) + block_position;
			let dom = document.querySelector('.current_time');
			dom.style.left = `${offset}px`;
		},
		//#region
		// add_exist_meeting_style() {
		// 	this.dom_list = document.querySelectorAll('.time_box');
		// 	for (let i = 0; i < this.html.block_list.length; i++) {
		// 		let start_num = 0;
		// 		let t = this.html.block_list[i];
		// 		for (let j = 0; j < t.length; j++) {
		// 			if (t[j] != start_num && t[j] != 0) {
		// 				start_num = t[j];
		// 				let child = this.dom_list[i * 34 + j].children;
		// 				for (let k = 0; k < child.length; k++) {
		// 					if (child[k].style.display != 'none') {
		// 						child[k].classList.add('color_start');
		// 					}
		// 				}
		// 			} else if (t[j] != start_num && t[j] == 0) {
		// 				start_num = t[j];
		// 				let child = this.dom_list[i * 34 + j - 1].children;
		// 				for (let k = 0; k < child.length; k++) {
		// 					if (child[k].style.display != 'none') {
		// 						child[k].classList.add('color_end');
		// 					}
		// 				}
		// 			}
		// 		}
		// 	}
		// },
		//#endregion
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
			this.req_room_list();
		},
		// 鼠标点下时 只有在当前时间后的才能框选
		//#region
		// area_start(e) {
		// 	this.mouse_start = e.pageX; //鼠标只能往后拖
		// 	let mouse_position = this.mouse_start - this.first_block_position;
		// 	let boundary = parseInt(document.querySelector('.current_time').style.left) - 200;
		// 	if (mouse_position >= boundary) {
		// 		// 查看鼠标点击位置方块是否已经有值
		// 		this.col_index_start = Math.floor(mouse_position / this.block_width);
		// 		let parent_position = document.querySelector('.meeting_boxs').getBoundingClientRect().top;
		// 		let mouse_y = e.pageY;
		// 		this.row_index = Math.floor((mouse_y - parent_position) / 70);
		// 		if (this.html.block_list[this.row_index][this.col_index_start] == 0) {
		// 			this.start_move = true;
		// 			// 将色块状态改为3 表示选中 在取消创建会议时恢复状态为0
		// 			this.html.block_list[this.row_index].splice(this.col_index_start, 1, 3);
		// 			let child = this.dom_list[this.row_index * 34 + this.col_index_start].children;
		// 			child[2].classList.add('color_start', 'color_end');
		// 		}
		// 	}
		// },
		//#endregion
		area_start(e) {
			this.mouse_start = e.pageX; //鼠标只能往后拖
			let mouse_position = this.mouse_start - this.first_block_position + 10; //10是边框带来的偏差值
			let boundary = parseInt(document.querySelector('.current_time').style.left) - 200;
			if (mouse_position >= boundary) {
				// 查看鼠标点击位置方块是否已经有值
				let col_index_start = Math.floor(mouse_position / this.block_width);
				let parent_position = document.querySelector('.meeting_boxs').getBoundingClientRect().top;
				let mouse_y = e.pageY;
				this.row_index = Math.floor((mouse_y - parent_position) / 70); // 从0开始
				if (this.html.block_list[this.row_index][col_index_start] == 0) {
					this.start_move = true;
					this.col_index_start = col_index_start;
					this.col_index_end = col_index_start;
					// 将色块状态改为3 表示选中 在取消创建会议时恢复状态为0
					this.html.block_list[this.row_index].splice(col_index_start, 1, 3);
				}
			}
		},
		// 鼠标滑动时 将开始的end样式去除 给末尾的添加end样式
		//#region
		// area_over(e) {
		// 	let mouse_x = e.pageX;
		// 	if (this.start_move && mouse_x > this.mouse_start) {
		// 		let mouse_position = mouse_x - this.first_block_position;
		// 		this.col_index_end = Math.floor(mouse_position / this.block_width);
		// 		let current_block_position = this.dom_list[this.row_index * 34 + this.col_index_end].getBoundingClientRect().left;
		// 		if (current_block_position > this.mouse_start) {
		// 			this.mouse_start = current_block_position;
		// 			// 已经进入到了新的方块 把当前的置为3
		// 			this.html.block_list[this.row_index].splice(this.col_index_end, 1, 3);
		// 			let child = this.dom_list[this.row_index * 34 + this.col_index_end].children;
		// 			child[2].classList.add('color_end');
		// 			// 清除上一个的样式
		// 			let child2 = this.dom_list[this.row_index * 34 + this.col_index_end - 1].children;
		// 			child2[2].classList.remove('color_end');
		// 		}
		// 	}
		// },
		// area_over(e) {
		// 	let mouse_x = e.pageX;
		// 	if (this.start_move && mouse_x > this.mouse_start) {
		// 		let mouse_position = mouse_x - this.first_block_position;
		// 		this.col_index_end = Math.floor(mouse_position / this.block_width);
		// 		if (this.col_index_end > this.col_index_start) {
		// 			let child = this.dom_list[this.row_index * 34 + this.col_index_start].children;
		// 			child[2].className = 'area_box color_start';
		// 			let child2 = this.dom_list[this.row_index * 34 + this.col_index_end].children;
		// 			child2[2].className = 'area_box color_end';
		// 			let l = this.col_index_end - this.col_index_start;
		// 			for (let i = 0; i <= l; i++) {
		// 				if (i != 0 && i != l) {
		// 					this.dom_list[this.row_index * 34 + this.col_index_start + i].children[2].className = 'area_box';
		// 				}
		// 				this.html.block_list[this.row_index].splice(this.col_index_start + i, 1, 3);
		// 			}
		// 		}
		// 	}
		// },
		//#endregion
		area_over(e) {
			let mouse_x = e.pageX;
			if (this.start_move && mouse_x > this.mouse_start) {
				let mouse_position = mouse_x - this.first_block_position;
				this.col_index_end = Math.floor(mouse_position / this.block_width);
				let l = this.col_index_end - this.col_index_start;
				for (let i = 0; i <= l; i++) {
					this.html.block_list[this.row_index].splice(this.col_index_start + i, 1, 3);
				}
				if (this.col_index_end >= this.col_index_start) {
					for (let i = 1; i < 34 - this.col_index_end; i++) {
						if (this.html.block_list[this.row_index][this.col_index_end + i] == 3) {
							this.html.block_list[this.row_index].splice(this.col_index_end + i, 1, 0);
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
				// 获取当前时间、星期和几号 并填入
				let curr_week;
				switch (new Date().getDay()) {
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
					`每月${new Date().getDate()}号`,
					'每年(不可用)',
					`自定义`,
				];
				this.new_meeting_form.name = '';
				this.new_meeting_form.method = 0;
				this.new_meeting_form.cus_week = [];
				this.new_meeting_form.reply = 0;
				this.new_meeting_form.sendMessage = 1;
				this.new_meeting_form.signIn = 1;
				this.new_meeting_form.summary = 1;
				this.new_meeting_form.search_person = [];
				this.new_meeting_form.cycle_deadline = '';
				this.new_meeting_form.files = [];
			}
			this.start_move = false;
		},
		// 提交新建会议表单 并刷新数据 关闭弹窗
		new_submit(form) {
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
			this.request('post', meeting_reserve, this.token, data, () => {
				this.col_index_start = this.col_index_end = null;
				this.req_room_list();
				this.html.new_meeting = false;
			});
		},
		close_new() {
			this.html.new_meeting = false;
			//#region
			// let child = this.dom_list[this.row_index * 34 + this.col_index_start].children;
			// child[2].classList.remove('color_start');
			// let child2 = this.dom_list[this.row_index * 34 + this.col_index_end].children;
			// child2[2].classList.remove('color_end');
			//#endregion
			let l = this.col_index_end - this.col_index_start;
			for (let i = 0; i <= l; i++) {
				this.html.block_list[this.row_index].splice(this.col_index_start + i, 1, 0);
			}
			this.col_index_start = this.col_index_end = null;
		},
		// 获取组织架构
		search_organiztion() {
			this.request('post', user_list, this.token, { condition: {}, pageNum: 1, pageSize: 9999999 }, (res) => {
				console.log('部门人员', res);
				if (res.data.data == null) {
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
		// 鼠标悬浮时显示其下会议信息
		query_meeting_info(event, row_index, col_index) {
			if (!this.start_move) {
				// 先判断鼠标悬停处有没有会议 没有隐藏信息框 有则显示
				this.html.meeting_info_show = false;
				if (this.html.block_list[row_index][col_index] != 0) {
					let t = this.place_list[row_index].meetingList;
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
		// 鼠标移出位置时关闭弹窗
		close_meeting_info_box(event) {
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
	},
});
