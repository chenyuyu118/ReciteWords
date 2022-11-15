<template>
  <el-popover trigger="click" width="60%">
    <template #default>
      <el-scrollbar max-height="200px">
        <p v-for="item in explains">{{ item }}</p>
      </el-scrollbar>
    </template>
    <template #reference>
      <div v-if="explains[0] !== undefined">
        <div v-if="ellipsis">
          {{ explains[0].slice(0, 20) }}
          <el-button link v-if="explains[0].length > 20">...</el-button>
        </div>
        <div v-else>
          <el-button link type="primary">释义</el-button>
        </div>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
defineProps<{ explains: string[]; ellipsis: boolean }>();
</script>

<style scoped></style>
