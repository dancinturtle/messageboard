var express = require('express');
var app = express();

var session = require('express-session');
app.use(session({
	secret: 'kermitandrainbows',
	resave: false,
	saveUninitialized: true,
	cookie: {maxAge: 60000}
}))

var flash = require('express-flash');
app.use(flash());

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var path = require('path');

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, './static')));
//static content
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mbdemo');

var commentSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, "A name must be provided."], 
		minlength: [3, "Names must have at least 3 characters."]
	},
	comment: {
		type: String,
		required: [true, "A comment must be provided."], 
		minlength: [3, "Comments must have at least 3 characters."]
	}
	}, {timestamps: true });

var postSchema = new mongoose.Schema({
	name: {
		type: String, 
		required: [true, "A name must be provided."], 
		minlength: [3, "Names must have at least 3 characters."]
	},
	message: {
		type: String,
		required: [true, "A message must be provided."], 
		minlength: [3, "Messages must have at least 3 characters."],
	},
	comments: [commentSchema]
}, {timestamps: true });

// SETTERS
mongoose.model('Post', postSchema); 
// creates a collection in the database called posts
mongoose.model('Comment', commentSchema);
// creates a collection in the database called comments
// GETTERS
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');

app.get('/', function(req, res){
	Post.find({}, function(err, data){
		if(err){
			req.flash("post", "We were unable to connect to our database");
			return res.redirect('/')
		}
		else {
			res.render('index', {posts: data})
		}
	})
});

app.post('/message', function(req, res){
	console.log("made it to the post route", req.body);
	var newmessage = Post.create(req.body, function(err, data){
		if(err){
			// console.log("There was an error on create", err.errors);
			for(var x in err.errors){
				req.flash("post", err.errors[x].message);
			}
			return res.redirect('/')
		}
		else {
			req.flash("success", "Successfully created!")
			console.log("The data", data);
		}
		res.redirect('/')
	})
})
app.post('/comments/:id', function(req, res){
	
	console.log("made it to the commments route", req.body);
	Comment.create(req.body, function(err, data){
		if(err){
			console.log("Got an error creating a comment", err);
			for(var x in err.errors){
				req.flash(req.params.id, err.errors[x].message);
			}
		}
		else {
			console.log("got data from coment", data);
			Post.findOne({_id: req.params.id}, function(err, datam){
				if(err){
					console.log("ERROR couldn't find one", err)
				}
				else if (!datam){
					console.log("no data, couldn't find one")
				}
				else {
					console.log("got our data", datam)
					datam.comments.push(data);
					datam.save(function(err, result){
						if(err){
							console.log("couldn't save", err);
						}
						else {
							console.log("got the result", result)
						}
					})
				}
			})
		}
		res.redirect('/')
	})

})


app.listen(8000, function(){
	console.log("listening on port 8000");
});
