<template>
  <v-card class="mt-4 risk-score-card" elevation="0" border>
    <v-card-title class="d-flex align-center" v-if="hasRiskData">
      <span class="text-h6">风险评估</span>
      <v-chip
        class="ml-2"
        :color="normalizedRiskScore.color"
        size="small"
        label
        variant="elevated"
      >
        {{ normalizedRiskScore.riskLevel }}
      </v-chip>
    </v-card-title>
    
    <v-card-text>
      <template v-if="hasRiskData">
        <v-row>
          <v-col cols="12" sm="6">
            <div class="text-center">
              <div class="text-subtitle-1 mb-4">总体风险评分</div>
              <div class="score-circle-container">
                <v-progress-circular
                  :model-value="normalizedRiskScore.finalScore"
                  :color="normalizedRiskScore.color"
                  size="150"
                  width="15"
                  class="score-circle"
                >
                  <div class="score-value">
                    <div class="text-h4 font-weight-bold">{{ normalizedRiskScore.finalScore }}</div>
                    <div class="text-caption text-medium-emphasis">风险指数</div>
                  </div>
                </v-progress-circular>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" sm="6">
            <div class="text-subtitle-1 mb-4">风险因素分析</div>
            <template v-if="normalizedRiskFactors.length > 0">
              <v-list density="compact" class="risk-factors-list">
                <v-list-item
                  v-for="(factor, index) in normalizedRiskFactors"
                  :key="index"
                  :prepend-icon="getRiskIcon(factor.type)"
                  :color="getRiskColor(factor.severity)"
                  class="mb-2"
                  rounded
                >
                  <v-list-item-title class="text-body-2">{{ factor.description }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </template>
            <template v-else>
              <v-alert
                type="success"
                variant="tonal"
                class="mb-4"
                border="start"
              >
                未检测到任何风险因素
              </v-alert>
            </template>
          </v-col>
        </v-row>

        <v-row class="mt-6">
          <v-col cols="12" sm="4">
            <div class="score-category">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-subtitle-2">历史滥用评分</div>
                <div class="text-caption" :class="{'text-success': !normalizedRiskScore.details.abuseScore}">
                  {{ !normalizedRiskScore.details.abuseScore ? '安全' : '风险' }}
                </div>
              </div>
              <v-progress-linear
                :model-value="normalizedRiskScore.details.abuseScore"
                :color="getScoreColor(normalizedRiskScore.details.abuseScore)"
                height="24"
                rounded
                class="score-bar"
              >
                <template #default>
                  <div class="text-caption font-weight-medium white--text">
                    {{ normalizedRiskScore.details.abuseScore }}
                  </div>
                </template>
              </v-progress-linear>
            </div>
          </v-col>
          
          <v-col cols="12" sm="4">
            <div class="score-category">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-subtitle-2">代理使用评分</div>
                <div class="text-caption" :class="{'text-success': !normalizedRiskScore.details.proxyScore}">
                  {{ !normalizedRiskScore.details.proxyScore ? '安全' : '风险' }}
                </div>
              </div>
              <v-progress-linear
                :model-value="normalizedRiskScore.details.proxyScore"
                :color="getScoreColor(normalizedRiskScore.details.proxyScore)"
                height="24"
                rounded
                class="score-bar"
              >
                <template #default>
                  <div class="text-caption font-weight-medium white--text">
                    {{ normalizedRiskScore.details.proxyScore }}
                  </div>
                </template>
              </v-progress-linear>
            </div>
          </v-col>
          
          <v-col cols="12" sm="4">
            <div class="score-category">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-subtitle-2">行为评分</div>
                <div class="text-caption" :class="{'text-success': !normalizedRiskScore.details.behaviorScore}">
                  {{ !normalizedRiskScore.details.behaviorScore ? '安全' : '风险' }}
                </div>
              </div>
              <v-progress-linear
                :model-value="normalizedRiskScore.details.behaviorScore"
                :color="getScoreColor(normalizedRiskScore.details.behaviorScore)"
                height="24"
                rounded
                class="score-bar"
              >
                <template #default>
                  <div class="text-caption font-weight-medium white--text">
                    {{ normalizedRiskScore.details.behaviorScore }}
                  </div>
                </template>
              </v-progress-linear>
            </div>
          </v-col>
        </v-row>
      </template>
      <template v-else>
        <div class="text-h6 mb-4">风险评估</div>
        <v-alert
          type="info"
          variant="tonal"
          class="mb-4"
          border="start"
        >
          暂无风险评估数据
        </v-alert>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'RiskScoreCard',
  
  props: {
    riskScore: {
      type: Object,
      required: true,
      default: () => ({
        finalScore: 0,
        riskLevel: '未知',
        color: 'grey',
        details: {
          abuseScore: 0,
          proxyScore: 0,
          behaviorScore: 0
        }
      })
    },
    riskFactors: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    normalizedRiskScore() {
      try {
        if (!this.riskScore || typeof this.riskScore !== 'object') {
          throw new Error('Invalid risk score data');
        }

        return {
          finalScore: Number(this.riskScore.finalScore) || 0,
          riskLevel: String(this.riskScore.riskLevel || '未知'),
          color: String(this.riskScore.color || 'grey'),
          details: {
            abuseScore: Number(this.riskScore.details?.abuseScore) || 0,
            proxyScore: Number(this.riskScore.details?.proxyScore) || 0,
            behaviorScore: Number(this.riskScore.details?.behaviorScore) || 0
          }
        };
      } catch (error) {
        console.error('Error normalizing risk score:', error);
        return {
          finalScore: 0,
          riskLevel: '未知',
          color: 'grey',
          details: {
            abuseScore: 0,
            proxyScore: 0,
            behaviorScore: 0
          }
        };
      }
    },

    normalizedRiskFactors() {
      try {
        if (!Array.isArray(this.riskFactors)) {
          return [];
        }
        return this.riskFactors.map(factor => ({
          type: String(factor.type || ''),
          severity: String(factor.severity || 'low'),
          description: String(factor.description || '未知风险')
        }));
      } catch (error) {
        console.error('Error normalizing risk factors:', error);
        return [];
      }
    },

    hasRiskData() {
      return this.normalizedRiskScore.finalScore > 0 || 
             this.normalizedRiskFactors.length > 0 || 
             this.normalizedRiskScore.riskLevel !== '未知';
    }
  },

  methods: {
    getRiskIcon(type) {
      try {
        const icons = {
          abuse: 'mdi-alert-circle',
          proxy: 'mdi-server-network',
          vpn: 'mdi-shield-lock',
          tor: 'mdi-web',
          network: 'mdi-desktop-tower',
          behavior: 'mdi-account-alert',
          default: 'mdi-information'
        };
        return icons[type] || icons.default;
      } catch (error) {
        return 'mdi-information';
      }
    },
    
    getRiskColor(severity) {
      try {
        const colors = {
          low: 'success',
          medium: 'warning',
          high: 'error',
          default: 'grey'
        };
        return colors[severity] || colors.default;
      } catch (error) {
        return 'grey';
      }
    },
    
    getScoreColor(score) {
      try {
        score = Number(score) || 0;
        if (score === 0) return 'success';
        if (score <= 30) return 'success';
        if (score <= 60) return 'info';
        if (score <= 80) return 'warning';
        return 'error';
      } catch (error) {
        return 'grey';
      }
    }
  }
};
</script>

<style scoped>
.risk-score-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
}

.score-circle-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}

.score-circle {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.score-value {
  text-align: center;
}

.risk-factors-list {
  background-color: transparent;
}

.risk-factors-list .v-list-item {
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.risk-factors-list .v-list-item:hover {
  transform: translateX(4px);
}

.score-category {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}

.score-bar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

@media (max-width: 600px) {
  .score-circle-container {
    min-height: 160px;
  }
  
  .score-category {
    margin-bottom: 16px;
  }
}
</style>
