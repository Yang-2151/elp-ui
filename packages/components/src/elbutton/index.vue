<template>
  <el-button :type="type" :disabled="disabled" round
    ><slot>Danger</slot>
    <button/>
    </el-button
  >
</template>
<script lang="ts" setup>
import button from '../button/index.vue'
  defineOptions({ name: "test-el-button" });
  withDefaults(
    defineProps<{
      disabled: boolean;
      type: string;
    }>(),
    {
      disabled: false,
      type: "danger"
    }
  );
</script>
