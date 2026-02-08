import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export function loadConfig(configPath = "config/my-config.yaml") {
  const fullPath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(fullPath)) return null;

  const content = fs.readFileSync(fullPath, "utf8");
  return yaml.load(content);
}

export function getProxyEnv(config) {
  const anon = config?.anonymization;
  if (!anon?.enabled) return {};

  const proxyUrl = anon.proxy?.url || "socks5://127.0.0.1:9050";
  return {
    HTTP_PROXY: proxyUrl.startsWith("socks") ? undefined : proxyUrl,
    HTTPS_PROXY: proxyUrl.startsWith("socks") ? undefined : proxyUrl,
    SOCKS_PROXY: proxyUrl.startsWith("socks") ? proxyUrl : undefined,
    http_proxy: proxyUrl.startsWith("socks") ? undefined : proxyUrl,
    https_proxy: proxyUrl.startsWith("socks") ? undefined : proxyUrl,
  };
}
