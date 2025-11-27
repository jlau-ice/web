<template>
  <div class="page">
    <section class="intro card">
      <h1>需求预测</h1>
      <p>
        汇聚历史订单、库存与外部事件，通过机器学习模型生成未来周期的需求预测、置信区间与异常提示，辅助制定主动性的销售与生产策略。
      </p>
    </section>

    <section class="cards">
      <el-card v-for="item in kpis" :key="item.title" class="card">
        <div class="kpi-title">{{ item.title }}</div>
        <div class="kpi-value">{{ item.value }}</div>
        <div class="kpi-desc">{{ item.desc }}</div>
      </el-card>
    </section>

    <section class="card">
      <h2>预测结果（未来 8 周）</h2>
      <el-table :data="forecastData" border>
        <el-table-column prop="week" label="周次" width="120" />
        <el-table-column prop="forecast" label="预测需求" />
        <el-table-column prop="confidence" label="置信区间" />
        <el-table-column prop="variance" label="波动率" />
        <el-table-column prop="notes" label="提示" />
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
const kpis = [
  { title: '平均 MAPE', value: '6.8%', desc: '较上期改善 1.2%' },
  { title: '置信度', value: '92%', desc: '覆盖核心 SKU 80%' },
  { title: '异常波动', value: '3 次', desc: '主要分布在华东渠道' },
]

const forecastData = [
  { week: '第 1 周', forecast: '3,120', confidence: '± 210', variance: '8%', notes: '正常' },
  { week: '第 2 周', forecast: '3,260', confidence: '± 230', variance: '9%', notes: '促销叠加' },
  { week: '第 3 周', forecast: '3,080', confidence: '± 190', variance: '7%', notes: '正常' },
  { week: '第 4 周', forecast: '2,950', confidence: '± 200', variance: '11%', notes: '需求下滑预警' },
  { week: '第 5 周', forecast: '3,020', confidence: '± 210', variance: '8%', notes: '正常' },
  { week: '第 6 周', forecast: '3,180', confidence: '± 240', variance: '9%', notes: '新品上线' },
  { week: '第 7 周', forecast: '3,260', confidence: '± 230', variance: '8%', notes: '正常' },
  { week: '第 8 周', forecast: '3,330', confidence: '± 260', variance: '10%', notes: '旺季启动' },
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.kpi-title {
  font-size: 14px;
  color: #606266;
}

.kpi-value {
  font-size: 26px;
  font-weight: 600;
  margin: 10px 0;
}

.kpi-desc {
  font-size: 13px;
  color: #909399;
}
</style>

