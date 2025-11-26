<template>
  <div class="flex items-center justify-between w-full">
    <div class="text-[25px] text-[#FFF]">{{ SYS_NAME }}</div>
    <div class="flex items-center gap-[10px]">
      <el-avatar :src="avatar"/>
      <span class="text-[16px] text-[#FFF]">系统管理员</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import avatar from "@/assets/admin.svg"
import {SYS_NAME} from "@/constant/system"
</script>
<style lang="scss" scoped>


</style>
