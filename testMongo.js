// import { MongoClient, ServerApiVersion } from "mongodb";

// const uri =
//   "mongodb+srv://sportteam:sportteam987@cluster0.owiivlj.mongodb.net/?appName=Cluster0";

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// async function run() {
//   try {
//     await client.connect();
//     await client.db("admin").command({ ping: 1 });
//     console.log("✅ Pinged your deployment. MongoDB connected!");
//   } catch (err) {
//     console.error("❌ Connection failed:", err.message);
//   } finally {
//     await client.close();
//   }
// }

// run();
