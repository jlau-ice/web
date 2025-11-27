<template>
  <div class="page">
    <section class="intro card">
      <h1>洞察分析</h1>
      <p>
        深度解析预测结果背后的模式与驱动因素，输出面向业务的洞察结论，帮助快速验证假设并制定应对策略。
      </p>
    </section>

    <section class="cards">
      <el-card v-for="item in insights" :key="item.title" class="card insight">
        <div class="tag">{{ item.tag }}</div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.detail }}</p>
        <footer>{{ item.action }}</footer>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
const insights = [
  {
    tag: '需求',
    title: '华南渠道对促销敏感',
    detail: '折扣从 8% 提升至 12% 时，订单量跳升 18%，需提前准备库存。',
    action: '与销售共建分层促销策略，并同步产线排产。',
  },
  {
    tag: '库存',
    title: '慢动销 SKU 积压风险',
    detail: '部分尾货库存超过 35 天，影响现金流表现。',
    action: '建议与渠道联合开展组合促销，或调拨至线上直销渠道。',
  },
  {
    tag: '供应',
    title: '关键原料价格波动',
    detail: '近两周期货价格上涨 8%，或将压缩毛利。',
    action: '提前锁定季度合同并评估替代材料可行性。',
  },
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.insight .tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 6px;
  background: #eef2ff;
  color: #5c6ac4;
  font-size: 12px;
  margin-bottom: 8px;
}

.insight h3 {
  margin: 0 0 6px;
}

.insight footer {
  margin-top: 12px;
  font-size: 13px;
  color: #606266;
}
</style>

