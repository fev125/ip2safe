// 风险等级定义
export const RISK_LEVELS = {
    VERY_LOW: { score: 30, label: '极低', color: 'success' },
    LOW: { score: 60, label: '低', color: 'info' },
    MEDIUM: { score: 80, label: '中等', color: 'warning' },
    HIGH: { score: 90, label: '高', color: 'error' },
    VERY_HIGH: { score: 100, label: '极高', color: 'deep-purple' }
};

class RiskScoreService {
    // 计算历史滥用评分
    calculateAbuseScore(data) {
        let score = 0;
        
        if (data.abuseIpDb) {
            const { totalReports, abuseConfidenceScore } = data.abuseIpDb;
            // 根据举报次数和可信度评分
            if (totalReports > 0) {
                score += Math.min(abuseConfidenceScore, 100);
            }
        }

        if (data.ipRegistry?.security) {
            const security = data.ipRegistry.security;
            // 检查是否在黑名单中
            if (security.is_blacklisted) score += 50;
            // 检查是否有威胁标记
            if (security.is_threat) score += 30;
            // 检查是否有滥用记录
            if (security.is_abuser) score += 20;
        }

        return Math.min(score, 100);
    }

    // 计算代理/VPN/Tor使用评分
    calculateProxyScore(data) {
        let score = 0;

        if (data.ipRegistry?.security) {
            const security = data.ipRegistry.security;
            // 检查代理使用情况
            if (security.is_proxy) score += 30;
            if (security.is_vpn) score += 40;
            if (security.is_tor) score += 50;
            // 检查数据中心使用情况
            if (security.is_datacenter) score += 20;
            // 检查是否为匿名代理
            if (security.is_anonymous) score += 40;
        }

        // 检查其他来源的代理信息
        if (data.ip2Location?.usageType === 'VPN' || 
            data.ip2Location?.usageType === 'TOR' || 
            data.ip2Location?.usageType === 'Proxy') {
            score += 30;
        }

        return Math.min(score, 100);
    }

    // 计算其他行为评分
    calculateBehaviorScore(data) {
        let score = 0;

        // 根据网络类型评分
        const networkType = data.networkType?.toLowerCase() || '';
        if (networkType.includes('datacenter')) score += 50;
        else if (networkType.includes('hosting')) score += 40;
        else if (networkType.includes('business')) score += 30;
        else if (networkType.includes('education')) score += 20;
        else if (networkType.includes('residential')) score += 10;

        // 根据使用用途评分
        const usageType = data.usageType?.toLowerCase() || '';
        if (usageType.includes('vpn') || usageType.includes('proxy')) score += 40;
        else if (usageType.includes('hosting')) score += 30;
        else if (usageType.includes('business')) score += 20;
        else if (usageType.includes('residential')) score += 10;

        // 检查异常行为
        if (data.ipRegistry?.security) {
            const security = data.ipRegistry.security;
            if (security.is_bogon) score += 50;
            if (security.is_spam) score += 30;
            if (security.is_suspicious) score += 20;
        }

        return Math.min(score, 100);
    }

    // 计算最终风险评分
    calculateFinalScore(data) {
        const abuseScore = this.calculateAbuseScore(data);
        const proxyScore = this.calculateProxyScore(data);
        const behaviorScore = this.calculateBehaviorScore(data);

        // 计算加权平均分
        const finalScore = (abuseScore + proxyScore + behaviorScore) / 3;

        // 确定风险等级
        let riskLevel;
        if (finalScore <= RISK_LEVELS.VERY_LOW.score) riskLevel = RISK_LEVELS.VERY_LOW;
        else if (finalScore <= RISK_LEVELS.LOW.score) riskLevel = RISK_LEVELS.LOW;
        else if (finalScore <= RISK_LEVELS.MEDIUM.score) riskLevel = RISK_LEVELS.MEDIUM;
        else if (finalScore <= RISK_LEVELS.HIGH.score) riskLevel = RISK_LEVELS.HIGH;
        else riskLevel = RISK_LEVELS.VERY_HIGH;

        return {
            finalScore: Math.round(finalScore),
            riskLevel: riskLevel.label,
            color: riskLevel.color,
            details: {
                abuseScore,
                proxyScore,
                behaviorScore
            }
        };
    }

    // 获取风险因素描述
    getRiskFactors(data) {
        const factors = [];

        // 检查历史滥用
        if (data.abuseIpDb?.totalReports > 0) {
            factors.push({
                type: 'abuse',
                severity: 'high',
                description: `发现 ${data.abuseIpDb.totalReports} 次滥用报告`
            });
        }

        // 检查代理/VPN使用
        if (data.ipRegistry?.security) {
            const security = data.ipRegistry.security;
            if (security.is_proxy) {
                factors.push({
                    type: 'proxy',
                    severity: 'medium',
                    description: '检测到代理服务器使用'
                });
            }
            if (security.is_vpn) {
                factors.push({
                    type: 'vpn',
                    severity: 'medium',
                    description: '检测到VPN使用'
                });
            }
            if (security.is_tor) {
                factors.push({
                    type: 'tor',
                    severity: 'high',
                    description: '检测到Tor网络使用'
                });
            }
        }

        // 检查网络类型风险
        if (data.networkType === 'DATACENTER') {
            factors.push({
                type: 'network',
                severity: 'low',
                description: '数据中心IP地址'
            });
        }

        return factors;
    }
}

export default new RiskScoreService();
