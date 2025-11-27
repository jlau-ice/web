<template>
  <div class="page">
    <section class="intro card">
      <h1>库存预测</h1>
      <p>
        根据需求预测、在途采购与安全库存策略，推演各区域仓的未来库存水平，提前识别缺货或积压风险。
      </p>
    </section>

    <section class="card">
      <h2>库存健康度</h2>
      <el-table :data="inventoryHealth" size="small">
        <el-table-column prop="warehouse" label="仓库" />
        <el-table-column prop="daysOfInventory" label="周转天数" />
        <el-table-column prop="safetyRange" label="安全范围" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.tag">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="建议动作" />
      </el-table>
    </section>

    <section class="card">
      <h2>未来 6 周库存预测</h2>
      <div class="forecast">
        <div v-for="item in forecast" :key="item.week" class="forecast-item">
          <div class="week">{{ item.week }}</div>
          <div class="value">{{ item.inventory }} 天</div>
          <div class="range">安全 {{ item.safe }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const inventoryHealth = [
  {
    warehouse: '华东 RDC',
    daysOfInventory: '17.2',
    safetyRange: '12 ~ 18',
    status: '健康',
    tag: 'success',
    action: '继续保持动态补货机制',
  },
  {
    warehouse: '华北 RDC',
    daysOfInventory: '10.8',
    safetyRange: '12 ~ 18',
    status: '偏低',
    tag: 'warning',
    action: '本周内补货 2,000 单位',
  },
  {
    warehouse: '华南 RDC',
    daysOfInventory: '21.5',
    safetyRange: '12 ~ 18',
    status: '偏高',
    tag: 'danger',
    action: '暂停低动销 SKU 补货，联合促销',
  },
]

const forecast = [
  { week: '第 1 周', inventory: 15.2, safe: '12 ~ 18' },
  { week: '第 2 周', inventory: 14.6, safe: '12 ~ 18' },
  { week: '第 3 周', inventory: 16.4, safe: '12 ~ 18' },
  { week: '第 4 周', inventory: 18.1, safe: '12 ~ 18' },
  { week: '第 5 周', inventory: 17.5, safe: '12 ~ 18' },
  { week: '第 6 周', inventory: 16.9, safe: '12 ~ 18' },
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

.forecast {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.forecast-item {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 12px;
  background: #fafafa;
}

.week {
  font-weight: 600;
  margin-bottom: 6px;
}

.value {
  font-size: 24px;
  font-weight: 600;
}

.range {
  font-size: 13px;
  color: #909399;
}
</style>

