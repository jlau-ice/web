<template>
  <el-container>
    <!--border-b border-b-[#e0e0e0] border-solid-->
    <el-header class="h-[60px] overflow-hidden bg-[#0F72DC] flex items-center">
      <Header/>
    </el-header>
    <el-container>
      <el-aside width="200px">
        <SideBar/>
      </el-aside>
      <el-main class="!p-0">
        <Content/>
      </el-main>
    </el-container>
  </el-container>
</template>
<script lang="ts" setup>
import Header from '@/layouts/components/Header.vue'
import Content from '@/layouts/components/Content.vue'
import SideBar from '@/layouts/components/SideBar.vue';
</script>
<style lang="scss" scoped></style>
