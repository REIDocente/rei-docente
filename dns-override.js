const dns = require('dns');
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.startsWith('192.168.');
  if (!isLocal) {
    resolver.resolve4(hostname, (err, addresses) => {
      if (err || !addresses.length) {
        return originalLookup(hostname, options, callback);
      }
      if (options && options.all) {
        callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
      } else {
        callback(null, addresses[0], 4);
      }
    });
  } else {
    originalLookup(hostname, options, callback);
  }
};

console.log("[DNS Override] Pre-loaded successfully. Global DNS lookup patched for Supabase & Google.");
