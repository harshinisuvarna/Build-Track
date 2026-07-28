require("dotenv").config();

async function getHtml() {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://developer:BuildTrackAdminPass@cluster0.dbwiv.mongodb.net/buildtrack?retryWrites=true&w=majority');
  
  const EsignRequest = mongoose.model('EsignRequest', new mongoose.Schema({}, { strict: false }));
  const esignReq = await EsignRequest.findOne({});
  const token = esignReq.token;
  
  const res = await fetch(`http://localhost:5001/api/esign/sign/${token}`);
  const text = await res.text();
  console.log("HTML:", text);
  process.exit(0);
}

getHtml().catch(console.error);
