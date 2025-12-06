import express from 'express';
import mongoose from 'mongoose';
import { Product } from './model.js';
import { createClient } from 'redis'

const app = express();

const client = await createClient()
    .on('error', (err) => console.log('Redis Client Error', err)).connect();


mongoose.connect('mongodb://localhost:27017/redis');


app.get('/api/products', async (req, res) => {

    const key = generateCacheKey(req);

    const cachedProducts = await client.get(key);

    if (cachedProducts) {
        console.log("Cache Hit");

        res.json(JSON.parse(cachedProducts));
        return;
    }

    console.log("Cache Miss!");


    const query = {};

    if (req.query.category) {
        query.category = req.query.category;
    }

    const products = await Product.find(query);

    if (products.length) {
        await client.set(key, JSON.stringify(products));
    }


    return res.json({ "The Products are: ": products })
});

function generateCacheKey(req) {
    const baseUrl = req.path.replace(/^\/+|\/+$/g, '').replace(/\//g, ':');
    const params = req.query;
    const sortedParams = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&');

    return sortedParams ? `${baseUrl}:${sortedParams}` : baseUrl;
}


app.listen(4000, () => {
    console.log("Server Running on port 4000");
})