<template>
  <div class="page">
    <section class="intro card">
      <h1>预测报告</h1>
      <p>
        汇总需求、库存与风险预测的关键结论，以报告形式呈现给业务与管理团队，便于快速对齐策略与行动计划。
      </p>
    </section>

    <section class="cards">
      <el-card v-for="item in highlights" :key="item.title" class="card">
        <div class="title">{{ item.title }}</div>
        <p>{{ item.detail }}</p>
      </el-card>
    </section>

    <section class="card">
      <h2>执行摘要</h2>
      <ul class="list">
        <li v-for="item in summary" :key="item">
          {{ item }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
const highlights = [
  { title: '需求', detail: '未来 4 周需求上升 6%，旺季提前半周启动。' },
  { title: '库存', detail: '华南仓库存偏高 3 天，需联合促销与调拨。' },
  { title: '风险', detail: '供应商 B 准时率下滑，需备选方案。' },
]

const summary = [
  '整体预测置信区间 92%，关键 SKU 对齐业务口径。',
  '建议为旺季准备弹性产能，并锁定关键物料采购计划。',
  '物流与供应风险需在一周内形成专项闭环汇报。',
]
</script>

<style scoped>
.page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f5f7fa;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.title {
  font-weight: 600;
  margin-bottom: 8px;
}

.list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #606266;
}
</style>

