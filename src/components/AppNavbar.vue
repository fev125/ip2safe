<template>
  <v-app-bar
    color="primary"
    app
    elevation="1"
  >
    <v-app-bar-title>
      <router-link to="/" class="text-decoration-none text-white">
        IP 信息查询
      </router-link>
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <!-- 未登录状态 -->
    <template v-if="!isAuthenticated">
      <v-btn
        variant="text"
        @click="showLoginDialog = true"
      >
        登录
      </v-btn>
      <v-btn
        variant="outlined"
        class="ml-2"
        @click="showRegisterDialog = true"
      >
        注册
      </v-btn>
    </template>

    <!-- 已登录状态 -->
    <template v-else>
      <v-btn
        variant="text"
        to="/history"
      >
        查询历史
      </v-btn>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            variant="text"
            v-bind="props"
          >
            {{ user?.username }}
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>退出登录</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>

    <!-- 登录对话框 -->
    <v-dialog
      v-model="showLoginDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>登录</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleLogin" ref="loginForm">
            <v-text-field
              v-model="loginForm.username"
              label="用户名或邮箱"
              required
              :rules="[v => !!v || '请输入用户名或邮箱']"
            ></v-text-field>
            <v-text-field
              v-model="loginForm.password"
              label="密码"
              type="password"
              required
              :rules="[v => !!v || '请输入密码']"
            ></v-text-field>
            <div class="d-flex justify-space-between align-center mt-4">
              <v-btn
                variant="text"
                @click="showForgotPasswordDialog = true"
              >
                忘记密码？
              </v-btn>
              <v-btn
                color="primary"
                type="submit"
                :loading="loading"
              >
                登录
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 注册对话框 -->
    <v-dialog
      v-model="showRegisterDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>注册</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleRegister" ref="registerForm">
            <v-text-field
              v-model="registerForm.username"
              label="用户名"
              required
              :rules="[v => !!v || '请输入用户名']"
            ></v-text-field>
            <v-text-field
              v-model="registerForm.email"
              label="邮箱"
              type="email"
              required
              :rules="[
                v => !!v || '请输入邮箱',
                v => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址'
              ]"
            ></v-text-field>
            <v-text-field
              v-model="registerForm.password"
              label="密码"
              type="password"
              required
              :rules="[
                v => !!v || '请输入密码',
                v => v.length >= 6 || '密码长度至少为6位'
              ]"
            ></v-text-field>
            <v-text-field
              v-model="registerForm.confirmPassword"
              label="确认密码"
              type="password"
              required
              :rules="[
                v => !!v || '请确认密码',
                v => v === registerForm.password || '两次输入的密码不一致'
              ]"
            ></v-text-field>
            <div class="d-flex justify-end mt-4">
              <v-btn
                color="primary"
                type="submit"
                :loading="loading"
              >
                注册
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 忘记密码对话框 -->
    <v-dialog
      v-model="showForgotPasswordDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>重置密码</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleResetPassword" ref="resetPasswordForm">
            <v-text-field
              v-model="resetPasswordForm.email"
              label="邮箱"
              type="email"
              required
              :rules="[
                v => !!v || '请输入邮箱',
                v => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址'
              ]"
            ></v-text-field>
            <div class="d-flex justify-end mt-4">
              <v-btn
                color="primary"
                type="submit"
                :loading="loading"
              >
                发送重置链接
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 提示消息 -->
    <v-snackbar
      v-model="showMessage"
      :color="messageType"
      :timeout="3000"
    >
      {{ message }}
    </v-snackbar>
  </v-app-bar>
</template>

<script>
import authService from '../services/authService';

export default {
  name: 'AppNavbar',
  
  data() {
    return {
      showLoginDialog: false,
      showRegisterDialog: false,
      showForgotPasswordDialog: false,
      loading: false,
      showMessage: false,
      message: '',
      messageType: 'success',
      
      loginForm: {
        username: '',
        password: ''
      },
      
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      
      resetPasswordForm: {
        email: ''
      }
    };
  },
  
  computed: {
    isAuthenticated() {
      return authService.isAuthenticated();
    },
    
    user() {
      return authService.getUser();
    }
  },
  
  methods: {
    async handleLogin() {
      if (!this.$refs.loginForm.validate()) return;
      
      try {
        this.loading = true;
        await authService.login(this.loginForm);
        this.showLoginDialog = false;
        this.showSuccessMessage('登录成功');
        this.$emit('login-success');
      } catch (error) {
        this.showErrorMessage(error.response?.data?.message || '登录失败，请重试');
      } finally {
        this.loading = false;
      }
    },
    
    async handleRegister() {
      if (!this.$refs.registerForm.validate()) return;
      
      try {
        this.loading = true;
        await authService.register(this.registerForm);
        this.showRegisterDialog = false;
        this.showSuccessMessage('注册成功');
        this.$emit('register-success');
      } catch (error) {
        this.showErrorMessage(error.response?.data?.message || '注册失败，请重试');
      } finally {
        this.loading = false;
      }
    },
    
    async handleResetPassword() {
      if (!this.$refs.resetPasswordForm.validate()) return;
      
      try {
        this.loading = true;
        await authService.resetPassword(this.resetPasswordForm.email);
        this.showForgotPasswordDialog = false;
        this.showSuccessMessage('重置密码链接已发送到您的邮箱');
      } catch (error) {
        this.showErrorMessage(error.response?.data?.message || '发送重置链接失败，请重试');
      } finally {
        this.loading = false;
      }
    },
    
    logout() {
      authService.logout();
      this.showSuccessMessage('已退出登录');
      this.$emit('logout');
    },
    
    showSuccessMessage(message) {
      this.message = message;
      this.messageType = 'success';
      this.showMessage = true;
    },
    
    showErrorMessage(message) {
      this.message = message;
      this.messageType = 'error';
      this.showMessage = true;
    }
  }
};
</script>

<style scoped>
.v-btn {
  text-transform: none;
}
</style>
