<template>
  <div class="admin">
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8">
          <!-- 登录卡片 -->
          <v-card v-if="!isLoggedIn" class="mt-4" elevation="2">
            <v-card-title class="text-h5 font-weight-bold pa-4">
              管理员登录
            </v-card-title>
            <v-card-text>
              <v-form @submit.prevent="handleLogin" ref="loginForm">
                <v-text-field
                  v-model="loginForm.username"
                  label="用户名"
                  :rules="[v => !!v || '请输入用户名']"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="loginForm.password"
                  label="密码"
                  type="password"
                  :rules="[v => !!v || '请输入密码']"
                  required
                ></v-text-field>
                <v-btn
                  color="primary"
                  type="submit"
                  block
                  :loading="loading"
                >
                  登录
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- API 配置管理 -->
          <template v-else>
            <div class="d-flex justify-space-between align-center mb-4">
              <h1 class="text-h4">API 配置管理</h1>
              <v-btn color="error" @click="handleLogout">
                退出登录
              </v-btn>
            </div>

            <v-card elevation="2">
              <v-tabs v-model="activeTab">
                <v-tab value="abuseipdb">AbuseIPDB</v-tab>
                <v-tab value="ip2location">IP2Location</v-tab>
                <v-tab value="ipregistry">IPRegistry</v-tab>
                <v-tab value="ipinfo">IPInfo</v-tab>
              </v-tabs>

              <v-card-text>
                <v-window v-model="activeTab">
                  <!-- AbuseIPDB 配置 -->
                  <v-window-item value="abuseipdb">
                    <v-form @submit.prevent="saveApiConfig('abuseipdb')" ref="abuseipdbForm">
                      <v-text-field
                        v-model="apiConfig.abuseipdb.apiKey"
                        label="API Key"
                        :rules="[v => !!v || '请输入 API Key']"
                        required
                      ></v-text-field>
                      <v-text-field
                        v-model="apiConfig.abuseipdb.maxAge"
                        label="最大天数"
                        type="number"
                        hint="查询历史记录的最大天数"
                        persistent-hint
                      ></v-text-field>
                      <v-switch
                        v-model="apiConfig.abuseipdb.enabled"
                        label="启用"
                        color="success"
                      ></v-switch>
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="loading"
                      >
                        保存配置
                      </v-btn>
                    </v-form>
                  </v-window-item>

                  <!-- IP2Location 配置 -->
                  <v-window-item value="ip2location">
                    <v-form @submit.prevent="saveApiConfig('ip2location')" ref="ip2locationForm">
                      <v-text-field
                        v-model="apiConfig.ip2location.apiKey"
                        label="API Key"
                        :rules="[v => !!v || '请输入 API Key']"
                        required
                      ></v-text-field>
                      <v-switch
                        v-model="apiConfig.ip2location.enabled"
                        label="启用"
                        color="success"
                      ></v-switch>
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="loading"
                      >
                        保存配置
                      </v-btn>
                    </v-form>
                  </v-window-item>

                  <!-- IPRegistry 配置 -->
                  <v-window-item value="ipregistry">
                    <v-form @submit.prevent="saveApiConfig('ipregistry')" ref="ipregistryForm">
                      <v-text-field
                        v-model="apiConfig.ipregistry.apiKey"
                        label="API Key"
                        :rules="[v => !!v || '请输入 API Key']"
                        required
                      ></v-text-field>
                      <v-switch
                        v-model="apiConfig.ipregistry.enabled"
                        label="启用"
                        color="success"
                      ></v-switch>
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="loading"
                      >
                        保存配置
                      </v-btn>
                    </v-form>
                  </v-window-item>

                  <!-- IPInfo 配置 -->
                  <v-window-item value="ipinfo">
                    <v-form @submit.prevent="saveApiConfig('ipinfo')" ref="ipinfoForm">
                      <v-text-field
                        v-model="apiConfig.ipinfo.token"
                        label="Access Token"
                        :rules="[v => !!v || '请输入 Access Token']"
                        required
                      ></v-text-field>
                      <v-switch
                        v-model="apiConfig.ipinfo.enabled"
                        label="启用"
                        color="success"
                      ></v-switch>
                      <v-btn
                        color="primary"
                        type="submit"
                        :loading="loading"
                      >
                        保存配置
                      </v-btn>
                    </v-form>
                  </v-window-item>
                </v-window>
              </v-card-text>
            </v-card>
          </template>
        </v-col>
      </v-row>
    </v-container>

    <!-- 提示消息 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script>
export default {
  name: 'AdminView',
  
  data() {
    return {
      isLoggedIn: false,
      loading: false,
      activeTab: 'abuseipdb',
      loginForm: {
        username: '',
        password: ''
      },
      apiConfig: {
        abuseipdb: {
          apiKey: '',
          maxAge: 90,
          enabled: true
        },
        ip2location: {
          apiKey: '',
          enabled: true
        },
        ipregistry: {
          apiKey: '',
          enabled: true
        },
        ipinfo: {
          token: '',
          enabled: true
        }
      },
      snackbar: {
        show: false,
        text: '',
        color: 'success'
      }
    };
  },

  created() {
    // 检查登录状态
    this.checkLoginStatus();
    // 如果已登录，加载配置
    if (this.isLoggedIn) {
      this.loadApiConfig();
    }
  },

  methods: {
    checkLoginStatus() {
      const token = localStorage.getItem('admin_token');
      this.isLoggedIn = !!token;
    },

    async handleLogin() {
      try {
        const valid = await this.$refs.loginForm.validate();
        if (!valid) return;

        this.loading = true;
        
        // 简单的登录验证
        if (this.loginForm.username === 'admin' && this.loginForm.password === 'admin') {
          localStorage.setItem('admin_token', 'dummy_token');
          this.isLoggedIn = true;
          this.loadApiConfig();
          this.showMessage('登录成功', 'success');
        } else {
          this.showMessage('用户名或密码错误', 'error');
        }
      } catch (error) {
        this.showMessage('登录失败', 'error');
      } finally {
        this.loading = false;
      }
    },

    handleLogout() {
      localStorage.removeItem('admin_token');
      this.isLoggedIn = false;
      this.showMessage('已退出登录', 'info');
    },

    loadApiConfig() {
      // 从 localStorage 加载配置
      const savedConfig = localStorage.getItem('api_config');
      if (savedConfig) {
        this.apiConfig = JSON.parse(savedConfig);
      }
    },

    async saveApiConfig(provider) {
      try {
        const formRef = this.$refs[`${provider}Form`];
        if (!formRef) return;

        const valid = await formRef.validate();
        if (!valid) return;

        this.loading = true;

        // 保存到 localStorage
        localStorage.setItem('api_config', JSON.stringify(this.apiConfig));
        
        this.showMessage('配置保存成功', 'success');
      } catch (error) {
        this.showMessage('保存失败', 'error');
      } finally {
        this.loading = false;
      }
    },

    showMessage(text, color = 'success') {
      this.snackbar = {
        show: true,
        text,
        color
      };
    }
  }
};
</script>

<style scoped>
.admin {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24px 0;
}
</style> 