import axios from 'axios';

// 配置 API keys
const API_KEYS = {
    IPINFO: process.env.VUE_APP_IPINFO_TOKEN,
    IPREGISTRY: process.env.VUE_APP_IPREGISTRY_TOKEN,
    ABUSEIPDB: process.env.VUE_APP_ABUSEIPDB_TOKEN,
    IP2LOCATION: process.env.VUE_APP_IP2LOCATION_TOKEN
};

// ASN 类型映射
const ASN_TYPES = {
    DATACENTER: [
        'Amazon', 'AWS', 'Google', 'GCP', 'Microsoft', 'Azure', 'Alibaba', 'Aliyun',
        'Digital Ocean', 'Linode', 'OVH', 'Hetzner', 'Vultr', 'Oracle', 'IBM',
        'Tencent', 'Baidu', 'Rackspace', 'Softlayer', 'GoDaddy', 'HostGator',
        'EC2', 'Compute', 'Cloud', 'Data Center', 'Datacenter', 'DC', 'Hosting',
        'Server', 'VPS', 'Virtual', 'Dedicated'
    ],
    CDN: [
        'Cloudflare', 'Akamai', 'Fastly', 'CloudFront', 'Limelight', 'EdgeCast',
        'StackPath', 'CDNetworks', 'Imperva', 'Incapsula', 'Azure CDN', 'Alibaba CDN',
        'CDN', 'Content Delivery', 'Cache', 'Edge Network', 'Edge Server'
    ],
    ISP: [
        'Comcast', 'Verizon', 'AT&T', 'T-Mobile', 'Sprint', 'Charter', 'Spectrum',
        'China Telecom', 'China Unicom', 'China Mobile', 'China Net', 'ChinaNet',
        'Deutsche Telekom', 'Vodafone', 'Orange', 'Telefonica',
        'British Telecom', 'NTT', 'KDDI', 'SoftBank',
        'Rogers', 'Bell', 'Telus', 'Shaw',
        'Telstra', 'Optus', 'TPG', 'iiNet',
        'Telecom', 'Broadband', 'Communications', 'Internet Service',
        'Network', 'Cable', 'Fiber', 'DSL', 'Mobile', 'Wireless'
    ],
    HOSTING: [
        'GoDaddy', 'HostGator', 'Bluehost', 'DreamHost', 'A2 Hosting', 'SiteGround',
        'InMotion', 'NameCheap', 'iPage', 'Hostinger', 'Web Host', 'Webhost',
        'Hosting', 'Host', 'Shared Hosting', 'Reseller'
    ],
    EDUCATION: [
        'EDU', 'University', 'College', 'School', 'Institute', 'Academia',
        'Research', 'Education', 'Academic', 'Campus', 'Laboratory', 'Lab'
    ],
    GOVERNMENT: [
        'GOV', 'Government', 'Federal', 'State', 'Military', 'Army',
        'Navy', 'Air Force', 'Defense', 'Police', 'Administration',
        'Department', 'Ministry', 'Agency', 'Bureau', 'Council'
    ],
    BUSINESS: [
        'LLC', 'Corp', 'Inc', 'Limited', 'Bank', 'Financial',
        'Insurance', 'Trading', 'Enterprise', 'Business', 'Company',
        'Corporate', 'Office', 'Group', 'Holdings', 'Commerce'
    ]
};

// 使用类型描述
const USAGE_TYPES = {
    DATACENTER: '数据中心/云服务',
    CDN: '内容分发网络',
    ISP: '互联网服务提供商',
    HOSTING: '虚拟主机服务',
    EDUCATION: '教育机构',
    GOVERNMENT: '政府机构',
    BUSINESS: '企业网络',
    RESIDENTIAL: '家庭宽带',
    MOBILE: '移动网络',
    PROXY: '代理服务器',
    VPN: 'VPN服务',
    TOR: 'Tor网络',
    UNKNOWN: '未知类型'
};

// 风险因素权重
const RISK_WEIGHTS = {
    // 网络特征 (40%)
    PROXY: 15,
    VPN: 20,
    TOR: 25,
    DATACENTER: 10,
    
    // 滥用历史 (35%)
    ABUSE_REPORTS: 20,
    ATTACK_HISTORY: 25,
    SPAM: 15,
    
    // 行为特征 (25%)
    BOT: 15,
    SUSPICIOUS_TRAFFIC: 10,
    ANONYMOUS_SERVICES: 15,
    
    // 地理位置风险 (额外加权)
    HIGH_RISK_COUNTRY: 10
};

// 高风险国家/地区列表
const HIGH_RISK_COUNTRIES = [
    'North Korea',
    'Iran',
    'Russia',
    'China',
    'Nigeria',
    'Venezuela'
];

class IpService {
    constructor() {
        this.loadConfig();
    }

    loadConfig() {
        try {
            const savedConfig = localStorage.getItem('api_config');
            if (savedConfig) {
                this.config = JSON.parse(savedConfig);
            } else {
                this.config = {
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
                };
            }
        } catch (error) {
            console.error('Error loading API config:', error);
            this.config = {
                abuseipdb: { enabled: false },
                ip2location: { enabled: false },
                ipregistry: { enabled: false },
                ipinfo: { enabled: false }
            };
        }
    }

    async getAllIpInfo(ip) {
        try {
            console.log('Fetching IP info for:', ip);
            const [ipInfo, ipRegistry, ipApi, abuseIpDb, ip2Location] = await Promise.allSettled([
                this.getIpInfo(ip),
                this.getIpRegistry(ip),
                this.getIpApi(ip),
                this.getAbuseIpDb(ip),
                this.getIp2Location(ip)
            ]);

            console.log('API Responses:', {
                ipInfo: ipInfo.value,
                ipRegistry: ipRegistry.value,
                ipApi: ipApi.value,
                abuseIpDb: abuseIpDb.value,
                ip2Location: ip2Location.value
            });

            const consolidatedData = this.consolidateData(ip, {
                ipInfo: ipInfo.value,
                ipRegistry: ipRegistry.value,
                ipApi: ipApi.value,
                abuseIpDb: abuseIpDb.value,
                ip2Location: ip2Location.value
            });

            console.log('Consolidated data:', consolidatedData);
            return consolidatedData;
        } catch (error) {
            console.error('Error fetching IP information:', error);
            throw error;
        }
    }

    async getIpInfo(ip) {
        try {
            if (!this.config.ipinfo.enabled || !this.config.ipinfo.token) {
                console.log('IPInfo API is disabled or not configured');
                return null;
            }

            const response = await axios.get(`https://ipinfo.io/${ip}/json`, {
                headers: {
                    'Authorization': `Bearer ${this.config.ipinfo.token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('IPinfo error:', error);
            return null;
        }
    }

    async getIpRegistry(ip) {
        try {
            if (!this.config.ipregistry.enabled || !this.config.ipregistry.apiKey) {
                console.log('IPRegistry API is disabled or not configured');
                return null;
            }

            const response = await axios.get(`https://api.ipregistry.co/${ip}`, {
                params: {
                    key: this.config.ipregistry.apiKey
                }
            });

            return response.data;
        } catch (error) {
            console.error('IPregistry error:', error);
            return null;
        }
    }

    async getIpApi(ip) {
        try {
            const response = await axios.get(`http://ip-api.com/json/${ip}`);
            return response.data;
        } catch (error) {
            console.error('IP-API error:', error);
            return null;
        }
    }

    async getAbuseIpDb(ip) {
        try {
            if (!this.config.abuseipdb.enabled || !this.config.abuseipdb.apiKey) {
                console.log('AbuseIPDB API is disabled or not configured');
                return null;
            }

            const response = await axios.get(`http://localhost:3000/api/abuseipdb`, {
                params: {
                    ipAddress: ip,
                    maxAgeInDays: this.config.abuseipdb.maxAge || 90
                }
            });

            return response.data;
        } catch (error) {
            console.error('AbuseIPDB error:', error);
            return null;
        }
    }

    async getIp2Location(ip) {
        try {
            if (!this.config.ip2location.enabled || !this.config.ip2location.apiKey) {
                console.log('IP2Location API is disabled or not configured');
                return null;
            }

            const response = await axios.get(`http://localhost:3000/api/ip2location`, {
                params: {
                    ip: ip
                }
            });

            return response.data;
        } catch (error) {
            console.error('IP2Location error:', error);
            return null;
        }
    }

    determineAsnType(asnInfo) {
        if (!asnInfo) return 'unknown';
        
        const asnLower = asnInfo.toLowerCase();
        
        // 首先检查特殊网络类型
        if (asnLower.includes('residential') || asnLower.includes('home') || 
            asnLower.includes('consumer') || asnLower.includes('household')) {
            return 'residential';
        }
        
        if (asnLower.includes('mobile') || asnLower.includes('wireless') || 
            asnLower.includes('cellular') || asnLower.includes('4g') || 
            asnLower.includes('5g')) {
            return 'mobile';
        }

        // 检查每种主要类型
        for (const [type, keywords] of Object.entries(ASN_TYPES)) {
            if (keywords.some(keyword => asnLower.includes(keyword.toLowerCase()))) {
                return type.toLowerCase();
            }
        }

        // 通过IP地址范围或其他特征进行二次判断
        if (asnLower.includes('ip') || asnLower.includes('net') || 
            asnLower.includes('as') || asnLower.includes('network')) {
            if (asnLower.includes('business') || asnLower.includes('enterprise')) {
                return 'business';
            }
            if (asnLower.includes('isp') || asnLower.includes('provider')) {
                return 'isp';
            }
        }
        
        return 'unknown';
    }

    calculateDetailedRiskScore(data) {
        const riskFactors = [];
        let totalScore = 0;
        let maxPossibleScore = 0;
        
        const { ipRegistry, abuseIpDb, ipApi } = data;
        
        // 1. 网络特征评估
        if (ipRegistry?.security) {
            // 代理检测
            if (ipRegistry.security.is_proxy) {
                totalScore += RISK_WEIGHTS.PROXY;
                riskFactors.push({
                    type: 'proxy',
                    name: '代理服务器',
                    score: RISK_WEIGHTS.PROXY,
                    description: '检测到代理服务器使用'
                });
            }
            maxPossibleScore += RISK_WEIGHTS.PROXY;

            // VPN检测
            if (ipRegistry.security.is_vpn) {
                totalScore += RISK_WEIGHTS.VPN;
                riskFactors.push({
                    type: 'vpn',
                    name: 'VPN',
                    score: RISK_WEIGHTS.VPN,
                    description: '检测到VPN服务使用'
                });
            }
            maxPossibleScore += RISK_WEIGHTS.VPN;

            // Tor检测
            if (ipRegistry.security.is_tor) {
                totalScore += RISK_WEIGHTS.TOR;
                riskFactors.push({
                    type: 'tor',
                    name: 'Tor出口节点',
                    score: RISK_WEIGHTS.TOR,
                    description: '检测到Tor网络使用'
                });
            }
            maxPossibleScore += RISK_WEIGHTS.TOR;

            // 数据中心检测
            if (ipRegistry.security.is_datacenter) {
                totalScore += RISK_WEIGHTS.DATACENTER;
                riskFactors.push({
                    type: 'datacenter',
                    name: '数据中心',
                    score: RISK_WEIGHTS.DATACENTER,
                    description: '来自数据中心IP'
                });
            }
            maxPossibleScore += RISK_WEIGHTS.DATACENTER;
        }

        // 2. 滥用历史评估
        if (abuseIpDb?.data) {
            const abuseScore = abuseIpDb.data.abuseConfidenceScore;
            if (abuseScore > 0) {
                const weightedScore = (abuseScore / 100) * RISK_WEIGHTS.ABUSE_REPORTS;
                totalScore += weightedScore;
                riskFactors.push({
                    type: 'abuse',
                    name: '滥用报告',
                    score: weightedScore,
                    description: `有${abuseIpDb.data.totalReports || 0}个滥用报告，置信度${abuseScore}%`
                });
            }
            maxPossibleScore += RISK_WEIGHTS.ABUSE_REPORTS;

            // 攻击历史评估
            if (abuseIpDb.data.totalReports > 10) {
                const attackScore = RISK_WEIGHTS.ATTACK_HISTORY;
                totalScore += attackScore;
                riskFactors.push({
                    type: 'attack',
                    name: '攻击历史',
                    score: attackScore,
                    description: `过去90天内有大量滥用报告`
                });
            }
            maxPossibleScore += RISK_WEIGHTS.ATTACK_HISTORY;
        }

        // 3. 地理位置风险评估
        const country = ipRegistry?.location?.country?.name || ipApi?.country;
        if (country && HIGH_RISK_COUNTRIES.includes(country)) {
            totalScore += RISK_WEIGHTS.HIGH_RISK_COUNTRY;
            riskFactors.push({
                type: 'country',
                name: '高风险地区',
                score: RISK_WEIGHTS.HIGH_RISK_COUNTRY,
                description: `来自高风险国家/地区: ${country}`
            });
        }
        maxPossibleScore += RISK_WEIGHTS.HIGH_RISK_COUNTRY;

        // 4. 行为特征评估
        if (ipRegistry?.security) {
            // 可疑流量检测
            if (ipRegistry.security.is_known_attacker) {
                totalScore += RISK_WEIGHTS.SUSPICIOUS_TRAFFIC;
                riskFactors.push({
                    type: 'suspicious',
                    name: '可疑流量',
                    score: RISK_WEIGHTS.SUSPICIOUS_TRAFFIC,
                    description: '检测到可疑网络行为'
                });
            }
            maxPossibleScore += RISK_WEIGHTS.SUSPICIOUS_TRAFFIC;

            // 匿名服务检测
            if (ipRegistry.security.is_anonymous) {
                totalScore += RISK_WEIGHTS.ANONYMOUS_SERVICES;
                riskFactors.push({
                    type: 'anonymous',
                    name: '匿名服务',
                    score: RISK_WEIGHTS.ANONYMOUS_SERVICES,
                    description: '使用匿名服务'
                });
            }
            maxPossibleScore += RISK_WEIGHTS.ANONYMOUS_SERVICES;
        }

        // 计算最终风险分数（转换为100分制）
        const normalizedScore = Math.min(100, (totalScore / maxPossibleScore) * 100);
        
        return {
            score: Math.round(normalizedScore),
            factors: riskFactors,
            threatLevel: this.determineThreatLevel(normalizedScore)
        };
    }

    determineThreatLevel(score) {
        if (score < 15) return { level: 'safe', label: '安全', color: '#4CAF50' };
        if (score < 35) return { level: 'low', label: '低风险', color: '#8BC34A' };
        if (score < 55) return { level: 'medium', label: '中等风险', color: '#FFC107' };
        if (score < 75) return { level: 'high', label: '高风险', color: '#FF5722' };
        return { level: 'critical', label: '严重风险', color: '#F44336' };
    }

    consolidateData(ip, data) {
        const { ipInfo, ipRegistry, ipApi, abuseIpDb, ip2Location } = data;
        
        // 确定 ASN 类型
        const asnInfo = ipInfo?.org || ipRegistry?.connection?.organization || '';
        const asnType = this.determineAsnType(asnInfo);
        
        // 计算详细风险评估
        const riskAssessment = this.calculateDetailedRiskScore(data);
        
        // 基本信息整合
        const basicInfo = {
            ip: ip,
            asn: {
                number: ipInfo?.org || ipRegistry?.connection?.asn || ipApi?.as || '',
                type: asnType,
                organization: asnInfo
            },
            coordinates: {
                latitude: ipInfo?.loc?.split(',')[0] || ipRegistry?.location?.latitude || ipApi?.lat || '',
                longitude: ipInfo?.loc?.split(',')[1] || ipRegistry?.location?.longitude || ipApi?.lon || ''
            },
            location: {
                city: ipInfo?.city || ipRegistry?.location?.city || ipApi?.city || '',
                region: ipInfo?.region || ipRegistry?.location?.region || ipApi?.region || '',
                country: ipRegistry?.location?.country?.name || ipApi?.country || '',
                timezone: ipInfo?.timezone || ipRegistry?.time_zone?.id || ipApi?.timezone || ''
            }
        };

        return {
            ...basicInfo,
            usage: {
                type: asnType,
                category: ip2Location?.usage_type || ipRegistry?.connection?.type || '',
                purpose: this.determineUsagePurpose(asnType, data)
            },
            security: {
                riskScore: riskAssessment.score,
                threatLevel: riskAssessment.threatLevel,
                riskFactors: riskAssessment.factors,
                isProxy: ipRegistry?.security?.is_proxy || false,
                isVpn: ipRegistry?.security?.is_vpn || false,
                isTor: ipRegistry?.security?.is_tor || false,
                isDatacenter: ipRegistry?.security?.is_datacenter || false,
                abuseConfidenceScore: abuseIpDb?.data?.abuseConfidenceScore || 0
            },
            raw_data: data // 保存原始数据以备需要
        };
    }

    determineUsagePurpose(asnType, data) {
        // 首先检查特殊用途
        if (data.ipRegistry?.security) {
            if (data.ipRegistry.security.is_proxy) return USAGE_TYPES.PROXY;
            if (data.ipRegistry.security.is_vpn) return USAGE_TYPES.VPN;
            if (data.ipRegistry.security.is_tor) return USAGE_TYPES.TOR;
        }

        // 根据ASN类型确定用途
        const usageType = USAGE_TYPES[asnType.toUpperCase()];
        if (usageType) return usageType;

        // 检查IP2Location的usage_type
        if (data.ip2Location?.usage_type) {
            const usage = data.ip2Location.usage_type.toUpperCase();
            if (usage.includes('ISP') || usage.includes('INTERNET')) return USAGE_TYPES.ISP;
            if (usage.includes('RESIDENTIAL') || usage.includes('HOME')) return USAGE_TYPES.RESIDENTIAL;
            if (usage.includes('MOBILE') || usage.includes('CELLULAR')) return USAGE_TYPES.MOBILE;
            if (usage.includes('DATACENTER') || usage.includes('HOSTING')) return USAGE_TYPES.DATACENTER;
            if (usage.includes('EDUCATION') || usage.includes('UNIVERSITY')) return USAGE_TYPES.EDUCATION;
            if (usage.includes('GOVERNMENT') || usage.includes('MILITARY')) return USAGE_TYPES.GOVERNMENT;
            if (usage.includes('BUSINESS') || usage.includes('CORPORATE')) return USAGE_TYPES.BUSINESS;
        }

        // 尝试从其他数据源获取信息
        if (data.ipApi) {
            const org = data.ipApi.org?.toLowerCase() || '';
            if (org.includes('isp') || org.includes('telecom')) return USAGE_TYPES.ISP;
            if (org.includes('mobile') || org.includes('wireless')) return USAGE_TYPES.MOBILE;
            if (org.includes('edu') || org.includes('university')) return USAGE_TYPES.EDUCATION;
            if (org.includes('gov') || org.includes('government')) return USAGE_TYPES.GOVERNMENT;
        }

        // 使用 ipInfo 的额外信息
        if (data.ipInfo) {
            const company = data.ipInfo.company?.toLowerCase() || '';
            const type = data.ipInfo.type?.toLowerCase() || '';
            
            if (type.includes('business')) return USAGE_TYPES.BUSINESS;
            if (type.includes('isp')) return USAGE_TYPES.ISP;
            if (company.includes('hosting') || company.includes('datacenter')) return USAGE_TYPES.DATACENTER;
        }

        return USAGE_TYPES.UNKNOWN;
    }
}

export default new IpService();
