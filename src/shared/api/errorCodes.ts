// Generated from lab-system-cloud/contracts/errors.json.
export const errorCatalog = {
  "100001": {
    "name": "VALIDATION_FAILED",
    "code": 100001,
    "httpStatus": 400,
    "message": "请求参数不合法",
    "type": "VALIDATION",
    "domain": "common"
  },
  "100002": {
    "name": "INTERNAL_ERROR",
    "code": 100002,
    "httpStatus": 500,
    "message": "服务器内部错误",
    "type": "INTERNAL",
    "domain": "common"
  },
  "100003": {
    "name": "RESOURCE_NOT_FOUND",
    "code": 100003,
    "httpStatus": 404,
    "message": "资源不存在",
    "type": "NOT_FOUND",
    "domain": "common"
  },
  "100004": {
    "name": "BUSINESS_CONFLICT",
    "code": 100004,
    "httpStatus": 409,
    "message": "操作与当前状态冲突",
    "type": "CONFLICT",
    "domain": "common"
  },
  "100005": {
    "name": "DEPENDENCY_UNAVAILABLE",
    "code": 100005,
    "httpStatus": 503,
    "message": "下游服务暂不可用",
    "type": "DEPENDENCY",
    "domain": "common"
  },
  "100006": {
    "name": "RPC_TIMEOUT",
    "code": 100006,
    "httpStatus": 504,
    "message": "下游服务调用超时",
    "type": "DEPENDENCY",
    "domain": "common"
  },
  "100007": {
    "name": "INVALID_RPC_RESPONSE",
    "code": 100007,
    "httpStatus": 502,
    "message": "下游服务返回无效响应",
    "type": "DEPENDENCY",
    "domain": "common"
  },
  "100008": {
    "name": "BUSINESS_FAILED",
    "code": 100008,
    "httpStatus": 422,
    "message": "业务处理失败",
    "type": "BUSINESS",
    "domain": "common"
  },
  "100009": {
    "name": "NETWORK_ERROR",
    "code": 100009,
    "httpStatus": 0,
    "message": "网络连接失败，请检查网络",
    "type": "DEPENDENCY",
    "domain": "common"
  },
  "100010": {
    "name": "REQUEST_TIMEOUT",
    "code": 100010,
    "httpStatus": 0,
    "message": "请求超时，请稍后重试",
    "type": "DEPENDENCY",
    "domain": "common"
  },
  "100011": {
    "name": "REQUEST_CANCELLED",
    "code": 100011,
    "httpStatus": 0,
    "message": "请求已取消",
    "type": "BUSINESS",
    "domain": "common"
  },
  "110001": {
    "name": "AUTHENTICATION_REQUIRED",
    "code": 110001,
    "httpStatus": 401,
    "message": "登录已过期，请重新登录",
    "type": "AUTHENTICATION",
    "domain": "common"
  },
  "110002": {
    "name": "PERMISSION_DENIED",
    "code": 110002,
    "httpStatus": 403,
    "message": "无权执行此操作",
    "type": "AUTHORIZATION",
    "domain": "common"
  },
  "110003": {
    "name": "AUTH_CONFIGURATION_ERROR",
    "code": 110003,
    "httpStatus": 500,
    "message": "权限配置异常",
    "type": "INTERNAL",
    "domain": "common"
  },
  "130001": {
    "name": "MQTT_DEVICE_TIMEOUT",
    "code": 130001,
    "httpStatus": 504,
    "message": "设备响应超时，请检查设备连接",
    "type": "DEPENDENCY",
    "domain": "common"
  },
  "130002": {
    "name": "MQTT_REQUEST_INTERRUPTED",
    "code": 130002,
    "httpStatus": 503,
    "message": "设备请求被中断",
    "type": "DEPENDENCY",
    "domain": "common"
  },
  "120101": {
    "name": "LABORATORY_NOT_FOUND",
    "code": 120101,
    "httpStatus": 404,
    "message": "实验室不存在",
    "type": "NOT_FOUND",
    "domain": "base"
  },
  "120102": {
    "name": "LABORATORY_MEMBER_NOT_FOUND",
    "code": 120102,
    "httpStatus": 400,
    "message": "可见成员中包含不存在的用户",
    "type": "VALIDATION",
    "domain": "base"
  },
  "120103": {
    "name": "LABORATORY_ID_REQUIRED",
    "code": 120103,
    "httpStatus": 400,
    "message": "实验室 ID 不能为空",
    "type": "VALIDATION",
    "domain": "base"
  },
  "120104": {
    "name": "USER_NOT_FOUND",
    "code": 120104,
    "httpStatus": 404,
    "message": "用户不存在",
    "type": "NOT_FOUND",
    "domain": "base"
  },
  "120105": {
    "name": "USER_DISABLED",
    "code": 120105,
    "httpStatus": 403,
    "message": "该用户不允许使用系统，请联系管理员",
    "type": "AUTHORIZATION",
    "domain": "base"
  },
  "120106": {
    "name": "INVALID_CREDENTIALS",
    "code": 120106,
    "httpStatus": 403,
    "message": "用户名或密码错误",
    "type": "AUTHORIZATION",
    "domain": "base"
  },
  "120107": {
    "name": "USER_ID_REQUIRED",
    "code": 120107,
    "httpStatus": 400,
    "message": "用户 ID 不能为空",
    "type": "VALIDATION",
    "domain": "base"
  },
  "120108": {
    "name": "USER_NAME_CONFLICT",
    "code": 120108,
    "httpStatus": 403,
    "message": "该姓名已被使用",
    "type": "AUTHORIZATION",
    "domain": "base"
  },
  "120109": {
    "name": "CONTACT_LOGIN_ASSIGNMENT_FORBIDDEN",
    "code": 120109,
    "httpStatus": 400,
    "message": "联系人不能通过用户更新接口分配登录信息或权限",
    "type": "VALIDATION",
    "domain": "base"
  },
  "120110": {
    "name": "SELF_DELETION_FORBIDDEN",
    "code": 120110,
    "httpStatus": 400,
    "message": "不能删除当前登录用户",
    "type": "VALIDATION",
    "domain": "base"
  },
  "120111": {
    "name": "CONTACT_NOT_FOUND",
    "code": 120111,
    "httpStatus": 404,
    "message": "用户或联系人不存在",
    "type": "NOT_FOUND",
    "domain": "base"
  },
  "160101": {
    "name": "BI_TIME_DIMENSION_REQUIRED",
    "code": 160101,
    "httpStatus": 400,
    "message": "统计时间维度不能为空",
    "type": "VALIDATION",
    "domain": "bi"
  },
  "160102": {
    "name": "BI_CURRENT_SEMESTER_NOT_FOUND",
    "code": 160102,
    "httpStatus": 404,
    "message": "当前日期不在任何有效学期内",
    "type": "NOT_FOUND",
    "domain": "bi"
  },
  "150101": {
    "name": "SEMESTER_NAME_CONFLICT",
    "code": 150101,
    "httpStatus": 409,
    "message": "学期名称已存在",
    "type": "CONFLICT",
    "domain": "edu"
  },
  "150102": {
    "name": "SEMESTER_NOT_FOUND",
    "code": 150102,
    "httpStatus": 404,
    "message": "学期不存在",
    "type": "NOT_FOUND",
    "domain": "edu"
  },
  "150103": {
    "name": "SEMESTER_HAS_TIMETABLES",
    "code": 150103,
    "httpStatus": 409,
    "message": "该学期仍有课表记录，请先清理课表",
    "type": "CONFLICT",
    "domain": "edu"
  },
  "150104": {
    "name": "SEMESTER_NAME_INVALID",
    "code": 150104,
    "httpStatus": 400,
    "message": "学期名称格式应为 YYYY-YYYY 第N学期",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150105": {
    "name": "SEMESTER_DATES_REQUIRED",
    "code": 150105,
    "httpStatus": 400,
    "message": "学期开始日期和结束日期不能为空",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150106": {
    "name": "SEMESTER_DATE_RANGE_INVALID",
    "code": 150106,
    "httpStatus": 400,
    "message": "学期开始日期必须早于结束日期",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150107": {
    "name": "TIMETABLE_NOT_FOUND",
    "code": 150107,
    "httpStatus": 404,
    "message": "课表不存在",
    "type": "NOT_FOUND",
    "domain": "edu"
  },
  "150108": {
    "name": "TIMETABLE_WEEK_TYPE_REQUIRED",
    "code": 150108,
    "httpStatus": 400,
    "message": "周次类型不能为空",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150109": {
    "name": "TIMETABLE_WEEK_RANGE_INVALID",
    "code": 150109,
    "httpStatus": 400,
    "message": "周次范围不合法",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150110": {
    "name": "TIMETABLE_PERIOD_RANGE_INVALID",
    "code": 150110,
    "httpStatus": 400,
    "message": "节次超出允许范围",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150111": {
    "name": "TIMETABLE_TIME_RANGE_INVALID",
    "code": 150111,
    "httpStatus": 400,
    "message": "上课开始时间必须早于结束时间",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150112": {
    "name": "TIMETABLE_WEEKDAY_INVALID",
    "code": 150112,
    "httpStatus": 400,
    "message": "weekday 必须在 1 到 7 之间",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150113": {
    "name": "TIMETABLE_CONFLICT",
    "code": 150113,
    "httpStatus": 409,
    "message": "课程安排冲突",
    "type": "CONFLICT",
    "domain": "edu"
  },
  "150114": {
    "name": "TIMETABLE_IMPORT_PARSE_FAILED",
    "code": 150114,
    "httpStatus": 400,
    "message": "Excel 文件无法解析",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150115": {
    "name": "TIMETABLE_IMPORT_CELL_INVALID",
    "code": 150115,
    "httpStatus": 400,
    "message": "格式应为：课程名称<>时间信息<>教师名称",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150116": {
    "name": "TIMETABLE_COURSE_TEACHER_REQUIRED",
    "code": 150116,
    "httpStatus": 400,
    "message": "课程名称和教师名称不能为空",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150117": {
    "name": "TIMETABLE_IMPORT_TIME_INVALID",
    "code": 150117,
    "httpStatus": 400,
    "message": "时间格式应为 X-Y周[节次或时间]",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150118": {
    "name": "TIMETABLE_IMPORT_WEEK_INVALID",
    "code": 150118,
    "httpStatus": 400,
    "message": "周次数字不合法",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150119": {
    "name": "TIMETABLE_IMPORT_TIME_RANGE_INVALID",
    "code": 150119,
    "httpStatus": 400,
    "message": "开始时间必须早于结束时间",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150120": {
    "name": "TIMETABLE_IMPORT_TIME_VALUE_INVALID",
    "code": 150120,
    "httpStatus": 400,
    "message": "时间值不合法",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150121": {
    "name": "TIMETABLE_IMPORT_TIME_DETAIL_INVALID",
    "code": 150121,
    "httpStatus": 400,
    "message": "时间详情应为 X-Y节 或 HH:mm-HH:mm",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150122": {
    "name": "TIMETABLE_IMPORT_EXTENSION_INVALID",
    "code": 150122,
    "httpStatus": 400,
    "message": "仅支持 .xlsx 或 .xls 文件",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150123": {
    "name": "TIMETABLE_IMPORT_EMPTY",
    "code": 150123,
    "httpStatus": 400,
    "message": "Excel 文件不能为空",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150124": {
    "name": "TIMETABLE_IMPORT_TOO_LARGE",
    "code": 150124,
    "httpStatus": 400,
    "message": "Excel 文件超过大小限制",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150125": {
    "name": "TIMETABLE_IMPORT_FORMAT_INVALID",
    "code": 150125,
    "httpStatus": 400,
    "message": "文件内容不是有效的 Excel 格式",
    "type": "VALIDATION",
    "domain": "edu"
  },
  "150126": {
    "name": "LABORATORY_ACCESS_DENIED",
    "code": 150126,
    "httpStatus": 403,
    "message": "无权访问该实验室",
    "type": "AUTHORIZATION",
    "domain": "edu"
  },
  "130101": {
    "name": "MQTT_DEVICE_TYPE_IMMUTABLE",
    "code": 130101,
    "httpStatus": 400,
    "message": "设备类型不能修改",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130102": {
    "name": "MQTT_DEVICE_ID_REQUIRED",
    "code": 130102,
    "httpStatus": 400,
    "message": "设备 ID 不能为空",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130103": {
    "name": "MQTT_DEVICE_NOT_FOUND",
    "code": 130103,
    "httpStatus": 404,
    "message": "设备不存在",
    "type": "NOT_FOUND",
    "domain": "mqtt"
  },
  "130104": {
    "name": "MQTT_DEVICE_TYPE_REQUIRED",
    "code": 130104,
    "httpStatus": 400,
    "message": "设备类型不能为空",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130105": {
    "name": "MQTT_GATEWAY_ID_REQUIRED",
    "code": 130105,
    "httpStatus": 400,
    "message": "网关 ID 不能为空",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130107": {
    "name": "MQTT_DEVICE_NAME_REQUIRED",
    "code": 130107,
    "httpStatus": 400,
    "message": "设备名称不能为空",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130108": {
    "name": "MQTT_DEVICE_MODEL_MISMATCH",
    "code": 130108,
    "httpStatus": 400,
    "message": "设备类型与型号不匹配",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130109": {
    "name": "MQTT_DEVICE_ADDRESS_INVALID",
    "code": 130109,
    "httpStatus": 400,
    "message": "设备地址超出允许范围",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130110": {
    "name": "MQTT_DEVICE_SELF_ID_INVALID",
    "code": 130110,
    "httpStatus": 400,
    "message": "设备内部 ID 不能为负数",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130111": {
    "name": "MQTT_GATEWAY_HAS_DEVICES",
    "code": 130111,
    "httpStatus": 409,
    "message": "网关下仍有设备，不能删除",
    "type": "CONFLICT",
    "domain": "mqtt"
  },
  "130112": {
    "name": "MQTT_GATEWAY_NOT_FOUND",
    "code": 130112,
    "httpStatus": 404,
    "message": "网关不存在",
    "type": "NOT_FOUND",
    "domain": "mqtt"
  },
  "130113": {
    "name": "MQTT_GATEWAY_REQUIRED",
    "code": 130113,
    "httpStatus": 400,
    "message": "网关不能为空",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130114": {
    "name": "MQTT_GATEWAY_TOPICS_REQUIRED",
    "code": 130114,
    "httpStatus": 400,
    "message": "网关主题不能为空",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130116": {
    "name": "MQTT_TARGETS_REQUIRED",
    "code": 130116,
    "httpStatus": 400,
    "message": "至少需要选择一台设备",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130117": {
    "name": "MQTT_TOO_MANY_TARGETS",
    "code": 130117,
    "httpStatus": 400,
    "message": "单次批量控制最多支持 20 台设备",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130119": {
    "name": "MQTT_DEVICE_ACCESS_DENIED",
    "code": 130119,
    "httpStatus": 403,
    "message": "无权控制该实验室设备",
    "type": "AUTHORIZATION",
    "domain": "mqtt"
  },
  "130120": {
    "name": "MQTT_DEVICE_TYPE_MISMATCH",
    "code": 130120,
    "httpStatus": 400,
    "message": "设备类型与实际设备不匹配",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "140101": {
    "name": "STRATEGY_ALREADY_EXISTS",
    "code": 140101,
    "httpStatus": 409,
    "message": "策略已存在",
    "type": "CONFLICT",
    "domain": "rule"
  },
  "140102": {
    "name": "STRATEGY_NOT_FOUND",
    "code": 140102,
    "httpStatus": 404,
    "message": "策略不存在",
    "type": "NOT_FOUND",
    "domain": "rule"
  },
  "130121": {
    "name": "MQTT_POLL_TASK_INVALID",
    "code": 130121,
    "httpStatus": 400,
    "message": "无法为该设备创建轮询任务",
    "type": "VALIDATION",
    "domain": "mqtt"
  },
  "130122": {
    "name": "MQTT_POLL_UPDATE_FAILED",
    "code": 130122,
    "httpStatus": 500,
    "message": "设备轮询状态更新失败",
    "type": "INTERNAL",
    "domain": "mqtt"
  }
} as const

export const ErrorCode = {
  "VALIDATION_FAILED": 100001,
  "INTERNAL_ERROR": 100002,
  "RESOURCE_NOT_FOUND": 100003,
  "BUSINESS_CONFLICT": 100004,
  "DEPENDENCY_UNAVAILABLE": 100005,
  "RPC_TIMEOUT": 100006,
  "INVALID_RPC_RESPONSE": 100007,
  "BUSINESS_FAILED": 100008,
  "NETWORK_ERROR": 100009,
  "REQUEST_TIMEOUT": 100010,
  "REQUEST_CANCELLED": 100011,
  "AUTHENTICATION_REQUIRED": 110001,
  "PERMISSION_DENIED": 110002,
  "AUTH_CONFIGURATION_ERROR": 110003,
  "MQTT_DEVICE_TIMEOUT": 130001,
  "MQTT_REQUEST_INTERRUPTED": 130002,
  "LABORATORY_NOT_FOUND": 120101,
  "LABORATORY_MEMBER_NOT_FOUND": 120102,
  "LABORATORY_ID_REQUIRED": 120103,
  "USER_NOT_FOUND": 120104,
  "USER_DISABLED": 120105,
  "INVALID_CREDENTIALS": 120106,
  "USER_ID_REQUIRED": 120107,
  "USER_NAME_CONFLICT": 120108,
  "CONTACT_LOGIN_ASSIGNMENT_FORBIDDEN": 120109,
  "SELF_DELETION_FORBIDDEN": 120110,
  "CONTACT_NOT_FOUND": 120111,
  "BI_TIME_DIMENSION_REQUIRED": 160101,
  "BI_CURRENT_SEMESTER_NOT_FOUND": 160102,
  "SEMESTER_NAME_CONFLICT": 150101,
  "SEMESTER_NOT_FOUND": 150102,
  "SEMESTER_HAS_TIMETABLES": 150103,
  "SEMESTER_NAME_INVALID": 150104,
  "SEMESTER_DATES_REQUIRED": 150105,
  "SEMESTER_DATE_RANGE_INVALID": 150106,
  "TIMETABLE_NOT_FOUND": 150107,
  "TIMETABLE_WEEK_TYPE_REQUIRED": 150108,
  "TIMETABLE_WEEK_RANGE_INVALID": 150109,
  "TIMETABLE_PERIOD_RANGE_INVALID": 150110,
  "TIMETABLE_TIME_RANGE_INVALID": 150111,
  "TIMETABLE_WEEKDAY_INVALID": 150112,
  "TIMETABLE_CONFLICT": 150113,
  "TIMETABLE_IMPORT_PARSE_FAILED": 150114,
  "TIMETABLE_IMPORT_CELL_INVALID": 150115,
  "TIMETABLE_COURSE_TEACHER_REQUIRED": 150116,
  "TIMETABLE_IMPORT_TIME_INVALID": 150117,
  "TIMETABLE_IMPORT_WEEK_INVALID": 150118,
  "TIMETABLE_IMPORT_TIME_RANGE_INVALID": 150119,
  "TIMETABLE_IMPORT_TIME_VALUE_INVALID": 150120,
  "TIMETABLE_IMPORT_TIME_DETAIL_INVALID": 150121,
  "TIMETABLE_IMPORT_EXTENSION_INVALID": 150122,
  "TIMETABLE_IMPORT_EMPTY": 150123,
  "TIMETABLE_IMPORT_TOO_LARGE": 150124,
  "TIMETABLE_IMPORT_FORMAT_INVALID": 150125,
  "LABORATORY_ACCESS_DENIED": 150126,
  "MQTT_DEVICE_TYPE_IMMUTABLE": 130101,
  "MQTT_DEVICE_ID_REQUIRED": 130102,
  "MQTT_DEVICE_NOT_FOUND": 130103,
  "MQTT_DEVICE_TYPE_REQUIRED": 130104,
  "MQTT_GATEWAY_ID_REQUIRED": 130105,
  "MQTT_DEVICE_NAME_REQUIRED": 130107,
  "MQTT_DEVICE_MODEL_MISMATCH": 130108,
  "MQTT_DEVICE_ADDRESS_INVALID": 130109,
  "MQTT_DEVICE_SELF_ID_INVALID": 130110,
  "MQTT_GATEWAY_HAS_DEVICES": 130111,
  "MQTT_GATEWAY_NOT_FOUND": 130112,
  "MQTT_GATEWAY_REQUIRED": 130113,
  "MQTT_GATEWAY_TOPICS_REQUIRED": 130114,
  "MQTT_TARGETS_REQUIRED": 130116,
  "MQTT_TOO_MANY_TARGETS": 130117,
  "MQTT_DEVICE_ACCESS_DENIED": 130119,
  "MQTT_DEVICE_TYPE_MISMATCH": 130120,
  "STRATEGY_ALREADY_EXISTS": 140101,
  "STRATEGY_NOT_FOUND": 140102,
  "MQTT_POLL_TASK_INVALID": 130121,
  "MQTT_POLL_UPDATE_FAILED": 130122
} as const
