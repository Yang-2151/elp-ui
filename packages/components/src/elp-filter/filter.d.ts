export interface FilterItem {
    component: string, // 组件名称
    label: string, // 标签名称
    prop: string, //绑定的属性
    default: string | number | boolean | Array<any>, // 默认值
    placeholder?: string, // 占位符
    options?: Array<{
        label: string,
        value: string | number
    }>,
    [propsName: string]: any

}