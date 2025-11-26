<template>
  <div class="h-[calc(100vh-60px)]">
    <el-scrollbar class="scrollbar">
      <el-menu>
        <template v-for="(menu, index) in menus" :key="index">
          <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path">
            <template #title>
              <component :is="menu?.meta?.icon" class="w-[20px] mr-[5px]" />
              <span>{{ menu.name }}</span>
            </template>
            <el-menu-item v-for="child in menu.children" :key="child.meta.id" :index="child.meta.id" @click="handelClick(child)">
              <component :is="child?.meta?.icon" class="w-[20px] mr-[5px]" />
              {{ child.name }}
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.meta.id" @click="handelClick(menu)">
            <template #title>
              <component :is="menu?.meta?.icon" class="w-[20px] mr-[5px]" />
              <span>{{ menu.name }}</span>
            </template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>
<script setup lang="ts">
import { menus } from '@/router/menus'
import { useRouter } from 'vue-router'

const router = useRouter()
const handelClick = (item) => {
  console.log('dasdsa')
  router.push(item.path)
}
</script>
<style scoped lang="scss">
:deep(.el-menu) {
  border: none;
  background-color: transparent;
}

.scrollbar {
  border-right: #dcdfe6 1px solid;
}

:deep(.el-scrollbar__bar.is-vertical) {
  display: none;
}

:deep() {
  .el-menu-item.is-active {
    background: #b3c0d1;
    color: #303133;
    font-weight: bold;
  }
  .el-menu-item {
    color: #000;
  }
  .el-sub-menu__title {
    color: #000;
  }
}
</style>
