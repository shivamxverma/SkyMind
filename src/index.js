import axios from "axios";
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import dotenv from 'dotenv';
const openai = new OpenAI();

dotenv.config();

async function scrapWebPage(url) {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const pageHead = $('head').html();

    const pageBody = $('body').html();

    console.log({pageHead, pageBody});

    const internalLink = [];
    const externalLink = [];

    $('a').each((_, el) => {
        const link = $(el).attr('href');
        console.log(link);

        if(link === '/') return ;
        if(link.startsWith('http') || link.startsWith('https')) {
            externalLink.push(link);
        } else internalLink.push(link);
    })

    console.log("External Link", externalLink);
    console.log("Internal Link", internalLink);
}

async function generateVectorEmbeddings({ url, text}){
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
    });

    return embedding.data[0].embedding;
}

async function insertIntoDB({ embedding, body = '', url}) {
    const collection = await chromaClient.getOrCreateCollection({
        name: WEB_COLLECTION,
    })
}


async function ingest(url = '') {
    const {head , body, internalLink} = await scrapWebPage(url);
    const headEmbeddings = await generateVectorEmbeddings({text: head});

    const bodyChunks = chunkText(body, 2000);

    for (const chunk of bodyChunks) {
        const bodyEmbedding = await generateVectorEmbeddings({text : body});
    }

}

function chunkText(text, chunkSize) {
    if(!text || chunkSize <= 0) return [];

    const words = text.split(/\s+/);
    const chunks = [];

    for(let i = 0 ; i < words.length; i+= chunkSize) {
        chunks.push(words.slice(i, i+chunkSize).join(' '));
    }

    return chunks;
}

scrapWebPage("https://www.shivamworks.dev/");
