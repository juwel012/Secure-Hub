import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ips, provider = 'fraudlogix' } = req.body;
  const fraudlogixKey = process.env.FRAUDLOGIX_API_KEY || "fL6S4nutw7a8v8cLnzFRN44fjtF4P8XE8P6a3lyV";
  const ipqsKey = process.env.IPQS_API_KEY || "fsMhBMagELt2PaFYqXMc03QqKXMoO5QC";

  if (!ips || !Array.isArray(ips)) {
    return res.status(400).json({ error: "Invalid IPs provided" });
  }

  try {
    const results = await Promise.all(
      ips.map(async (ip) => {
        try {
          if (provider === 'ipqs') {
            const response = await axios.get(`https://www.ipqualityscore.com/api/json/ip/${ipqsKey}/${ip}`, {
              params: { strictness: 1, allow_public_access_points: 'true', lighter_penalties: 'false' },
              timeout: 5000
            });
            
            if (response.data.success === false) {
              return { ip, status: "error", message: response.data.message || "IPQS API Error" };
            }

            return {
              ip,
              status: "success",
              data: {
                risk_score: response.data.fraud_score >= 75 ? 'High' : response.data.fraud_score >= 40 ? 'Medium' : 'Low',
                fraud_score: response.data.fraud_score,
                is_proxy: response.data.proxy || false,
                is_vpn: response.data.vpn || false,
                is_tor: response.data.tor || false,
                is_datacenter: response.data.is_crawler === false && response.data.proxy === true,
                is_bot: response.data.is_crawler || false,
                asn: response.data.asn || 'N/A',
                organization: response.data.organization || 'N/A',
                isp: response.data.isp || 'N/A',
                city: response.data.city || 'N/A',
                region: response.data.region || 'N/A',
                country: response.data.country_code || 'N/A',
                country_code: response.data.country_code || 'N/A',
                timezone: response.data.timezone || 'N/A',
                connection_type: response.data.connection_type || 'Residential'
              }
            };
          } else {
            const response = await axios.get(`https://iplist.fraudlogix.com/v5`, {
              params: { ip: ip },
              headers: { "x-api-key": fraudlogixKey },
              timeout: 5000
            });
            return {
              ip,
              status: "success",
              data: {
                risk_score: response.data.RiskScore || 'Low',
                is_proxy: response.data.Proxy || false,
                is_vpn: response.data.VPN || false,
                is_tor: response.data.TOR || false,
                is_datacenter: response.data.DataCenter || false,
                is_bot: response.data.SearchEngineBot || false,
                is_masked: response.data.MaskedDevicesDetected || false,
                is_abnormal: response.data.AbnormalTrafficPatterns || false,
                risk_events: response.data.RiskEventsDetected || 0,
                asn: response.data.ASN || 'N/A',
                organization: response.data.Organization || 'N/A',
                isp: response.data.ISP || 'N/A',
                city: response.data.City || 'N/A',
                region: response.data.Region || 'N/A',
                country: response.data.Country || 'N/A',
                country_code: response.data.CountryCode || 'N/A',
                timezone: response.data.TimeZone || 'N/A',
                connection_type: response.data.ConnectionType || 'Residential'
              }
            };
          }
        } catch (error: any) {
          return { ip, status: "error", message: error.response?.data?.message || error.message };
        }
      })
    );
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
