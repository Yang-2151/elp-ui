<template>
  <div
    :class="['elp-toolbar', { 'toolbar-bg': showbg, 'toolbar-line': showLine }]"
  >
    <slot name="toolbar"></slot>
  </div>
</template>

<script setup lang="ts" name="elp-toolbar">
  const props = defineProps({
    showLine: {
      type: Boolean,
      default: true,
    },
    showbg: {
      type: Boolean,
      default: true,
    },
  });
</script>

<style lang="scss" scoped>
  .elp-toolbar {
    //   height: 60px;
    box-sizing: border-box;
    //   padding: 12px 30px !important;
    padding: 0 30px !important;
    position: relative;
    width: calc(100% + 60px);
    left: -30px;
    :deep(.el-button) {
      margin: 16px 0;
    }

    :deep(.el-button) + :deep(.el-button) {
      margin-left: 16px !important;
    }
    :deep(.el-button[style*="display: none"]) + :deep(.el-button) {
      margin-left: 0 !important;
    }
  }
  .toolbar-line {
    border-top: 1px solid #f0f0f0;
  }
  .toolbar-bg {
    background: #fafafa;
  }
</style>
