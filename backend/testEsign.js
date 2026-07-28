require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
async function resolveMongoSrvUri(uri) {
  if (!uri || !uri.startsWith("mongodb+srv://")) return uri;
  try {
    const url = new URL(uri);
    const host = url.hostname;
    const userInfo = url.username
      ? `${url.username}:${encodeURIComponent(decodeURIComponent(url.password))}@`
      : "";
    const dbName = url.pathname || "/";
    const srvRecords = await new Promise((resolve, reject) => dns.resolveSrv(`_mongodb._tcp.${host}`, (err, recs) => err ? reject(err) : resolve(recs)));
    const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
    return `mongodb://${userInfo}${hosts}${dbName}?tls=true&authSource=admin&retryWrites=true&w=majority`;
  } catch (err) {
    return uri;
  }
}

async function testEsign() {
  const res1 = await fetch('http://localhost:5001/api/esign/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientEmail: 'test@example.com',
      meta: { projectName: 'Test Project', amount: 500, type: 'material' }
    })
  });
  const data1 = await res1.json();
  const reqId = data1.requestId;
  
  const mongoose = require('mongoose');
  const uri = await resolveMongoSrvUri(process.env.MONGO_URI || 'mongodb+srv://developer:BuildTrackAdminPass@cluster0.dbwiv.mongodb.net/buildtrack?retryWrites=true&w=majority');
  await mongoose.connect(uri);
  const EsignRequest = mongoose.model('EsignRequest', new mongoose.Schema({}, { strict: false }));
  const esignReq = await EsignRequest.findById(reqId);
  
  const token = esignReq.token;
  const signatureData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  const res2 = await fetch('http://localhost:5001/api/esign/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, signatureData })
  });
  
  console.log('Submit status:', res2.status);
  const data2 = await res2.json();
  console.log('Submit res:', data2);
  process.exit(0);
}
testEsign().catch(console.error);
