<template>
  <div class="enhance-table">
    <!-- 表格区域 -->
    <el-skeleton :loading="loading" animated v-show="loading">
      <template #template>
        <el-table
          ref="tableRef"
          :data="Array(skeletonRowCount).fill({})"
          style="width: 100%"
          v-bind="$attrs"
        >
          <template v-for="col in columns" :key="col.prop">
            <skeleton-column :column="col" />
          </template>
        </el-table>
      </template>
    </el-skeleton>
    <el-table
      ref="tableRef"
      :data="tableData"
      v-bind="$attrs"
      v-show="!loading"
      @selection-change="handleSelectionChange"
    >
      <!-- 动态列渲染 -->
      <template v-for="col in columns" :key="col.prop">
        <table-column :column="col">
          <!-- 透传插槽 -->
          <template v-for="(_, slotName) in $slots" #[slotName]="scope">
            <slot :name="slotName" v-bind="scope" />
          </template>
        </table-column>
      </template>
    </el-table>
  </div>
</template>

<script setup lang="ts" name="elp-table">
  import {
    h,
    ref,
    computed,
    watch,
    defineProps,
    defineEmits,
    PropType,
    defineComponent,
    reactive,
    nextTick
  } from "vue";
  import {
    ElTable,
    ElTableColumn,
    ElSkeleton,
    ElSkeletonItem,
    ElInput,
    ElSelect,
    ElDatePicker,
    ElMessage,
    ElButton,
    ElIcon,
    ElPopover,
    ElCheckbox,
    ElScrollbar
  } from "element-plus";
  import { Column, RequestParams } from "./table.d.ts";
  import {
    Setting,
    Sort,
    Search,
    Close,
    CloseBold
  } from "@element-plus/icons-vue";
  import Draggable from "vuedraggable/src/vuedraggable";
  // import { useSystem } from '../../config/index' // 导入配置

  // const { mitt } = useSystem() // 结构server
  const deProps = defineProps({
    columns: {
      type: Array as PropType<any[]>,
      required: true
    },
    data: {
      type: Array as PropType<any[]>,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    total: {
      type: Number,
      default: 0
    },
    showPagination: {
      type: Boolean,
      default: true
    },
    showSearch: {
      type: Boolean,
      default: true
    },
    skeletonRowCount: {
      type: Number,
      default: 5
    },
    request: {
      type: Function as PropType<(params: RequestParams) => void>,
      default: null
    },
    isEditTable: {
      type: Boolean,
      default: false
    }
  });
  // Emits 定义
  const emit = defineEmits([
    "selection-change",
    "update:columns",
    "column-change"
  ]);

  const selectedRows = ref<any[]>([]);
  const tableData = ref<any[]>(deProps.data);
  // 暴露el-table实例和方法
  const tableRef = ref<InstanceType<typeof ElTable>>();
  // 列配置状态
  const columnConfigVisible = ref(false);
  // 新增状态管理
  const searchKeyword = ref("");
  const originalColumns = ref<Column[]>([]); // 原始列数据备份
  const leftColumns = ref<Column[]>([]); // 左侧未选列
  const selectedColumns = ref<Column[]>([]); // 右侧已选列
  const oldSelectedColumns = ref<Column[]>([]); // 右侧已选列

  const availableColumns = computed(() => {
    return leftColumns.value?.filter((col) =>
      col.label?.includes(searchKeyword.value)
    );
  });
  // 行编辑状态管理
  const editingStates = reactive<
    Record<
      string,
      {
        editing: boolean;
        tempValue: any;
      }
    >
  >({});

  // 进入编辑模式
  // const enterEditMode = (row: any, column: Column) => {
  //   const key = `${row[column.columnKey]}_${column.prop}`
  //   editingStates[key] = {
  //     editing: true,
  //     tempValue: row[column.prop!]
  //   }
  // }

  // 保存编辑
  // const saveEdit = (row: any, column: Column) => {
  //   const key = `${row[column.columnKey]}_${column.prop}`
  //   if (!validateEdit(row, column)) return

  //   row[column.prop!] = editingStates[key].tempValue
  //   editingStates[key].editing = false
  //   emit('edit-save', { row, column, value: editingStates[key].tempValue })
  // }

  // 校验逻辑
  // const validateEdit = (row: any, column: Column): boolean => {
  //   if (!column.editRules) return true

  //   return column.editRules.every((rule) => {
  //     const result = rule(
  //       editingStates[`${row[column.columnKey]}_${column.prop}`].tempValue
  //     )
  //     if (typeof result === 'string') {
  //       ElMessage.error(result)
  //       return false
  //     }
  //     return result
  //   })
  // }

  // 递归列组件
  const TableColumn = defineComponent({
    name: "TableColumn",
    props: {
      column: {
        type: Object,
        required: true
      }
    },
    setup(props, { slots }) {
      const renderColumn = (column: any) => {
        // 处理特殊类型列
        if (column.type === "selection" || column.type === "index") {
          return h(ElTableColumn, {
            ...column,
            type: column.type,
            index:
              typeof column.index === "function"
                ? column.index
                : (i: number) => i + (column.index || 0) + 1,
            width: column.width || (column.type === "selection" ? 50 : 80)
          });
        }
        // 修正属性过滤：保留children属性
        if (column.children?.length > 0) {
          return h(
            ElTableColumn,
            {
              ...column
            },
            () => column.children.map((child: any) => renderColumn(child))
          );
        }
        return h(
          ElTableColumn,
          {
            ...column
          },
          {
            // 处理表头自定义
            header: (scope: { column: any }) => {
              // 优先级：插槽 > 渲染函数 > 默认
              const slotName = `${column.prop}-header`;
              if (column.showColumnConfigButton) {
                return h(
                  "div",
                  { class: "flex items-center justify-between" },
                  [
                    column.label,
                    h(
                      ElPopover,
                      {
                        visible: columnConfigVisible.value,
                        placement: "bottom-end",
                        width: "469",
                        trigger: "click",
                        popperClass: "table-column-popover",
                        onBeforeShow: () => initColumns()
                      },
                      {
                        reference: () =>
                          h(ElButton, {
                            icon: Setting,
                            onClick: () => (columnConfigVisible.value = true)
                          }),
                        default: () => [
                          // 标题栏
                          h("div", { class: "config-header" }, [
                            h("span", { class: "header-txt" }, "自定义列表"),
                            h(
                              ElIcon,
                              {
                                class: "close-icon",
                                onClick: handleCancelEdit
                              },
                              () => h(CloseBold)
                            )
                          ]),

                          // 双栏布局
                          h("div", { class: "dual-column-layout" }, [
                            // 左侧未选列
                            h("div", { class: "left-column" }, [
                              h("div", { class: "column-actions" }, [
                                h(
                                  "div",
                                  { class: "left-title" },
                                  `所有字段 (${leftColumns.value?.length}）`
                                ),
                                h(
                                  ElButton,
                                  {
                                    disabled:
                                      selectedColumns.value?.length >=
                                      leftColumns.value?.length,
                                    link: true,
                                    onClick: selectAll
                                  },
                                  "全选"
                                )
                              ]),
                              h("div", { class: "column-search" }, [
                                h(ElInput, {
                                  modelValue: searchKeyword.value,
                                  "onUpdate:modelValue": (val) =>
                                    (searchKeyword.value = val),
                                  placeholder: "搜索字段",
                                  clearable: true,
                                  suffixIcon: Search
                                })
                              ]),
                              h(
                                "div",
                                {
                                  class: "left-column-list column-list"
                                },
                                {
                                  default: () =>
                                    availableColumns.value.map((element) =>
                                      h(
                                        "div",
                                        {
                                          key: element.prop,
                                          class: "column-item"
                                        },
                                        [
                                          h(
                                            ElCheckbox,
                                            {
                                              modelValue:
                                                selectedColumns.value.some(
                                                  (c) => c.prop === element.prop
                                                ), // 改为判断是否在已选列中
                                              "onUpdate:modelValue": (val) => {
                                                if (val) {
                                                  selectedColumns.value.push(
                                                    element
                                                  );
                                                } else {
                                                  selectedColumns.value =
                                                    selectedColumns.value.filter(
                                                      (c) =>
                                                        c.prop !== element.prop
                                                    );
                                                }
                                              }
                                            },
                                            element.label
                                          )
                                        ]
                                      )
                                    )
                                }
                              )
                            ]),

                            // 右侧已选列
                            h("div", { class: "right-column" }, [
                              h("div", { class: "column-actions" }, [
                                h(
                                  "span",
                                  `显示字段（${leftColumns.value.length}/${selectedColumns.value.length} ）项`
                                ),
                                h(
                                  ElButton,
                                  {
                                    link: true,
                                    onClick: clearAll
                                  },
                                  "清空"
                                )
                              ]),
                              h(
                                Draggable,
                                {
                                  list: selectedColumns.value,
                                  itemKey: "prop",
                                  group: "columns",
                                  handle: ".drag-handle",
                                  class: "right-column-list column-list",
                                  onChange: updateSelection
                                },
                                {
                                  item: ({ element }: any) =>
                                    h(
                                      "div",
                                      { class: "column-item selected" },
                                      [
                                        h(
                                          "p",
                                          { class: "drag-handle" },
                                          element.label
                                        ),
                                        h(
                                          ElIcon,
                                          {
                                            class: "delete-icon",
                                            onClick: () => removeColumn(element)
                                          },
                                          () => h(Close)
                                        )
                                      ]
                                    )
                                }
                              ),
                              h(
                                "div",
                                { class: "column-tip" },
                                "提示：拖拽字段可上下调换顺序"
                              )
                            ])
                          ]),

                          // 底部确认按钮
                          h("div", { class: "config-footer" }, [
                            h(
                              ElButton,
                              {
                                onClick: handleCancelEdit
                              },
                              "取消"
                            ),
                            h(
                              ElButton,
                              {
                                type: "primary",
                                onClick: saveConfiguration
                              },
                              "确定"
                            )
                          ])
                        ]
                      }
                    )
                  ]
                );
              }
              if (slotName) {
                return slots[slotName]?.(scope);
              }
              if (column.renderHeader) {
                return column.renderHeader(h, column);
              }
              return column.label;
            },
            // 处理插槽
            default: (scope: any) => {
              // 修改点：直接使用prop作为插槽名称
              const slotName = column.slotName || column.prop; // 优先使用slotName，保持向后兼容

              if (slotName && !column.options) {
                return slots[slotName]?.(scope);
              }
              const createOptionMap = (options: any[]) =>
                options.reduce((map, opt) => {
                  map[opt.value] = opt.label;
                  return map;
                }, {});

              // 新增：根据options转换value
              const convertValue = (val: any) => {
                if (!column.options || !Array.isArray(column.options))
                  return val;

                const optionMap = createOptionMap(column.options);
                return optionMap[val] ?? val;
              };
              // if (
              //   column.editable &&
              //   editingStates[`${scope.row[column.columnKey]}_${column.prop}`]
              //     ?.editing
              // ) {
              //   return renderEditComponent(scope.row, column)
              // }
              return column.render
                ? column.render(scope.row)
                : convertValue(scope.row[column.prop!]);
              // scope?.row[column.prop]
              //   h(
              //       'div',
              //       {
              //         class: 'editable-cell',
              //         onClick: () => enterEditMode(scope.row, column)
              //       },
              //       scope.row[column.prop!]
              //     )
            }
          }
        );
      };
      return () => renderColumn(props.column);
    }
  });

  // 骨架屏列组件
  const SkeletonColumn = defineComponent({
    name: "SkeletonColumn",
    props: {
      column: {
        type: Object,
        required: true
      }
    },
    setup(props) {
      const renderColumn = (column: any) => {
        if (column.children?.length > 0) {
          return h(
            ElTableColumn,
            {
              ...column
            },
            () => column.children.map((child: any) => renderColumn(child))
          );
        }
        return h(
          ElTableColumn,
          {
            ...column
          },
          {
            default: () => h(ElSkeletonItem, { variant: "text" })
          }
        );
      };
      return () => renderColumn(props.column);
    }
  });

  // 编辑组件渲染器
  // const renderEditComponent = (row: any, column: Column) => {
  //   const key = `${row[column.columnKey]}_${column.prop}`
  //   const state = editingStates[key]

  //   const commonProps = {
  //     modelValue: state.tempValue,
  //     'onUpdate:modelValue': (val: any) => (state.tempValue = val),
  //     onBlur: () => saveEdit(row, column),
  //     onKeyup: (e: KeyboardEvent) => e.key === 'Enter' && saveEdit(row, column)
  //   }

  //   switch (column.editComponent) {
  //     case 'select':
  //       return h(ElSelect, {
  //         ...commonProps,
  //         ...column.editProps,
  //         options: column.editProps?.options || []
  //       })
  //     case 'date':
  //       return h(ElDatePicker, {
  //         ...commonProps,
  //         ...column.editProps,
  //         type: column.editProps?.type || 'date'
  //       })
  //     case 'custom':
  //       return h(column.customEditComponent, {
  //         ...commonProps,
  //         rowData: row,
  //         column
  //       })
  //     default:
  //       return h(ElInput, {
  //         ...commonProps,
  //         ...column.editProps
  //       })
  //   }
  // }

  const handleSelectionChange = (selection: any[]) => {
    // 从table实例获取所有已选行（包括跨页数据）
    selectedRows.value = selection;
    emit("selection-change", selectedRows.value);
  };

  // 监听外部数据变化
  watch(
    () => deProps.data,
    (val) => {
      tableData.value = val;
    },
    { immediate: true, deep: true }
  );

  // 初始化列数据（默认全选）
  const initColumns = () => {
    if (!originalColumns.value.length) {
      originalColumns.value = JSON.parse(JSON.stringify(deProps.columns));
      leftColumns.value = originalColumns.value.filter(
        (col: any) => col.type != "selection" && !col.showColumnConfigButton
      );
      selectedColumns.value = [...leftColumns.value];
    }
    oldSelectedColumns.value = selectedColumns.value;
  };
  // 操作方法
  const selectAll = () => {
    if (selectedColumns.value?.length < leftColumns.value?.length) {
      selectedColumns.value = [
        ...selectedColumns.value,
        ...availableColumns.value
      ];
    }
  };

  const clearAll = () => {
    selectedColumns.value = [];
  };

  const removeColumn = (col: Column) => {
    selectedColumns.value = selectedColumns.value.filter((c) => {
      return c.prop !== col.prop;
    });
  };

  const updateSelection = () => {
    // 拖拽排序后自动保存顺序
  };
  // 取消配置
  const handleCancelEdit = () => {
    selectedColumns.value = [...oldSelectedColumns.value];
    columnConfigVisible.value = false;
  };
  //确定配置
  const saveConfiguration = () => {
    const startColumn = originalColumns.value.filter(
      (col) => col.type === "selection"
    );
    const endColumn = originalColumns.value.filter(
      (col) => col.showColumnConfigButton
    );
    console.log(startColumn, endColumn);
    const finalColumns = [
      ...startColumn,
      ...selectedColumns.value,
      ...endColumn
    ];
    oldSelectedColumns.value = [...selectedColumns.value];
    columnConfigVisible.value = false;

    // 强制表格重新渲染
    nextTick(() => {
      emit("column-change", finalColumns); // 触发列变更事件
      tableRef.value?.doLayout();
    });
  };
  defineExpose({
    tableRef
  });
</script>
<style scoped lang="scss"></style>

<style lang="scss">
  .table-column-popover {
    height: 451px;
    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      margin-bottom: 12px;
      .header-txt {
        font-weight: 500;
        font-size: 18px;
        color: #333333;
        line-height: 24px;
      }
      .close-icon {
        position: absolute;
        right: 12px;
        top: 12px;
        cursor: pointer;
      }
    }
    .dual-column-layout {
      display: flex;
      justify-content: space-between;
      padding: 0 12px;
      .left-column,
      .right-column {
        width: 202px;
        height: 295px;
        border-radius: 4px 4px 4px 4px;
        border: 1px solid #d9d9d9;
        padding: 8px 12px;
        box-sizing: border-box;
        .column-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 12px;
          .left-title {
            font-weight: 400;
            font-size: 14px;
            color: #333333;
            line-height: 22px;
          }
        }
        .column-search {
          margin-bottom: 8px;
        }
      }
      .right-column {
        position: relative;
        .column-tip {
          width: calc(100% - 2px);
          background: #fff;
          position: absolute;
          bottom: 1px;
          left: 1px;
          height: 37px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 400;
          font-size: 12px;
          color: #999999;
          line-height: 22px;
          text-align: left;
          border-top: 1px solid #f0f0f0;
        }
      }
      .left-column-list {
        height: 184px;
        overflow-y: auto;
      }
      .right-column-list {
        height: 194px;
        overflow-y: auto;
      }
      .left-column-list,
      .right-column-list {
        margin: 0 -12px;
        margin-right: -8px;
        padding-left: 12px;
        padding-right: 8px;
        .column-item {
          height: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          .delete-icon {
            cursor: pointer;
          }
        }
      }
    }
    .config-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 12px 16px;
    }
  }
</style>
