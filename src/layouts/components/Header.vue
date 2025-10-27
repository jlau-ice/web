<template>
  <div class="flex items-center justify-between w-full">
    <div class="text-[25px] text-[#FFF]">{{ SYS_NAME }}</div>
    <div class="flex items-center gap-[10px]">
      <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"/>
      <span class="text-[16px] text-[#FFF]">admin</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import {SYS_NAME} from "@/constant/system"
</script>
<style lang="scss" scoped>


</style>
