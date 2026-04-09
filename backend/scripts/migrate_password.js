require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
async function migrate() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not set in .env — aborting to avoid connecting to the wrong database.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");
  const collection = mongoose.connection.collection("users");
  const users = await collection.find({}).toArray();
  let migrated = 0;
  for (const u of users) {
    if (u.password?.startsWith("$2")) {
      console.log(`⏭  ${u.email} — already hashed, skipping`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 12);
    await collection.updateOne({ _id: u._id }, { $set: { password: hash } });
    console.log(`🔐 ${u.email} — password hashed`);
    migrated++;
  }
  console.log(`\n✅ Done. ${migrated} password(s) migrated.`);
  await mongoose.disconnect();
}
migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});