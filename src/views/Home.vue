<template>
  <div class="home">
    <ip-lookup />
  </div>
</template>

<script>
import IpLookup from '@/components/IpLookup.vue'

export default {
  name: 'HomeView',
  components: {
    IpLookup
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
}
</style> 