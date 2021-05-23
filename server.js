let express = require("express");
var app = express();
const path = require("path");
const GoogleNewsRss = require('google-news-rss');
const googleNews = new GoogleNewsRss();

const news = require('gnews');

const natural = require('natural');
const SW = require('stopword');
const port = process.env.PORT||3000;

app.use(express.static(path.join(__dirname, "/static")));

app.use(express.urlencoded({
    extended: true
}));


app.use(express.json());
//const URL = "http://news.google.com/news?q=covid-19&hl=en-US&sort=date&gl=US&num=100&output=rss";
//const URL = "http://news.google.com/news?q=";
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/static/home.html'));
});

app.get("/category/:text", (req, res) => {
    let query = req.params.text.trim();
    if (query.length) {
        if (query === "HEADLINES") {
            news.headlines().then((article_array) => {
                article_array.sort((a, b) => {
                    return new Date(b.pubDate) - new Date(a.pubDate)
                });
                res.status(200).send(JSON.stringify(article_array));
            }).catch(err => {
                console.log("\nError in Headlines : ", err,query);
                console.log("\nError in Headlines : ", err,query);
                res.status(500).send({
                    error: "Server Error"
                });
            });
        } else if (query === "WORLD" || query === "BUSINESS" || query === "SCIENCE" || query === "ENTERTAINMENT" || query === "SPORTS" || query === "HEALTH") {
            news.topic(query).then((article_array) => {
                article_array.sort((a, b) => {
                    return new Date(b.pubDate) - new Date(a.pubDate)
                });
                res.status(200).send(JSON.stringify(article_array));
            }).catch((e) => {
                console.log("\nError in topic : ", e,query);
                res.status(500).send({
                    error: "Server Error"
                });
            });
        }
    }

});

app.get("/search_for/:text", (req, res) => {
    if (req.params.text) {
        let data_array = [];
        const queryString = req.params.text.trim();
        //if(queryString&& Object.values(queryString).length != 0 && queryString.constructor === Object){
        console.log("\nSearch For  : ", queryString, queryString.length);
        if (queryString.length) {
            //const new_url = URL + queryString + "&hl=en-US&sort=date&gl=US&num=50&output=rss";
            //console.log(new_url);
            googleNews
                .search(queryString, 20)
                /*  .then(resp => {

                      for (let j = 0; j < 20; j++) 
                          data_array[j] = resp[j];
                  })
                  */
                .then((resp) => {
                    resp.sort((a, b) => {
                        return new Date(b.pubDate) - new Date(a.pubDate);
                    });
                    data_array = resp.slice(); //copying to new array.

                    //sentimental Analysis 
                    resp.forEach((element, index) => {
                        const lowertextOnlyalphabet = element.description.toLowerCase().replace(/[^a-zA-Z\s]+/g, ''); //removing special characters   \s whitespace  \g global(find the match till end )

                        const {
                            WordTokenizer
                        } = natural; //using the WordTokenizer from imported Natural package
                        const tokenizer = new WordTokenizer();
                        const tokenizedString = tokenizer.tokenize(lowertextOnlyalphabet);

                        //Removing stop (a,an,or..)
                        const filteredString = SW.removeStopwords(tokenizedString);

                        //Stemming This is a process of word normalization in NLP that is used to convert derived or inflected words to their base or root form.
                        // take taken took
                        //Sentiment Analyzer will do this for us
                        const {
                            SentimentAnalyzer,
                            PorterStemmer
                        } = natural;
                        const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');
                        const analysis = analyzer.getSentiment(filteredString);
                        data_array[index]["sentiment"] = analysis;
                    });



                    res.status(200).send(JSON.stringify(resp));
                }).catch((error) => {
                    console.log("\nServer Error ", error, "\n");
                    res.status(500).send({
                        error: "Server Error"
                    });
                });
        }
    }
});
app.listen(port, () => {
    console.log(`\nRunning On Port ${port}`);
});


/*
    let x = cheerio.load(r.data);
                 x('item').each((i,element)=>{
                     const title=x(element).children('title').text();
                     const pubDate = x(element).children('pubDate').text();
                     const description=x(element).children('description').text();
                     const link = x(element).children('link').text();
                   if(i<50)
                     data_array[i]={title,pubDate,link,description};
                 });


                console.log(data_array.length);

*/