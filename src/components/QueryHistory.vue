<template>
  <v-container>
    <v-row>
      <v-col>
        <h2 class="text-h4 mb-4">查询历史</h2>
        
        <v-card>
          <v-data-table
            :headers="headers"
            :items="historyItems"
            :loading="loading"
            class="elevation-1"
          >
            <template #[`item.timestamp`]="{ item }">
              {{ formatDate(item.timestamp) }}
            </template>
            
            <template #[`item.ipAddress`]="{ item }">
              <v-btn
                variant="text"
                color="primary"
                @click="lookupIp(item.ipAddress)"
              >
                {{ item.ipAddress }}
              </v-btn>
            </template>

            <template #[`item.networkType`]="{ item }">
              <v-chip
                :color="getNetworkTypeColor(item.networkType)"
                size="small"
              >
                {{ item.networkType }}
              </v-chip>
            </template>

            <template #[`item.riskLevel`]="{ item }">
              <v-chip
                :color="getRiskLevelColor(item.riskLevel)"
                size="small"
              >
                {{ item.riskLevel }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios'
import authService from '../services/authService'

export default {
  name: 'QueryHistory',
  
  data() {
    return {
      loading: false,
      historyItems: [],
      headers: [
        { title: '时间', key: 'timestamp', sortable: true },
        { title: 'IP地址', key: 'ipAddress', sortable: true },
        { title: '网络类型', key: 'networkType', sortable: true },
        { title: '使用用途', key: 'usageType', sortable: true },
        { title: '风险等级', key: 'riskLevel', sortable: true },
        { title: '位置', key: 'location', sortable: true }
      ]
    }
  },

  created() {
    this.fetchHistory()
  },

  methods: {
    async fetchHistory() {
      try {
        this.loading = true
        const token = authService.getToken()
        const response = await axios.get('/api/history', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.historyItems = response.data
      } catch (error) {
        console.error('Failed to fetch history:', error)
      } finally {
        this.loading = false
      }
    },

    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString()
    },

    lookupIp(ip) {
      this.$router.push({
        name: 'Home',
        query: { ip }
      })
    },

    getNetworkTypeColor(type) {
      const colors = {
        'DATACENTER': 'purple',
        'CDN': 'blue',
        'ISP': 'green',
        'HOSTING': 'orange',
        'EDUCATION': 'cyan',
        'GOVERNMENT': 'red',
        'BUSINESS': 'indigo',
        'RESIDENTIAL': 'teal',
        'MOBILE': 'pink'
      }
      return colors[type] || 'grey'
    },

    getRiskLevelColor(level) {
      const colors = {
        '低': 'success',
        '中': 'warning',
        '高': 'error'
      }
      return colors[level] || 'grey'
    }
  }
}
</script>

<style scoped>
.v-data-table {
  width: 100%;
}
</style>
