new Vue({
	el: '#index',
	mixins: [common_functions],
	data: {
		html: {
			layout6_select: 0,
			layout7: [
				{ name: 'name1', time: '14:23' },
				{ name: 'name2', time: '14:23' },
				{ name: 'name3', time: '14:23' },
				{ name: 'name4', time: '14:23' },
				{ name: 'name5', time: '14:23' },
				{ name: 'name5', time: '14:23' },
				{ name: 'name5', time: '14:23' },
				{ name: 'name5', time: '14:23' },
			],
			layout8: [
				{ name: 'name1', time: '14:23', room: '物联网会议室' },
				{ name: 'name2', time: '14:23', room: '物联网会议室' },
				{ name: 'name3', time: '14:23', room: '物联网会议室' },
				{ name: 'name4', time: '14:23', room: '物联网会议室' },
				{ name: 'name5', time: '14:23', room: '物联网会议室' },
			],
		},
	},
	methods: {},
});
