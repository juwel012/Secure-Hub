import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

console.log(">>> SECUREHUB SERVER BOOTING <<<");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || 'development' });
  });

  // Proxy Checker API Route
  app.post("/api/proxy-check", async (req, res) => {
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
              // IPQualityScore API
              const response = await axios.get(`https://www.ipqualityscore.com/api/json/ip/${ipqsKey}/${ip}`, {
                params: {
                  strictness: 1,
                  allow_public_access_points: 'true',
                  lighter_penalties: 'false'
                },
                timeout: 5000
              });

              console.log(`IPQS check for ${ip}:`, response.data);

              if (!response.data.success) {
                throw new Error(response.data.message || "IPQS API Error");
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
                  is_datacenter: response.data.is_crawler === false && response.data.proxy === true, // Approximation
                  is_bot: response.data.is_crawler || false,
                  is_masked: false,
                  is_abnormal: response.data.fraud_score > 80,
                  risk_events: response.data.fraud_score > 50 ? 1 : 0,
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
              // Fraudlogix IP Reputation API - v5
              const response = await axios.get(`https://iplist.fraudlogix.com/v5`, {
                params: { ip: ip },
                headers: { "x-api-key": fraudlogixKey },
                timeout: 5000
              });
              
              console.log(`Fraudlogix check for ${ip}:`, response.data);
              
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
            const errorMessage = error.response?.data?.message || error.message;
            console.error(`${provider.toUpperCase()} check failed for ${ip}:`, error.response?.data || error.message);
            
            const cleanMessage = typeof errorMessage === 'string' && errorMessage.includes('<!DOCTYPE HTML') 
              ? "Invalid API Endpoint or Server Error (HTML Response)" 
              : errorMessage;

            return {
              ip,
              status: "error",
              message: cleanMessage
            };
          }
        })
      );

      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  console.log(`Server starting in ${process.env.NODE_ENV || 'development'} mode`);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Using Vite middleware (Development)");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    
    console.log(`[Production] Serving static files from: ${distPath}`);
    console.log(`[Production] Index file path: ${indexPath}`);
    
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      // Use absolute path to avoid any issues with relative paths
      const absoluteIndexPath = path.resolve(process.cwd(), "dist", "index.html");
      res.sendFile(absoluteIndexPath, (err) => {
        if (err) {
          console.error(`[Production] Error sending index.html from ${absoluteIndexPath}:`, err);
          res.status(500).send("Internal Server Error - Could not load app. Please try refreshing.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
  process.exit(1);
});
