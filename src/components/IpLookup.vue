<template>
  <div class="ip-lookup">
    <v-container class="pa-4">
      <!-- 搜索区域 -->
      <div class="search-container mb-8">
        <h1 class="text-h3 mb-6 font-weight-light text-center">IP 信息查询</h1>
        
        <!-- 当前IP信息 -->
        <v-card class="mb-4" elevation="0" border v-if="currentIpv4 || currentIpv6">
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-subtitle-1">当前IP地址</div>
              <v-chip
                v-if="currentIpv4 && currentIpv6"
                :color="showingIpv6 ? 'primary' : 'success'"
                @click="toggleIpVersion"
                class="ml-2"
              >
                切换到 {{ showingIpv6 ? 'IPv4' : 'IPv6' }}
              </v-chip>
            </div>
            <div class="d-flex align-center">
              <v-chip
                :color="showingIpv6 ? 'primary' : 'success'"
                class="mr-2"
              >
                {{ showingIpv6 ? 'IPv6' : 'IPv4' }}
              </v-chip>
              <div class="text-h6">{{ showingIpv6 ? currentIpv6 : currentIpv4 }}</div>
              <v-btn
                icon
                variant="text"
                size="small"
                class="ml-2"
                @click="lookupCurrentIp"
              >
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-form @submit.prevent="lookupIp" class="search-form">
          <v-text-field
            v-model="ipAddress"
            :rules="[rules.required, rules.ipFormat]"
            placeholder="输入 IP 地址，例如: 8.8.8.8 或 2001:4860:4860::8888"
            variant="outlined"
            clearable
            hide-details
            class="search-input"
          >
            <template v-slot:append>
              <v-btn
                color="primary"
                :loading="loading"
                @click="lookupIp"
                :disabled="!ipAddress"
                size="large"
                class="search-button"
              >
                <v-icon>mdi-magnify</v-icon>
                查询
              </v-btn>
            </template>
          </v-text-field>
        </v-form>
      </div>

      <!-- 结果展示区域 -->
      <v-expand-transition>
        <div v-if="ipInfo" class="result-container">
          <!-- 主要信息卡片 -->
          <v-card class="mb-6 main-info-card" elevation="0" border>
            <v-card-item>
              <div class="d-flex align-center mb-4">
                <v-avatar
                  :color="getStatusColor(ipInfo.security.threatLevel.level)"
                  size="48"
                  class="mr-4"
                >
                  <v-icon size="32" color="white">
                    {{ getStatusIcon(ipInfo.security.threatLevel.level) }}
                  </v-icon>
                </v-avatar>
                <div>
                  <div class="text-h4 mb-1">{{ ipInfo.ip }}</div>
                  <div class="text-subtitle-1 text-medium-emphasis">
                    {{ ipInfo.asn.organization }}
                  </div>
                </div>
              </div>

              <!-- 风险评估进度条 -->
              <div class="risk-assessment mb-4">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1">风险评估</span>
                  <v-chip
                    :color="getStatusColor(ipInfo.security.threatLevel.level)"
                    text-color="white"
                  >
                    {{ ipInfo.security.threatLevel.label }}
                  </v-chip>
                </div>
                <v-progress-linear
                  :model-value="ipInfo.security.riskScore"
                  :color="getStatusColor(ipInfo.security.threatLevel.level)"
                  height="12"
                  rounded
                >
                  <template v-slot:default="{ value }">
                    <span class="risk-score">{{ Math.ceil(value) }}%</span>
                  </template>
                </v-progress-linear>
              </div>

              <!-- 风险因素标签 -->
              <div v-if="ipInfo.security.riskFactors.length > 0" class="risk-factors">
                <div class="text-subtitle-1 mb-2">检测到的风险因素：</div>
                <div class="d-flex flex-wrap gap-2">
                  <v-chip
                    v-for="(factor, index) in ipInfo.security.riskFactors"
                    :key="index"
                    :color="ipInfo.security.threatLevel.color"
                    variant="outlined"
                    class="mr-2 mb-2"
                    @click="showRiskDetails(factor)"
                  >
                    <template v-slot:prepend>
                      <v-icon size="small" class="mr-1">
                        {{ getRiskFactorIcon(factor.type) }}
                      </v-icon>
                    </template>
                    {{ factor.name }}
                    <v-tooltip
                      activator="parent"
                      location="top"
                    >
                      {{ factor.description }}
                    </v-tooltip>
                  </v-chip>
                </div>
              </div>
            </v-card-item>
          </v-card>

           <!-- 风险评分卡片 -->
           <risk-score-card
            v-if="ipInfo && ipInfo.security"
            :risk-score="{
              finalScore: ipInfo.security.riskScore,
              riskLevel: ipInfo.security.threatLevel.label,
              color: ipInfo.security.threatLevel.color,
              details: {
                abuseScore: ipInfo.security.riskFactors.find(f => f.type === 'abuse')?.score || 0,
                proxyScore: ipInfo.security.riskFactors.find(f => f.type === 'proxy')?.score || 0,
                behaviorScore: ipInfo.security.riskFactors.find(f => f.type === 'behavior')?.score || 0
              }
            }"
            :risk-factors="ipInfo.security.riskFactors"
            class="mt-4"
          />

          <!-- 详细信息网格 -->
          <v-row>
            <!-- ASN 信息 -->
            <v-col cols="12" md="6">
              <v-card elevation="0" border class="info-card">
                <v-card-item>
                  <template v-slot:prepend>
                    <v-icon size="32" color="primary">mdi-server-network</v-icon>
                  </template>
                  <v-card-title>网络信息</v-card-title>
                  <v-card-subtitle>自治系统和网络详情</v-card-subtitle>

                  <v-card-text>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">ASN</div>
                        <div class="info-value">{{ ipInfo.asn.number }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">网络类型</div>
                        <div class="info-value">{{ ipInfo.usage.type.toUpperCase() }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">使用用途</div>
                        <div class="info-value">{{ ipInfo.usage.purpose }}</div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card-item>
              </v-card>
            </v-col>

            <!-- 地理位置信息 -->
            <v-col cols="12" md="6">
              <v-card elevation="0" border class="info-card">
                <v-card-item>
                  <template v-slot:prepend>
                    <v-icon size="32" color="primary">mdi-map-marker</v-icon>
                  </template>
                  <v-card-title>地理位置</v-card-title>
                  <v-card-subtitle>IP 地址的物理位置信息</v-card-subtitle>

                  <v-card-text>
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-label">城市</div>
                        <div class="info-value">{{ ipInfo.location.city }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">地区</div>
                        <div class="info-value">{{ ipInfo.location.region }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">国家</div>
                        <div class="info-value">{{ ipInfo.location.country }}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">时区</div>
                        <div class="info-value">{{ ipInfo.location.timezone }}</div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card-item>
              </v-card>
            </v-col>
          </v-row>

          <!-- 地图 -->
          <v-card v-if="hasCoordinates" elevation="0" border class="mt-6">
            <v-card-text class="pa-0">
              <iframe
                width="100%"
                height="400"
                frameborder="0"
                scrolling="no"
                marginheight="0"
                marginwidth="0"
                :src="getMapUrl"
                class="map-frame"
              ></iframe>
            </v-card-text>
          </v-card>
        </div>
      </v-expand-transition>

      <v-snackbar
        v-model="showError"
        color="error"
        timeout="3000"
      >
        {{ errorMessage }}
      </v-snackbar>

      <v-dialog v-model="showRiskDialog" max-width="500">
        <v-card>
          <v-card-title class="risk-details-title">{{ selectedRiskFactor.name }}</v-card-title>
          <v-card-text class="risk-details-description">{{ selectedRiskFactor.description }}</v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import ipService from '../services/ipService';
import currentIpService from '../services/currentIpService';
import riskScoreService from '../services/riskScoreService';
import RiskScoreCard from './RiskScoreCard.vue';

export default {
  name: 'IpLookup',
  components: {
    RiskScoreCard
  },
  data() {
    return {
      ipAddress: '',
      loading: false,
      ipInfo: null,
      riskScore: null,
      riskFactors: [],
      currentIpv4: null,
      currentIpv6: null,
      showingIpv6: false,
      error: null,
      rules: {
        required: v => !!v || '请输入IP地址',
        ipFormat: v => {
          if (!v) return true;
          const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
          const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$/;
          return (ipv4Regex.test(v) || ipv6Regex.test(v)) || '请输入有效的IPv4或IPv6地址';
        }
      }
    };
  },
  computed: {
    hasCoordinates() {
      return this.ipInfo?.coordinates?.latitude && this.ipInfo?.coordinates?.longitude;
    },
    getMapUrl() {
      if (!this.hasCoordinates) return '';
      const { latitude, longitude } = this.ipInfo.coordinates;
      return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    }
  },
  methods: {
    async lookupIp() {
      if (!this.ipAddress) return;
      
      try {
        this.loading = true;
        this.error = null;
        
        // 重置数据
        this.ipInfo = null;
        this.riskScore = null;
        this.riskFactors = [];
        
        // 获取数据
        const data = await ipService.getAllIpInfo(this.ipAddress);
        
        // 初始化基本数据结构
        const baseData = {
          ip: this.ipAddress,
          asn: {
            number: 'N/A',
            organization: '未知组织'
          },
          location: {
            city: '未知',
            region: '未知',
            country: '未知',
            timezone: 'UTC'
          },
          coordinates: {
            latitude: null,
            longitude: null
          },
          usage: {
            type: 'UNKNOWN',
            purpose: '未知'
          },
          security: {
            riskScore: 0,
            threatLevel: {
              level: 'unknown',
              label: '未知',
              color: 'grey'
            },
            riskFactors: []
          }
        };

        // 合并API返回的数据
        const mergedData = {
          ...baseData,
          ...data
        };
        
        // 确保安全信息存在
        if (!mergedData.security) {
          mergedData.security = {
            riskScore: 0,
            threatLevel: { level: 'safe', label: '安全', color: 'success' },
            riskFactors: []
          };
        }
        
        // 计算风险评分和因素
        const riskScoreData = riskScoreService.calculateFinalScore(mergedData);
        const riskFactorsData = riskScoreService.getRiskFactors(mergedData);
        
        // 更新安全信息
        mergedData.security = {
          ...mergedData.security,
          riskScore: riskScoreData.finalScore,
          threatLevel: {
            level: this.getRiskLevel(riskScoreData.finalScore).level,
            label: riskScoreData.riskLevel,
            color: riskScoreData.color
          },
          riskFactors: riskFactorsData.map(factor => ({
            ...factor,
            score: factor.score || 0
          }))
        };
        
        // 更新组件数据
        this.ipInfo = mergedData;
        this.riskScore = riskScoreData.finalScore;
        this.riskFactors = riskFactorsData;
        
      } catch (error) {
        console.error('Error looking up IP:', error);
        this.error = '查询IP信息时发生错误，请稍后重试';
        this.showError = true;
      } finally {
        this.loading = false;
      }
    },

    getRiskLevel(score) {
      if (score <= 30) return { level: 'very_low', label: '极低', color: 'success' };
      if (score <= 60) return { level: 'low', label: '低', color: 'info' };
      if (score <= 80) return { level: 'medium', label: '中等', color: 'warning' };
      if (score <= 90) return { level: 'high', label: '高', color: 'error' };
      return { level: 'very_high', label: '极高', color: 'deep-purple' };
    },

    async detectCurrentIp() {
      try {
        const { ipv4, ipv6 } = await currentIpService.getCurrentIps();
        this.currentIpv4 = ipv4;
        this.currentIpv6 = ipv6;
        
        if (this.currentIpv4) {
          this.ipAddress = this.currentIpv4;
          await this.lookupIp();
        }
      } catch (error) {
        console.error('Error detecting current IP:', error);
        this.error = '检测当前IP地址时发生错误，请手动输入IP地址';
        this.showError = true;
      }
    },

    toggleIpVersion() {
      this.showingIpv6 = !this.showingIpv6;
      this.ipAddress = this.showingIpv6 ? this.currentIpv6 : this.currentIpv4;
      this.lookupIp();
    },

    lookupCurrentIp() {
      this.ipAddress = this.showingIpv6 ? this.currentIpv6 : this.currentIpv4;
      this.lookupIp();
    },
    getStatusColor(level) {
      const colors = {
        safe: 'success',
        low: 'info',
        medium: 'warning',
        high: 'warning-darken-2',
        critical: 'error'
      };
      return colors[level] || 'grey';
    },
    getStatusIcon(level) {
      const icons = {
        safe: 'mdi-shield-check',
        low: 'mdi-shield-alert',
        medium: 'mdi-shield-alert',
        high: 'mdi-shield-alert',
        critical: 'mdi-shield-off'
      };
      return icons[level] || 'mdi-shield';
    },
    getRiskFactorIcon(type) {
      const icons = {
        proxy: 'mdi-server-network',
        vpn: 'mdi-vpn',
        tor: 'mdi-web',
        datacenter: 'mdi-server',
        abuse: 'mdi-alert-circle',
        bot: 'mdi-robot',
        spam: 'mdi-email-alert',
        attack: 'mdi-shield-alert',
        suspicious: 'mdi-eye-alert',
        anonymous: 'mdi-incognito',
        country: 'mdi-map-marker-alert'
      };
      return icons[type] || 'mdi-alert';
    },
    showRiskDetails(factor) {
      this.selectedRiskFactor = factor;
      this.showRiskDialog = true;
    }
  },
  
  async created() {
    await this.detectCurrentIp();
  }
};
</script>

<style scoped>
.ip-lookup {
  background-color: #fafafa;
  min-height: 100vh;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
}

.search-form {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.search-input {
  padding: 8px;
}

.search-button {
  margin: 8px;
  height: 48px !important;
}

.result-container {
  max-width: 1200px;
  margin: 0 auto;
}

.main-info-card {
  background-color: white;
  border-radius: 12px;
}

.info-card {
  height: 100%;
  background-color: white;
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.info-item {
  padding: 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.info-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 4px;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
}

.risk-score {
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
}

.risk-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.gap-2 {
  gap: 8px;
}

.map-frame {
  border-radius: 8px;
}

.risk-details {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin-top: 8px;
}

.risk-details-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.risk-details-description {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.current-ip-section {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.ip-version-chip {
  min-width: 80px;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .search-container {
    padding: 16px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
