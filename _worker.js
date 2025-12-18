export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);

    const DEFAULT_BYTES = 200 * 1024 * 1024; // 200MB
    const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
    let bytes = DEFAULT_BYTES;

    // 访问 / 时显示说明
    if (!path) {
      return new Response(
        "Cloudflare Speed Test (self-use)\n\n" +
        "Usage:\n" +
        "  /100m\n" +
        "  /1g\n" +
        "  /500k\n\n" +
        "Default: 200MB\n" +
        "Max: 2GB\n",
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // 解析路径参数
    const m = path.match(/^(\d+)([kmg]?)$/i);
    if (m) {
      bytes = parseInt(m[1], 10);
      const unit = m[2].toLowerCase();

      if (unit === "k") bytes *= 1024;
      else if (unit === "m") bytes *= 1024 * 1024;
      else if (unit === "g") bytes *= 1024 * 1024 * 1024;
    }

    // 上限保护
    if (bytes > MAX_BYTES) bytes = MAX_BYTES;

    const target = `https://speed.cloudflare.com/__down?bytes=${bytes}`;

    const resp = await fetch(target, {
      headers: {
        "Cache-Control": "no-store",
        "Accept-Encoding": "identity"
      },
      cf: {
        cacheTtl: 0,
        cacheEverything: false
      }
    });

    return new Response(resp.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="cf-speed-${bytes}.bin"`,
        "Cache-Control": "no-store"
      }
    });
  }
};
