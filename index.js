import express from 'express';
import mongoose from 'mongoose';
import { Product } from './model.js';
import { createClient } from 'redis'

const app = express();

app.use(express.json());


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

app.put('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    const updateData = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $set: updateData },
        { new: true }
    );

    const listCacheKey = 'api:products*';
    const keys = await client.keys(listCacheKey);
    if (keys.length > 0) {
        await client.del(keys)
    }


    res.json({
        success: true,
        message: 'Product Updated',
        updatedProduct: updatedProduct
    })
})

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