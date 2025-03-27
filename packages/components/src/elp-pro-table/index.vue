<template>
  <div class="data-table-wrapper">
    <!-- 筛选器 -->
    <ElpFilter
      :items="filterItems"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElpToolbar
      v-if="showToolBar"
      :showLine="showToolBarTopLine"
      :showbg="showToolBarTopbg"
    >
      <template #toolbar>
        <slot name="toolbar"></slot>
      </template>
    </ElpToolbar>

    <!-- 表格 -->
    <ElpTable
      v-bind="$attrs"
      :data="tableData"
      :columns="tableColumns"
      :loading="loading"
      :skeletonRowCount="pagination.pageSize"
      @column-change="handleColumnChange"
    >
      <!-- 透传插槽 -->
      <template v-for="(_, slotName) in $slots" #[slotName]="scope">
        <slot :name="slotName" v-bind="scope" />
      </template>
    </ElpTable>

    <!-- 分页器 -->
    <ElpPagination
      :page="pagination.currentPage"
      :size="pagination.pageSize"
      :total="pagination.total"
      @pagination="getTableData"
    />
  </div>
</template>

<script setup lang="ts" name="elp-proTable">
  import { ref, onMounted, computed, type PropType, watch } from "vue";
  import ElpFilter from "../elp-filter/index.vue";
  import ElpTable from "../elp-table/index.vue";
  import ElpPagination from "../elp-pagination/index.vue";
  import ElpToolbar from "../elp-toolbar/index.vue";

  // 接收外部传入的配置
  const props = defineProps({
    //   filterItems: {
    //     type: Array,
    //     default: () => []
    //   },
    //   tableColumns: {
    //     type: Array,
    //     default: () => []
    //   },
    columns: {
      // 统一配置项
      type: Array as PropType<any[]>,
      required: true,
    },
    paginationConfig: {
      // 分页配置
      type: Object,
      default: () => ({
        currentPage: 1,
        pageSize: 10,
        total: 0,
      }),
    },
    fetchTableData: {
      // 获取表格数据的方法
      type: Function,
      required: true,
    },
    showToolBar: {
      //是否显示工具栏
      type: Boolean,
      default: true,
    },
    showToolBarTopLine: {
      //是否显示工具栏上边框
      type: Boolean,
      default: true,
    },
    showToolBarTopbg: {
      //是否显示工具栏背景色
      type: Boolean,
      default: true,
    },
    params: {
      // 请求额外参数
      type: Object,
      default: () => ({}),
    },
  });

  // 表格数据
  const tableData = ref<any[]>([]);
  const loading = ref(false);
  let isInitPost = ref<boolean>(true);

  // 分页数据
  const pagination = ref({
    currentPage: props.paginationConfig.currentPage,
    pageSize: props.paginationConfig.pageSize,
    total: props.paginationConfig.total,
  });

  // 筛选器表单数据
  const filterForm = ref<Record<string, any>>({});
  const tableColumn = ref<any[]>([...props.columns]);
  // 生成筛选器配置
  const filterItems = computed(() => {
    return tableColumn.value
      .filter((col) => col.searchable)
      .sort((a, b) => a.sortIndex - b.sortIndex); // 只包含需要筛选的列
  });
  // 生成表格列配置
  const tableColumns = computed({
    get() {
      return tableColumn.value.filter((col) => !col.hideInTable); // 只包含不需要筛选的列
    },
    set(newValue) {
      tableColumn.value = newValue;
    },
  });

  watch(
    () => filterItems.value,
    () => {
      initFilterForm();
      fetchData();
    },
    {
      deep: true,
    }
  );
  watch(
    () => props.params,
    () => {
      fetchData();
    },
    {
      deep: true,
    }
  );
  // 初始化表单数据
  const initFilterForm = () => {
    const initialForm: Record<string, any> = {};
    filterItems.value.forEach((item: any) => {
      //   props.filterItems.forEach((item: any) => {
      initialForm[item.prop] = item.default;
    });
    filterForm.value = initialForm;
  };

  // 获取表格数据
  const fetchData = async () => {
    loading.value = true;
    try {
      const params = {
        data: { ...filterForm.value, ...props.params },
        current: pagination.value.currentPage,
        size: pagination.value.pageSize,
      };
      const res = await props.fetchTableData(params);

      tableData.value = res.data.rows;
      pagination.value.total = Number(res.data.totalRows);
    } catch (error) {
      console.error("获取表格数据失败:", error);
      throw error; // 允许外部捕获
    } finally {
      loading.value = false;
    }
  };

  const getTableData = (data: any) => {
    //   console.log(data)
    pagination.value.currentPage = data.page;
    pagination.value.pageSize = data.size;

    fetchData();
  };

  /** 获取 options 数据 */
  const getOptions = async () => {
    for (const item of filterItems.value) {
      if (item.needOptions) {
        isInitPost.value = false;
        const res = await item.fetchOptionsData(item);
      }
    }
  };

  // 初始化时获取表格数据
  onMounted(async () => {
    await getOptions(); // 先获取 options 数据
    if (isInitPost.value) {
      initFilterForm();
      fetchData();
    }
  });

  // 处理查询
  const handleSearch = (formData: Record<string, any>) => {
    filterForm.value = formData;
    pagination.value.currentPage = 1; // 重置为第一页
    fetchData();
  };

  // 处理重置
  const handleReset = () => {
    initFilterForm();
    pagination.value.currentPage = 1; // 重置为第一页
    fetchData();
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    pagination.value.currentPage = page;
    fetchData();
  };

  const handleColumnChange = (newColumns: any) => {
    tableColumns.value = newColumns; // 更新本地columns数据
    fetchData(); // 重新获取数据刷新表格
  };
  defineExpose({
    fetchData,
  });
</script>

<style lang="scss" scoped>
  .data-table-wrapper {
  }
</style>