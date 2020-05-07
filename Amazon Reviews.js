//Create a composite index on reviewerid and time both descending
db.products.createIndex({"reviewerID":-1, "reviewTime:"-1})

//Review Collection Statistics
db.products.stats

//Change the review scheme from the current 5-point scale to a 10-point scale
db.products.updateMany({}, {$mul: { overall : NumberInt(2)} } )

//Remove last element of an array
db.products.update({"_id": ObjectId("5e8e8513b54eC3c1bbc10c46a")}, {$pop:{category:1}})

//Remove a specific catgory from array
db.products.update({"_id": ObjectId("5e8e8513b54eC3c1bbc10c46a")}, {$pull:{category:"Printers"}})

//Find total Products count
db.products.find({asin:{exists:true}}).count()


//Reviewer with the oldest Review Overall
db.products.find({"reviewerName":{$exists: true}})
    .projection({"reviewerName":1, "_id":0})
    .sort({unixReviewTime:1})
    .limit(1)

//Find Distinct Categories
db.products.distinct("category")


//Total Number of products per Category
db.products.aggregate([ {$group: {_id:{category: "$category"}, totalProducts:{$sum : 1}}},
{$sort:{"totalProducts":-1}} ])

//Total number of reviews per category
db.products.aggregate([ {$group: {_id:{category: "$category", review : "$reviewText"},
totalReviews:{$sum : 1}}}, {$sort:{"totalReviews":-1}} ])

//Histogram of review ratings per product
db.productReviews.aggregate([
{"$group":{"_id":{"asin":"$asin","overall":"$overall"}, "total":{$sum:1}}},
{"$sort":{"_id.asin":1,"_id.overall": -1 }}
]).pretty()

//Top 10 most helpful reviews per product – display the results for 10 products only

// Create Index:
db.products.createIndex({summary: "text",reviewText: "text"}, { weights: { summary: 10, reviewText: 5
}, name: "TextIndex" })

db.products.find({$text: {$search: "good excellent beautiful amazing fantastic bad disappointing worst horrible"}}, {score: {$meta: "textScore"}}).sort({score: {$meta: "textScore"}}).limit(10).pretty()

//10 most recent Q&A per product 

db.productQnA.aggregate()
    .match({questions:{$exists: true}})
    .group({
          _id: "$asin",
          questions: {$first: "$questions"}
    })
    .project({questions:1})
    .sort({questionTime:-1})
    .limit(10)

// Top 10 most prolific reviewers (i.e., with most number of reviews)
db.products.aggregate()
    .group({
          _id: "$reviewerID",
          count:{$sum:1}
    })
    .sort({count:-1})
    .allowDiskUse()
    .limit(100)
    

//Top 10 most verbose reviewers
db.products.aggregate()
    .match({reviewText:{$exists:true}})
    .project({reviewerName:1, reviewText:1, "review_length": {$strLenCP: "$reviewText"} })
    .sort({review_length:1})
    .limit(10)


//Top 10 most positive reviewers based on the ratings of their reviews
db.products.aggregate([
{$group:{"_id":{reviewerID: "$reviewerID"}, userReviews:{$sum:1},
averageUserRating:{$avg:'$overall'}}}, {$match:{"userReviews":{$gt:30}}},
{$sort:{"averageUserRating":-1}},{$limit:10}
])

// Reviewer who has been reviewing for the longest period
db.products.aggregate([
{$group : {_id : "$reviewerID", maximumValue : {$max : "$unixReviewTime"} , minimumValue : {$min :
"$unixReviewTime"}}},
{$project : {_id : "$_id", longestTime: {$subtract: [ "$maximumValue", "$minimumValue"]}}},
{$sort: {longestTime:-1}}, {$limit: 1}])



// Reviewer whose reviews deviate the most (largeststandard deviation of review rating) overall
db.products.aggregate()
    .group({
          _id: "$reviewerID",
          ratingStdDev: { $stdDevPop: "$overall"},
          reviewer: {$first: "$reviewerName"}
    })
    .sort({"ratingStdDev": -1})
    .limit(1)
    .allowDiskUse()

   
// Reviewer whose reviews deviate the most (largeststandard deviation of review rating) within a category
db.products.aggregate([ {$group : { _id: {category : "$category", reviewerID : "$reviewerID"} , stddev :
{ $stdDevPop : "$overall"}}} , {$project : {reviewerID : 1, stddev :1}}, {$sort : { stddev : -1}} ])    


//Use look up to join two show collections
db.products.aggregate()
 .lookup({
       from: "productMeta",
       localField: "asin",
       foreignField: "asin",
       as: "catgryRate"
 })
 .limit(10)


// Most Recent Reviewer
db.products.find({})
   .projection({reviewerName:1, reviewTime:1})
   .sort({reviewTime:-1})
   .limit(1)

 
