const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');
const Snippet = require('./models/codesnippet')
const Blog = require('./models/blog')
const Chatroom = require('./models/chatroom')
const multer = require('multer');
const bodyParser = require('body-parser')
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

app.use(cors());
app.use(bodyParser.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {
    useNewUrlParser: true,
});
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
})

app.use(bodyParser.urlencoded({extended: false}))

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret:process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'CloudinaryDemo',
        allowedFormats: ['jpeg', 'png', 'jpg'],
    }                                                              
}); 

const upload = multer({ storage: storage });

// routes for snippets

app.post('/store/code', async (req, res) => {
    const body = req.body 
    console.log(req)
    console.log(req.body)
    const code = body.code
    const description = body.description
    const user_id = body.user_id
    const user_email = body.user_email
    const user_image = body.user_image
    const language = body.language
    const uploaded_by = {
        user_id: user_id,
        user_email: user_email,
        user_image: user_image
    }
    const uploaded_at = new Date().toLocaleDateString()

    if (code && description && uploaded_by && uploaded_at) {

        const json_snippet = {
            code: code,
            description: description,
            uploaded_by: uploaded_by,
            language: language,
            uploaded_at: uploaded_at
        }

        const new_snippet = new Snippet(json_snippet)

        const result = await new_snippet.save().then((doc) => {
            return {doc: doc, success: true}
        }).catch((err) => {
            console.log(`Error In Uploading Snippet \n \n ${err}`)
            return {success: false, error: err}
        })

        if(result.success == true) {
            res.json(result)
        } else {
            console.log("An Error Occured!")
            res.json(result)
        }

    } else {
        res.json({
            message: "Please Fill All The Fields",
            success: false
        })
    }
})

app.post('/get/code', async (req, res) => {
    const body = req.body
    const id = body.id

    if (!id) {
        res.json({
            success: false,
            message: "No ID received"
        })
    }

    const fetch_snippet = await Snippet.findById({_id: id}).exec()

    if (fetch_snippet) {
        res.json({
            result: fetch_snippet,
            sucess: true
        })
    } else {
        res.json({
            message: "No Snippet Found",
            sucess: false
        })
    }
})

app.get('/get/codes', async (req, res) => {
    const snippets = await Snippet.find()
    console.log(snippets)

    if (snippets) {
        res.json({
            success: true,
            result: snippets
        })
    } else {
        res.json({
            success: false,
            message: "Error In Fetching Snippets"
        })
    }
})

app.post('/get/user/snippets', async (req, res) => {
    const body = req.body 
    const id = body.id

    if (id) {
        const snippets = await Snippet.find()

        function check(snippet) {
            return snippet.uploaded_by.user_id = id
        }

        const result = snippets.filter(check)

        if (snippets) {
            res.json({
                success: true,
                result: result
            })
        } else {
            res.json({
                success: true,
                message: "No Snippets Found"
            })
        }
    } else {
        res.json({
            success: false,
            error: "No ID Received"
        })
    }
})

app.put('/update/code', async (req, res) => {
    const body = req.body 
    const code = body.code
    const description = body.description
    const user_id = body.user_id
    const user_email = body.user_email
    const user_image = body.user_image
    const uploaded_by = {
        user_id: user_id,
        user_email: user_email,
        user_image: user_image
    }
    const uploaded_at = new Date().toLocaleDateString()
    const id = body.id

    if (code && description && uploaded_by && uploaded_at && id) {

        const json_snippet = {
            code: code,
            description: description,
            uploaded_by: uploaded_by,
            uploaded_at: uploaded_at
        }

        const filter = {_id: id}

        const update_query = await Snippet.findOneAndUpdate(filter, json_snippet).exec()

        if(update_query) {
            const result = {
                message: "Updated Snippet Successfully", 
                success: true
            }
            res.json(result)
        } else {
            const result = {
                message: "Update Snippet Error", 
                success: false
            }
            res.json(result)
        }

    } else {
        res.json({
            message: "Please Fill All The Fields",
            success: false
        })
    }
})

app.post('/snippet/delete', async (req, res) => {
    const body = req.body
    const id = body.id

    if (id) {
        await Snippet.findByIdAndDelete({_id: id}).then((result) => {
            res.json({
                sucess: true,
                result: result
            })
        }).catch((err) => {
            console.log(err)
            res.json({
                success: false,
                message: err,
                error: err
            })
        })
    } else {
        res.json({
            success: false,
            message: "No Id received"
        })
    }
})

// Routes For Blog

app.post('/store/blog', upload.single('file'), async (req, res) => {
    const body = req.body 
    console.log(body)
    const title = body.title
    const excerpt = body.excerpt
    const content = body.content
    const reading_time = body.reading_time
    const patreon = body.patreon
    const sources= body.sources
    const tags = body.tags
    const user_id = body.user_id
    const user_email = body.user_email
    const user_image = body.user_image
    const preview = req.file.path

    if (title && excerpt && content && reading_time && patreon && sources && tags && user_id && user_email && user_image && preview) {

        const json_blog = {
            title: title,
            content: content,
            excerpt: excerpt,
            reading_time: reading_time,
            patreon: patreon, 
            sources: sources,
            tags: tags,
            uploaded_by: {
                user_id: user_id,
                user_email: user_email,
                user_image: user_image
            },
            preview_image: preview
        }

        const new_blog = new Blog(json_blog)

        const result = await new_blog.save().then((doc) => {
            return {doc: doc, success: true}
            console.log(doc)
        }).catch((err) => {
            console.log(`Error In Uploading Snippet \n \n ${err}`)
            return {success: false, error: err}
        })

        if(result.success == true) {
            res.json(result)
        } else {
            console.log("An Error Occured!")
            res.json(result)
        }

    } else {
        res.json({
            message: "Please Fill All The Fields",
            success: false
        })
    }
})

app.post('/get/blog', async (req, res) => {
    const body = req.body
    const id = body.id

    if (!id) {
        res.json({
            success: false,
            message: "No ID received"
        })
    }

    const fetch_blog = await Blog.findById({_id: id}).exec()

    if (fetch_blog) {
        res.json({
            result: fetch_blog,
            sucess: true
        })
    } else {
        res.json({
            message: "No Snippet Found",
            sucess: false
        })
    }
})

app.get('/get/blogs', async (req, res) => {
    const blogs = await Blog.find()

    if (blogs) {
        res.json({
            success: true,
            result: blogs
        })
    } else {
        res.json({
            success: false,
            message: "Error In Fetching Blogs"
        })
    }
})

app.post('/get/user/blogs', async (req, res) => {
    const body = req.body 
    const id = body.id

    if (id) {
        const blogs = await Blog.find()

        function check(blog) {
            return blog.uploaded_by.user_id = id
        }

        const result = blogs.filter(check)

        if (blogs) {
            res.json({
                success: true,
                result: result
            })
        } else {
            res.json({
                success: true,
                message: "No Snippets Found"
            })
        }
    } else {
        res.json({
            success: false,
            error: "No ID Received"
        })
    }
})

app.put('/update/blog', async (req, res) => {
    const body = req.body 
    const title = body.title
    const excerpt = body.excerpt
    const content = body.content
    const reading_time = body.reading_time
    const patreon = body.patreon
    const sources= body.sources
    const tags = body.tags
    const user_id = body.user_id
    const user_email = body.user_email
    const user_image = body.user_image
    const preview = req.file.filename
    const id = body.id

    if (title && excerpt && content && reading_time && patreon && sources && tags && user_id && user_email && user_image && preview) {

        const json_blog = {
            title: title,
            content: content,
            excerpt: excerpt,
            reading_time: reading_time,
            patreon: patreon, 
            sources: sources,
            tags: tags,
            uploaded_by: {
                user_id: user_id,
                user_email: user_email,
                user_image: user_image
            },
            preview_image: preview
        }

        const filter = {_id: id}

        const update_query = await Blog.findOneAndUpdate(filter, json_blog).exec()

        if(update_query) {
            const result = {
                message: "Updated Blog Successfully", 
                success: true
            }
            res.json(result)
        } else {
            const result = {
                message: "Update Blog Error", 
                success: false
            }
            res.json(result)
        }

    } else {
        res.json({
            message: "Please Fill All The Fields",
            success: false
        })
    }
})

app.post('/blog/delete', async (req, res) => {
    const body = req.body
    const id = body.id

    if (id) {
        await Blog.findByIdAndDelete({_id: id}).then(() => {
            res.json({
                success: true,
                message: "Blog Deleted"
            }).catch((err) => {
                console.log(err)
                res.json({
                    success: false,
                    message: "Error in Deleting Blog"
                })
            })
        })
    } else {
        res.json({
            success: false,
            message: "No Id received"
        })
    }
})

// routes for chatrooms

app.post('/create/chatroom', upload.single('file'), async (req, res) => {
    const body = req.body
    const name = body.name
    const description = body.description
    const created_at = new Date().toLocaleDateString()
    const image = req.file.filename
    const user_id = body.user_id
    const user_email = body.user_email
    const user_image = body.user_image

    if (name && description && created_at && image && user_id && user_email && user_image) {
        const json_chatroom = {
            name:name,
            description: description,
            participants: {
                user_id: user_id,
                user_email: user_email,
                user_image: user_image,
                user_role: "admin"
            },
            created_at: created_at,
            image: image
        }

        const new_chatroom = new Chatroom(json_blog)

        const result = await new_chatroom.save().then((doc) => {
            return {doc: doc, success: true}
        }).catch((err) => {
            console.log(`Error In Creating Chatroom \n \n ${err}`)
            return {success: false, error: err}
        })

        if(result.success == true) {
            res.json(result)
        } else {
            console.log("An Error Occured!")
            res.json(result)
        }
    } else {
        res.json({
            message: "Please Fill All The Fields",
            success: false
        })
    }
})

app.get('/get/chatrooms', async (req, res) => {
    const chatrooms = await Chatroom.find()

    if (chatrooms) {
        res.json({
            success: true,
            result: chatrooms
        })
    } else {
        res.json({
            success: false,
            message: "Error In Fetching Chatrooms"
        })
    }
})

app.post('/get/chatroom', async (req, res) => {
    const body = req.body
    const id = body.id

    if (!id) {
        res.json({
            success: false,
            message: "No ID received"
        })
    }

    const fetch_chatroom = await Chatroom.findOneById({_id: id}).exec()

    if (fetch_chatroom) {
        res.json({
            result: fetch_chatroom,
            sucess: true
        })
    } else {
        res.json({
            message: "No Chatroom Found",
            sucess: false
        })
    }
})

app.put('/update/chatroom', async (req, res) => {
    const body = req.body
    const name = body.name
    const description = body.description
    const created_at = new Date().toLocaleDateString()
    const image = req.file.filename
    const user_id = body.user_id
    const user_email = body.user_email
    const user_image = body.user_image
    const id = body.id

    if (name && description && created_at && image && user_id && user_email && user_image) {

        const json_chatroom = {
            name:name,
            description: description,
            participants: {
                user_id: user_id,
                user_email: user_email,
                user_image: user_image,
                user_role: "admin"
            },
            created_at: created_at,
            image: image
        }

        const filter = {_id: id}

        const update_query = await Chatroom.FindOneAndUpdate(filter, json_chatroom)

        if(update_query) {
            const result = {
                message: "Updated Chatroom Successfully", 
                success: true
            }
            res.json(result)
        } else {
            const result = {
                message: "Update Chatroom Error", 
                success: false
            }
            res.json(result)
        }

    } else {
        res.json({
            message: "Please Fill All The Fields",
            success: false
        })
    }
})

app.post('/chatroom/delete', async (req, res) => {
    const body = req.body
    const id = body.id

    if (id) {
        await Chatroom.findByIdAndDelete({_id: id}).then(() => {
            res.json({
                success: true,
                message: "Chatroom Deleted"
            }).catch((err) => {
                console.log(err)
                res.json({
                    success: false,
                    message: "Error in Deleting Chatroom"
                })
            })
        })
    } else {
        res.json({
            success: false,
            message: "No Id received"
        })
    }
})

app.post('/add/add_participant', async (req, res) => {
    const body = req.body
    const user_id = body.user_id
    const user_email = body.user_email
    const user_image= body.user_image
    const id = body.id
    const user_role = "participant"

    if (user_email && user_id && user_image && id) {
        const chatroom = await Chatroom.findById({_id: id}).exec()

        const new_user = {
            user_id: user_id,
            user_email: user_email,
            user_image: user_image,
            user_role: user_role
        }

        chatroom.participants = chatroom.participants.push(new_user)

        await chatroom.save().then(() => {
            res.json({
                message: "User Added Successfully",
                success: true
            })
        }).catch((err) => {
            console.log(err)
            res.json({
                message: "Error In Adding User",
                success: false
            })
        })

    } else {
        res.json({
            message: "Please Fill All The Fields",
            success: false
        })
    }
})

app.post('/add/add_message', async (req, res) => {
    const body = req.body
    const user_id = body.user_id
    const user_email = body.user_email
    const user_image= body.user_image
    const id = body.id
    const user_role = "participant"
    const content = body.content

    if (user_email && user_id && user_image && id && content) {
        const chatroom = await Chatroom.findById({_id: id}).exec()

        const new_chat = {
            sender : {
                user_id: user_id,
                user_email: user_email,
                 user_image: user_image,
                user_role: user_role
            },
            content: content,
        }

        chatroom.messages = chatroom.messages.push(new_chat)

        await chatroom.save().then(() => {
            res.json({
                message: "Message Added Successfully",
                success: true
            })
        }).catch((err) => {
            console.log(err)
            res.json({
                message: "Error In Adding Message",
                success: false
            })
        })

    } else {
        res.json({
            message: "Please Fill All The Fields",
            success: false
        })
    }
})

app.post('/leave/user', async (req, res) => {
    const body = req.body
    const id = body.id
    const user_id = body.user_id

    if (id && user_id) {
        const chatroom = await Chatroom.findById({_id: id}).exec()
        function checkUser(user) {
            return user.user_id != user_id;
        }

        const new_participant_list = chatroom.participants.filter(checkUser)

        chatroom.participants = new_participant_list

        await chatroom.save().then(() => {
            res.json({
                message: "User Left Successfully",
                success: true
            })
        }).catch((err) => {
            console.log(err)
            res.json({
                message: "Error In Leaving User",
                success: false
            })
        })
    } else {
        res.json({
            message: "Please Fill All The Fields",
            success: false
        })
    }
})

// Routes for AI Services

app.post('/ai/code/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;

    console.log(response)

    res.json({ response: response.text() });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
    console.log("Server Running On Port " + port)
})
