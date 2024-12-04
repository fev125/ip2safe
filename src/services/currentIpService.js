import axios from 'axios';

class CurrentIpService {
    async getCurrentIps() {
        try {
            // 尝试多个服务以提高可靠性
            const [ipv4Info, ipv6Info] = await Promise.allSettled([
                this.getIpv4(),
                this.getIpv6()
            ]);

            return {
                ipv4: ipv4Info.status === 'fulfilled' ? ipv4Info.value : null,
                ipv6: ipv6Info.status === 'fulfilled' ? ipv6Info.value : null
            };
        } catch (error) {
            console.error('Error fetching current IPs:', error);
            throw error;
        }
    }

    async getIpv4() {
        try {
            // 使用ipv4.icanhazip.com确保返回IPv4地址
            const response = await axios.get('https://ipv4.icanhazip.com', {
                timeout: 5000
            });
            return response.data.trim();
        } catch (error) {
            console.error('Error fetching IPv4:', error);
            // 备用服务
            try {
                const response = await axios.get('https://api.ipify.org?format=json');
                return response.data.ip;
            } catch (backupError) {
                console.error('Backup IPv4 service failed:', backupError);
                return null;
            }
        }
    }

    async getIpv6() {
        try {
            // 使用ipv6.icanhazip.com确保返回IPv6地址
            const response = await axios.get('https://ipv6.icanhazip.com', {
                timeout: 5000
            });
            return response.data.trim();
        } catch (error) {
            console.error('Error fetching IPv6:', error);
            // 备用服务
            try {
                const response = await axios.get('https://api64.ipify.org?format=json');
                return response.data.ip;
            } catch (backupError) {
                console.error('Backup IPv6 service failed:', backupError);
                return null;
            }
        }
    }

    isValidIpv4(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipv4Regex.test(ip)) return false;
        return ip.split('.').every(num => {
            const n = parseInt(num, 10);
            return n >= 0 && n <= 255;
        });
    }

    isValidIpv6(ip) {
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv6Regex.test(ip);
    }
}

export default new CurrentIpService();
