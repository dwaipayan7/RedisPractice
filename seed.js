import fs from "fs";
import mongoose from "mongoose";
import { Product } from "./model.js";

async function seed() {
    try {
        await mongoose.connect("mongodb://localhost:27017/redis");
        console.log("DB connected");

        const raw = JSON.parse(fs.readFileSync("./dummy.json", "utf-8"));

        const data = raw.map(item => {
            if (item._id?.$oid) {
                item._id = item._id.$oid;
            }
            return item;
        });

        await Product.deleteMany();
        await Product.insertMany(data);

        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
}

seed();
