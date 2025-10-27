<template>
  <!-- 有子菜单 -->
  <el-sub-menu v-if="item.children && item.children.length" :index="item.path">
    <template #title>
      <el-icon v-if="item.meta?.icon">
        <component :is="item.meta.icon" />
      </el-icon>
      <span>{{ item.meta?.title || item.name }}</span>
    </template>

    <menu-item
      v-for="child in item.children"
      :key="child.path"
      :item="child"
    />
  </el-sub-menu>

  <!-- 无子菜单 -->
  <el-menu-item v-else :index="item.path">
    <el-icon v-if="item.meta?.icon">
      <component :is="item.meta.icon" />
    </el-icon>
    <span>{{ item.meta?.title || item.name }}</span>
  </el-menu-item>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps({
  item: {
    type: Object,
    required: true,
  },
})
</script>
