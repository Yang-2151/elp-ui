<template>
  <div class="pagination-container">
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :total="pageTotal"
      :layout="layout"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <span class="per">每页</span>
      <el-select
        v-model="pageSize"
        @change="handleSizeChange"
        popper-class="custom-dropdown"
      >
        <el-option
          v-for="(item, index) in pageSizes"
          :key="index"
          :label="item"
          :value="item"
        />
      </el-select>
      <span class="piece">条</span>
    </el-pagination>
  </div>
</template>

<script lang="ts" setup name="elp-pagination">
  import { ref, reactive, defineProps, defineEmits, computed } from "vue";

  const props = defineProps({
    total: {
      type: Number,
      default: 0,
    },
    page: {
      type: Number,
      default: 1,
    },
    size: {
      type: Number,
      default: 10,
    },
    pageSizes: {
      type: Array,
      default() {
        return [10, 20, 30];
      },
    },
  });

  const layout = computed(() => {
    if (props.total <= 30) {
      return "prev, pager, next";
    } else if (props.total <= 50) {
      return "slot, prev, pager, next";
    } else {
      return "total, slot, prev, pager, next, jumper";
    }
  });

  const $emit = defineEmits(["update:page", "update:size", "pagination"]);

  const currentPage = computed({
    get: () => {
      return props.page;
    },
    set(val) {
      $emit("update:page", val);
    },
  });

  const pageSize = computed({
    get: () => {
      return props.size;
    },
    set(val) {
      $emit("update:size", val);
    },
  });

  const pageTotal = computed(() => props.total);

  const handleSizeChange = (val: any) => {
    console.log(`每页 ${val} 条`);
    currentPage.value = 1;
    $emit("pagination", { page: currentPage.value, size: val });
  };

  const handleCurrentChange = (val: any) => {
    console.log(`当前页: ${val}`);
    $emit("pagination", { page: val, size: pageSize.value });
  };
</script>

<style lang="scss" scoped name="elp-pagination">
  .pagination-container {
    display: flex;
    justify-content: flex-end;
    padding: 12px 0;

    ::v-deep(.el-select),
    ::v-deep(.el-input) {
      width: 60px !important;
      height: 28px !important;
    }

    ::v-deep(.el-select__wrapper) {
      padding: 1px 12px;
      height: 28px !important;
      min-height: 28px !important;
    }

    ::v-deep(.el-pagination__total),
    ::v-deep(.el-pagination__jump) {
      color: var(--el-text-color-primary);
    }

    .per {
      margin-left: 20px;
      margin-right: 6px;
      color: var(--el-text-color-primary);
    }

    .piece {
      margin-left: 6px;
      color: var(--el-text-color-primary);
    }

    ::v-deep(.el-pager) {
      .is-active {
        font-weight: normal;
      }
    }
  }

  .el-select-dropdown__item {
    padding-left: 12px;
  }
</style>
