<template>
    <el-form :model="form" ref="formRef" label-position="right">
        <div class="filter-container">
            <div class="grid-wrapper">
                <!-- 表单项容器 -->
                <div class="grid-container" :style="gridStyle">
                    <template v-for="(item, index) in visibleItems" :key="item.prop">
                        <el-form-item :label-width="columnWidths[getColumnIndex(index)] + 'px'" :prop="item.prop">
                            <!-- 添加label的ref收集 -->
                            <template #label>
                                <span :ref="(el:any) => collectLabelRef(el, index)" style="padding-right:10px">{{ item.label
                                    || '标签' }}</span>
                            </template>
                            <component v-model="form[item.prop]" :clearable="item.clearable || true"
                                :placeholder="item.placeholder || item.component === 'el-input' || item.component === 'el-input-number' ? `请输入${item.label}` : `请选择${item.label}`"
                                v-bind="item" :is="item.component || 'el-input'">
                                <!-- 处理下拉框 -->
                                <template v-if="item.component === 'el-select'">
                                    <el-option v-for="option in item.options" :key="option.value" :label="option.label"
                                        :value="option.value" />
                                </template>
                                <!-- 处理单选框 -->
                                <template v-if="item.component === 'el-radio-group'">
                                    <el-radio v-for="option in item.options" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </el-radio>
                                </template>
                                <!-- 处理多选框 -->
                                <template v-if="item.component === 'el-checkbox-group'">
                                    <el-checkbox v-for="option in item.options" :key="option.value"
                                        :value="option.value" :label="option.label" />
                                </template>
                            </component>
                        </el-form-item>
                    </template>

                    <!-- 操作按钮组 -->
                    <div class="action-group" :style="actionGroupStyle" v-if="props.isBtnShow">
                        <el-button type="primary" @click="handleQuery">查询</el-button>
                        <el-button @click="handleReset">重置</el-button>
                        <el-button v-if="showExpand" link type="primary" @click="toggleExpand">
                            {{ isExpanded ? '收起筛选' : '高级筛选' }}
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
    </el-form>
</template>

<script setup lang="ts" name="elp-filter">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { FilterItem } from './filter'
const props = defineProps({
    items: {
        type: Array<FilterItem>,
        default: () => []
    },
	isBtnShow:{
		type: Boolean,
		default:() => true
	}
})

const emit = defineEmits(['search', 'reset'])

// 表单数据
const form = ref<any>({})
const isExpanded = ref(false)
const columnCount = ref(4)
const columnWidths = ref<number[]>([])
const labelElements = ref<HTMLElement[]>([])
const formRef = ref<any>()

watch(() => props.items, (val) => {
    if (val) {
        for (let i = 0; i < val.length; i++) {
            const item = val[i]
            form.value[item.prop] = item.default
        }
    }
}, {
    deep: true,
    immediate: true
})

// 计算属性
const visibleItemCount = computed(() =>
    isExpanded.value ? props.items.length : columnCount.value * 2 - 1
)
const visibleItems = computed(() =>
    props.items.slice(0, visibleItemCount.value)
)
const showExpand = computed(() =>
    props.items.length >= columnCount.value * 2
)

// Grid布局样式
const gridStyle = computed(() => {
    return {
        gridTemplateColumns: `repeat(${columnCount.value}, 1fr)`,
        gap: '0 24px' // 固定列间隔
    }
})

// 按钮组定位
const actionGroupStyle = computed(() => {
    const totalItems = visibleItems.value.length
    const itemsPerRow = columnCount.value
    const rowCount = Math.ceil(totalItems / itemsPerRow)

    if (itemsPerRow === 1) {
        // 如果只有一列，按钮放在第二行
        return {
            gridColumn: `1 / 2`,
            gridRow: 2,
            justifyContent: 'flex-end' // 靠右
        }
    } else {
        // 如果有多个列，按钮放在最后一列的第一行
        if (totalItems >= itemsPerRow) {
            return {
                gridColumn: `${itemsPerRow} / ${itemsPerRow + 1}`,
                gridRow: 1,
                justifyContent: 'flex-start' // 靠左
            }
        }

    }
})

// 获取列索引 第一行不+1 第二行+1
function getColumnIndex(itemIndex: number): number {
    if ((itemIndex + 1) >= columnCount.value) {
        /** 换行 */
        return (itemIndex + 1) % columnCount.value
    } else {
        /** 没有换行 */
        return itemIndex % columnCount.value
    }

}

// 计算列宽
async function calculateColumnWidths() {
    await nextTick()
    const widths = Array(columnCount.value).fill(0)

    // 只计算表单项的label宽度，排除操作按钮组
    labelElements.value.forEach((el, index) => {
        if (!el) return
        const colIndex = getColumnIndex(index)
        const width = el.offsetWidth
        if (width > widths[colIndex]) {
            widths[colIndex] = width
        }
    })

    columnWidths.value = widths
}

// 响应式处理
function handleResize() {
    labelElements.value = []
    const width = window.innerWidth
    columnCount.value = width >= 1920 ? 4 :
        width >= 1440 ? 3 :
            width >= 1024 ? 2 : 1
    calculateColumnWidths()
}

// 展开/收起切换
function toggleExpand() {
    isExpanded.value = !isExpanded.value
    calculateColumnWidths()
}

// 添加label元素收集方法
const collectLabelRef = (el: HTMLElement | null, index: number) => {
    if (el) {
        labelElements.value[index] = el
    }
}

/** 查询 */
const handleQuery = () => {
    emit('search', form.value) // 将表单数据传递给父组件
}

/** 重置 */
const handleReset = () => {
    formRef.value?.resetFields()
    emit('reset', form.value)
}

// 初始化
onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
})
</script>

<style scoped>
.filter-container {
    max-width: 1920px;
    margin: 0 auto;
    padding: 20px 0;
}

.grid-wrapper {
    position: relative;
    overflow: hidden;
}

.grid-container {
    display: grid;
    transition: all 0.3s;
}

.action-group {
    display: flex;
    gap: 12px;
    padding-bottom: 20px;
}

/* 标签右对齐优化 */
:deep(.el-form-item__label) {
    justify-content: flex-end;
    white-space: nowrap;
}

:deep(.el-input-number) {
    width: 100%;
}

/* 响应式处理 */
@media (max-width: 768px) {
    .filter-container {
        padding: 10px;
    }
}
</style>
