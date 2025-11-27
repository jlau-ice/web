<template>
  <div class="page">
    <section class="intro card">
      <h1>供应风险预测</h1>
      <p>
        结合供应商表现、物流时效及宏观事件，预测未来周期的供应风险，给出缓释优先级与策略建议。
      </p>
    </section>

    <section class="card">
      <h2>风险热度</h2>
      <el-table :data="riskHeat" border size="small">
        <el-table-column prop="supplier" label="对象" />
        <el-table-column prop="dimension" label="影响维度" />
        <el-table-column prop="score" label="风险指数" />
        <el-table-column prop="trend" label="趋势" />
        <el-table-column prop="action" label="建议" />
      </el-table>
    </section>

    <section class="grid">
      <el-card class="card">
        <template #header>缓释闭环</template>
        <ul class="list">
          <li v-for="item in mitigations" :key="item.title">
            <strong>{{ item.title }}</strong>
            <span>{{ item.detail }}</span>
          </li>
        </ul>
      </el-card>
      <el-card class="card">
        <template #header>预警信号</template>
        <ul class="list">
          <li v-for="item in signals" :key="item.title">
            <strong>{{ item.title }}</strong>
            <span>{{ item.detail }}</span>
          </li>
        </ul>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
const riskHeat = [
  {
    supplier: '供应商 B',
    dimension: '交付准时率',
    score: '0.68',
    trend: '↑',
    action: '制定备选供应，增加库存缓冲 2 天',
  },
  {
    supplier: '华南物流链路',
    dimension: '在途时效',
    score: '0.45',
    trend: '→',
    action: '继续观测，准备路由切换方案',
  },
  {
    supplier: '关键原料 M',
    dimension: '价格波动',
    score: '0.72',
    trend: '↑',
    action: '锁定季度合同，对冲价格风险',
  },
]

const mitigations = [
  { title: '供应商并行', detail: '核心零件引入第二供应商，完成样件验证。' },
  { title: '安全库存上调', detail: '为风险 SKU 增加 2 天库存，保障旺季供应。' },
  { title: '跨区域调拨', detail: '建立华南↔华东的快线调拨机制，缩短响应。' },
]

const signals = [
  { title: '天气与地缘', detail: '关注东南沿海台风路径，对港口装卸影响 2 天。' },
  { title: '物流拥堵指数', detail: '节前高速拥堵指数上升 12%，提前安排发运。' },
  { title: '供应商财务健康', detail: '供应商 B 现金流指标下滑，需加密审查。' },
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.list strong {
  color: #303133;
}
</style>

