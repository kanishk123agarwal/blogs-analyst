const express=require('express');
// const fetch=require('node-fetch')
const bodyParser=require('body-parser')
const _ = require('lodash')

const app=express();
const port=3000;

const APIUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs';
const AdminSecret = '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6';

let blogData=[];

// middleware for fetching blog data and performing analytics
const analyzeBlogData=async(req,res,next)=>{
    try{
        const fetch=await import('node-fetch');
        // fetch blog data using curl
        const response=await fetch.default(APIUrl,{
            method:'GET',
           headers:{
                'Content-Type':'application/json',
                'x-hasura-admin-secret':AdminSecret
            }
        });
        const responseData=await response.json();
        blogData=responseData.blogs;

        // calculate analytics using lodash
        const totalBlogs=blogData.length;
        const longestBlog= _.maxBy(blogData,blog=>blog.title.length);
        const blogsWithPrivacy=blogData.filter(blog=>blog.title.toLowerCase().includes('privacy'));
        const uniqueBlogTitles= _.uniqBy(blogData,'title').map(blog=>blog.title);

        req.blogStats={
            totalBlogs,
            longestBlogTitle:longestBlog.title,
            blogsWithPrivacy:blogsWithPrivacy.length,
            uniqueBlogTitles
        };
        next();
    }catch(error){
        console.error("Error fetching blog data:",error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

app.use(bodyParser.json());
app.use(analyzeBlogData);

// Endpoint to get blog statistics
app.get('/api/blog-stats',(req,res)=>{
    res.json(req.blogStats);
});

// EndPoint for blog search
app.get('/api/blog-search',(req,res)=>{
    const {query} =req.query;

    if(!query){
        return res.status(400).json({error:'Query parameter is required'});
    }

    const matchingBlogs=blogData.filter(blog=>blog.title.toLowerCase().includes(query.toLowerCase()))
    res.json({matchingBlogs});
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});