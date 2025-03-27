// 类型定义
export interface SearchProps {
	[key: string]: any
}

// 新增类型定义
interface ActionContext {
	emit: (event: string, ...args: any[]) => void
}

export interface Column {
	// 基础属性
	prop?: string
	label: string
	width?: string | number
	align?: 'left' | 'center' | 'right'
	fixed?: boolean | 'left' | 'right'
	sortable?: boolean | 'custom'
	className?: string
	type?: 'selection' | 'index' | 'expand' // 扩展原生支持的特殊类型
	index?: number | ((index: number) => number) // 序号列配置
	selectable?: (row: any, index: number) => boolean // 选择是否禁用
	reserveSelection?: boolean // 是否保留选中状态

	// 自定义扩展
	searchable?: boolean
	searchType?: 'input' | 'select' | 'date'
	searchProps?: SearchProps
	render?: (row: any) => VNode
	handler?: (row: any, context: ActionContext) => VNode | void

	// 多级表头
	children?: Column[]

	// 行内编辑
	editable?: boolean;
	editComponent?: 'input' | 'select' | 'date' | 'custom';
	editProps?: Record<string, any>;
	editRules?: Array<(value: any) => boolean | string>;
	customEditComponent?: any; // 自定义编辑组件


	// 其他原生属性
	[key: string]: any
}

// 批量操作类型
export interface BatchAction {
	label: string;
	name: string;
	handler: (rows: any[]) => void;
	icon?: string;
	danger?: boolean;
}

export interface RequestParams {
	page: number
	pageSize: number
	[key: string]: any
}
