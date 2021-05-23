
window.onload = ()=>{
    document.getElementsByClassName("categories")[0].children[0].click();
};

document.getElementById("search").addEventListener("click", async (e) => {
    e.preventDefault();

    let categories=document.getElementsByClassName("categories")[0].children;
    categories.forEach((el)=>{if(el.classList.contains("color_category")) el.classList.remove("color_category");});

    let s = document.getElementById("search_for").value;
    s=s.trim();
    if (s && s.length > 0) {
        console.log("\n Sending Request\n");
        console.log(s);
        resultDisplay(false);
        await fetch(`/search_for/${s}`).then((res) => res.json()).then((data) => {
            showResult(data);
        }).catch((e) => {
            console.error("\n Error : \n", e)
        });
    }

});



function showResult(result) {
    resultDisplay(true);
    let main = document.getElementById("result").children;
    main[0].innerHTML = ' <p class="section_title">WordCloud</p><div id="wordcloud" style="width:100%;height:100%;"></div>';
    main[1].innerHTML = " <p class='section_title'>Articles</p>";
    main[2].innerHTML = "<p class='section_title'>Website Frequency Graph</p><div id='chartdiv'></div>";
    let content = "";
    let article_div = document.createElement("div");
    article_div.classList.add("article_div");
    let website_links = {};
    result.forEach((element) => {
        const link = element.link;
        var matches = link.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
        website_links[matches[1]] = website_links[matches[1]] + 1 || 1;

        let itemList = document.createElement('div');

        let contentdiv = document.createElement('div');
        let sentimentdiv = document.createElement('div');

        itemList.classList.add("item");

        var itemAnchor = document.createElement('a');
        itemAnchor.setAttribute('target', '_blank');
        itemAnchor.setAttribute('href', element.link); // obtaining the link
        itemAnchor.innerText = element.title; // obtaining the title

        content += element.description;

        var publisher = document.createElement('p');
        publisher.innerText = `${element.publisher} (${element.pubDate})`; // obtaining the publisher

        contentdiv.appendChild(itemAnchor);
        contentdiv.appendChild(publisher);

        if (element.sentiment < 0)
            sentimentdiv.innerHTML = '<img src="/sad.png" />';
        else if (element.sentiment == 0)
            sentimentdiv.innerHTML = '<img src="/neutral.png">';
        else
            sentimentdiv.innerHTML = '<img src="/happy.png" />';

        itemList.appendChild(contentdiv);
        itemList.appendChild(sentimentdiv);

        article_div.appendChild(itemList);
    });
    main[1].appendChild(article_div);

    generateWordCloud("wordcloud",content);

    website_link_count_array = [];
    for (const key in website_links) {
        const obj = {};
        obj["website"] = key;
        obj["count"] = website_links[key];
        website_link_count_array.push(obj);
    }

    makechart(website_link_count_array);
}


function resultDisplay(l) {
    if (l) {
        document.getElementById("result").style.display = "flex";
        document.getElementById("loading").style.display = "none";
    document.getElementById("category_news").style.display = "none";
    document.getElementById("category_news").innerHTML="";
    } else {
        document.getElementById("result").style.display = "none";
        document.getElementById("loading").style.display = "block";
        document.getElementById("category_news").style.display = "none";
        document.getElementById("category_news").innerHTML="";
    }
}


function makechart(data) {
    am4core.useTheme(am4themes_animated);
    var chart = am4core.create("chartdiv", am4charts.XYChart);
    chart.data = data;

    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "website";
    categoryAxis.title.text = "Websites";
    categoryAxis.renderer.labels.template.disabled = true;
    categoryAxis.renderer.minGridDistance = 30;
    categoryAxis.renderer.grid.template.stroke = am4core.color("#FFCC4D");

    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Count";
    valueAxis.renderer.grid.template.stroke = am4core.color("#FFCC4D");

    var series = chart.series.push(new am4charts.ColumnSeries3D());
    series.dataFields.valueY = "count";
    series.dataFields.categoryX = "website";
    series.name = "Frequency";
    series.tooltipText = "{name}: [bold]{valueY}[/]";
    //series2.strokeWidth = 2;
    series.columns.template.tooltipText = "Series: {name}\nCategory: {categoryX}\nValue: {valueY}";
    chart.legend = new am4charts.Legend();

    // Add cursor
    chart.cursor = new am4charts.XYCursor();

    // Add simple vertical scrollbar
    chart.scrollbarY = new am4core.Scrollbar();
    //chart.valueLabels.template.fill = "#F56702";
    // Add horizotal scrollbar with preview
    var scrollbarX = new am4charts.XYChartScrollbar();
    //scrollbarX.series.push(series);

    //var scrollAxis = scrollbarX.scrollbarChart.xAxes.getIndex(0);
    //scrollAxis.renderer.labels.template.disabled = true;
    //scrollAxis.renderer.grid.template.disabled = true;

    chart.scrollbarX = scrollbarX;
}



 function fetchHeadings(event)
{

    document.getElementById("loading").style.display = "block";
    document.getElementById("category_news").style.display = "none";
    document.getElementById("result").style.display = "none";

    let child_elements=event.target.parentElement.children;
    child_elements.forEach((el)=>{if(el.classList.contains("color_category")) el.classList.remove("color_category")})  

    event.target.classList.add("color_category");
    fetch(`/category/${event.target.innerText.toUpperCase()}`).then((res) => res.json()).then((data) => {
        document.getElementById("category_news").innerHTML = "";
        data.forEach((element)=>{
            let article = document.createElement("div");
            let title = document.createElement("a");
            title.innerText=element.title;
            title.setAttribute('target', '_blank');
            title.setAttribute('href', element.link);
            
            let pub_date = document.createElement("div");
            pub_date.innerText=element.pubDate

            let content= document.createElement("p");
            content.innerHTML = element.contentSnippet;

            article.appendChild(title);
            article.appendChild(content);
            article.appendChild(pub_date);


            document.getElementById("category_news").appendChild(article);

        }); 
        
    }).then(()=>{document.getElementById("loading").style.display = "none";document.getElementById("category_news").style.display = "block";}).catch((e) => {
        console.error("\n Error : \n", e)
    });
}


function generateWordCloud(reference,content)
{

    
    am4core.ready(function () {

        // Themes begin
        am4core.useTheme(am4themes_animated);
        // Themes end

        var chart = am4core.create(reference, am4plugins_wordCloud.WordCloud);
        var series = chart.series.push(new am4plugins_wordCloud.WordCloudSeries());

        series.accuracy = 4;
        series.step = 15;
        series.rotationThreshold = 0.7;
        series.maxCount = 200;
        series.minWordLength = 2;
        series.labels.template.tooltipText = "{word}: {value}";
        series.fontFamily = "Courier New";
        series.maxFontSize = am4core.percent(30);
        series.labels.template.fill = am4core.color("#F56702");

        series.text = content;
    }); // end am4core.ready

}