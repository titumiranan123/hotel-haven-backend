const Blog = require("../../models/Blog");
const BlogBookmark = require("../../models/BlogBookmark");
const User = require("../../models/User");
const isFieldsRequired = require("../../utils/isFieldsRequired");
const throwError = require("../../utils/throwError");
const router = require("express").Router();

router.get("/user-blog/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id) throwError("id is required", 404);

    const blog = await Blog.findOne({_id: id, userId: req.user._id});

    if (!blog) throwError("Blog not found", 404);

    res.json(blog);
  } catch (error) {
    next(error);
  }
});

router.put("/user-blog/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = req.body;

    if (!id) throwError("id is required", 404);

    const existingBlog = await Blog.findOne({_id: id, userId: req.user._id});

    if (!existingBlog) throwError("Blog not found", 404);

    // Compare the existing data with the new data
    const dataIsSame =
      JSON.stringify(existingBlog.toObject()) ===
      JSON.stringify({...existingBlog.toObject(), ...data});

    if (dataIsSame) {
      return res
        .status(400)
        .json({message: "No changes to apply, user data is the same."});
    }

    await Blog.findOneAndUpdate(
      {_id: existingBlog._id, userId: req.user._id},
      {
        title: data.title,
        thumbnail: data.thumbnail,
        description: data.description,
        category: data.category,
      }
    );

    res.json({message: "blog updated successfully"});
  } catch (error) {
    next(error);
  }
});

router.delete("/user-blog/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id) throwError("id is required", 404);

    const existingBlog = await Blog.findOne({_id: id, userId: req.user._id});

    if (!existingBlog) throwError("Blog not found", 404);

    const result = await Blog.findByIdAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!result) throwError("Blog is not deleted", 404);

    res.json({message: "Blog deleted successfully"});
  } catch (error) {
    next(error);
  }
});

router.get("/user-blog", async (req, res, next) => {
  try {
    const blog = await Blog.find({userId: req.user._id});

    if (!blog) throwError("Blog not found!", 404);

    res.json(blog);
  } catch (error) {
    next(error);
  }
});

router.post("/user-blog", async (req, res, next) => {
  try {
    const data = req.body;

    const isRequired = isFieldsRequired(data, [
      "title",
      "thumbnail",
      "description",
      "category",
    ]);

    if (!isRequired) throwError("Field is required", 404);

    if (data.description.length < 100)
      throwError("Description min length is 100");

    data.userId = req.user._id;

    const newBlog = new Blog(data);
    await newBlog.save();

    res.json({message: "Blog created successfully!"});
  } catch (error) {
    next(error);
  }
});

/******** BLOG BOOKMARK ******* */
router.get("/bookmark", async (req, res, next) => {
  try {
    const bookmark = await BlogBookmark.find({userId: req.user._id});

    if (!bookmark) throwError("bookmark not found", 404);

    res.json(bookmark);
  } catch (error) {
    next(error);
  }
});

router.post("/bookmark", async (req, res, next) => {
  try {
    const blogId = req.body.blogId;

    if (!blogId) {
      throwError("blogId must be provide", 404);
    }

    const existingBookmark = await BlogBookmark.findOne({
      blogId,
      userId: req.user._id,
    });

    if (existingBookmark) {
      throwError("Bookmark already saved", 409);
    }

    const newBookmark = new BlogBookmark({blogId, userId: req.user._id});
    await newBookmark.save();

    res.json({message: "Bookmark saved successfully"});
  } catch (error) {
    next(error);
  }
});

router.delete("/bookmark/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id) {
      throwError("id must be provide");
    }

    const existingBookmark = await BlogBookmark.findOne({
      userId: req.user._id,
      $or: [{blogId: id}, {_id: id}],
    });

    if (!existingBookmark) throwError("Bookmark not found");

    const bookmark = await BlogBookmark.findByIdAndDelete(existingBookmark._id);

    if (!bookmark) throwError("Bookmark not delete");

    res.json({message: "Bookmark deleted successfully"});
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!id) throwError("id is required", 404);

    let blog = await Blog.findOne({_id: id});

    if (!blog) throwError("Blog not found", 404);

    const user = await User.findOne({_id: blog.userId});

    if (!user) throwError("User not found", 404);

    blog = {
      ...blog._doc,
      userName: user.name,
      userProfile: user.photoURL,
    };

    res.json(blog);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
